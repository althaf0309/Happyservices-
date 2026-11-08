---
name: hs-content
description: Add or change Happy Services site content (services, districts/towns, landing pages, FAQs, reviews, photos, legal text) and check what the client still owes. Use when asked about content, launch readiness, a new town/service, or "open items".
---

# Content and launch readiness

Content lives in the database and is edited in Django admin, not in code. The source of truth for what the client has and hasn't supplied is **docs/HANDOFF.md, "Open items from the client"**.

## Hard rule: never invent client facts
Do not invent brands, reviews, prices, working hours, Kochi areas, service intervals, or privacy/terms wording. If a value is missing, leave it empty or unpublished so the site's fallback shows, and tell the user it's still owed.

## Data model in brief (`backend/catalog/models.py`)
- `Service` (11) has `SubService` and `CommonProblem` rows.
- `District` (Kannur, Thrissur, Kochi) has `Town` rows (10 in total). Town slugs are globally unique.
- `ServiceArea` is one service × town landing page at `/{district}/{town}/{service}`. It goes live (and into the sitemap) only when `is_published` is ticked. Unpublished pages return 404.
- `Faq` is scoped global / service / district / landing page, and the most specific published scope wins. Answers can use `{town}`, `{district}` and `{service}`.
- `Review` (real reviews only; the section is hidden at zero), `SitePhoto`, `LegalPage`.

## Common tasks
- **New town**: add a Town under its District, create its ServiceArea rows (or extend `seed_catalog` if it's a default), then publish the ones the client confirms.
- **Brands / AC types**: fill them in on one landing page, then use the admin action *Copy types & brands...* to apply them to every town for that service.
- **Seeding** is create-only, so re-running `seed_catalog` is safe and won't overwrite admin edits.
- Saves trigger `/api/revalidate` on the frontend (this needs `FRONTEND_REVALIDATE_URL` + `REVALIDATE_SECRET`), so no redeploy is required.

## Launch blockers checklist
Check each one and report it as done or still owed:
- [ ] Privacy & Terms: final text published (the drafts are visibly marked)
- [ ] Domain set: `NEXT_PUBLIC_SITE_URL`, `PUBLIC_BASE_URL`, `ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`
- [ ] Real photos replacing the Unsplash stock photos, then re-run the design side-by-side and Lighthouse on staging
- [ ] `EMAIL_URL` + Redis in prod (booking emails), `SENTRY_DSN`, uptime ping on `/api/v1/health`, daily `purge_spam` cron
- [ ] Rich Results Test on the public staging URL
- [ ] Optional: GA4 ID, Kochi towns, brands, reviews, hours/pricing FAQs
