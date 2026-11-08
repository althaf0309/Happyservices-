import { ArrowRight, ChevronRight, MapPin, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { WhatsAppLink } from '@/components/booking/ContactActions';
import { LinkButton, buttonClasses } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ServiceIcon } from '@/components/ui/Icon';
import { Photo } from '@/components/ui/Photo';
import { SectionHeading } from '@/components/ui/SectionHeading';
import type { Service } from '@/types/api';

export function PopularServices({ services }: { services: Service[] }) {
  const featured = services.find((s) => s.isFeatured);
  const popular = services.filter((s) => s.isPopular && s !== featured).slice(0, 4);
  const more = services.filter((s) => s !== featured && !popular.includes(s));

  return (
    <section className="container-x py-14 lg:py-20" aria-labelledby="popular-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading id="popular-heading" eyebrow="Popular services" title="What can we fix for you today?" />
        <Link href="/services" className="hidden items-center gap-1 font-semibold text-happy hover:underline md:inline-flex">
          Explore all services <ArrowRight size={18} strokeWidth={1.8} aria-hidden />
        </Link>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        {featured && (
          <article className="card lift flex flex-col overflow-hidden">
            <div className="relative">
              <Photo image={featured.image} label="Technician cleaning split-AC indoor unit, filter out" className="aspect-[16/10] lg:aspect-[16/11]" />
              <Chip tone="dark" className="absolute left-4 top-4">
                Most requested
              </Chip>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="h3 flex items-center gap-2">
                <ServiceIcon icon={featured.icon} className="text-happy" /> {featured.name}
              </h3>
              <p className="mt-2 text-slate">{featured.shortDescription}</p>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-slate">
                <MapPin size={16} strokeWidth={1.8} aria-hidden /> Kannur · Thrissur · Kochi
              </p>
              <div className="mt-auto flex gap-3 pt-5">
                <LinkButton href={`/services/${featured.slug}`} variant="outline" className="flex-1">
                  View service
                </LinkButton>
                <WhatsAppLink service={featured} placement="popular_featured" className={buttonClasses('whatsapp', 'flex-1')}>
                  <MessageCircle size={20} strokeWidth={1.8} aria-hidden /> Book
                </WhatsAppLink>
              </div>
            </div>
          </article>
        )}

        {/* Desktop/tablet: photo cards */}
        <div className="hidden gap-5 md:grid md:grid-cols-2">
          {popular.map((s) => (
            <article key={s.slug} className="card lift flex flex-col overflow-hidden">
              <Photo image={s.image} label={`${s.name} technician at work`} className="aspect-[16/9]" sizes="(min-width: 1024px) 25vw, 50vw" />
              <div className="flex flex-1 flex-col p-5">
                <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <ServiceIcon icon={s.icon} className="text-happy" /> {s.name}
                </h3>
                <p className="mt-1.5 text-sm text-slate">{s.shortDescription}</p>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <Link href={`/services/${s.slug}`} className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-happy hover:underline">
                    View service <ArrowRight size={16} strokeWidth={1.8} aria-hidden />
                  </Link>
                  <WhatsAppLink
                    service={s}
                    placement="popular_card"
                    aria-label={`WhatsApp us about ${s.name}`}
                    className="grid h-11 w-11 place-items-center rounded-xl bg-whatsapp-50 text-whatsapp hover:bg-whatsapp hover:text-white"
                  >
                    <MessageCircle size={20} strokeWidth={1.8} aria-hidden />
                  </WhatsAppLink>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Mobile: compact rows */}
        <ul className="card divide-y divide-line md:hidden">
          {popular.map((s) => (
            <li key={s.slug}>
              <Link href={`/services/${s.slug}`} className="flex min-h-[64px] items-center gap-3 px-4 py-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-happy-50 text-happy">
                  <ServiceIcon icon={s.icon} />
                </span>
                <span className="flex-1">
                  <span className="block font-semibold">{s.name}</span>
                  <span className="block text-sm text-slate">{s.shortDescription}</span>
                </span>
                <ChevronRight size={20} strokeWidth={1.8} aria-hidden className="text-slate" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {more.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-slate">More services</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {more.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/services/${s.slug}`}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-chip border border-line bg-white px-4 text-[15px] font-medium hover:border-happy hover:text-happy"
                >
                  <ServiceIcon icon={s.icon} size={20} className="text-happy" /> {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
