import { ArrowRight, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BookingForm } from '@/components/booking/BookingForm';
import { CallLink, WhatsAppLink } from '@/components/booking/ContactActions';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { WithBookingAside } from '@/components/layout/WithBookingAside';
import { CtaBand } from '@/components/sections/CtaBand';
import { FaqAccordion } from '@/components/sections/FaqAccordion';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { NearbyLinks } from '@/components/sections/NearbyLinks';
import { buttonClasses } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ServiceIcon } from '@/components/ui/Icon';
import { api } from '@/lib/api';
import { CONTACT } from '@/lib/config';
import { buildSiteIndex } from '@/lib/pageContext';
import { ogImageFor, pageMetadata } from '@/lib/seo';
import { serviceLabel } from '@/lib/text';

type Params = Promise<{ district: string; town: string }>;

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const districts = await api.locations();
  return districts.flatMap((d) => d.towns.map((t) => ({ district: d.slug, town: t.slug })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { district, town } = await params;
  const page = await api.town(district, town);
  return pageMetadata({
    title: `Home & Appliance Services in ${page.town.name}`,
    description: `AC, fridge and washing machine repair, plumbing and electrical work in ${page.town.name}, ${page.district.name}. Book by phone, WhatsApp or online — quote before any work.`,
    path: `/${district}/${town}`,
    ogImage: ogImageFor(district),
  });
}

export default async function TownPage({ params }: { params: Params }) {
  const { district, town } = await params;
  const [page, services, districts] = await Promise.all([api.town(district, town), api.services(), api.locations()]);
  const index = buildSiteIndex(services, districts);
  const twn = { slug: page.town.slug, name: page.town.name };
  const neighbours = page.district.towns.filter((t) => t.slug !== town);

  return (
    <>
      <Breadcrumbs
        items={[
          { name: page.district.name, href: `/locations/${district}` },
          { name: page.town.name, href: `/${district}/${town}` },
        ]}
      />
      <WithBookingAside
        form={<BookingForm services={index.services} districts={index.districts} defaultTown={town} source="sticky_form" />}
      >
        <header>
          <Chip>
            <MapPin size={16} strokeWidth={1.8} aria-hidden /> {page.district.name} district
          </Chip>
          <h1 className="h1 mt-4">Home &amp; Appliance Services in {page.town.name}</h1>
          <p className="lead mt-4">
            {page.town.blurb} Book AC, fridge and washing machine repair, plumbing, electrical work and more with a local Happy
            Services team.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <WhatsAppLink town={twn} placement="town_hero" className={buttonClasses('whatsapp')}>
              <MessageCircle size={20} strokeWidth={1.8} aria-hidden /> WhatsApp us
            </WhatsAppLink>
            <CallLink town={twn} placement="town_hero" className={buttonClasses('outline')}>
              <Phone size={20} strokeWidth={1.8} aria-hidden /> {CONTACT.phoneDisplay}
            </CallLink>
          </div>
        </header>

        {page.services.length > 0 && (
          <section aria-labelledby="town-services-heading">
            <h2 id="town-services-heading" className="h2">
              Services in {page.town.name}
            </h2>
            <ul className="mt-6 grid gap-4 xs:grid-cols-2">
              {page.services.map((s) => (
                <li key={s.slug}>
                  <Link href={`/${district}/${town}/${s.slug}`} className="card lift flex h-full gap-4 p-5">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-happy-50 text-happy">
                      <ServiceIcon icon={s.icon} />
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold">
                        {serviceLabel(s.name)} in {page.town.name}
                      </span>
                      <span className="mt-1 block text-sm text-slate">{s.shortDescription}</span>
                    </span>
                    <ArrowRight size={18} strokeWidth={1.8} aria-hidden className="mt-1 shrink-0 text-happy" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-slate">
              Need something else?{' '}
              <Link href="/services" className="font-semibold text-happy underline">
                See all services
              </Link>{' '}
              — we’ll tell you on WhatsApp if a technician can help in {page.town.name}.
            </p>
          </section>
        )}

        <HowItWorks variant="landing" />

        <FaqAccordion faqs={page.faqs} title={`${page.town.name} FAQ`} town={twn} />

        <NearbyLinks
          groups={[
            {
              title: `Other towns in ${page.district.name}`,
              links: neighbours.map((t) => ({ href: `/${district}/${t.slug}`, label: `Services in ${t.name}` })),
            },
          ]}
        />
      </WithBookingAside>

      <CtaBand
        title={`Something to fix at home in ${page.town.name}?`}
        text="Send it on WhatsApp — add a photo of the problem, and we’ll take it from there."
        town={twn}
      />
    </>
  );
}
