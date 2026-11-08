import { Mail, MessageCircle, Phone } from 'lucide-react';
import { BookingForm } from '@/components/booking/BookingForm';
import { CallLink, WhatsAppLink } from '@/components/booking/ContactActions';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { api } from '@/lib/api';
import { CONTACT } from '@/lib/config';
import { buildSiteIndex } from '@/lib/pageContext';
import { pageMetadata } from '@/lib/seo';

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: 'Contact Us',
  description: `Call ${CONTACT.phoneDisplay}, message us on WhatsApp or email ${CONTACT.email} to book a technician in Kannur, Thrissur or Kochi.`,
  path: '/contact',
});

export default async function ContactPage() {
  const [services, districts] = await Promise.all([api.services(), api.locations()]);
  const index = buildSiteIndex(services, districts);
  const card = 'card lift flex items-center gap-4 p-5';

  return (
    <>
      <Breadcrumbs items={[{ name: 'Contact', href: '/contact' }]} />
      <section className="container-x grid gap-10 py-10 lg:grid-cols-[1fr_480px] lg:gap-16 lg:py-14">
        <div>
          <p className="eyebrow">Contact</p>
          <h1 className="h1 mt-3">Get in touch</h1>
          <p className="lead mt-4 max-w-xl">Call, WhatsApp or email — or send the form and we’ll call you back to confirm a visit.</p>
          <ul className="mt-8 grid max-w-md gap-3">
            <li>
              <CallLink placement="contact_page" className={card}>
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-happy text-white">
                  <Phone size={24} strokeWidth={1.8} aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold">{CONTACT.phoneDisplay}</span>
                  <span className="block text-sm text-slate">Call to book</span>
                </span>
              </CallLink>
            </li>
            <li>
              <WhatsAppLink placement="contact_page" className={card}>
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-whatsapp text-white">
                  <MessageCircle size={24} strokeWidth={1.8} aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold">WhatsApp</span>
                  <span className="block text-sm text-slate">Share photos of the problem</span>
                </span>
              </WhatsAppLink>
            </li>
            <li>
              <a href={`mailto:${CONTACT.email}`} className={card}>
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-happy-50 text-happy">
                  <Mail size={24} strokeWidth={1.8} aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold">{CONTACT.email}</span>
                  <span className="block text-sm text-slate">Email us</span>
                </span>
              </a>
            </li>
          </ul>
        </div>
        <BookingForm services={index.services} districts={index.districts} />
      </section>
    </>
  );
}
