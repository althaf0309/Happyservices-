import { ArrowRight } from 'lucide-react';
import { WhatsAppLink, type Named } from '@/components/booking/ContactActions';
import { ServiceIcon } from '@/components/ui/Icon';
import type { SubService } from '@/types/api';

export function SubServiceGrid({
  title,
  items,
  service,
  town,
  icon,
}: {
  title: string;
  items: SubService[];
  service: Named;
  town?: Named;
  icon: string;
}) {
  if (items.length === 0) return null;
  return (
    <section aria-label={title}>
      <h2 className="font-display text-2xl font-bold lg:text-[1.75rem]">{title}</h2>
      <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <li key={item.name} className="card lift flex flex-col p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-happy-50 text-happy">
              <ServiceIcon icon={icon} />
            </span>
            <h3 className="mt-3 font-semibold">{item.name}</h3>
            <p className="mt-1 flex-1 text-[15px] text-slate">{item.description}</p>
            <WhatsAppLink
              service={service}
              town={town}
              extra={`About: ${item.name}.`}
              placement="sub_service"
              className="mt-3 inline-flex min-h-[44px] items-center gap-1 text-[15px] font-semibold text-whatsapp hover:underline"
            >
              Ask on WhatsApp <ArrowRight size={16} strokeWidth={1.8} aria-hidden />
            </WhatsAppLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
