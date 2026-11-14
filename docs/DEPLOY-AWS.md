# Deploy Happy Services on AWS (one EC2 server + Elastic IP)

One Ubuntu server runs everything:

```
Internet ──► Elastic IP ──► Nginx (80/443, Let's Encrypt)
                              ├─ www.DOMAIN, DOMAIN ─► Next.js site   (127.0.0.1:3000, systemd)
                              └─ api.DOMAIN         ─► Django API     (127.0.0.1:8000, Docker)
                                                       + Celery worker, Postgres 16, Redis (Docker)
```

Throughout, replace `happyservices.in` with the real domain once the client confirms it.

**Rough cost** (Mumbai region, on-demand, check the [AWS pricing calculator](https://calculator.aws/)): t3.small about $16/month, 30 GB gp3 disk about $3/month, public IPv4 / Elastic IP about $3.60/month. That's roughly **$23/month** before tax.

---

## 0. Before you start

- [ ] **The domain is registered**, and you can edit its DNS records at the registrar.
- [ ] **The AWS account is secured:** MFA is on for the root user. Do the daily work as an IAM / IAM Identity Center user, not as root.
- [ ] **A budget alert is set:** Billing → Budgets → *Create budget* → monthly cost budget, e.g. $30, alerting your email.
- [ ] **The region is chosen:** **Asia Pacific (Mumbai) `ap-south-1`**, the closest to Kerala. Select it at the top right of the console and keep it for every step. The Elastic IP and server must be in the same region.
- [ ] **You have the Gmail app password** for booking emails, the one that works locally.

## 1. Create an SSH key pair

EC2 → **Key pairs** → *Create key pair*

- Name `happy-services`, type **ED25519**, format **.pem**. It downloads once, so keep it safe.
- Move it to `C:\Users\Althaf\.ssh\happy-services.pem` and lock it down (in PowerShell):

```powershell
$k = "$env:USERPROFILE\.ssh\happy-services.pem"
icacls $k /inheritance:r
icacls $k /grant:r "$($env:USERNAME):(R)"
```

## 2. Create a security group (firewall)

EC2 → **Security groups** → *Create security group*: name `happy-services-web`, default VPC.

| Type | Port | Source | Why |
|---|---|---|---|
| SSH | 22 | **My IP** | Admin login only from you. Update it if your IP changes. |
| HTTP | 80 | 0.0.0.0/0 and ::/0 | Let's Encrypt + redirect to HTTPS |
| HTTPS | 443 | 0.0.0.0/0 and ::/0 | The website and API |

Do **not** open 8000, 3000, 5432 or 6379. They stay private on the server.

## 3. Launch the EC2 instance

EC2 → **Instances** → *Launch instances*

| Setting | Value |
|---|---|
| Name | `happy-services` |
| AMI | **Ubuntu Server 24.04 LTS** (64-bit x86) |
| Instance type | **t3.small** (2 GB RAM). Smaller than this can't build the Next.js site. |
| Key pair | `happy-services` |
| Network | Default VPC, auto-assign public IP **enabled**, security group `happy-services-web` |
| Storage | **30 GiB gp3** |
| Advanced → Termination protection | **Enable** |

Click *Launch*, then wait until **Status checks: 2/2 passed**.

## 4. Allocate and attach an Elastic IP

A normal public IP changes when the server stops. An Elastic IP stays fixed, so DNS keeps working.

1. EC2 → **Elastic IPs** → *Allocate Elastic IP address* → Amazon's pool → *Allocate*.
2. Select it → *Actions* → **Associate Elastic IP address** → Resource type *Instance* → `happy-services` → *Associate*.
3. Note the address, e.g. `13.233.x.x`. This is `EIP` below.

> An Elastic IP that is allocated but **not attached** still costs money. Release it if you ever delete the server.

## 5. Point the domain at the server

At your DNS provider, add three **A records** pointing to `EIP` (TTL 300 is fine):

| Host | Type | Value |
|---|---|---|
| `@` (happyservices.in) | A | EIP |
| `www` | A | EIP |
| `api` | A | EIP |

Check from PowerShell, and wait until all three return the EIP:

```powershell
nslookup happyservices.in; nslookup www.happyservices.in; nslookup api.happyservices.in
```

## 6. Log in and install the basics

```powershell
ssh -i $env:USERPROFILE\.ssh\happy-services.pem ubuntu@EIP
```

On the server:

```bash
# Updates + 2 GB swap (the Next.js build needs the headroom on 2 GB RAM)
sudo apt update && sudo apt -y upgrade
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo timedatectl set-timezone Asia/Kolkata

# Docker (API, worker, Postgres, Redis)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu

# Node 20 (website), Nginx, Certbot
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt -y install nodejs nginx certbot python3-certbot-nginx git

exit   # log out and back in so the docker group applies
```

## 7. Get the code

```bash
sudo mkdir -p /srv/happy-services && sudo chown ubuntu:ubuntu /srv/happy-services
git clone https://github.com/althaf0309/happyhomeservice.git /srv/happy-services
cd /srv/happy-services
mkdir -p backend/media     # uploaded photos; owned by ubuntu (uid 1000) = the container's app user
```

## 8. Backend settings: `backend/.env`

Generate three random secrets, and use a **different** one for each line below:

```bash
python3 -c "import secrets; [print(secrets.token_urlsafe(50)) for _ in range(3)]"
```

`nano backend/.env`:

```ini
SECRET_KEY=<secret 1>
DEBUG=false
ALLOWED_HOSTS=api.happyservices.in
CSRF_TRUSTED_ORIGINS=https://api.happyservices.in
ALLOWED_ORIGINS=https://www.happyservices.in,https://happyservices.in
PUBLIC_BASE_URL=https://api.happyservices.in
NUM_PROXIES=1

# Booking emails (Gmail app password, no spaces; the @ in the username is %40)
EMAIL_URL=smtp+tls://althaf162017%40gmail.com:<app-password>@smtp.gmail.com:587
DEFAULT_FROM_EMAIL=althaf162017@gmail.com
NOTIFY_EMAIL_TO=newhappyservices@gmail.com

# Site refresh after admin edits; the same secret goes in the frontend's .env.local
FRONTEND_REVALIDATE_URL=https://www.happyservices.in/api/revalidate
REVALIDATE_SECRET=<secret 2>
IP_HASH_SALT=<secret 3>
# SENTRY_DSN=
```

`docker-compose.yml` already sets `DATABASE_URL`, `REDIS_URL` and the production settings module. Postgres and Redis are not reachable from outside the server.

```bash
chmod 600 backend/.env
```

## 9. Nginx + HTTPS

`sudo nano /etc/nginx/sites-available/happy-services`:

```nginx
# API + admin
server {
    listen 80;
    server_name api.happyservices.in;
    client_max_body_size 10m;            # photo uploads in the admin

    location /media/ {
        alias /srv/happy-services/backend/media/;
        expires 30d;
        add_header Cache-Control "public";
    }
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Bare domain → www
server {
    listen 80;
    server_name happyservices.in;
    return 301 https://www.happyservices.in$request_uri;
}

# Website
server {
    listen 80;
    server_name www.happyservices.in;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/happy-services /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Free certificates for all three names (DNS from step 5 must already resolve). Auto-renews.
sudo certbot --nginx --redirect -m newhappyservices@gmail.com --agree-tos \
  -d happyservices.in -d www.happyservices.in -d api.happyservices.in
```

## 10. Start the backend

```bash
cd /srv/happy-services
docker compose up -d --build                     # runs migrations on start
docker compose exec api python manage.py seed_catalog
docker compose exec api python manage.py createsuperuser     # owner login for the admin
# Optional, until real photos arrive:
# docker compose exec api python manage.py load_stock_photos

curl -s https://api.happyservices.in/api/v1/health     # → {"status":"ok"}
```

Admin: **https://api.happyservices.in/admin/**

## 11. Build and run the website

`nano frontend/.env.local`:

```ini
NEXT_PUBLIC_SITE_URL=https://www.happyservices.in
API_BASE_URL=https://api.happyservices.in/api/v1
NEXT_PUBLIC_API_BASE_URL=https://api.happyservices.in/api/v1
NEXT_PUBLIC_GA_ID=
REVALIDATE_SECRET=<secret 2, same as the backend>
```

```bash
cd /srv/happy-services/frontend
npm ci && npm run build        # needs the API from step 10 running
```

Run it as a service: `sudo nano /etc/systemd/system/happy-web.service`

```ini
[Unit]
Description=Happy Services website (Next.js)
After=network.target docker.service

[Service]
User=ubuntu
WorkingDirectory=/srv/happy-services/frontend
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start -- -H 127.0.0.1 -p 3000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now happy-web
```

The site is now at **https://www.happyservices.in**.

## 12. Scheduled jobs and backups

```bash
sudo mkdir -p /srv/backups && sudo chown ubuntu:ubuntu /srv/backups
cat > /srv/backups/backup.sh <<'EOF'
#!/bin/sh
cd /srv/happy-services
docker compose exec -T db pg_dump -U happy happy | gzip > /srv/backups/db-$(date +%F).sql.gz
tar czf /srv/backups/media-$(date +%F).tgz -C backend media
find /srv/backups -name '*.gz' -mtime +14 -delete; find /srv/backups -name '*.tgz' -mtime +14 -delete
EOF
chmod +x /srv/backups/backup.sh
crontab -e
```

Add:

```cron
0 3 * * * cd /srv/happy-services && docker compose exec -T api python manage.py purge_spam
30 3 * * * /srv/backups/backup.sh
```

Also in AWS: EC2 → **Lifecycle Manager** → create a policy that takes a **daily EBS snapshot** of the server's volume and keeps 7. This covers you if the server itself is lost.

## 13. Go-live checks

- [ ] The site loads at `https://www.happyservices.in`, and `http://` and the bare domain both redirect to it.
- [ ] Submitting a booking from the site makes it appear in the admin, **and** an email arrives at newhappyservices@gmail.com (check Spam the first time).
- [ ] Editing a FAQ in the admin changes the site within a few seconds (revalidation works).
- [ ] Uploading a photo in the admin makes it show on the site.
- [ ] Unpublished landing pages return 404.
- [ ] Privacy & Terms have their final text published (see docs/HANDOFF.md, "Open items").
- [ ] Google Rich Results Test passes on the home page and one landing page.
- [ ] An uptime monitor (e.g. UptimeRobot, free) pings `https://api.happyservices.in/api/v1/health` and the home page.

## Updating the site later

```bash
ssh -i $env:USERPROFILE\.ssh\happy-services.pem ubuntu@EIP
cd /srv/happy-services && git pull
docker compose up -d --build                             # backend (migrations run automatically)
cd frontend && npm ci && npm run build && sudo systemctl restart happy-web
```

## Troubleshooting

| Symptom | Check |
|---|---|
| 502 Bad Gateway on www | `sudo systemctl status happy-web`, `journalctl -u happy-web -n 50` |
| 502 on api | `docker compose ps`, `docker compose logs api --tail 50` |
| No booking emails | `docker compose logs worker --tail 50`. Gmail `535` means a wrong app password. |
| Booking form "network error" | `ALLOWED_ORIGINS` must include the exact site origin (https, with www) |
| Admin edits don't show | `REVALIDATE_SECRET` must match in both files; check `FRONTEND_REVALIDATE_URL` |
| Photos 404 | The file exists under `/srv/happy-services/backend/media/`; check the Nginx `alias` path ends in `/` |
| Can't SSH | Your IP changed. Update the port 22 rule in the security group to *My IP*. |
