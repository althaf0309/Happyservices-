// The one place for contact constants — never hard-code these in components.
export const CONTACT = {
  phoneDisplay: '+91 90374 02356',
  phoneShort: '90374 02356',
  waNumber: '919037402356',
  email: 'newhappyservices@gmail.com',
} as const;

export const SITE = {
  name: 'Happy Services',
  tagline: 'Home & appliance care · Kerala',
  description:
    'AC, fridge and washing machine repair, plus plumbing, electrical, painting and more across Kannur, Thrissur and Kochi. Book by phone, WhatsApp or online.',
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
} as const;

/** Browser-side API base (booking POST, click events). */
export const PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1';

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';
