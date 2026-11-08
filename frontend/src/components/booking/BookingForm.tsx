'use client';

import clsx from 'clsx';
import { CalendarDays, CircleCheck, MessageCircle, Phone } from 'lucide-react';
import Link from 'next/link';
import { useId, useState, type FormEvent } from 'react';
import { buttonClasses } from '@/components/ui/Button';
import { Field, SelectShell, errorProps } from '@/components/ui/Field';
import { track } from '@/lib/analytics';
import { CONTACT, PUBLIC_API_BASE_URL } from '@/lib/config';
import {
  OTHER_TOWN,
  bookingSchema,
  fieldErrors,
  toBookingPayload,
  type BookingInput,
} from '@/lib/schemas/booking';
import type { ApiValidationError, BookingCreated } from '@/types/api';
import { CallLink, WhatsAppLink, type Named } from './ContactActions';

export interface BookingDistrict {
  slug: string;
  name: string;
  towns: Named[];
}

interface Props {
  services: Named[];
  districts: BookingDistrict[];
  defaultService?: string;
  defaultTown?: string;
  source?: BookingInput['source'];
  className?: string;
}

type State = { kind: 'idle' } | { kind: 'loading' } | { kind: 'success'; reference: string } | { kind: 'error' };

// Field order = focus order for "move focus to the first error".
const FIELDS = ['name', 'phone', 'service', 'town', 'otherLocation', 'problem', 'preferredTime'] as const;
type Errors = Partial<Record<(typeof FIELDS)[number], string>>;

function collectContext() {
  const utm: Record<string, string> = {};
  new URLSearchParams(window.location.search).forEach((value, key) => {
    if (key.startsWith('utm_')) utm[key] = value.slice(0, 200);
  });
  if (document.referrer && !document.referrer.startsWith(window.location.origin)) {
    utm.referrer = document.referrer.slice(0, 200);
  }
  return { pageUrl: window.location.href, utm };
}

