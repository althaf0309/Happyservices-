import clsx from 'clsx';
import Link from 'next/link';
import type { ReactNode } from 'react';

const base =
  'inline-flex min-h-[40px] items-center gap-1.5 rounded-chip px-4 text-sm font-medium transition-colors duration-micro ease-brand';

export function Chip({ children, tone = 'light', className }: { children: ReactNode; tone?: 'light' | 'dark' | 'outline'; className?: string }) {
  return (
    <span
      className={clsx(
        base,
        tone === 'light' && 'bg-happy-50 text-happy',
        tone === 'dark' && 'bg-ink text-white',
        tone === 'outline' && 'border border-dashed border-line text-slate',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ChipLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={clsx(base, 'bg-happy-50 text-happy hover:bg-happy hover:text-white', className)}>
      {children}
    </Link>
  );
}
