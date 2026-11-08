import type { BookingDistrict } from '@/components/booking/BookingForm';
import type { Named } from '@/components/booking/ContactActions';

export interface SiteIndex {
  services: Named[];
  districts: BookingDistrict[];
}

/**
 * Work out the service/town a URL is about, so site-wide WhatsApp buttons can be
 * pre-filled: /thrissur/guruvayoor/ac-service, /thrissur/guruvayoor, /services/ac-service.
 */
export function contextFromPath(pathname: string, { services, districts }: SiteIndex): { service?: Named; town?: Named } {
  const [first, second, third] = pathname.split('/').filter(Boolean);
  if (first === 'services') return { service: services.find((s) => s.slug === second) };
  const district = districts.find((d) => d.slug === first);
  if (!district) return {};
  return {
    town: district.towns.find((t) => t.slug === second),
    service: services.find((s) => s.slug === third),
  };
}

export function bookHref(ctx: { service?: Named; town?: Named }) {
  const params = new URLSearchParams();
  if (ctx.service) params.set('service', ctx.service.slug);
  if (ctx.town) params.set('town', ctx.town.slug);
  const qs = params.toString();
  return qs ? `/book?${qs}` : '/book';
}

/** Slim slug/name index of the catalogue for client components (keeps the RSC payload small). */
export function buildSiteIndex(
  services: Named[],
  districts: { slug: string; name: string; towns: Named[] }[],
): SiteIndex {
  return {
    services: services.map(({ slug, name }) => ({ slug, name })),
    districts: districts.map((d) => ({
      slug: d.slug,
      name: d.name,
      towns: d.towns.map(({ slug, name }) => ({ slug, name })),
    })),
  };
}
