---
name: hs-run-local
description: Start the Happy Services stack locally (Django API + Next.js site) on this Windows machine, with the port and host workarounds it needs. Use when asked to run, start, preview or screenshot the site, or before `next build` / e2e tests.
---

# Run Happy Services locally

Two independent apps: `backend/` (Django 5 + DRF, REST at `/api/v1`) and `frontend/` (Next.js 15). The frontend needs the API running, even for `next build`.

## Machine gotchas (read first)
- **Port 8000 is taken** by another Python process on this machine. Run the API on **8010**.
- Use **127.0.0.1**, not `localhost`, because Node resolves `localhost` to `::1` and the fetch fails.
- On Windows, `next build` omits the next/font preloads (a Next 15.5 bug). That is not a code issue, and Linux/CI builds are fine.

## 1. API (background)
```bash
cd backend
.venv/Scripts/python manage.py migrate
.venv/Scripts/python manage.py seed_catalog        # idempotent, create-only
.venv/Scripts/python manage.py runserver 127.0.0.1:8010
```
Run the server with `run_in_background`, then wait until `curl -sf http://127.0.0.1:8010/api/v1/health` succeeds.
- Admin: http://127.0.0.1:8010/admin/ · Swagger: `/api/v1/docs`
- If the DB is empty, `load_stock_photos` adds interim Unsplash photos (credited in docs/PHOTO-CREDITS.md).

## 2. Site
Point the frontend at 8010 through env vars, without editing `.env.local` permanently:
```bash
cd frontend
API_BASE_URL=http://127.0.0.1:8010/api/v1 NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run dev
```
The site runs at http://127.0.0.1:3000. The backend's `ALLOWED_ORIGINS` must include whichever origin the browser uses (3000 for dev, 3100 for e2e). If it doesn't, the booking POST fails CORS.

## Stop
Stop the background tasks you started, and leave the other process on port 8000 alone.
