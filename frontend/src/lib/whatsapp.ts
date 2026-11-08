import { CONTACT } from './config';
import { servicePhrase } from './text';

/** Every WhatsApp link arrives pre-filled, e.g. "I need AC service in Guruvayoor." */
export function whatsappUrl(opts: { service?: string; town?: string; extra?: string } = {}) {
  const parts = ['Hi Happy Services,'];
  const service = opts.service ? servicePhrase(opts.service) : '';
  if (service && opts.town) parts.push(`I need ${service} in ${opts.town}.`);
  else if (service) parts.push(`I need ${service}.`);
  else if (opts.town) parts.push(`I need a technician in ${opts.town}.`);
  else parts.push('I need a technician.');
  if (opts.extra) parts.push(opts.extra);
  return `https://wa.me/${CONTACT.waNumber}?text=${encodeURIComponent(parts.join(' '))}`;
}

export const telUrl = () => `tel:+${CONTACT.waNumber}`;
