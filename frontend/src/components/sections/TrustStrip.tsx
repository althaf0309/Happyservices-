import { BadgeIndianRupee, MapPin, MessageCircle, Phone } from 'lucide-react';

const ITEMS = [
  { icon: MapPin, title: 'Local teams', text: 'Kannur, Thrissur & Kochi' },
  { icon: BadgeIndianRupee, title: 'Quote before work', text: 'Know the cost up front' },
  { icon: MessageCircle, title: 'WhatsApp booking', text: 'Chat, share photos, get a slot', green: true },
  { icon: Phone, title: 'One number', text: 'Appliances and home repairs' },
];

export function TrustStrip() {
  return (
    <section aria-label="Why book with us" className="container-x">
      <ul className="card grid grid-cols-2 gap-x-4 gap-y-5 p-5 md:grid-cols-4 md:p-6">
        {ITEMS.map(({ icon: Icon, title, text, green }) => (
          <li key={title} className="flex items-start gap-3">
            <span
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${green ? 'bg-whatsapp-50 text-whatsapp' : 'bg-happy-50 text-happy'}`}
            >
              <Icon size={22} strokeWidth={1.8} aria-hidden />
            </span>
            <span>
              <span className="block font-semibold leading-snug">{title}</span>
              <span className="hidden text-sm text-slate md:block">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
