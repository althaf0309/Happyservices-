import { describe, expect, it } from 'vitest';
import { OTHER_TOWN, PHONE_ERROR, bookingSchema, fieldErrors, normalizePhone, toBookingPayload } from './booking';

const valid = { name: 'Anil Kumar', phone: '+91 98470 12345', service: 'ac-service', town: 'guruvayoor' };

describe('normalizePhone', () => {
  it.each([
    ['+91 98470 12345', '9847012345'],
    ['+91-98470-12345', '9847012345'],
    ['919847012345', '9847012345'],
    ['09847012345', '9847012345'],
    ['98470 12345', '9847012345'],
    ['9123456789', '9123456789'], // real number starting 91 is left alone
  ])('%s -> %s', (raw, expected) => {
    expect(normalizePhone(raw)).toBe(expected);
  });
});

describe('bookingSchema', () => {
  it('accepts a valid booking and normalises the phone', () => {
    const data = bookingSchema.parse(valid);
    expect(data.phone).toBe('9847012345');
    expect(data.preferredTime).toBe('any');
    expect(data.source).toBe('form');
  });

  it('uses the exact design copy for a bad phone number', () => {
    const result = bookingSchema.safeParse({ ...valid, phone: '98765' });
    expect(result.success).toBe(false);
    expect(fieldErrors(result.error!)).toEqual({ phone: PHONE_ERROR });
  });

  it('rejects numbers that do not start with 6-9', () => {
    expect(bookingSchema.safeParse({ ...valid, phone: '5847012345' }).success).toBe(false);
  });

  it('requires a name of at least 2 characters after trimming', () => {
    expect(bookingSchema.safeParse({ ...valid, name: ' A ' }).success).toBe(false);
  });

  it('requires the area when "Other area" is chosen, then sends town as null', () => {
    expect(bookingSchema.safeParse({ ...valid, town: OTHER_TOWN }).success).toBe(false);
    const data = bookingSchema.parse({ ...valid, town: OTHER_TOWN, otherLocation: 'Payyanur' });
    expect(toBookingPayload(data)).toMatchObject({ town: null, otherLocation: 'Payyanur' });
  });

  it('rejects a filled honeypot', () => {
    expect(bookingSchema.safeParse({ ...valid, website: 'spam' }).success).toBe(false);
  });
});
