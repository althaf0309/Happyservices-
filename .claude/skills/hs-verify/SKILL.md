---
name: hs-verify
description: Run the Happy Services quality gates (the same ones CI runs) and report pass/fail. Use after any code change in backend/ or frontend/, before saying work is done, or when asked for the project's status.
---

# Verify Happy Services

Run the fast gates first; they need no running server and can run in parallel.

**Backend** (`cd backend`):
```bash
.venv/Scripts/python manage.py makemigrations --check --dry-run   # must say "No changes detected"
.venv/Scripts/python manage.py test                               # baseline: 26 tests OK
.venv/Scripts/python manage.py spectacular --file "$TEMP/schema.yml" --validate --fail-on-warn
```

**Frontend** (`cd frontend`):
```bash
npm run lint        # the "next lint" deprecation notice is expected; there must be no warnings or errors
npm run typecheck
npm test            # vitest, baseline: 20 tests
```

**Full gate**: run this when you change pages, components, booking, SEO/JSON-LD or a11y.
1. Start the API on 127.0.0.1:8010 (see the `hs-run-local` skill), with `ALLOWED_ORIGINS=http://127.0.0.1:3100`.
2. In `frontend`, with `API_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL` set to 8010 and `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3100`:
   `npm run build && npm run test:e2e`. Baseline: 67 pass (desktop 1280 + mobile 390, axe included). On Windows it uses the installed Edge.
3. Note that one e2e test creates a real "E2E Test" booking in the local DB.

## Budgets to keep (from the acceptance checklist)
- First-load JS **< 120 KB gz** per page (home is about 118 KB, so there is little headroom). Check the `next build` output and reject new client-side dependencies that break it.
- axe: 0 serious or critical issues. Mobile Lighthouse >= 90, CLS < 0.1.

## Reporting
Report the counts and any failures verbatim. If test counts drop below the baseline, say so. If you add tests, update the counts in docs/HANDOFF.md (the "Tests:" line).
