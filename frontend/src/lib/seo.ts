import type { Metadata } from 'next';
import { CONTACT, SITE } from './config';

export const absoluteUrl = (path: string) => `${SITE.url}${path === '/' ? '' : path}`;

export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  absoluteTitle?: boolean;
}): Metadata {
  return {
    title: opts.absoluteTitle ? { absolute: opts.title } : opts.title,
    description: opts.description,
    alternates: { canonical: absoluteUrl(opts.path) },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: absoluteUrl(opts.path),
      siteName: SITE.name,
      locale: 'en_IN',
      type: 'website',
      ...(opts.ogImage ? { images: [{ url: opts.ogImage, width: 1200, height: 630 }] } : {}),
    },
  };
}

export const ogImageFor = (district: string) => `/og/${district}`;

const businessRef = () => ({
  '@type': 'HomeAndConstructionBusiness',
  '@id': `${SITE.url}/#business`,
  name: SITE.name,
  url: SITE.url,
  telephone: CONTACT.phoneDisplay.replace(/\s/g, ''),
});

/** Sitewide LocalBusiness. No AggregateRating until real reviews exist. */
export function businessJsonLd(districts: { name: string }[]) {
  return {
    '@context': 'https://schema.org',
    ...businessRef(),
    email: CONTACT.email,
    description: SITE.description,
    address: { '@type': 'PostalAddress', addressRegion: 'Kerala', addressCountry: 'IN' },
    areaServed: districts.map((d) => ({ '@type': 'AdministrativeArea', name: `${d.name}, Kerala` })),
  };
}

export function serviceJsonLd(opts: { name: string; description: string; town: string; district: string; path: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: opts.name,
    serviceType: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    provider: businessRef(),
    areaServed: { '@type': 'City', name: opts.town, containedInPlace: { '@type': 'AdministrativeArea', name: `${opts.district}, Kerala` } },
  };
}

export function breadcrumbJsonLd(items: { name: string; href: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}
