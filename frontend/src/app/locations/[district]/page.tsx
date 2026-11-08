import { ArrowRight, MapPin, MessageCircle } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BookingForm } from '@/components/booking/BookingForm';
import { CallLink, WhatsAppLink } from '@/components/booking/ContactActions';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { WithBookingAside } from '@/components/layout/WithBookingAside';
import { CtaBand } from '@/components/sections/CtaBand';
import { FaqAccordion } from '@/components/sections/FaqAccordion';
import { WhyChoose } from '@/components/sections/WhyUs';
import { LinkButton, buttonClasses } from '@/components/ui/Button';
import { ChipLink } from '@/components/ui/Chip';
import { ServiceIcon } from '@/components/ui/Icon';
import { Photo } from '@/components/ui/Photo';
import { api } from '@/lib/api';
import { CONTACT } from '@/lib/config';
import { buildSiteIndex } from '@/lib/pageContext';
import { ogImageFor, pageMetadata } from '@/lib/seo';
import { serviceLabel } from '@/lib/text';

type Params = Promise<{ district: string }>;

export const revalidate = 3600;

export async function generateStaticParams() {
  const districts = await api.locations();
  return districts.map((d) => ({ district: d.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { district } = await params;
  const hub = await api.district(district);
  const towns = hub.district.towns.map((t) => t.name).join(', ');
  return pageMetadata({
    title: `Home & Appliance Services in ${hub.district.name}`,
    description: `AC, fridge and washing machine repair, plumbing and electrical work in ${towns}. Book a local Happy Services technician by phone, WhatsApp or online.`.slice(0, 170),
    path: `/locations/${district}`,
    ogImage: ogImageFor(district),
  });
}

export default async function DistrictHubPage({ params }: { params: Params }) {
  const { district } = await params;
  const [hub, services, districts] = await Promise.all([api.district(district), api.services(), api.locations()]);
  const d = hub.district;
  const index = buildSiteIndex(services, districts);
  const isPublished = (town: string, service: string) => hub.pages.some((p) => p.town === town && p.service === service);
  const townsLabel = d.towns.map((t) => t.name).join(', ').replace(/, ([^,]*)$/, ' and $1');
  const quickServices = hub.popularServices.filter((s) => ['ac', 'fridge', 'washer'].includes(s.icon));

  return (
    <>
      <Breadcrumbs items={[{ name: 'Locations', href: '/locations' }, { name: d.name, href: `/locations/${district}` }]} />

      <section className="container-x grid gap-8 pt-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12 lg:pt-10">
        <div>
          <p className="eyebrow">
            {d.name} district{d.tagline && ` · ${d.tagline}`}
          </p>
          <h1 className="h1 mt-3">Home &amp; Appliance Services in {d.name}</h1>
          {d.intro && <p className="lead mt-5">{d.intro}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <WhatsAppLink town={{ slug: '', name: d.name }} placement="hub_hero" className={buttonClasses('whatsapp')}>
              <MessageCircle size={20} strokeWidth={1.8} aria-hidden /> WhatsApp us
            </WhatsAppLink>
            <LinkButton href="#book">Book a Service</LinkButton>
            <CallLink placement="hub_hero" className="inline-flex min-h-[52px] items-center px-2 font-semibold text-happy hover:underline">
              Call {CONTACT.phoneShort}
            </CallLink>
          </div>
          {d.towns.length > 1 && (
            <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate">Jump to:</span>
              {d.towns.map((t) => (
                <ChipLink key={t.slug} href={`#town-${t.slug}`}>
                  {t.name}
                </ChipLink>
              ))}
            </div>
          )}
        </div>
        <Photo priority image={d.image} label={`Technician with tool bag at the gate of a home in ${d.name}`} className="aspect-[4/3] rounded-card-lg" />
      </section>

      <WithBookingAside form={<BookingForm services={index.services} districts={index.districts} source="sticky_form" />}>
        <section aria-labelledby="towns-heading">
          <h2 id="towns-heading" className="h2">
            Towns we cover in {d.name}
          </h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {d.towns.map((t) => (
              <li key={t.slug} id={`town-${t.slug}`} className="card scroll-mt-28 p-6">
                <h3 className="flex items-center gap-2 font-display text-xl font-bold">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-happy-50 text-happy">
                    <MapPin size={20} strokeWidth={1.8} aria-hidden />
                  </span>
                  {t.name}
                </h3>
                {t.blurb && <p className="mt-3 text-[15px] text-slate">{t.blurb}</p>}
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {quickServices
                    .filter((s) => isPublished(t.slug, s.slug))
                    .map((s) => (
                      <li key={s.slug}>
                        <Link href={`/${district}/${t.slug}/${s.slug}`} className="inline-flex min-h-[36px] items-center font-medium text-happy hover:underline">
                          {serviceLabel(s.name)}
                        </Link>
                      </li>
                    ))}
                </ul>
                <Link href={`/${district}/${t.slug}`} className="mt-2 inline-flex min-h-[44px] items-center gap-1 font-semibold text-ink hover:text-happy">
                  All services in {t.name} <ArrowRight size={16} strokeWidth={1.8} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {quickServices.length > 0 && (
          <section aria-labelledby="popular-heading">
            <h2 id="popular-heading" className="h2">
              Popular in {d.name}
            </h2>
            <ul className="mt-6 grid gap-4 md:grid-cols-3">
              {quickServices.map((s) => (
                <li key={s.slug} className="card lift flex flex-col overflow-hidden">
                  <Photo image={s.image} label={`${s.name} in ${d.name}`} className="aspect-[16/10]" sizes="(min-width: 1024px) 240px, 100vw" />
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="flex items-center gap-2 font-semibold">
                      <ServiceIcon icon={s.icon} className="text-happy" /> {s.name}
                    </h3>
                    <p className="mt-1 flex-1 text-sm text-slate">{s.shortDescription}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <Link href={`/services/${s.slug}`} className="inline-flex min-h-[44px] items-center text-[15px] font-semibold text-happy hover:underline">
                        {serviceLabel(s.name)} in {d.name}
                      </Link>
                      <WhatsAppLink
                        service={s}
                        town={{ slug: '', name: d.name }}
                        placement="hub_popular"
                        aria-label={`WhatsApp us about ${s.name} in ${d.name}`}
                        className="grid h-11 w-11 place-items-center rounded-xl bg-whatsapp-50 text-whatsapp hover:bg-whatsapp hover:text-white"
                      >
                        <MessageCircle size={20} strokeWidth={1.8} aria-hidden />
                      </WhatsAppLink>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="all-services-heading">
          <h2 id="all-services-heading" className="h2">
            All services available in {d.name}
          </h2>
          <ul className="mt-6 grid gap-x-8 md:grid-cols-2">
            {hub.services.map((s) => (
              <li key={s.slug} className="border-b border-line">
                <Link href={`/services/${s.slug}`} className="group flex min-h-[56px] items-center gap-3 py-2">
                  <ServiceIcon icon={s.icon} className="text-happy" />
                  <span className="flex-1 group-hover:text-happy">
                    {serviceLabel(s.name)} in {d.name}
                  </span>
                  <ArrowRight size={18} strokeWidth={1.8} aria-hidden className="text-slate group-hover:text-happy" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <WhyChoose
          tone="band"
          title={`Why ${d.name} homes choose Happy Services`}
          reasons={[
            { title: d.towns.length > 1 ? `${d.towns.length} ${d.name} towns` : `Local to ${d.name}`, text: `${townsLabel}.` },
            { title: 'Quote before work', text: 'Know the fault and the cost before anything starts.' },
            { title: 'Book in a minute', text: 'Form, WhatsApp or phone — your town is pre-selected.' },
          ]}
        />

        <FaqAccordion faqs={hub.faqs} title={`${d.name} FAQ`} />

        {hub.otherDistricts.length > 0 && (
          <section aria-labelledby="other-regions-heading">
            <h2 id="other-regions-heading" className="font-display text-2xl font-bold">
              Other regions we serve
            </h2>
            <ul className="mt-5 grid gap-4 md:grid-cols-2">
              {hub.otherDistricts.map((o) => (
                <li key={o.slug}>
                  <Link href={`/locations/${o.slug}`} className="card lift flex items-center justify-between gap-4 p-5">
                    <span>
                      <span className="block font-display text-lg font-bold">{o.name}</span>
                      <span className="block text-sm text-slate">{o.towns.map((t) => t.name).join(', ')}</span>
                    </span>
                    <ArrowRight size={20} strokeWidth={1.8} aria-hidden className="shrink-0 text-happy" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </WithBookingAside>

      <CtaBand
        title={`Something to fix at home in ${d.name}?`}
        text="Send it on WhatsApp — add a photo and your town, and we’ll take it from there."
        town={{ slug: '', name: d.name }}
      />
    </>
  );
}
