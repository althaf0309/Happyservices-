import { MapPin, MessageCircle, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BookingForm } from '@/components/booking/BookingForm';
import { CallLink, WhatsAppLink } from '@/components/booking/ContactActions';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { WithBookingAside } from '@/components/layout/WithBookingAside';
import { CommonProblems } from '@/components/sections/CommonProblems';
import { CtaBand } from '@/components/sections/CtaBand';
import { FaqAccordion } from '@/components/sections/FaqAccordion';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { NearbyLinks } from '@/components/sections/NearbyLinks';
import { SubServiceGrid } from '@/components/sections/SubServiceGrid';
import { WhyChoose } from '@/components/sections/WhyUs';
import { buttonClasses } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { JsonLd } from '@/components/ui/JsonLd';
import { Photo } from '@/components/ui/Photo';
import { api, pagePath } from '@/lib/api';
import { CONTACT } from '@/lib/config';
import { buildSiteIndex } from '@/lib/pageContext';
import { ogImageFor, pageMetadata, serviceJsonLd } from '@/lib/seo';
import { serviceLabel, serviceNoun, servicePhrase } from '@/lib/text';

const APPLIANCE_ICONS = new Set(['ac', 'fridge', 'washer', 'tv']);

type Params = Promise<{ district: string; town: string; service: string }>;

// Pre-render every published page; new ones render on first request (ISR).
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const pages = await api.publishedPages();
  return pages.map(({ district, town, service }) => ({ district, town, service }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { district, town, service } = await params;
  const page = await api.landing(district, town, service);
  return pageMetadata({
    title: page.metaTitle,
    description: page.metaDescription || page.intro.slice(0, 160),
    path: pagePath({ district, town, service }),
    ogImage: ogImageFor(district),
  });
}

export default async function LandingPage({ params }: { params: Params }) {
  const { district, town, service } = await params;
  const [page, services, districts] = await Promise.all([
    api.landing(district, town, service),
    api.services(),
    api.locations(),
  ]);
  const index = buildSiteIndex(services, districts);
  const svc = { slug: page.service.slug, name: page.service.name };
  const twn = { slug: page.town.slug, name: page.town.name };
  const noun = serviceNoun(page.service.name);
  const phrase = servicePhrase(page.service.name);
  const path = pagePath({ district, town, service });
  const otherTowns = page.district.towns.filter((t) => t.slug !== page.town.slug);
  const nearbyTowns = page.nearby.sameServiceTowns;

  return (
    <>
      <Breadcrumbs
        items={[
          { name: page.district.name, href: `/locations/${district}` },
          { name: page.town.name, href: `/${district}/${town}` },
          { name: page.service.name, href: path },
        ]}
      />
      <JsonLd
        data={serviceJsonLd({ name: page.title, description: page.intro, town: page.town.name, district: page.district.name, path })}
      />

      <WithBookingAside
        form={
          <BookingForm
            services={index.services}
            districts={index.districts}
            defaultService={page.service.slug}
            defaultTown={page.town.slug}
            source="sticky_form"
          />
        }
      >
        <header>
          <Chip>
            <MapPin size={16} strokeWidth={1.8} aria-hidden /> {page.town.name}, {page.district.name} district
          </Chip>
          <h1 className="h1 mt-4">{page.title}</h1>
          <p className="lead mt-4">{page.intro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <WhatsAppLink service={svc} town={twn} placement="landing_hero" className={buttonClasses('whatsapp')}>
              <MessageCircle size={20} strokeWidth={1.8} aria-hidden /> WhatsApp for {phrase}
            </WhatsAppLink>
            <CallLink service={svc} town={twn} placement="landing_hero" className={buttonClasses('outline')}>
              <Phone size={20} strokeWidth={1.8} aria-hidden /> {CONTACT.phoneDisplay}
            </CallLink>
          </div>
          <Photo
            priority
            image={page.heroImage ?? page.service.image}
            label={`${page.service.name} technician at work in ${page.town.name}`}
            className="mt-8 aspect-[16/9] rounded-card-lg"
            sizes="(min-width: 1024px) 760px, 100vw"
          />
        </header>

        <SubServiceGrid
          title={`${noun} services we offer in ${page.town.name}`}
          items={page.subServices}
          service={svc}
          town={twn}
          icon={page.service.icon}
        />

        <CommonProblems noun={noun} problems={page.commonProblems} service={svc} town={twn} />

        {(page.types.length > 0 || page.brands.length > 0) && (
          <section className="grid gap-5 md:grid-cols-2" aria-label="Types and brands">
            {page.types.length > 0 && (
              <div className="card p-6">
                <h2 className="font-display text-xl font-bold">Types of {noun} we service</h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {page.types.map((t) => (
                    <li key={t}>
                      <Chip>{t}</Chip>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {page.brands.length > 0 && (
              <div className="card p-6">
                <h2 className="font-display text-xl font-bold">Brands serviced</h2>
                <p className="mt-3 text-slate">{page.brands.join(' · ')}</p>
              </div>
            )}
          </section>
        )}

        {page.areasCovered.length > 0 && (
          <section aria-labelledby="areas-heading">
            <h2 id="areas-heading" className="font-display text-2xl font-bold lg:text-[1.75rem]">
              Areas covered around {page.town.name}
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {page.areasCovered.map((a) => (
                <li key={a}>
                  <Chip>{a}</Chip>
                </li>
              ))}
            </ul>
            {nearbyTowns.length > 0 && (
              <p className="mt-4 text-slate">
                Also nearby:{' '}
                {nearbyTowns.slice(0, 2).map((t, i) => (
                  <span key={t.slug}>
                    {i > 0 && ' and '}
                    <Link href={`/${district}/${t.slug}/${service}`} className="font-medium text-happy underline">
                      {phrase} in {t.name}
                    </Link>
                  </span>
                ))}
                .
              </p>
            )}
          </section>
        )}

        <HowItWorks variant="landing" />

        <WhyChoose
          title="Why choose Happy Services"
          reasons={[
            {
              title: `Local to ${page.district.name} district`,
              text: otherTowns.length
                ? `We also cover ${otherTowns.map((t) => t.name).join(', ').replace(/, ([^,]*)$/, ' and $1')}.`
                : `Local service across ${page.district.name}.`,
            },
            { title: 'Quote before work', text: 'The technician explains the fault and the cost first.' },
            { title: 'Easy booking', text: `WhatsApp arrives pre-filled with “${phrase} in ${page.town.name}”.` },
          ]}
        />

        <FaqAccordion faqs={page.faqs} title={`${serviceLabel(page.service.name)} in ${page.town.name} — FAQ`} service={svc} town={twn} />

        <NearbyLinks
          groups={[
            {
              title: `${serviceLabel(page.service.name)} nearby`,
              links: nearbyTowns.map((t) => ({ href: `/${district}/${t.slug}/${service}`, label: `${serviceLabel(page.service.name)} in ${t.name}` })),
            },
            {
              title: `Other services in ${page.town.name}`,
              links: page.nearby.otherServices.slice(0, 6).map((s) => ({
                href: `/${district}/${town}/${s.slug}`,
                label: `${serviceLabel(s.name)} in ${page.town.name}`,
              })),
            },
          ]}
        />
      </WithBookingAside>

      <CtaBand
        title={
          APPLIANCE_ICONS.has(page.service.icon)
            ? `Need your ${noun} looked at in ${page.town.name}?`
            : `Need ${phrase} in ${page.town.name}?`
        }
        text="Message us — your service and location are already filled in."
        service={svc}
        town={twn}
      />
    </>
  );
}
