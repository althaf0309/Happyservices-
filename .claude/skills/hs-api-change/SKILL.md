---
name: hs-api-change
description: Make an end-to-end change that touches the Happy Services data model or API, from the Django model/serializer/view through to the Next.js types and pages. Use when adding or changing a field, endpoint, or admin-editable content.
---

# Change the model/API safely

The API contract is camelCase JSON under `/api/v1`, described by drf-spectacular. The frontend only talks to the backend through it (`frontend/src/lib/api.ts`).

## Steps
1. **Model**: edit `backend/<app>/models.py` (`catalog` = content, `bookings` = leads), then run `makemigrations`. Never edit applied migrations.
2. **Admin**: expose the field in `admin.py`. Everything the client supplies must be admin-editable, with no code change needed to fill it in.
3. **Serializer/view**: update `serializers.py`. Keep the view querysets in `catalog/queries.py` so they don't cause N+1 queries.
4. **Revalidation**: if it's a new content model, add it to `_CONTENT_MODELS` in `backend/catalog/signals.py` so admin saves refresh the site. Bulk scripts should wrap their writes in `revalidation_muted()`.
5. **Seed**: if you need default rows, add them to `seed_catalog` so it stays idempotent and create-only (it must never overwrite admin edits).
6. **Frontend types**: update the hand-written types in `frontend/src/types/api.ts`. To compare against the live schema, run
   `npx openapi-typescript http://127.0.0.1:8010/api/v1/schema -o src/types/openapi.d.ts`
   (the `gen:types` script hard-codes `localhost:8000`, which doesn't work on this machine).
7. **Fetch**: add the call in `src/lib/api.ts` using `get` / `getOr404` / `getOrNull`. Every fetch carries the `catalog` tag.
8. **UI**: optional content must hide cleanly when it's empty. Follow the existing pattern: Reviews are hidden with zero reviews, and the brands block is hidden with no brands.
9. **Tests**: add a backend test in the app's `tests.py`, and an e2e assertion if the change is user-visible. Then run the `hs-verify` skill.

## Rules
- Contact details (phone, WhatsApp, email) live only in `frontend/src/lib/config.ts`.
- Booking validation exists on both sides (`frontend/src/lib/schemas/booking.ts` and `backend/bookings/serializers.py`), so keep them in sync, including the exact error copy.
- Don't add heavy client dependencies, because of the 120 KB gz JS budget. Prefer server components.
