import clsx from 'clsx';
import { MessageCircle, Plus } from 'lucide-react';
import { useId } from 'react';
import { WhatsAppLink, type Named } from '@/components/booking/ContactActions';
import { JsonLd } from '@/components/ui/JsonLd';
import { faqJsonLd } from '@/lib/seo';
import type { Faq } from '@/types/api';

/**
 * FAQ list + FAQPage JSON-LD. Renders nothing when there are no published FAQs.
 * Native <details name>: one open at a time, first open, keyboard/screen-reader support
 * built in, and no client JavaScript.
 */
export function FaqAccordion({
  faqs,
  title,
  eyebrow,
  layout = 'stack',
  service,
  town,
  className,
}: {
  faqs: Faq[];
  title: string;
  eyebrow?: string;
  layout?: 'split' | 'stack';
  service?: Named;
  town?: Named;
  className?: string;
}) {
  const group = useId();
  if (faqs.length === 0) return null;

  return (
    <section
      aria-label={title}
      className={clsx(layout === 'split' && 'grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr] lg:gap-16', className)}
    >
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className={layout === 'split' ? 'h2' : 'font-display text-2xl font-bold lg:text-[1.75rem]'}>{title}</h2>
        {layout === 'split' && (
          <WhatsAppLink
            service={service}
            town={town}
            placement="faq"
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 font-semibold text-whatsapp hover:underline"
          >
            <MessageCircle size={20} strokeWidth={1.8} aria-hidden /> Ask us on WhatsApp
          </WhatsAppLink>
        )}
      </div>
      <div className={clsx(layout === 'stack' && 'mt-6')}>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={faq.id} name={group} open={i === 0} className="faq card group overflow-hidden">
              <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 lg:px-6 [&::-webkit-details-marker]:hidden">
                <h3 className="font-sans text-base font-semibold">{faq.question}</h3>
                <span
                  aria-hidden
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-happy transition-[transform,background-color,color] duration-reveal ease-brand group-open:rotate-45 group-open:border-happy group-open:bg-happy group-open:text-white"
                >
                  <Plus size={18} strokeWidth={2} />
                </span>
              </summary>
              <p className="px-5 pb-5 text-slate lg:px-6">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
      <JsonLd data={faqJsonLd(faqs)} />
    </section>
  );
}
