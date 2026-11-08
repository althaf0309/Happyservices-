import { MessageCircle, Phone } from 'lucide-react';
import { CallLink, WhatsAppLink, type Named } from '@/components/booking/ContactActions';
import { buttonClasses } from '@/components/ui/Button';
import { CONTACT } from '@/lib/config';

/** Blue band with WhatsApp + Call, pre-filled with the page's service and town. */
export function CtaBand({ title, text, service, town }: { title: string; text: string; service?: Named; town?: Named }) {
  return (
    <section className="px-3 py-10 md:px-5 lg:py-14" aria-label={title}>
      <div className="container-x flex flex-col gap-6 rounded-section bg-happy py-10 md:flex-row md:items-center md:justify-between lg:px-14 lg:py-14">
        <div className="max-w-xl">
          <h2 className="h2 !text-white">{title}</h2>
          <p className="mt-3 text-white/80">{text}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <WhatsAppLink service={service} town={town} placement="cta_band" className={buttonClasses('white', 'flex-1 md:flex-none')}>
            <MessageCircle size={20} strokeWidth={1.8} aria-hidden className="text-whatsapp" /> WhatsApp us
          </WhatsAppLink>
          <CallLink service={service} town={town} placement="cta_band" className={buttonClasses('outline-light', 'flex-1 md:flex-none')}>
            <Phone size={20} strokeWidth={1.8} aria-hidden /> Call {CONTACT.phoneShort}
          </CallLink>
        </div>
      </div>
    </section>
  );
}
