# Happy Services — developer handoff (text copy)

Source of truth: [Happy-Services-Website-Redesign.pdf](Happy-Services-Website-Redesign.pdf) (design) and [Happy-Services-Dev-Handoff.pdf](Happy-Services-Dev-Handoff.pdf) (handoff). This file restates the handoff in text and records how it was built and where the build differs.

## Goal and stack

Turn local search traffic into bookings by phone, WhatsApp or a one-minute form, on every page.

| Layer | Spec | Built |
|---|---|---|
| Frontend | React + TypeScript, Next.js 15 App Router | Next.js 15.5, React 19\*, TypeScript strict, Tailwind 3 |
| Backend | Option B (recommended): Django 5 + DRF | Django 5.1, DRF 3.16, drf-spectacular, camel-case JSON |
| Database | PostgreSQL 16 | Postgres 16 (SQLite fallback for local dev only) |
| Async | Celery + Redis | Celery 5 + Redis (tasks run inline when `REDIS_URL` is unset) |

\* The App Router in Next 15 requires React 19; the handoff said React 18.

## Routes

| Route | Page | Render |
|---|---|---|
| `/` | Home | SSG, revalidate 1h |
| `/services` | All services | SSG |
| `/services/[service]` | Service overview (11) | SSG |
| `/locations` | All regions | SSG |
| `/locations/[district]` | District hub (3) | SSG |
| `/[district]/[town]` | Town page (10) | SSG |
| `/[district]/[town]/[service]` | Service × town landing (up to 110) | SSG + ISR |
| `/book` | Booking form, `?service=&town=` | SSR |
| `/about` `/contact` `/privacy` `/terms` | Static | SSG |
| `/sitemap.xml` `/robots.txt` | From the API | Route handler |
| `/og/[district]` | Open Graph image per district | Route handler |
| `/api/revalidate` | On-demand ISR hook for the backend | Route handler |

Breadcrumbs follow the URL. A service × town page only exists while its `ServiceArea` row is published; otherwise it returns 404 and is left out of the sitemap.

## Content seed

- **11 services:** ac-service, refrigerator-repair, washing-machine-repair, plumbing, electrical, tv-service, painting, cctv-installation, interior-services, welding-fabrication, gas-pipeline.
- **Popular:** AC (featured), fridge, washing machine, plumbing, electrical.
- **AC sub-services:** general service, repair, installation, uninstallation, gas refilling, deep cleaning.
- **Locations:**
  - Kannur: Kannur Town, Thalassery, Mattanur, Panoor
  - Thrissur: Thrissur Town, Guruvayoor, Irinjalakuda, Kunnamkulam, Chalakudy
  - Kochi: Kochi city
- **Seed command:** `python manage.py seed_catalog` (create-only, so it never overwrites admin edits). The same data is in `backend/catalog/fixtures/seed.json`.

## Design tokens ("Monsoon Blue")

| Token | Value | Use |
|---|---|---|
| Happy Blue | `#1F3C88` | Brand, primary buttons, links |
| Deep Blue | `#172E6E` | Location band, hover |
| Ink | `#111A2E` | Headings, body |
| Slate | `#3B4558` | Secondary text |
| WhatsApp Green | `#0B7A43` | WhatsApp actions only |
| Marigold | `#F5B83D` | Logo smile, eyebrow on dark |
| Focus ring | `#E0A020` | 3px ring, 3px offset |
| Mist | `#F5F7FB` | Page ground; cards are white |

- **Type:** Bricolage Grotesque (H1 66/40, H2 46/30, H3 22/18) and Figtree (body 16–19, eyebrow 13), self-hosted with `next/font`.
- **Radius:** fields 14, cards 24–28, sections 40, chips 999.
- **Motion:** 200 / 280 / 400 ms with `cubic-bezier(.2,.7,.2,1)`. All animation is off under `prefers-reduced-motion`.
- **Tap targets:** 44px+ on desktop, 52–56px on mobile.
- **Icons:** Lucide, 24px, 1.8 stroke.
- **In code:** `frontend/src/styles/tokens.ts`, mirrored in `tailwind.config.ts`.

## Booking form

| Field | Rule |
|---|---|
| Name * | 2–80 characters, trimmed |
| Mobile * | Strip +91 / 91 / 0 / spaces / dashes, then `^[6-9]\d{9}$`; error: "Please enter a valid 10-digit mobile number." |
| Service * | Service slug, pre-filled from the page |
| Location * | Town slug, or "Other area" plus free text |
| Problem | Optional, max 1000 |
| Preferred time | any · morning · afternoon · evening |
| `website` | Honeypot, must be empty |
| Context | Page URL, UTM params and referrer (sent hidden) |

