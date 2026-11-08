import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { CtaBand } from '@/components/sections/CtaBand';
import { ChipLink } from '@/components/ui/Chip';
import { Photo } from '@/components/ui/Photo';
import { api } from '@/lib/api';
import { pageMetadata } from '@/lib/seo';

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: 'Areas We Serve',
  description: 'Home and appliance services in Kannur, Thrissur and Kochi — find your town and book a local technician.',
  path: '/locations',
});

export default async function LocationsPage() {
  const districts = await api.locations();
  return (
    <>
      <Breadcrumbs items={[{ name: 'Locations', href: '/locations' }]} />
      <section className="container-x py-10 lg:py-14">
        <p className="eyebrow">Choose your location</p>
        <h1 className="h1 mt-3">Areas we serve</h1>
        <p className="lead mt-4 max-w-2xl">
          Local service across three regions. Pick your area to see the services available near you.
        </p>
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {districts.map((d) => (
            <li key={d.slug} className="card flex flex-col overflow-hidden">
              <Photo image={d.image} label={`Residential street, ${d.name}`} className="aspect-[16/10]" sizes="33vw" />
              <div className="flex flex-1 flex-col p-6">
                <h2 className="h3">{d.name}</h2>
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
            </li>
          ))}
        </ul>
      </section>
      <CtaBand
        title="Don’t see your area?"
        text="Send your location on WhatsApp and we’ll tell you straight away if a technician can reach you."
      />
    </>
  );
}
