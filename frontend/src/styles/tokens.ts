// "Monsoon Blue" design tokens — mirrored into tailwind.config.ts theme.extend.
export const tokens = {
  color: {
    blue: '#1F3C88',
    blueDeep: '#172E6E',
    ink: '#111A2E',
    slate: '#3B4558',
    whatsapp: '#0B7A43',
    marigold: '#F5B83D',
    focus: '#E0A020',
    mist: '#F5F7FB',
    white: '#FFFFFF',
  },
  radius: { field: '14px', card: '24px', cardLg: '28px', section: '40px', chip: '999px' },
  font: { display: 'var(--font-bricolage)', body: 'var(--font-figtree)' },
  motion: { micro: '200ms', hover: '280ms', reveal: '400ms', ease: 'cubic-bezier(.2,.7,.2,1)' },
} as const;
