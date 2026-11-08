import type { MetadataRoute } from 'next';
import { api, pagePath } from '@/lib/api';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 3600;

/** Built from the API; unpublished service × town pages never appear. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, districts, pages] = await Promise.all([api.services(), api.locations(), api.publishedPages()]);

  const staticRoutes = ['/', '/services', '/locations', '/book', '/about', '/contact', '/privacy', '/terms'].map((path) => ({
    url: absoluteUrl(path),
    priority: path === '/' ? 1 : 0.5,
  }));

  return [
    ...staticRoutes,
    ...services.map((s) => ({ url: absoluteUrl(`/services/${s.slug}`), priority: 0.7 })),
    ...districts.map((d) => ({ url: absoluteUrl(`/locations/${d.slug}`), priority: 0.8 })),
    ...districts.flatMap((d) => d.towns.map((t) => ({ url: absoluteUrl(`/${d.slug}/${t.slug}`), priority: 0.7 }))),
    ...pages.map((p) => ({ url: absoluteUrl(pagePath(p)), lastModified: p.updatedAt, priority: 0.9 })),
  ];
}
