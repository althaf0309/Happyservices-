'use client';

import type { ReactNode } from 'react';
import { trackContactClick } from '@/lib/analytics';
import { telUrl, whatsappUrl } from '@/lib/whatsapp';

export interface Named {
  slug: string;
  name: string;
}

interface ContactLinkProps {
  service?: Named;
  town?: Named;
  placement: string;
  className?: string;
  children: ReactNode;
  'aria-label'?: string;
}

/** WhatsApp link pre-filled with the page's service and town; tracked as whatsapp_click. */
export function WhatsAppLink({ service, town, placement, extra, className, children, ...rest }: ContactLinkProps & { extra?: string }) {
  return (
    <a
      href={whatsappUrl({ service: service?.name, town: town?.name, extra })}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={rest['aria-label']}
      onClick={() => trackContactClick({ kind: 'whatsapp', service: service?.slug, town: town?.slug, placement })}
    >
      {children}
    </a>
  );
}

/** tel: link; tracked as call_click. */
export function CallLink({ service, town, placement, className, children, ...rest }: ContactLinkProps) {
  return (
    <a
      href={telUrl()}
      className={className}
      aria-label={rest['aria-label']}
      onClick={() => trackContactClick({ kind: 'call', service: service?.slug, town: town?.slug, placement })}
    >
      {children}
    </a>
  );
}
