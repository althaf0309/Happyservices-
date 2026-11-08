'use client';

import { CalendarDays, MessageCircle, Phone } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { bookHref, contextFromPath, type SiteIndex } from '@/lib/pageContext';
import { CallLink, WhatsAppLink } from './ContactActions';

const item = 'flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold';

/** Mobile-only bottom bar: Call · WhatsApp · Book Service. */
export function StickyMobileBar({ index }: { index: SiteIndex }) {
  const pathname = usePathname();
  const ctx = contextFromPath(pathname, index);
  if (pathname === '/book') return null;

  return (
    <nav
      aria-label="Quick contact"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <CallLink {...ctx} placement="sticky_bar" className={`${item} text-happy`}>
        <Phone size={22} strokeWidth={1.8} aria-hidden /> Call
      </CallLink>
      <WhatsAppLink {...ctx} placement="sticky_bar" className={`${item} text-whatsapp`}>
        <MessageCircle size={22} strokeWidth={1.8} aria-hidden /> WhatsApp
      </WhatsAppLink>
      <Link href={bookHref(ctx)} className={`${item} m-1.5 rounded-field bg-happy text-white`}>
        <CalendarDays size={22} strokeWidth={1.8} aria-hidden /> Book Service
      </Link>
    </nav>
  );
}

/** Floating WhatsApp button, bottom-right on every page. */
export function FloatingWhatsApp({ index }: { index: SiteIndex }) {
  const ctx = contextFromPath(usePathname(), index);
  return (
    <WhatsAppLink
      {...ctx}
      placement="floating"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-[76px] right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-whatsapp text-white shadow-lift transition-transform duration-hover ease-brand hover:-translate-y-1 lg:bottom-6 lg:right-6"
    >
      <MessageCircle size={26} strokeWidth={1.8} aria-hidden />
    </WhatsAppLink>
  );
}

/** WhatsApp link for site-wide chrome (e.g. the footer), pre-filled from the current URL. */
export function PageWhatsAppLink({
  index,
  placement,
  className,
  children,
}: {
  index: SiteIndex;
  placement: string;
  className?: string;
  children: ReactNode;
}) {
  const ctx = contextFromPath(usePathname(), index);
  return (
    <WhatsAppLink {...ctx} placement={placement} className={className}>
      {children}
    </WhatsAppLink>
  );
}
