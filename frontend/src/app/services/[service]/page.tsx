import { MessageCircle, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import { BookingForm } from '@/components/booking/BookingForm';
import { CallLink, WhatsAppLink } from '@/components/booking/ContactActions';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { WithBookingAside } from '@/components/layout/WithBookingAside';
import { CommonProblems } from '@/components/sections/CommonProblems';
import { CtaBand } from '@/components/sections/CtaBand';
import { FaqAccordion } from '@/components/sections/FaqAccordion';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { SubServiceGrid } from '@/components/sections/SubServiceGrid';
import { buttonClasses } from '@/components/ui/Button';
import { ChipLink } from '@/components/ui/Chip';
import { ServiceIcon } from '@/components/ui/Icon';
import { Photo } from '@/components/ui/Photo';
import { api } from '@/lib/api';
import { CONTACT } from '@/lib/config';
import { buildSiteIndex } from '@/lib/pageContext';
import { pageMetadata } from '@/lib/seo';
import { serviceNoun, servicePhrase } from '@/lib/text';
import type { Town } from '@/types/api';

type Params = Promise<{ service: string }>;

export const revalidate = 3600;

export async function generateStaticParams() {
  const services = await api.services();
  return services.map((s) => ({ service: s.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { service } = await params;
  const s = await api.service(service);
  return pageMetadata({
    title: `${s.name} in Kannur, Thrissur & Kochi`,
    description: `${s.shortDescription} Book a local technician by phone, WhatsApp or online — quote before any work.`,
    path: `/services/${service}`,
  });
}

export default async function ServicePage({ params }: { params: Params }) {
  const { service } = await params;
  const [s, services, districts] = await Promise.all([api.service(service), api.services(), api.locations()]);
  const index = buildSiteIndex(services, districts);
  const svc = { slug: s.slug, name: s.name };

  // Towns with a published landing page, grouped by district in district order.
  const byDistrict = districts
    .map((d) => ({ district: d, towns: s.towns.filter((t: Town) => t.district === d.slug) }))
    .filter((g) => g.towns.length > 0);

  return (
    <>
      <Breadcrumbs items={[{ name: 'Services', href: '/services' }, { name: s.name, href: `/services/${service}` }]} />
      <WithBookingAside
        form={<BookingForm services={index.services} districts={index.districts} defaultService={service} source="sticky_form" />}
      >
        <header>
          <p className="eyebrow flex items-center gap-2">
            <ServiceIcon icon={s.icon} size={18} /> Kannur · Thrissur · Kochi
          </p>
          <h1 className="h1 mt-3">{s.name}</h1>
          <p className="lead mt-4">{s.description || s.shortDescription}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <WhatsAppLink service={svc} placement="service_hero" className={buttonClasses('whatsapp')}>
              <MessageCircle size={20} strokeWidth={1.8} aria-hidden /> WhatsApp for {servicePhrase(s.name)}
            </WhatsAppLink>
            <CallLink service={svc} placement="service_hero" className={buttonClasses('outline')}>
              <Phone size={20} strokeWidth={1.8} aria-hidden /> {CONTACT.phoneDisplay}
            </CallLink>
          </div>
          <Photo priority image={s.image} label={`${s.name} technician at work`} className="mt-8 aspect-[16/9] rounded-card-lg" sizes="(min-width: 1024px) 760px, 100vw" />
        </header>

        {byDistrict.length > 0 && (
          <section aria-labelledby="where-heading">
            <h2 id="where-heading" className="font-display text-2xl font-bold lg:text-[1.75rem]">
              {s.name} near you
            </h2>
            <div className="mt-5 grid gap-6 md:grid-cols-3">
              {byDistrict.map(({ district, towns }) => (
                <div key={district.slug}>
                  <h3 className="eyebrow">{district.name}</h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {towns.map((t) => (
                      <li key={t.slug}>
                        <ChipLink href={`/${district.slug}/${t.slug}/${service}`}>{t.name}</ChipLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        <SubServiceGrid title={`${serviceNoun(s.name)} services we offer`} items={s.subServices} service={svc} icon={s.icon} />
        <CommonProblems noun={serviceNoun(s.name)} problems={s.commonProblems} service={svc} />
        <HowItWorks variant="landing" />
        <FaqAccordion faqs={s.faqs} title={`${s.name} — FAQ`} service={svc} />
      </WithBookingAside>

      <CtaBand title={`Need ${servicePhrase(s.name)}?`} text="Message us — your service is already filled in." service={svc} />
    </>
  );
}
