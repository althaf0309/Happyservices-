import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { KEY_PAGES, mockBookings } from './helpers';

async function jsonLd(page: Page): Promise<Record<string, unknown>[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.map((b) => JSON.parse(b));
}
const types = (docs: Record<string, unknown>[]) => docs.map((d) => d['@type']);

test.describe('every template', () => {
  for (const path of KEY_PAGES) {
    test(`${path}: one H1, canonical, no horizontal overflow, no serious a11y issues`, async ({ page }) => {
      await mockBookings(page, { status: 201 });
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${path === '/' ? '' : path}$`));

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, 'page is wider than the viewport').toBeLessThanOrEqual(0);

      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(
        serious.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')})`),
      ).toEqual([]);
    });
  }
});

test.describe('SEO and structured data', () => {
  test('landing page JSON-LD: LocalBusiness, Service, BreadcrumbList, FAQPage', async ({ page }) => {
    await page.goto('/thrissur/guruvayoor/ac-service');
    await expect(page).toHaveTitle('AC Service in Guruvayoor | Happy Services');
    const docs = await jsonLd(page);
    expect(types(docs)).toEqual(expect.arrayContaining(['HomeAndConstructionBusiness', 'Service', 'BreadcrumbList', 'FAQPage']));

    const business = docs.find((d) => d['@type'] === 'HomeAndConstructionBusiness')!;
    expect(business).toMatchObject({ name: 'Happy Services', telephone: '+919037402356' });
    expect(business.areaServed).toHaveLength(3);
    expect(JSON.stringify(docs)).not.toContain('AggregateRating'); // no ratings until real reviews exist

    const crumbs = docs.find((d) => d['@type'] === 'BreadcrumbList') as { itemListElement: { name: string; position: number }[] };
    expect(crumbs.itemListElement.map((i) => i.name)).toEqual(['Home', 'Thrissur', 'Guruvayoor', 'AC Service']);

    const faq = docs.find((d) => d['@type'] === 'FAQPage') as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
    expect(faq.mainEntity.length).toBeGreaterThan(0);
    for (const q of faq.mainEntity) expect(q.acceptedAnswer.text.length).toBeGreaterThan(10);
  });

  test('every WhatsApp link on a landing page is pre-filled with service + town', async ({ page }) => {
    await page.goto('/thrissur/guruvayoor/ac-service');
    const hrefs = await page.locator('a[href*="wa.me"]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
    expect(hrefs.length).toBeGreaterThan(5);
    for (const href of hrefs) {
      const text = new URL(href).searchParams.get('text') ?? '';
      expect(text).toContain('I need AC service in Guruvayoor.');
    }
  });

  test('reviews section is absent while no reviews are published', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('What customers say')).toHaveCount(0);
  });

  test('unpublished service × town page is a 404 and not in the sitemap', async ({ page, request }) => {
    const res = await page.goto('/thrissur/guruvayoor/painting');
    expect(res?.status()).toBe(404);
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('/thrissur/guruvayoor/ac-service');
    expect(sitemap).not.toContain('/thrissur/guruvayoor/painting');
  });
});

test.describe('interaction', () => {
  test('FAQ: first open, one open at a time, keyboard operable', async ({ page }) => {
    await page.goto('/locations/kannur');
    const items = page.locator('details.faq');
    await expect(items.first()).toHaveAttribute('open', '');
    await items.nth(1).locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(items.nth(1)).toHaveAttribute('open', '');
    await expect(items.first()).not.toHaveAttribute('open', '');
  });

  test('desktop menus open with the keyboard and close on Escape', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop navigation');
    await page.goto('/');
    const services = page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Services' });
    await services.focus();
    await page.keyboard.press('Enter');
    await expect(services).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('link', { name: 'Gas Pipeline' }).first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(services).toHaveAttribute('aria-expanded', 'false');
    await expect(services).toBeFocused();
  });

  test('mobile menu and sticky contact bar', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile layout');
    await page.goto('/thrissur/guruvayoor/ac-service');
    const bar = page.getByRole('navigation', { name: 'Quick contact' });
    await expect(bar).toBeVisible();
    await expect(bar.getByRole('link', { name: 'Book Service' })).toHaveAttribute('href', '/book?service=ac-service&town=guruvayoor');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeHidden();
  });

  test('skip link jumps to the main content', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard');
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });
});
