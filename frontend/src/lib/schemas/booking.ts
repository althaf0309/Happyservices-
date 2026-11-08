// Same rules are enforced server-side (backend/bookings/serializers.py).
// Uses zod's tree-shakeable "mini" build to keep the booking form's JS small.
import * as z from 'zod/v4-mini';

export const OTHER_TOWN = 'other';
export const PHONE_ERROR = 'Please enter a valid 10-digit mobile number.';

/**
 * Strip spaces/dashes and a +91, 91 or 0 prefix. The bare 91/0 prefixes are only
 * removed when the length shows they are a prefix, so 91234 56789 stays intact.
 */
export function normalizePhone(value: string): string {
  let v = value.replace(/[\s\-()]/g, '');
  if (v.startsWith('+91')) v = v.slice(3);
  else if (v.length === 12 && v.startsWith('91')) v = v.slice(2);
  else if (v.length === 11 && v.startsWith('0')) v = v.slice(1);
  return v;
}

export const preferredTimes = ['any', 'morning', 'afternoon', 'evening'] as const;
export const bookingSources = ['form', 'sticky_form', 'book_page'] as const;

export const bookingSchema = z
  .object({
    name: z
      .string()
      .check(
        z.trim(),
        z.minLength(2, 'Please enter your name'),
        z.maxLength(80, 'Please keep your name under 80 characters'),
      ),
    phone: z.string().check(z.overwrite(normalizePhone), z.regex(/^[6-9]\d{9}$/, PHONE_ERROR)),
    service: z.string().check(z.minLength(1, 'Choose a service')),
    town: z.string().check(z.minLength(1, 'Choose your location')), // town slug or OTHER_TOWN
    otherLocation: z.optional(z.string().check(z.trim(), z.maxLength(120, 'Please keep this under 120 characters'))),
    problem: z.optional(z.string().check(z.maxLength(1000, 'Please keep this under 1000 characters'))),
    preferredTime: z._default(z.enum(preferredTimes), 'any'),
    website: z.optional(z.string().check(z.maxLength(0))), // honeypot
    source: z._default(z.enum(bookingSources), 'form'),
    pageUrl: z.optional(z.url()),
    utm: z.optional(z.record(z.string(), z.string())),
  })
  .check(
    z.refine((v) => v.town !== OTHER_TOWN || Boolean(v.otherLocation), {
      message: 'Tell us your area',
      path: ['otherLocation'],
    }),
  );

export type BookingInput = z.input<typeof bookingSchema>;
export type BookingData = z.output<typeof bookingSchema>;

/** First error message per top-level field, e.g. { phone: PHONE_ERROR }. */
export function fieldErrors(error: z.core.$ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    out[key] ??= issue.message;
  }
  return out;
}

/** Shape POSTed to /bookings: "Other area" becomes town=null + otherLocation. */
export function toBookingPayload(data: BookingData) {
  const isOther = data.town === OTHER_TOWN;
  return {
    ...data,
    town: isOther ? null : data.town,
    otherLocation: isOther ? (data.otherLocation ?? '') : '',
    problem: data.problem ?? '',
    website: data.website ?? '',
  };
}
