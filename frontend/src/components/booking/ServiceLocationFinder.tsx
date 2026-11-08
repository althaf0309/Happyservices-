'use client';

import clsx from 'clsx';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import { buttonClasses } from '@/components/ui/Button';
import { SelectShell } from '@/components/ui/Field';
import type { BookingDistrict } from './BookingForm';
import type { Named } from './ContactActions';

/**
 * Routes to /[district]/[town]/[service] when that page is published, otherwise to the
 * service overview (no town) or the town page (no service).
 */
export function ServiceLocationFinder({
  services,
  districts,
  published,
  className,
}: {
  services: Named[];
  districts: BookingDistrict[];
  published: string[]; // "district/town/service"
  className?: string;
}) {
  const router = useRouter();
  const uid = useId();
  const [service, setService] = useState('');
  const [town, setTown] = useState('');
  const [error, setError] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const district = districts.find((d) => d.towns.some((t) => t.slug === town))?.slug;
    if (service && district && published.includes(`${district}/${town}/${service}`)) {
      router.push(`/${district}/${town}/${service}`);
    } else if (service) {
      router.push(`/services/${service}`);
    } else if (district) {
      router.push(`/${district}/${town}`);
    } else {
      setError('Choose a service or your location.');
      return;
    }
    setError('');
  };

  return (
    <form onSubmit={onSubmit} className={clsx('card p-4 xs:p-5', className)} aria-label="Find a service near you">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end lg:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-s`} className="mb-1.5 block text-sm font-semibold">
            What service do you need?
          </label>
          <SelectShell>
            <select id={`${uid}-s`} value={service} onChange={(e) => setService(e.target.value)} className="field-input appearance-none pr-11">
              <option value="">Select a service</option>
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </SelectShell>
        </div>
        <div>
          <label htmlFor={`${uid}-t`} className="mb-1.5 block text-sm font-semibold">
            Select your location
          </label>
          <SelectShell>
            <select id={`${uid}-t`} value={town} onChange={(e) => setTown(e.target.value)} className="field-input appearance-none pr-11">
              <option value="">Select your area</option>
              {districts.map((d) => (
                <optgroup key={d.slug} label={d.name}>
                  {d.towns.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </SelectShell>
        </div>
        <button type="submit" className={buttonClasses('primary', 'w-full md:w-auto lg:col-span-2 lg:w-full')}>
          <Search size={20} strokeWidth={1.8} aria-hidden /> Find service
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