- **States:** default, focus (marigold ring), error (red border, message linked with `aria-describedby`, focus moves to the first error), loading ("Sending request…"), success ("Request received" with the reference and a Continue on WhatsApp button), network error ("Couldn't send — call or WhatsApp us", values kept).
- **Shared rules:** the same rules run on the client (`frontend/src/lib/schemas/booking.ts`) and the server (`backend/bookings/serializers.py`).

## API (`/api/v1`, camelCase JSON)

| Method | Path | Auth | Returns |
|---|---|---|---|
| GET | `/services` | public | Active services, sorted |
| GET | `/services/{slug}` | public | Service + sub-services + problems + FAQs + towns offering it |
| GET | `/locations` | public | Districts with towns |
| GET | `/locations/{district}` | public | Hub: towns, popular, all services, FAQs, other districts, published pages |
| GET | `/locations/{district}/{town}` | public | Town page: services with published pages, FAQs |
| GET | `/pages/published` | public | `[{district, town, service, updatedAt}]` |
| GET | `/pages/{district}/{town}/{service}` | public | Landing page (404 unless published) |
| GET | `/faqs?scope=global` | public | FAQs |
| GET | `/reviews` | public | Published reviews (may be empty) |
| POST | `/bookings` | public, 5 per IP per 10 min | 201 `{id, reference, status}`; 400 `{errors:{field:[msg]}}`; 429 |
| POST | `/events/contact-click` | public, throttled | 204 |
| GET, PATCH | `/admin/bookings[/{id}]` | staff (session) | Filters: status, service, town, district, date range |
| GET | `/admin/bookings/export.csv` | staff | CSV |
| GET | `/health`, `/schema`, `/docs` | public | Uptime check, OpenAPI, Swagger UI |

- **Phone storage:** phones are stored normalised to 10 digits.
- **References:** `HS-YYMMDD-NNNN`.
- **Honeypot:** a filled honeypot returns 201 with a reference and is stored as `spam` (no email); if the rest of the data is invalid, it returns a fake reference and nothing is stored.
- **IP addresses:** stored only as a salted SHA-256 hash.

**Notifications.** A new booking emails `NOTIFY_EMAIL_TO` through Celery (3 retries, never blocks the 201). The email includes name, a tel link, service, location, problem, preferred time and a WhatsApp-reply link.

## Fixes made to the handoff's sample code

1. **Throttle rate.** DRF reads only the first letter of a throttle period, so `"5/10min"` would actually allow 5 per *minute*. `config/throttling.py` parses multi-unit windows; a test confirms the 6th booking within 10 minutes gets a 429.
2. **Phone prefix.** The handoff's `^(\+91|91|0)` stripping mangles real numbers that start with 91 (e.g. `91234 56789`). The prefix is now stripped only when the length shows it is a prefix, on both client and server.
3. **Spam status leak.** In the sample, a honeypot hit returned `"status": "spam"`, which tells bots they were caught. The API now always answers `"new"`.

## Other build decisions