export function BookingForm({ services, districts, defaultService = '', defaultTown = '', source = 'form', className }: Props) {
  const uid = useId();
  const fid = (name: string) => `${uid}-${name}`;
  const [state, setState] = useState<State>({ kind: 'idle' });

  // Uncontrolled inputs (values survive any failure) validated with the shared zod schema.
  // Errors appear after the first submit attempt, then update as the user types.
  const [errors, setErrors] = useState<Errors>({});
  const [attempted, setAttempted] = useState(false);
  const [serviceSlug, setServiceSlug] = useState(defaultService);
  const [townSlug, setTownSlug] = useState(defaultTown);
  const selectedService = services.find((s) => s.slug === serviceSlug);
  const selectedTown = districts.flatMap((d) => d.towns).find((t) => t.slug === townSlug);

  const readValues = (form: HTMLFormElement) => ({ ...Object.fromEntries(new FormData(form)), source });

  const showErrors = (next: Errors) => {
    setErrors(next);
    const first = FIELDS.find((f) => next[f]);
    if (first) document.getElementById(fid(first))?.focus();
  };

  const onChange = (e: FormEvent<HTMLFormElement>) => {
    const target = e.target as HTMLInputElement;
    if (target.name === 'service') setServiceSlug(target.value);
    if (target.name === 'town') setTownSlug(target.value);
    if (attempted) {
      const result = bookingSchema.safeParse(readValues(e.currentTarget));
      setErrors(result.success ? {} : fieldErrors(result.error));
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAttempted(true);
    const result = bookingSchema.safeParse({ ...readValues(e.currentTarget), ...collectContext() });
    if (!result.success) {
      showErrors(fieldErrors(result.error));
      return;
    }
    setErrors({});
    const data = result.data;
    setState({ kind: 'loading' });
    try {
      const res = await fetch(`${PUBLIC_API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(toBookingPayload(data)),
      });
      if (res.status === 201) {
        const body = (await res.json()) as BookingCreated;
        track('book_submit', { service: data.service, town: data.town, source: data.source });
        setState({ kind: 'success', reference: body.reference });
        return;
      }
      if (res.status === 400) {
        const { errors: serverErrors = {} } = (await res.json()) as ApiValidationError;
        const mapped: Errors = Object.fromEntries(FIELDS.filter((f) => serverErrors[f]?.length).map((f) => [f, serverErrors[f][0]]));
        if (Object.keys(mapped).length) {
          setState({ kind: 'idle' });
          showErrors(mapped);
          return;
        }
      }
      throw new Error(`Booking failed: ${res.status}`);
    } catch {
      setState({ kind: 'error' }); // values are kept
    }
  };

  const contactContext = { service: selectedService, town: selectedTown };

  return (
    <div className={clsx('card p-5 xs:p-6 lg:p-7', className)}>
      <p className="inline-flex items-center gap-2 rounded-chip bg-happy-50 px-3 py-1.5 text-eyebrow font-semibold uppercase text-happy">
        <CalendarDays size={16} strokeWidth={1.8} aria-hidden /> Book a service
      </p>
      <h2 className="mt-3 font-display text-[1.6rem] font-bold leading-tight lg:text-[1.75rem]">Request a technician visit</h2>
      <p className="mt-1.5 text-slate">Takes under a minute. We’ll contact you to confirm the visit.</p>

      <div aria-live="polite">
        {state.kind === 'success' ? (
          <div className="mt-6 rounded-card border border-whatsapp/20 bg-whatsapp-50 p-5 text-center">
            <CircleCheck className="mx-auto text-whatsapp" size={36} strokeWidth={1.8} aria-hidden />
            <p className="mt-2 font-display text-xl font-bold text-whatsapp">Request received</p>
            <p className="mt-2 text-slate">
              Your booking reference is <strong className="text-ink">{state.reference}</strong>. We’ll call you to confirm
              the visit time.
            </p>
            <WhatsAppLink
              {...contactContext}
              placement="booking_success"
              extra={`My booking reference is ${state.reference}.`}
              className={buttonClasses('whatsapp', 'mt-4 w-full')}
            >
              <MessageCircle {...{ size: 20, strokeWidth: 1.8 }} aria-hidden /> Continue on WhatsApp
            </WhatsAppLink>
            <button type="button" className="mt-3 text-sm font-semibold text-happy underline" onClick={() => {
                setAttempted(false);
                setState({ kind: 'idle' });
              }}>
              Send another request
            </button>
          </div>
        ) : null}
      </div>

      {state.kind !== 'success' && (
        <form noValidate onSubmit={onSubmit} onChange={onChange} className="mt-6 space-y-4">
          <div className="grid gap-4 xs:grid-cols-2">
            <Field id={fid('name')} label="Name" required error={errors.name}>
              <input
                name="name"
                {...errorProps(fid('name'), errors.name)}
                aria-required
                autoComplete="name"
                placeholder="Your name"
                className="field-input"
              />
            </Field>
            <Field id={fid('phone')} label="Mobile number" required error={errors.phone}>
              <input
                name="phone"
                {...errorProps(fid('phone'), errors.phone)}
                aria-required
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="98765 43210"
                className="field-input"
              />
            </Field>
          </div>

          <Field id={fid('service')} label="Service needed" required error={errors.service}>
            <SelectShell>
              <select
                name="service"
                defaultValue={defaultService}
                {...errorProps(fid('service'), errors.service)}
                aria-required
                className="field-input appearance-none pr-11"
              >
                <option value="">Choose a service</option>
                {services.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </SelectShell>
          </Field>

          <Field id={fid('town')} label="Your location" required error={errors.town}>
            <SelectShell>
              <select
                name="town"
                defaultValue={defaultTown}
                {...errorProps(fid('town'), errors.town)}
                aria-required
                className="field-input appearance-none pr-11"
              >
                <option value="">Choose your area</option>
                {districts.map((d) => (
                  <optgroup key={d.slug} label={d.name}>
                    {d.towns.map((t) => (
                      <option key={t.slug} value={t.slug}>
                        {t.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <option value={OTHER_TOWN}>Other area</option>
              </select>
            </SelectShell>
          </Field>

          {townSlug === OTHER_TOWN && (
            <Field id={fid('otherLocation')} label="Your area" required error={errors.otherLocation}>
              <input
                name="otherLocation"
                {...errorProps(fid('otherLocation'), errors.otherLocation)}
                aria-required
                autoComplete="address-level2"
                placeholder="e.g. Payyanur"
                className="field-input"
              />
            </Field>
          )}

          <Field id={fid('problem')} label="Describe the problem" optional error={errors.problem}>
            <textarea
              name="problem"
              {...errorProps(fid('problem'), errors.problem)}
              rows={3}
              maxLength={1000}
              placeholder="e.g. AC is not cooling properly"
              className="field-input py-3"
            />
          </Field>

          <Field id={fid('preferredTime')} label="Preferred visit time" optional>
            <SelectShell>
              <select name="preferredTime"
                defaultValue="any" id={fid('preferredTime')} className="field-input appearance-none pr-11">
                <option value="any">Any time</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </SelectShell>
          </Field>

          {/* Honeypot: hidden from people and assistive tech, bots fill it in. */}
          <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden>
            <label htmlFor={fid('website')}>Website</label>
            <input name="website" id={fid('website')} tabIndex={-1} autoComplete="off" />
          </div>

          {state.kind === 'error' && (
            <div role="alert" className="rounded-field border border-danger/30 bg-red-50 p-4 text-[15px] text-ink">
              <p className="font-semibold">Couldn’t send — call or WhatsApp us.</p>
              <p className="mt-1">
                <CallLink {...contactContext} placement="booking_error" className="font-semibold text-happy underline">
                  Call {CONTACT.phoneDisplay}
                </CallLink>{' '}
                or{' '}
                <WhatsAppLink {...contactContext} placement="booking_error" className="font-semibold text-whatsapp underline">
                  message us on WhatsApp
                </WhatsAppLink>
                .
              </p>
            </div>
          )}

          <button type="submit" disabled={state.kind === 'loading'} className={buttonClasses('primary', 'w-full text-lg')}>
            {state.kind === 'loading' ? 'Sending request…' : 'Request Service'}
          </button>
        </form>
      )}

      <div className="mt-5 flex items-center gap-3 text-sm text-slate">
        <span className="h-px flex-1 bg-line" />
        or reach us directly
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <WhatsAppLink {...contactContext} placement="booking_form" className={buttonClasses('whatsapp', 'px-3 text-[15px] leading-tight')}>
          <MessageCircle size={20} strokeWidth={1.8} aria-hidden /> Continue on WhatsApp
        </WhatsAppLink>
        <CallLink
          {...contactContext}
          placement="booking_form"
          className={buttonClasses('outline', 'whitespace-nowrap px-3 text-[15px]')}
          aria-label={`Call ${CONTACT.phoneDisplay}`}
        >
          <Phone size={20} strokeWidth={1.8} aria-hidden /> {CONTACT.phoneShort}
        </CallLink>
      </div>
      <p className="mt-4 text-center text-sm text-slate">
        We use your details only to arrange your service. See our{' '}
        <Link href="/privacy" className="text-happy underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
