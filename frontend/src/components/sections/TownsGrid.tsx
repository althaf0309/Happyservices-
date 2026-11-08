import { ChevronRight, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { WhatsAppLink } from '@/components/booking/ContactActions';
import { SectionHeading } from '@/components/ui/SectionHeading';
import type { District } from '@/types/api';

export function TownsGrid({ districts }: { districts: District[] }) {
  return (
    <section className="container-x grid gap-10 py-14 lg:grid-cols-[320px_1fr] lg:py-20" aria-labelledby="towns-heading">
      <div>
        <SectionHeading id="towns-heading" eyebrow="Service areas" title="Towns we cover">
          Don’t see your area? Send your location on WhatsApp and we’ll tell you straight away if a technician can reach you.
        </SectionHeading>
        <WhatsAppLink
          placement="towns_grid"
          extra="Can you reach my area?"
          className="mt-5 inline-flex min-h-[44px] items-center gap-2 font-semibold text-whatsapp hover:underline"
        >
          <MessageCircle size={20} strokeWidth={1.8} aria-hidden /> Send your location
        </WhatsAppLink>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        {districts.map((d) => (
          <div key={d.slug}>
            <h3 className="eyebrow">
              <Link href={`/locations/${d.slug}`} className="hover:underline">
                {d.name}
              </Link>
            </h3>
            <ul className="mt-3 divide-y divide-line">
              {d.towns.map((t) => (
                <li key={t.slug}>
                  <Link href={`/${d.slug}/${t.slug}`} className="group flex min-h-[56px] items-center justify-between gap-2 py-3">
                    <span>
                      <span className="block font-semibold group-hover:text-happy">{t.name}</span>
                      <span className="block text-sm text-slate">AC · Fridge · Washing machine · Home services</span>
                    </span>
                    <ChevronRight size={20} strokeWidth={1.8} className="shrink-0 text-slate group-hover:text-happy" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
