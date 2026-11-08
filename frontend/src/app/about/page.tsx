import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { CtaBand } from '@/components/sections/CtaBand';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { WhyUs } from '@/components/sections/WhyUs';
import { api } from '@/lib/api';
import { pageMetadata } from '@/lib/seo';

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: 'About Us',
  description: 'Happy Services is a local home and appliance service team covering Kannur, Thrissur and Kochi.',
  path: '/about',
});

export default async function AboutPage() {
  const photos = await api.sitePhotos();
  return (
    <>
      <Breadcrumbs items={[{ name: 'About', href: '/about' }]} />
      <section className="container-x pb-4 pt-10 lg:pt-14">
        <p className="eyebrow">About Happy Services</p>
        <h1 className="h1 mt-3 max-w-3xl">Home &amp; appliance care from people nearby</h1>
        <p className="lead mt-5 max-w-2xl">
          Happy Services handles appliance repair and home services across Kannur, Thrissur and Kochi — AC, fridge and washing
          machine repair as well as plumbing, electrical work, painting and more. One number, local teams, and a clear quote
          before any work starts.
        </p>
      </section>
      <WhyUs photo={photos.homeWhyUs} />
      <HowItWorks />
      <CtaBand title="Something to fix at home?" text="Message us on WhatsApp or call — we’ll confirm a visit time with you." />
    </>
  );
}
