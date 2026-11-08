import { notFound } from 'next/navigation';
import type {
  District,
  DistrictHub,
  Faq,
  LandingPage,
  LegalPageContent,
  PublishedPage,
  Review,
  Service,
  ServiceDetail,
  SitePhotos,
  TownPage,
} from '@/types/api';

// Server-side only: build-time and ISR fetches.
const BASE = process.env.API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1';

/** Tag on every catalogue fetch; the backend's revalidate hook clears it. */
export const CATALOG_TAG = 'catalog';

export class ApiError extends Error {
  constructor(
    public status: number,
    path: string,
  ) {
    super(`API ${status} for ${path}`);
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600, tags: [CATALOG_TAG] },
  });
  if (!res.ok) throw new ApiError(res.status, path);
  return (await res.json()) as T;
}

/** Like get(), but renders the 404 page when the API says the record doesn't exist. */
async function getOr404<T>(path: string): Promise<T> {
  try {
    return await get<T>(path);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

/** Like get(), but returns null on 404 (for optional content). */
async function getOrNull<T>(path: string): Promise<T | null> {
  try {
    return await get<T>(path);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

const seg = encodeURIComponent;

export const api = {
  services: () => get<Service[]>('/services'),
  service: (slug: string) => getOr404<ServiceDetail>(`/services/${seg(slug)}`),
  locations: () => get<District[]>('/locations'),
  district: (district: string) => getOr404<DistrictHub>(`/locations/${seg(district)}`),
  town: (district: string, town: string) => getOr404<TownPage>(`/locations/${seg(district)}/${seg(town)}`),
  publishedPages: () => get<PublishedPage[]>('/pages/published'),
  landing: (district: string, town: string, service: string) =>
    getOr404<LandingPage>(`/pages/${seg(district)}/${seg(town)}/${seg(service)}`),
  globalFaqs: () => get<Faq[]>('/faqs?scope=global'),
  reviews: () => get<Review[]>('/reviews'),
  sitePhotos: () => get<SitePhotos>('/site-photos'),
  legal: (slug: 'privacy' | 'terms') => getOrNull<LegalPageContent>(`/legal/${slug}`),
};

export const pagePath = (p: { district: string; town: string; service: string }) =>
  `/${p.district}/${p.town}/${p.service}`;
