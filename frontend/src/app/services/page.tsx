import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { CtaBand } from '@/components/sections/CtaBand';
import { ServiceIcon } from '@/components/ui/Icon';
import { api } from '@/lib/api';
import { pageMetadata } from '@/lib/seo';

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: 'All Services',
  description:
    'AC service, refrigerator and washing machine repair, plumbing, electrical, TV, painting, CCTV, interiors, welding and gas pipeline work across Kannur, Thrissur and Kochi.',
  path: '/services',
});

export default async function ServicesPage() {
  const services = await api.services();
  return (
    <>
      <Breadcrumbs items={[{ name: 'Services', href: '/services' }]} />
      <section className="container-x py-10 lg:py-14">
        <p className="eyebrow">Our services</p>
        <h1 className="h1 mt-3">All services</h1>
        <p className="lead mt-4 max-w-2xl">
          Appliances and home repairs from one number — across Kannur, Thrissur and Kochi. Pick a service to see where it’s
          available and book.
        </p>
        <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <li key={s.slug}>
              <Link href={`/services/${s.slug}`} className="card lift flex h-full flex-col p-6">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-happy-50 text-happy">
                  <ServiceIcon icon={s.icon} />
                </span>
                <h2 className="mt-4 font-display text-xl font-semibold">{s.name}</h2>
                <p className="mt-2 flex-1 text-slate">{s.shortDescription}</p>
                <span className="mt-4 inline-flex items-center gap-1 font-semibold text-happy">
                  View service <ArrowRight size={16} strokeWidth={1.8} aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <CtaBand title="Not sure which service you need?" text="Send a photo of the problem on WhatsApp and we’ll tell you." />
    </>
  );
}
