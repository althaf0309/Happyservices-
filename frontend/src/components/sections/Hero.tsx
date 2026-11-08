import { CalendarDays, MessageCircle, Phone } from 'lucide-react';
import type { BookingDistrict } from '@/components/booking/BookingForm';
import { CallLink, WhatsAppLink, type Named } from '@/components/booking/ContactActions';
import { ServiceLocationFinder } from '@/components/booking/ServiceLocationFinder';
import { LinkButton, buttonClasses } from '@/components/ui/Button';
import { Photo } from '@/components/ui/Photo';
import { CONTACT } from '@/lib/config';
import type { Image } from '@/types/api';

export function Hero({
  services,
  districts,
  published,
  photo,
}: {
  services: Named[];
  districts: BookingDistrict[];
  published: string[];
  photo?: Image;
}) {
  return (
    <section className="container-x grid gap-8 pb-10 pt-8 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-12 lg:pb-16 lg:pt-14">
      <div>
        <p className="inline-flex items-center gap-2 rounded-chip bg-white px-4 py-2 text-sm font-medium text-slate shadow-card">
          <span className="h-2 w-2 rounded-full bg-whatsapp" aria-hidden />
          Serving Kannur · Thrissur · Kochi
        </p>
        <h1 className="h1 mt-5">
          Trusted home &amp; appliance services <span className="text-happy">near you</span>
        </h1>
        <p className="lead mt-5 max-w-xl">
          AC, fridge and washing machine repair, plus plumbing, electrical, painting and more — booked in a minute by phone,
          WhatsApp or online.
        </p>

        {/* Mobile order: Call · WhatsApp · Book Service; desktop: Book / WhatsApp / Call */}
        <div className="mt-7 grid grid-cols-3 gap-2 xs:gap-3 md:flex md:flex-wrap">
          <LinkButton href="#book" className="order-3 px-3 md:order-1 md:px-6">
            <CalendarDays size={20} strokeWidth={1.8} aria-hidden className="hidden xs:block" />
            <span className="md:hidden">Book</span>
            <span className="hidden md:inline">Book a Service</span>
          </LinkButton>
          <WhatsAppLink placement="hero" className={buttonClasses('whatsapp', 'order-2 px-3 md:px-6')}>
            <MessageCircle size={20} strokeWidth={1.8} aria-hidden className="hidden xs:block" />
            <span className="md:hidden">WhatsApp</span>
            <span className="hidden md:inline">WhatsApp Us</span>
          </WhatsAppLink>
          <CallLink placement="hero" className={buttonClasses('outline', 'order-1 px-3 md:order-3 md:px-6')}>
            <Phone size={20} strokeWidth={1.8} aria-hidden className="hidden xs:block" />
            <span>
              Call<span className="hidden md:inline"> Now</span>
            </span>
          </CallLink>
        </div>

        <ServiceLocationFinder services={services} districts={districts} published={published} className="mt-7 hidden lg:block" />
      </div>

      <div className="relative">
        <Photo
          priority
          image={photo}
          sizes="(min-width: 1024px) 560px, 100vw"
          label="Kerala technician in clean uniform servicing a split AC, bright modern apartment, natural light"
          className="aspect-[716/480] rounded-card-lg lg:aspect-[1120/1200]"
        />
        <div className="absolute right-4 top-4 hidden rounded-card bg-ink px-4 py-3 text-white shadow-lift md:block">
          <p className="text-eyebrow font-semibold uppercase text-marigold">Call us</p>
          <CallLink placement="hero_chip" className="font-display text-lg font-bold">
            {CONTACT.phoneDisplay}
          </CallLink>
        </div>
        <div className="absolute bottom-4 left-4 hidden max-w-[300px] items-center gap-3 rounded-card bg-white p-4 shadow-lift md:flex">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-whatsapp text-white">
            <MessageCircle size={22} strokeWidth={1.8} aria-hidden />
          </span>
          <div>
            <WhatsAppLink placement="hero_card" className="font-semibold text-ink hover:underline">
              Book on WhatsApp
            </WhatsAppLink>
            <p className="text-sm text-slate">Your service &amp; area are filled in for you</p>
          </div>
        </div>
      </div>

      <ServiceLocationFinder services={services} districts={districts} published={published} className="lg:hidden" />
    </section>
  );
}
