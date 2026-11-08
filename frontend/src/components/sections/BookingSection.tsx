import { MessageCircle, Phone } from 'lucide-react';
import { BookingForm, type BookingDistrict } from '@/components/booking/BookingForm';
import { CallLink, WhatsAppLink, type Named } from '@/components/booking/ContactActions';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { CONTACT } from '@/lib/config';

/** Home-page booking block: intro + contact cards on the left, form on the right. */
export function BookingSection({ services, districts }: { services: Named[]; districts: BookingDistrict[] }) {
  return (
    <section id="book" className="scroll-mt-24 px-3 md:px-5" aria-labelledby="book-heading">
      <div className="rounded-section bg-happy-100/70 py-14 lg:py-20">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_480px] lg:items-center">
          <div>
            <SectionHeading id="book-heading" eyebrow="Book a service" title="Tell us what needs fixing.">
              Send the form, message us on WhatsApp or call — whichever is easiest. We’ll confirm the visit and share the
              quote before any work starts.
            </SectionHeading>
            <div className="mt-8 grid max-w-md gap-3">
              <WhatsAppLink placement="book_section" className="card lift flex items-center gap-4 p-4">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-whatsapp text-white">
                  <MessageCircle size={24} strokeWidth={1.8} aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold">WhatsApp</span>
                  <span className="block text-sm text-slate">Share photos of the problem</span>
                </span>
              </WhatsAppLink>
              <CallLink placement="book_section" className="card lift flex items-center gap-4 p-4">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-happy text-white">
                  <Phone size={24} strokeWidth={1.8} aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold">{CONTACT.phoneDisplay}</span>
                  <span className="block text-sm text-slate">Call to book</span>
                </span>
              </CallLink>
            </div>
          </div>
          <BookingForm services={services} districts={districts} source="form" />
        </div>
      </div>
    </section>
  );
}
