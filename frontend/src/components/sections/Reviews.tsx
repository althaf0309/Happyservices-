import { Star } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import type { Review } from '@/types/api';

/** Renders nothing when there are no published reviews. Never ship placeholder reviews. */
export function Reviews({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  return (
    <section className="container-x py-14 lg:py-20" aria-labelledby="reviews-heading">
      <SectionHeading id="reviews-heading" eyebrow="Customer reviews" title="What customers say" />
      <ul className="mt-8 grid gap-5 md:grid-cols-3">
        {reviews.slice(0, 6).map((r) => (
          <li key={r.id} className="card flex flex-col p-6">
            {r.rating ? (
              <p className="flex gap-0.5 text-marigold" aria-label={`${r.rating} out of 5 stars`}>
                {Array.from({ length: r.rating }, (_, i) => (
                  <Star key={i} size={18} fill="currentColor" strokeWidth={1.5} aria-hidden />
                ))}
              </p>
            ) : null}
            <blockquote className="mt-3 flex-1 text-ink">“{r.text}”</blockquote>
            <p className="mt-4 font-semibold">{r.name}</p>
            <p className="text-sm text-slate">{[r.service, r.town, r.source].filter(Boolean).join(' · ')}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
