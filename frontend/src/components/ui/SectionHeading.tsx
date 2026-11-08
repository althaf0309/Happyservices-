import clsx from 'clsx';
import type { ReactNode } from 'react';

export function SectionHeading({
  eyebrow,
  title,
  children,
  className,
  light,
  id,
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
  light?: boolean;
  id?: string;
}) {
  return (
    <div className={clsx('max-w-2xl', className)}>
      {eyebrow && <p className={clsx('eyebrow mb-3', light && '!text-marigold')}>{eyebrow}</p>}
      <h2 id={id} className={clsx('h2', light && '!text-white')}>
        {title}
      </h2>
      {children && <div className={clsx('lead mt-4', light && '!text-white/80')}>{children}</div>}
    </div>
  );
}
