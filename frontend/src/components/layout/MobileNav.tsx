'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { buttonClasses } from '@/components/ui/Button';
import type { SiteIndex } from '@/lib/pageContext';

export function MobileNav({ index }: { index: SiteIndex }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLElement>('a, button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const link = 'block rounded-xl px-3 py-3 text-base text-ink hover:bg-happy-50';

  return (
    <>
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((o) => !o)}
        className="grid h-[52px] w-[52px] place-items-center rounded-field border border-line bg-white text-ink lg:hidden"
      >
        {open ? <X size={24} strokeWidth={1.8} aria-hidden /> : <Menu size={24} strokeWidth={1.8} aria-hidden />}
      </button>

      {open && (
        <div
          id="mobile-menu"
          ref={panel}
          className="fixed inset-x-0 bottom-0 top-[76px] z-50 overflow-y-auto border-t border-line bg-white px-5 pb-28 pt-4 lg:hidden"
        >
          <nav aria-label="Mobile">
            <Link href="/" className={link}>
              Home
            </Link>
            <p className="eyebrow mt-4 px-3">Services</p>
            <ul className="mt-1 grid grid-cols-2">
              {index.services.map((s) => (
                <li key={s.slug}>
                  <Link href={`/services/${s.slug}`} className={link}>
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="eyebrow mt-4 px-3">Locations</p>
            {index.districts.map((d) => (
              <div key={d.slug} className="mt-1">
                <Link href={`/locations/${d.slug}`} className={`${link} font-semibold text-happy`}>
                  {d.name}
                </Link>
                <ul className="grid grid-cols-2 pl-2">
                  {d.towns.map((t) => (
                    <li key={t.slug}>
                      <Link href={`/${d.slug}/${t.slug}`} className={`${link} py-2.5 text-[15px]`}>
                        {t.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="mt-4 border-t border-line pt-3">
              <Link href="/about" className={link}>
                About
              </Link>
              <Link href="/contact" className={link}>
                Contact
              </Link>
            </div>
            <Link href="/book" className={buttonClasses('primary', 'mt-4 w-full')}>
              Book a Service
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
