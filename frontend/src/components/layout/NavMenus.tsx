'use client';

import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { SiteIndex } from '@/lib/pageContext';

const linkBase =
  'inline-flex min-h-[44px] items-center gap-1 rounded-field px-4 text-[15px] font-medium text-ink transition-colors duration-micro ease-brand hover:bg-happy-50 hover:text-happy';
const active = 'bg-happy-50 text-happy';

function useCloseOnNavigate(close: () => void) {
  const pathname = usePathname();
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => closeRef.current(), [pathname]);
}

/** Keyboard-operable disclosure menu: Enter/Space opens, Escape closes and restores focus. */
function Dropdown({ label, isActive, children }: { label: string; isActive: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useCloseOnNavigate(() => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div
      ref={root}
      className="relative"
      onBlur={(e) => {
        if (!root.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={clsx(linkBase, (isActive || open) && active)}
      >
        {label}
        <ChevronDown size={18} strokeWidth={1.8} aria-hidden className={clsx('transition-transform duration-micro', open && 'rotate-180')} />
      </button>
      <div id={id} hidden={!open} className="absolute left-0 top-full z-50 mt-2 min-w-[280px] rounded-card border border-line bg-white p-3 shadow-lift">
        {children}
      </div>
    </div>
  );
}

const menuLink = 'block rounded-xl px-3 py-2.5 text-[15px] text-ink hover:bg-happy-50 hover:text-happy';

export function MainNav({ index }: { index: SiteIndex }) {
  const pathname = usePathname();
  const inLocations = pathname.startsWith('/locations') || index.districts.some((d) => pathname.startsWith(`/${d.slug}`));

  return (
    <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
      <Link href="/" className={clsx(linkBase, pathname === '/' && active)} aria-current={pathname === '/' ? 'page' : undefined}>
        Home
      </Link>
      <Dropdown label="Services" isActive={pathname.startsWith('/services')}>
        <ul className="grid gap-0.5">
          {index.services.map((s) => (
            <li key={s.slug}>
              <Link href={`/services/${s.slug}`} className={menuLink}>
                {s.name}
              </Link>
            </li>
          ))}
          <li className="mt-1 border-t border-line pt-1">
            <Link href="/services" className={clsx(menuLink, 'font-semibold text-happy')}>
              All services →
            </Link>
          </li>
        </ul>
      </Dropdown>
      <Dropdown label="Locations" isActive={inLocations}>
        <div className="grid min-w-[480px] grid-cols-3 gap-2">
          {index.districts.map((d) => (
            <div key={d.slug}>
              <Link href={`/locations/${d.slug}`} className={clsx(menuLink, 'font-semibold text-happy')}>
                {d.name}
              </Link>
              <ul>
                {d.towns.map((t) => (
                  <li key={t.slug}>
                    <Link href={`/${d.slug}/${t.slug}`} className={clsx(menuLink, 'py-2 text-sm')}>
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Dropdown>
      {[
        ['/about', 'About'],
        ['/contact', 'Contact'],
      ].map(([href, label]) => (
        <Link key={href} href={href} className={clsx(linkBase, pathname === href && active)} aria-current={pathname === href ? 'page' : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
