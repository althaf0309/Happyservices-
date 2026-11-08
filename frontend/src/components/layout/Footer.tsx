import Link from 'next/link';
import { CallLink } from '@/components/booking/ContactActions';
import { PageWhatsAppLink } from '@/components/booking/StickyMobileBar';
import { LogoMark } from '@/components/ui/Logo';
import { CONTACT, SITE } from '@/lib/config';
import { buildSiteIndex } from '@/lib/pageContext';
import { serviceLabel } from '@/lib/text';
import type { District, Service } from '@/types/api';

const link = 'text-white/75 transition-colors duration-micro hover:text-white';

export function Footer({ services, districts }: { services: Service[]; districts: District[] }) {
  return (
    <footer className="bg-ink text-white">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_repeat(3,0.8fr)] lg:py-16">
        <div>
          <Link href="/" className="inline-flex items-center gap-3 rounded-field">
            <LogoMark inverted />
            <span className="font-display text-xl font-bold">{SITE.name}</span>
          </Link>
          <p className="mt-4 max-w-sm text-white/75">
            Appliance repair and home services across Kannur, Thrissur and Kochi. Call, WhatsApp or book online.
          </p>
          <CallLink placement="footer" className="mt-5 block font-display text-xl font-bold">
            {CONTACT.phoneDisplay}
          </CallLink>
          <PageWhatsAppLink
            index={buildSiteIndex(services, districts)}
            placement="footer"
            className="mt-2 inline-block font-semibold text-whatsapp-light hover:underline"
          >
            WhatsApp us
          </PageWhatsAppLink>
          <a href={`mailto:${CONTACT.email}`} className={`${link} mt-2 block`}>
            {CONTACT.email}
          </a>
        </div>

        <nav aria-label="Services">
          <h2 className="font-display text-lg font-bold !text-white">Services</h2>
          <ul className="mt-4 space-y-2.5">
            {services.slice(0, 6).map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className={link}>
                  {serviceLabel(s.name)}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/services" className="font-semibold text-white hover:underline">
                All services →
              </Link>
            </li>
          </ul>
        </nav>

        {districts.map((d) => (
          <nav key={d.slug} aria-label={`${d.name} areas`}>
            <h2 className="font-display text-lg font-bold">
              <Link href={`/locations/${d.slug}`} className="!text-white hover:underline">
                {d.name}
              </Link>
            </h2>
            <ul className="mt-4 space-y-2.5">
              {d.towns.map((t) => (
                <li key={t.slug}>
                  <Link href={`/${d.slug}/${t.slug}`} className={link}>
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-3 py-6 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <ul className="flex gap-6">
            <li>
              <Link href="/privacy" className={link}>
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className={link}>
                Terms
              </Link>
            </li>
            <li>
              <a href="/sitemap.xml" className={link}>
                Sitemap
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
