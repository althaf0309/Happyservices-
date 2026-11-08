import { ClipboardCheck, MapPin, MessageCircle, Wrench, type LucideIcon } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';

const HOME_STEPS: [LucideIcon, string, string][] = [
  [Wrench, 'Choose a service', 'AC, fridge, washing machine, plumbing, electrical and more.'],
  [MapPin, 'Pick your location', 'Kannur, Thrissur or Kochi — down to your town.'],
  [MessageCircle, 'Call, WhatsApp or book', 'Your details reach us in one step. We confirm a time.'],
  [ClipboardCheck, 'Technician visits', 'Inspection, a clear quote, then the fix — at your home.'],
];

const LANDING_STEPS: [string, string][] = [
  ['Tell us the problem', 'Form, WhatsApp or a call.'],
  ['Confirm a time', 'We fix a visit slot with you.'],
  ['Inspection & quote', 'You approve before work.'],
  ['Service done', 'Tested in front of you.'],
];

export function HowItWorks({ variant = 'home' }: { variant?: 'home' | 'landing' }) {
  if (variant === 'landing') {
    return (
      <section className="card p-6 lg:p-8" aria-labelledby="how-booking-heading">
        <h2 id="how-booking-heading" className="font-display text-2xl font-bold">
          How booking works
        </h2>
        <ol className="mt-6 grid gap-5 xs:grid-cols-2 lg:grid-cols-4">
          {LANDING_STEPS.map(([title, text], i) => (
            <li key={title}>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-happy font-semibold text-white" aria-hidden>
                {i + 1}
              </span>
              <p className="mt-3 font-semibold">{title}</p>
              <p className="text-sm text-slate">{text}</p>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section className="container-x py-14 lg:py-20" aria-labelledby="how-heading">
      <SectionHeading id="how-heading" eyebrow="How it works" className="mx-auto text-center" title={<>From problem to fixed in four steps</>} />
      <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {HOME_STEPS.map(([Icon, title, text], i) => (
          // Decorative step number as generated content, so it stays out of the accessibility tree.
          <li
            key={title}
            data-step={String(i + 1).padStart(2, '0')}
            className="card relative p-6 before:absolute before:right-5 before:top-4 before:font-display before:text-4xl before:font-bold before:text-happy-100 before:content-[attr(data-step)]"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-happy-50 text-happy">
              <Icon size={24} strokeWidth={1.8} aria-hidden />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold">
              <span className="sr-only">Step {i + 1}: </span>
              {title}
            </h3>
            <p className="mt-1.5 text-[15px] text-slate">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
