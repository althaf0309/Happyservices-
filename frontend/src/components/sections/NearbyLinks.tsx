import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

export interface NearbyGroup {
  title: string;
  links: { href: string; label: ReactNode }[];
}

/** Internal links for SEO: same service in nearby towns + other services in this town. */
export function NearbyLinks({ groups }: { groups: NearbyGroup[] }) {
  const visible = groups.filter((g) => g.links.length > 0);
  if (visible.length === 0) return null;
  return (
    <section className="grid gap-10 md:grid-cols-2" aria-label="Nearby">
      {visible.map((group) => (
        <div key={group.title}>
          <h2 className="font-display text-xl font-bold">{group.title}</h2>
          <ul className="mt-3 divide-y divide-line">
            {group.links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="group flex min-h-[52px] items-center justify-between gap-3 py-2 hover:text-happy">
                  <span>{link.label}</span>
                  <ArrowRight size={18} strokeWidth={1.8} aria-hidden className="shrink-0 text-slate group-hover:text-happy" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