- **Form libraries (to meet the 120 KB JS budget):** the booking form validates with the shared **zod** schema (using zod's tree-shakeable `zod/v4-mini` build) but no longer uses **react-hook-form**. A small native form handler gives the same behaviour: errors appear after the first submit and then update live, focus moves to the first error, values are kept on failure, and server 400s map onto their fields. Together that saved ~19 KB gz.
- **FAQ accordion:** native `<details name="…">` instead of Radix Accordion. The browser enforces one-open-at-a-time, keyboard and screen-reader support are built in, and it ships no JavaScript (saved ~9 KB). The open/close animation uses `::details-content` where supported and is instant elsewhere.
- **Images:** photos render as a plain `<img>` with a `srcset` pointing at Next's `/_next/image` optimiser (AVIF/WebP), built by `src/lib/image.ts`. The LCP image is preloaded with high priority. This keeps `next/image`'s client component (~5 KB) out of every page.
- **Selects:** native `<select>` elements, styled, instead of Radix Select. They're lighter, and on mobile they use the platform picker.
- **Focus not obscured:** `scroll-padding` keeps focused and scrolled-to elements clear of the sticky header and the mobile contact bar (found by the e2e suite).
- **Font preloads on Windows builds:** Next 15.5's font-manifest plugin matches a forward-slash module path, so `next build` *on Windows* emits no font `<link rel="preload">`. Linux builds (Vercel, Docker, CI) are unaffected. Production must be built on Linux, which both deploy targets already do.
- **Unique town slugs:** town slugs are unique site-wide (stricter than unique per district) so bookings can resolve a town from its slug alone.
- **Extra content fields:**
  - `District.summary`: the one-line text on the home page cards.
  - `Service.image`, `District.image`, `ServiceArea.hero_image` and `SitePhoto` (home hero, home team photo): photo uploads, each with alt text.
  - `LegalPage`: Privacy and Terms text, editable in the admin.
  - `ContactClick.placement`: records which button was clicked.
- **Photo placeholders:** until a photo is uploaded, each slot is a fixed-aspect neutral placeholder. The shot description shows only in development.
- **Privacy and Terms:** the built-in drafts are based on how the site handles data and are marked as drafts on the page. They **must be replaced with client-approved text before launch** (see below).

## Open items from the client — where each one goes

Nothing below needs a code change. Each item is filled in from the Django admin (`/admin/`) or an env var, and the site updates through on-demand revalidation.

| Item | Where to add it | Fallback until then |
|---|---|---|
| Kochi areas served | Admin → Districts → Kochi → add towns, then publish their landing pages | Only "Kochi city" |
| Confirmed AC / appliance brands | Admin → Landing pages: fill **Brands** on one page, then run *Copy types & brands…* to apply it to every town | "Brands serviced" block hidden |
| Cassette / tower AC serviced? | Same as brands, in **Types** | Chip omitted |
| Real customer reviews | Admin → Reviews (tick *Is published*) | Reviews section hidden |
| Working hours, pricing answer, AC service interval | Admin → FAQs: edit the answer, tick *Is published* | Those FAQs hidden |
| Photography | Admin → Site photos (home hero, team photo), Services, Districts, Landing pages (hero) | Neutral placeholders |
| Privacy policy & terms text | Admin → Legal pages (plain text: `## ` heading, `- ` bullet), tick *Is published* | Marked draft pages; **must be replaced before launch** |
| Domain | `NEXT_PUBLIC_SITE_URL` (frontend); `PUBLIC_BASE_URL`, `ALLOWED_ORIGINS` (backend) | Local URLs |
| GA4 measurement ID | `NEXT_PUBLIC_GA_ID` | Analytics off |

**Contact constants** (phone +91 90374 02356, WhatsApp 919037402356, newhappyservices@gmail.com) live only in `frontend/src/lib/config.ts`. The only exception is the seeded FAQ answer text, which the owner can edit in the admin.

## Acceptance checklist status (verified 1 Nov 2026)

| Item | Status |
|---|---|
| Home, hub and landing match the design at 390 and 1280 | Built to the design and checked visually at both widths. Repeat the side-by-side review once real photos are in. |
| Booking submits from every page; owner gets an email | E2E submits from all 7 form pages (each sending the correct `source`), plus one real API round trip. Email goes through Celery; needs `EMAIL_URL` + Redis in prod. |
| Exact phone error copy; values kept on failure | Yes. Unit tests on both sides plus e2e, which also checks `aria-describedby` and focus. |
| Every WhatsApp link pre-filled with service + town | Yes. E2E checks every `wa.me` link on a landing page, including the footer, floating button and sticky bar. |
| Reviews absent when none are published | Yes (e2e) |
| Unpublished ServiceArea → 404 and not in sitemap | Yes (backend + e2e) |
| Mobile Lighthouse ≥ 90; LCP < 2.5 s; CLS < 0.1 | Mobile Lighthouse 12 on a local production build: performance 96–99, accessibility 100, best practices 100, SEO 100 on home, landing, hub, service and /book. LCP 2.0–2.6 s run-to-run (the 2.6 s was /book, measured without font preloads — see the Windows note above); CLS ≤ 0.011. Re-run on staging with real photos. |
| First-load JS < 120 KB gz | Largest page 117.9 KB (home); form pages 116.9 KB; content pages 104–106 KB. About 103 KB is the React 19 + Next runtime that every page pays. |
| Rich Results Test passes (LocalBusiness, Breadcrumb, FAQ) | The JSON-LD is validated in e2e (types, required fields, breadcrumb order, no `AggregateRating`). Google's Rich Results Test needs a public URL, so run it on staging. |
| Keyboard-only booking; axe 0 serious issues | Yes. The e2e keyboard-booking test passes, and axe (WCAG 2.0/2.1/2.2 A+AA) reports 0 serious/critical issues on all 12 templates at both widths. |
| 6th booking from one IP in 10 min → 429 | Yes (backend test + live check) |
| OpenAPI at `/api/v1/schema`; TS types regenerate | Yes (`npm run gen:types`). CI validates the schema with `--fail-on-warn`. |
| Seed + migrations from a clean DB in CI | `.github/workflows/ci.yml` (backend job) |

**Tests:** backend 26 (`python manage.py test`), frontend unit 20 (`npm test`), e2e + axe 67 (`npm run test:e2e`, both widths). CI runs all three.
