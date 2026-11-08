import { describe, expect, it } from 'vitest';
import { contextFromPath } from './pageContext';
import { serviceNoun, servicePhrase } from './text';
import { telUrl, whatsappUrl } from './whatsapp';

const text = (url: string) => decodeURIComponent(new URL(url).searchParams.get('text') ?? '');

describe('whatsappUrl', () => {
  it('pre-fills service and town', () => {
    const url = whatsappUrl({ service: 'AC Service', town: 'Guruvayoor' });
    expect(url.startsWith('https://wa.me/919037402356?text=')).toBe(true);
    expect(text(url)).toBe('Hi Happy Services, I need AC service in Guruvayoor.');
  });

  it('falls back gracefully', () => {
    expect(text(whatsappUrl({ service: 'Refrigerator Repair' }))).toBe('Hi Happy Services, I need refrigerator repair.');
    expect(text(whatsappUrl())).toBe('Hi Happy Services, I need a technician.');
    expect(text(whatsappUrl({ town: 'Kannur' }))).toBe('Hi Happy Services, I need a technician in Kannur.');
  });

  it('appends extra text', () => {
    expect(text(whatsappUrl({ service: 'AC Service', extra: 'My booking reference is HS-1.' }))).toContain('HS-1.');
  });

  it('builds the tel link from config', () => {
    expect(telUrl()).toBe('tel:+919037402356');
  });
});

describe('text helpers', () => {
  it('keeps acronyms', () => {
    expect(servicePhrase('CCTV Installation')).toBe('CCTV installation');
    expect(serviceNoun('AC Service')).toBe('AC');
    expect(serviceNoun('Washing Machine Repair')).toBe('washing machine');
  });
});

describe('contextFromPath', () => {
  const index = {
    services: [{ slug: 'ac-service', name: 'AC Service' }],
    districts: [{ slug: 'thrissur', name: 'Thrissur', towns: [{ slug: 'guruvayoor', name: 'Guruvayoor' }] }],
  };

  it('reads service and town from a landing URL', () => {
    expect(contextFromPath('/thrissur/guruvayoor/ac-service', index)).toEqual({
      service: index.services[0],
      town: index.districts[0].towns[0],
    });
  });

  it('reads the service from /services/[service]', () => {
    expect(contextFromPath('/services/ac-service', index).service?.slug).toBe('ac-service');
  });

  it('ignores unrelated paths', () => {
    expect(contextFromPath('/about', index)).toEqual({});
  });
});
