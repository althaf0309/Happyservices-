import { BookingSection } from '@/components/sections/BookingSection';
import { FaqAccordion } from '@/components/sections/FaqAccordion';
import { Hero } from '@/components/sections/Hero';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { PopularServices } from '@/components/sections/PopularServices';
import { RegionsBand } from '@/components/sections/RegionsBand';
import { Reviews } from '@/components/sections/Reviews';
import { TownsGrid } from '@/components/sections/TownsGrid';
import { TrustStrip } from '@/components/sections/TrustStrip';
import { WhyUs } from '@/components/sections/WhyUs';
import { api } from '@/lib/api';
import { SITE } from '@/lib/config';
import { buildSiteIndex } from '@/lib/pageContext';
import { pageMetadata } from '@/lib/seo';

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: `${SITE.name} — Home & appliance repair in Kannur, Thrissur & Kochi`,
  description: SITE.description,
  path: '/',
  absoluteTitle: true,
});

export default async function HomePage() {
  const [services, districts, faqs, reviews, published, photos] = await Promise.all([
    api.services(),
    api.locations(),
    api.globalFaqs(),
    api.reviews(),
    api.publishedPages(),
    api.sitePhotos(),
  ]);
  const index = buildSiteIndex(services, districts);
  const publishedKeys = published.map((p) => `${p.district}/${p.town}/${p.service}`);

  return (
    <>
      <Hero services={index.services} districts={index.districts} published={publishedKeys} photo={photos.homeHero} />
      <TrustStrip />
      <PopularServices services={services} />
      <RegionsBand districts={districts} />
      <HowItWorks />
      <WhyUs photo={photos.homeWhyUs} />
      <Reviews reviews={reviews} />
      <TownsGrid districts={districts} />
      <div className="container-x py-14 lg:py-20">
        <FaqAccordion faqs={faqs} eyebrow="FAQ" title="Questions before you book" layout="split" />
      </div>
      <BookingSection services={index.services} districts={index.districts} />
      <div className="h-14 lg:h-20" />
    </>
  );
}
