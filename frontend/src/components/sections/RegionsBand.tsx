import { ArrowRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { ChipLink } from '@/components/ui/Chip';
import { Photo } from '@/components/ui/Photo';
import { SectionHeading } from '@/components/ui/SectionHeading';
import type { District } from '@/types/api';

export function RegionsBand({ districts }: { districts: District[] }) {
  return (
    <section className="px-3 md:px-5" aria-labelledby="regions-heading">
      <div className="rounded-section bg-happy-deep py-14 lg:py-20">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading id="regions-heading" light eyebrow="Choose your location" title="Local service across three regions" />
            <p className="max-w-sm text-white/80">
              Pick your area to see the services available near you and book with your location already filled in.
            </p>
          </div>

          {/* Desktop/tablet cards */}
          <div className="mt-10 hidden gap-5 md:grid md:grid-cols-3">
            {districts.map((d) => (
              <article key={d.slug} className="card flex flex-col overflow-hidden">
                <Photo image={d.image} label={`Residential street, ${d.name}`} className="aspect-[16/10]" sizes="33vw" />
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="h3">{d.name}</h3>
                  <p className="mt-2 text-[15px] text-slate">{d.summary || d.tagline}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {d.towns.map((t) => (
                      <li key={t.slug}>
                        <ChipLink href={`/${d.slug}/${t.slug}`}>{t.name}</ChipLink>
                      </li>
                    ))}
                  </ul>
                  <Link href={`/locations/${d.slug}`} className="mt-auto inline-flex min-h-[44px] items-center gap-1 pt-5 font-semibold text-happy hover:underline">
                    Services in {d.name} <ArrowRight size={16} strokeWidth={1.8} aria-hidden />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Mobile accordion cards (no JS) */}
          <div className="mt-8 space-y-3 md:hidden">
            {districts.map((d, i) => (
              <details key={d.slug} className="group card overflow-hidden" open={i === 0}>
                <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between px-5 font-display text-lg font-bold [&::-webkit-details-marker]:hidden">
                  {d.name}
                  <ChevronDown size={22} strokeWidth={1.8} aria-hidden className="transition-transform duration-reveal group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-5">
                  <ul className="flex flex-wrap gap-2">
                    {d.towns.map((t) => (
                      <li key={t.slug}>
                        <ChipLink href={`/${d.slug}/${t.slug}`}>{t.name}</ChipLink>
                      </li>
                    ))}
                  </ul>
                  <Link href={`/locations/${d.slug}`} className="mt-3 inline-flex min-h-[44px] items-center gap-1 font-semibold text-happy">
                    Services in {d.name} <ArrowRight size={16} strokeWidth={1.8} aria-hidden />
                  </Link>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
