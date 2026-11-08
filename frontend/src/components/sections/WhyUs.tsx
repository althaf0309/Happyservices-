import clsx from 'clsx';
import { BadgeIndianRupee, Check, MapPin, MessageCircle, Wrench } from 'lucide-react';
import { Photo } from '@/components/ui/Photo';
import { SectionHeading } from '@/components/ui/SectionHeading';
import type { Image } from '@/types/api';

const HOME_REASONS = [
  { icon: MapPin, title: 'Nearby, not a call centre', text: 'Local service in Kannur, Thrissur and Kochi, arranged directly with our team.' },
  { icon: BadgeIndianRupee, title: 'Clear quotation process', text: 'You hear what’s wrong and what it costs before the repair begins.' },
  { icon: Wrench, title: 'Appliances and home repairs', text: 'One number for your AC and fridge as well as plumbing, wiring and painting.' },
  { icon: MessageCircle, title: 'Book the way you like', text: 'Phone, WhatsApp or a one-minute form — on any page of the site.' },
];

const VISIT_CHECKLIST = ['A confirmed visit time', 'Problem explained simply', 'Quote before any work', 'Work area left clean'];

/** Home: photo + four reasons + "What to expect on a visit" checklist. */
export function WhyUs({ photo }: { photo?: Image }) {
  return (
    <section className="container-x grid gap-10 py-14 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-20" aria-labelledby="why-heading">
      <div className="relative">
        <Photo image={photo} label="Your real technician explaining the fix to a homeowner, tools laid out neatly" className="aspect-[4/3] rounded-card-lg lg:aspect-[5/5]" />
        <div className="card relative -mt-12 mx-4 p-5 lg:absolute lg:bottom-6 lg:left-6 lg:right-6 lg:mx-0 lg:mt-0">
          <p className="font-semibold">What to expect on a visit</p>
          <ul className="mt-3 grid gap-2 xs:grid-cols-2">
            {VISIT_CHECKLIST.map((item) => (
              <li key={item} className="flex items-center gap-2 text-[15px] text-slate">
                <Check size={18} strokeWidth={2} className="shrink-0 text-whatsapp" aria-hidden /> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div>
        <SectionHeading id="why-heading" eyebrow="Why Happy Services" title="Straightforward service from people nearby" />
        <ul className="mt-8 space-y-6">
          {HOME_REASONS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-happy-50 text-happy">
                <Icon size={24} strokeWidth={1.8} aria-hidden />
              </span>
              <span>
                <span className="block font-display text-lg font-semibold">{title}</span>
                <span className="block text-slate">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Hub (blue band) and landing (plain columns) variants with three reasons. */
export function WhyChoose({
  title,
  reasons,
  tone = 'plain',
}: {
  title: string;
  reasons: { title: string; text: string }[];
  tone?: 'plain' | 'band';
}) {
  const band = tone === 'band';
  return (
    <section className={clsx(band && 'rounded-card-lg bg-happy p-7 text-white lg:p-10')} aria-label={title}>
      <h2 className={clsx('font-display text-2xl font-bold lg:text-[1.75rem]', band && '!text-white')}>{title}</h2>
      <ul className="mt-6 grid gap-6 md:grid-cols-3">
        {reasons.map((r) => (
          <li key={r.title} className={clsx('border-t-2 pt-4', band ? 'border-marigold' : 'border-happy')}>
            <p className="font-semibold">{r.title}</p>
            <p className={clsx('mt-1 text-[15px]', band ? 'text-white/80' : 'text-slate')}>{r.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
