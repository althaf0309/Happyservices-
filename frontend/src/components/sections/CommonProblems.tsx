import { ArrowRight, CircleAlert } from 'lucide-react';
import { WhatsAppLink, type Named } from '@/components/booking/ContactActions';
import type { CommonProblem } from '@/types/api';

export function CommonProblems({
  noun,
  problems,
  service,
  town,
}: {
  noun: string; // "AC"
  problems: CommonProblem[];
  service: Named;
  town?: Named;
}) {
  if (problems.length === 0) return null;
  return (
    <section className="grid gap-8 lg:grid-cols-[260px_1fr]" aria-labelledby="problems-heading">
      <div>
        <h2 id="problems-heading" className="font-display text-2xl font-bold lg:text-[1.75rem]">
          Common {noun} problems
        </h2>
        <p className="mt-3 text-slate">
          Seeing one of these? Send a short video or photo on WhatsApp — it helps the technician come prepared.
        </p>
        <WhatsAppLink
          service={service}
          town={town}
          extra="Here is a photo/video of the problem:"
          placement="common_problems"
          className="mt-4 inline-flex min-h-[44px] items-center gap-1 font-semibold text-whatsapp hover:underline"
        >
          Describe your {noun} problem <ArrowRight size={16} strokeWidth={1.8} aria-hidden />
        </WhatsAppLink>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {problems.map((p) => (
          <li key={p.title} className="card flex gap-3 p-4">
            <CircleAlert size={22} strokeWidth={1.8} className="mt-0.5 shrink-0 text-happy" aria-hidden />
            <span>
              <span className="block font-semibold">{p.title}</span>
              <span className="block text-sm text-slate">{p.cause}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
