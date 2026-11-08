import clsx from 'clsx';

/** House roof + marigold smile mark. */
export function LogoMark({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <svg viewBox="0 0 44 44" className={clsx('h-11 w-11 shrink-0', className)} aria-hidden>
      <rect width="44" height="44" rx="12" fill={inverted ? '#FFFFFF' : '#1F3C88'} />
      <path
        d="M13 21.5 22 14l9 7.5"
        fill="none"
        stroke={inverted ? '#1F3C88' : '#FFFFFF'}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16.5 27.5c3.2 3.2 7.8 3.2 11 0" fill="none" stroke="#F5B83D" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}
