import { Phone } from 'lucide-react';
import Link from 'next/link';
import { CallLink } from '@/components/booking/ContactActions';
import { LinkButton, buttonClasses } from '@/components/ui/Button';
import { LogoMark } from '@/components/ui/Logo';
import { CONTACT, SITE } from '@/lib/config';
import type { SiteIndex } from '@/lib/pageContext';
import { MobileNav } from './MobileNav';
import { MainNav } from './NavMenus';

export function Header({ index }: { index: SiteIndex }) {
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-white/95 backdrop-blur">
      <div className="container-x flex h-[76px] items-center justify-between gap-4 lg:h-[84px]">
        <Link href="/" className="flex items-center gap-3 rounded-field">
          <LogoMark />
          <span className="leading-tight">
            <span className="block font-display text-lg font-bold text-ink lg:text-xl">{SITE.name}</span>
            <span className="block text-xs text-slate lg:text-[13px]">{SITE.tagline}</span>
          </span>
        </Link>

        <MainNav index={index} />

        <div className="flex items-center gap-2 lg:gap-3">
          <CallLink
            placement="header"
            className={buttonClasses('outline', 'hidden xl:inline-flex')}
            aria-label={`Call ${CONTACT.phoneDisplay}`}
          >
            <Phone size={20} strokeWidth={1.8} aria-hidden /> {CONTACT.phoneDisplay}
          </CallLink>
          <CallLink
            placement="header"
            className="grid h-[52px] w-[52px] place-items-center rounded-field border border-line bg-white text-happy lg:h-12 lg:w-12 xl:hidden"
            aria-label={`Call ${CONTACT.phoneDisplay}`}
          >
            <Phone size={22} strokeWidth={1.8} aria-hidden />
          </CallLink>
          <LinkButton href="/book" className="hidden lg:inline-flex">
            Book a Service
          </LinkButton>
          <MobileNav index={index} />
        </div>
      </div>
    </header>
  );
}
