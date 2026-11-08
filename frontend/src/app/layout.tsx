import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import Script from 'next/script';
import type { ReactNode } from 'react';
import { FloatingWhatsApp, StickyMobileBar } from '@/components/booking/StickyMobileBar';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { JsonLd } from '@/components/ui/JsonLd';
import { api } from '@/lib/api';
import { GA_ID, SITE } from '@/lib/config';
import { buildSiteIndex } from '@/lib/pageContext';
import { businessJsonLd } from '@/lib/seo';
import '@/styles/globals.css';

// Self-hosted at build time by next/font (latin subset, swap). Both are variable fonts:
// one file each covers every weight we use.
const display = Bricolage_Grotesque({ subsets: ['latin'], display: 'swap', variable: '--font-bricolage' });
const body = Figtree({ subsets: ['latin'], display: 'swap', variable: '--font-figtree' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — Home & appliance repair in Kannur, Thrissur & Kochi`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  openGraph: { siteName: SITE.name, locale: 'en_IN', type: 'website' },
};

export const viewport: Viewport = { themeColor: '#1F3C88' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [services, districts] = await Promise.all([api.services(), api.locations()]);
  const index = buildSiteIndex(services, districts);

  return (
    <html lang="en-IN" className={`${display.variable} ${body.variable}`}>
      <body className="pb-[76px] lg:pb-0">
        <a
          href="#main"
          className="sr-only z-[60] rounded-field bg-happy px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <Header index={index} />
        <main id="main" tabIndex={-1} className="focus:outline-none">
          {children}
        </main>
        <Footer services={services} districts={districts} />
        <FloatingWhatsApp index={index} />
        <StickyMobileBar index={index} />
        <JsonLd data={businessJsonLd(districts)} />
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
