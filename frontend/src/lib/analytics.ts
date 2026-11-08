import { PUBLIC_API_BASE_URL } from './config';

type EventName = 'book_submit' | 'whatsapp_click' | 'call_click';
type Params = Record<string, string | undefined>;

declare global {
  interface Window {
    gtag?: (command: 'event', name: string, params?: Params) => void;
  }
}

export function track(event: EventName, params: Params = {}) {
  window.gtag?.('event', event, params);
}

export interface ContactClick {
  kind: 'whatsapp' | 'call';
  service?: string; // slug
  town?: string; // slug
  placement: string;
}

/** GA4 event plus a fire-and-forget ContactClick row in the backend. */
export function trackContactClick({ kind, placement, ...ctx }: ContactClick) {
  // District-level links pass a name with no slug; send undefined rather than "".
  const service = ctx.service || undefined;
  const town = ctx.town || undefined;
  track(kind === 'whatsapp' ? 'whatsapp_click' : 'call_click', { service, town, placement });
  fetch(`${PUBLIC_API_BASE_URL}/events/contact-click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, service, town, placement, pageUrl: window.location.href }),
    keepalive: true,
  }).catch(() => {});
}
