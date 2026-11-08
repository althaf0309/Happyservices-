import { BookingForm } from '@/components/booking/BookingForm';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { api } from '@/lib/api';
import { buildSiteIndex } from '@/lib/pageContext';
import { pageMetadata } from '@/lib/seo';

// SSR: pre-fills from ?service=&town=
export const dynamic = 'force-dynamic';

export const metadata = pageMetadata({
  title: 'Book a Service',
  description: 'Request a technician visit in under a minute. We’ll contact you to confirm the visit and share the quote before any work.',
  path: '/book',
});

type SearchParams = Promise<{ service?: string | string[]; town?: string | string[] }>;

const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v) ?? '';

export default async function BookPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const [services, districts] = await Promise.all([api.services(), api.locations()]);
  const index = buildSiteIndex(services, districts);
  // Only pre-fill known slugs.
  const service = index.services.some((s) => s.slug === first(query.service)) ? first(query.service) : '';
  const town = index.districts.some((d) => d.towns.some((t) => t.slug === first(query.town))) ? first(query.town) : '';

  return (
    <>
      <Breadcrumbs items={[{ name: 'Book a Service', href: '/book' }]} />
      <section className="container-x grid gap-10 py-10 lg:grid-cols-[1fr_480px] lg:gap-16 lg:py-14">
        <div>
          <p className="eyebrow">Book a service</p>
          <h1 className="h1 mt-3">Tell us what needs fixing.</h1>
          <p className="lead mt-4 max-w-xl">
            Send the form, message us on WhatsApp or call — whichever is easiest. We’ll confirm the visit and share the quote
            before any work starts.
          </p>
          <ol className="mt-8 space-y-4">
            {['Tell us the problem', 'We confirm a visit time with you', 'Inspection and a clear quote', 'The fix — tested in front of you'].map(
              (step, i) => (
                <li key={step} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-happy font-semibold text-white" aria-hidden>
                    {i + 1}
                  </span>
                  {step}
                </li>
              ),
            )}
          </ol>
        </div>
        <BookingForm services={index.services} districts={index.districts} defaultService={service} defaultTown={town} source="book_page" />
      </section>
    </>
  );
}
