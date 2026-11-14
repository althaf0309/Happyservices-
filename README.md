# Happy Services — website

Local home & appliance service site for Kannur, Thrissur and Kochi. Every page turns visits into bookings by phone, WhatsApp or a one-minute form.

```
happy-services/
  frontend/   Next.js 15 (App Router) + TypeScript + Tailwind — the public site
  backend/    Django 5 + Django REST Framework — REST API, owner admin, notifications
  docs/       Design file + developer handoff (PDF) and HANDOFF.md (spec + build notes)
  docker-compose.yml   Postgres 16 + Redis + API + Celery worker
```

The two apps are independent. The frontend only talks to the backend through the REST API at `/api/v1`.

## Run locally

**1. Backend** (port 8000):

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env            # optional; defaults work for dev (SQLite, console email)
python manage.py migrate
python manage.py seed_catalog     # 11 services, 3 districts, 10 towns, AC content, FAQs
python manage.py load_stock_photos  # interim Unsplash photos for empty slots (see docs/PHOTO-CREDITS.md)
python manage.py createsuperuser  # owner login for /admin/
python manage.py runserver
```

- Admin (bookings, landing pages, FAQs, reviews): http://127.0.0.1:8000/admin/
- API docs (Swagger): http://127.0.0.1:8000/api/v1/docs · OpenAPI: `/api/v1/schema`
- New-booking emails print to this terminal until `EMAIL_URL` is set.

**2. Frontend** (port 3000, needs the backend running):

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Open http://localhost:3000.

> `next build` fetches every page from the API, so the backend must be running during builds. If something else already uses port 8000, run the API on another port and set `API_BASE_URL` and `NEXT_PUBLIC_API_BASE_URL` to match.

## Checks

```bash
cd backend  && python manage.py test        # booking rules, throttling, honeypot, publishing, FAQs, admin API
cd frontend && npm run lint && npm run typecheck && npm test
cd frontend && npm run build && npm run test:e2e   # Playwright + axe at 1280 and 390 (API must be running)
cd frontend && npm run gen:types            # regenerate src/types/openapi.d.ts from the running API
```

On Windows the e2e tests use your installed Edge (`PW_CHANNEL=msedge`); elsewhere, run `npx playwright install chromium` once. The API's `ALLOWED_ORIGINS` must include the test site's origin (`http://127.0.0.1:3100`). Booking tests mock the API, except one real round trip that creates an "E2E Test" booking.

## Content workflow (owner)

- **Landing pages**: Admin → *Landing pages (service × town)*. A page is only live (and in the sitemap) when **Is published** is ticked. 110 rows exist; AC, fridge, washing machine, plumbing and electrical are published in all 10 towns. The rest are drafts.
- **FAQs**: scope is global, service, district or landing page; the most specific scope with published FAQs wins. Text can use `{town}`, `{district}` and `{service}`.
- **Reviews**: add real reviews only. The home Reviews section stays hidden until one is published.
- **Photos**: upload in *Site photos* (home hero, team photo), *Services*, *Districts* and *Landing pages*. Empty slots show a neutral placeholder. Images are served as AVIF/WebP automatically; set `PUBLIC_BASE_URL` to the API's public origin.
- **Privacy & Terms**: paste the final text in *Legal pages* and tick *Is published*. Until then the site shows a marked draft.
- **Brands / AC types**: fill them in on one landing page, then run the *Copy types & brands…* action to apply them to every town for that service.
- **Bookings**: filter by status, service, district, town and date; edit status inline; use *Export selected to CSV*.
- Saving content calls the frontend's `/api/revalidate` (set `FRONTEND_REVALIDATE_URL` and `REVALIDATE_SECRET` on both apps), so pages update without a redeploy.

## Deploy

- **Frontend**: Vercel (or `npm run build && npm start` behind Nginx). Set the env vars from `frontend/.env.example`.
- **Backend**: `docker compose up -d --build` with `backend/.env` filled in (prod settings, Postgres, Redis, Celery worker). Put it behind HTTPS and set `NUM_PROXIES=1` so throttling sees real client IPs.
- Cron: `python manage.py purge_spam` daily (deletes spam bookings older than 30 days).
- Monitoring: set `SENTRY_DSN`; uptime-ping `/api/v1/health`.

Step-by-step AWS setup (EC2, Elastic IP, DNS, HTTPS, backups): [docs/DEPLOY-AWS.md](docs/DEPLOY-AWS.md).

See [docs/HANDOFF.md](docs/HANDOFF.md) for the spec, what's implemented, and the open client items.
