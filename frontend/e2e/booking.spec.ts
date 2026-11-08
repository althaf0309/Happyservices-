import { expect, test } from '@playwright/test';
import { FORM_PAGES, bookingForm, created, mockBookings } from './helpers';

const PHONE_ERROR = 'Please enter a valid 10-digit mobile number.';

test.describe('booking form', () => {
  for (const [path, source] of FORM_PAGES) {
    test(`submits from ${path}`, async ({ page }) => {
      const requests = await mockBookings(page, created);
      await page.goto(path);
      const form = bookingForm(page);
      await form.getByLabel('Name').fill('Anil Kumar');
      await form.getByLabel('Mobile number').fill('+91 98470 12345');
      await form.getByLabel('Service needed').selectOption('ac-service');
      await form.getByLabel('Your location').selectOption('guruvayoor');
      await form.getByRole('button', { name: 'Request Service' }).click();

      await expect(page.getByText('Request received')).toBeVisible();
      await expect(page.getByText('HS-261101-0042')).toBeVisible();
      expect(requests).toHaveLength(1);
      expect(requests[0]).toMatchObject({
        name: 'Anil Kumar',
        phone: '9847012345',
        service: 'ac-service',
        town: 'guruvayoor',
        preferredTime: 'any',
        website: '',
        source,
      });
      expect(String(requests[0].pageUrl)).toContain(path === '/' ? '/' : path);
    });
  }

  test('landing page pre-fills service and town', async ({ page }) => {
    await page.goto('/thrissur/guruvayoor/ac-service');
    const form = bookingForm(page);
    await expect(form.getByLabel('Service needed')).toHaveValue('ac-service');
    await expect(form.getByLabel('Your location')).toHaveValue('guruvayoor');
  });

  test('/book pre-fills from the query string and ignores unknown slugs', async ({ page }) => {
    await page.goto('/book?service=plumbing&town=thalassery');
    await expect(bookingForm(page).getByLabel('Service needed')).toHaveValue('plumbing');
    await expect(bookingForm(page).getByLabel('Your location')).toHaveValue('thalassery');
    await page.goto('/book?service=nope&town=nope');
    await expect(bookingForm(page).getByLabel('Service needed')).toHaveValue('');
  });

  test('invalid phone: exact copy, linked to the field, focus moves there, values kept', async ({ page }) => {
    const requests = await mockBookings(page, created);
    await page.goto('/book');
    const form = bookingForm(page);
    await form.getByLabel('Name').fill('Anjali');
    await form.getByLabel('Mobile number').fill('98765');
    await form.getByLabel('Service needed').selectOption('refrigerator-repair');
    await form.getByLabel('Your location').selectOption('kannur-town');
    await form.getByRole('button', { name: 'Request Service' }).click();

    const phone = form.getByLabel('Mobile number');
    await expect(form.getByText(PHONE_ERROR)).toBeVisible();
    await expect(phone).toHaveAttribute('aria-invalid', 'true');
    await expect(phone).toHaveAccessibleDescription(PHONE_ERROR);
    await expect(phone).toBeFocused();
    await expect(form.getByLabel('Name')).toHaveValue('Anjali');
    expect(requests).toHaveLength(0);

    // Error clears as soon as the number is fixed.
    await phone.fill('98765 43210');
    await expect(form.getByText(PHONE_ERROR)).toBeHidden();
  });

  test('empty submit focuses the first missing field', async ({ page }) => {
    await mockBookings(page, created);
    await page.goto('/book');
    const form = bookingForm(page);
    await form.getByRole('button', { name: 'Request Service' }).click();
    await expect(form.locator('p.text-danger')).toHaveText(['Please enter your name', PHONE_ERROR, 'Choose a service', 'Choose your location']);
    await expect(form.getByLabel('Name')).toBeFocused();
  });

  test('"Other area" asks for the area and sends town=null', async ({ page }) => {
    const requests = await mockBookings(page, created);
    await page.goto('/book');
    const form = bookingForm(page);
    await form.getByLabel('Name').fill('Anil');
    await form.getByLabel('Mobile number').fill('9847012345');
    await form.getByLabel('Service needed').selectOption('ac-service');
    await form.getByLabel('Your location').selectOption('other');
    await form.getByRole('button', { name: 'Request Service' }).click();
    await expect(form.getByText('Tell us your area')).toBeVisible();
    await form.getByLabel('Your area').fill('Payyanur');
    await form.getByRole('button', { name: 'Request Service' }).click();
    await expect(page.getByText('Request received')).toBeVisible();
    expect(requests[0]).toMatchObject({ town: null, otherLocation: 'Payyanur' });
  });

  test('network error keeps values and offers call + WhatsApp', async ({ page }) => {
    await mockBookings(page, 'network-error');
    await page.goto('/book');
    const form = bookingForm(page);
    await form.getByLabel('Name').fill('Anil Kumar');
    await form.getByLabel('Mobile number').fill('9847012345');
    await form.getByLabel('Service needed').selectOption('ac-service');
    await form.getByLabel('Your location').selectOption('guruvayoor');
    await form.getByRole('button', { name: 'Request Service' }).click();

    const alert = form.getByRole('alert');
    await expect(alert).toContainText('Couldn’t send — call or WhatsApp us.');
    await expect(alert.getByRole('link', { name: /call/i })).toHaveAttribute('href', 'tel:+919037402356');
    await expect(alert.getByRole('link', { name: /whatsapp/i })).toHaveAttribute('href', /wa\.me\/919037402356/);
    await expect(form.getByLabel('Name')).toHaveValue('Anil Kumar');
    await expect(form.getByLabel('Mobile number')).toHaveValue('9847012345');
  });

  test('server validation errors appear on their fields', async ({ page }) => {
    await mockBookings(page, { status: 400, body: { errors: { phone: [PHONE_ERROR] } } });
    await page.goto('/book');
    const form = bookingForm(page);
    await form.getByLabel('Name').fill('Anil Kumar');
    await form.getByLabel('Mobile number').fill('9847012345');
    await form.getByLabel('Service needed').selectOption('ac-service');
    await form.getByLabel('Your location').selectOption('guruvayoor');
    await form.getByRole('button', { name: 'Request Service' }).click();
    await expect(form.getByText(PHONE_ERROR)).toBeVisible();
    await expect(form.getByLabel('Mobile number')).toBeFocused();
  });

  test('keyboard-only booking', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard flow is a desktop concern');
    await mockBookings(page, created);
    await page.goto('/book');
    const form = bookingForm(page);
    await form.getByLabel('Name').focus();
    await page.keyboard.type('Anil Kumar');
    await page.keyboard.press('Tab');
    await expect(form.getByLabel('Mobile number')).toBeFocused();
    await page.keyboard.type('9847012345');
    await page.keyboard.press('Tab');
    await expect(form.getByLabel('Service needed')).toBeFocused();
    await form.getByLabel('Service needed').selectOption('ac-service'); // native select: arrow keys/typing
    await page.keyboard.press('Tab');
    await expect(form.getByLabel('Your location')).toBeFocused();
    await form.getByLabel('Your location').selectOption('guruvayoor');
    await page.keyboard.press('Tab'); // problem
    await page.keyboard.press('Tab'); // preferred time
    await page.keyboard.press('Tab'); // submit (honeypot is not focusable)
    await expect(form.getByRole('button', { name: 'Request Service' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Request received')).toBeVisible();
  });

  test('real API round trip creates a booking reference', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'one real booking per run (API is rate-limited)');
    await page.route('**/api/v1/events/contact-click', (route) => route.fulfill({ status: 204 }));
    await page.goto('/book');
    const form = bookingForm(page);
    await form.getByLabel('Name').fill('E2E Test');
    await form.getByLabel('Mobile number').fill('9847012345');
    await form.getByLabel('Service needed').selectOption('ac-service');
    await form.getByLabel('Your location').selectOption('guruvayoor');
    await form.getByRole('button', { name: 'Request Service' }).click();
    await expect(page.getByText(/HS-\d{6}-\d{4}/)).toBeVisible();
  });
});
