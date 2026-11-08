import type { Page, Route } from '@playwright/test';

/** Representative pages: one of every template. */
export const KEY_PAGES = [
  '/',
  '/services',
  '/services/ac-service',
  '/locations',
  '/locations/kannur',
  '/thrissur/guruvayoor',
  '/thrissur/guruvayoor/ac-service',
  '/book',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
];

/** Pages that carry the booking form, with the `source` each should send. */
export const FORM_PAGES: [string, string][] = [
  ['/', 'form'],
  ['/services/ac-service', 'sticky_form'],
  ['/locations/kannur', 'sticky_form'],
  ['/thrissur/guruvayoor', 'sticky_form'],
  ['/thrissur/guruvayoor/ac-service', 'sticky_form'],
  ['/book', 'book_page'],
  ['/contact', 'form'],
];

type Reply = { status: number; body?: unknown } | 'network-error';

/** Intercept POST /bookings so UI states can be tested without creating real bookings. */
export async function mockBookings(page: Page, reply: Reply) {
  const requests: Record<string, unknown>[] = [];
  await page.route('**/api/v1/bookings', async (route: Route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    requests.push(route.request().postDataJSON());
    if (reply === 'network-error') return route.abort('failed');
    await route.fulfill({ status: reply.status, headers: cors, contentType: 'application/json', body: JSON.stringify(reply.body ?? {}) });
  });
  // Click tracking is fire-and-forget; keep it out of the dev database.
  await page.route('**/api/v1/events/contact-click', (route) => route.fulfill({ status: 204, headers: cors }));
  return requests;
}

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type, accept',
  'access-control-allow-methods': 'POST, OPTIONS',
};

export const created = { status: 201, body: { id: '0d6f0000-0000-4000-8000-000000000000', reference: 'HS-261101-0042', status: 'new' } };

/** The booking form card (there is exactly one per page). */
export const bookingForm = (page: Page) => page.locator('form', { has: page.getByRole('button', { name: /request service|sending request/i }) });
