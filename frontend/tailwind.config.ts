import type { Config } from 'tailwindcss';
import { tokens } from './src/styles/tokens';

const { color, radius, font, motion } = tokens;

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    // 390 = design mobile, 1280 = design desktop
    screens: { xs: '390px', md: '768px', lg: '1024px', xl: '1280px' },
    extend: {
      colors: {
        happy: { DEFAULT: color.blue, deep: color.blueDeep, 50: '#EEF2FA', 100: '#E1E8F6' },
        ink: color.ink,
        slate: { DEFAULT: color.slate },
        whatsapp: { DEFAULT: color.whatsapp, 50: '#E8F4ED', light: '#7FD9A6' },
        marigold: color.marigold,
        focus: color.focus,
        mist: color.mist,
        line: '#D9DFEA',
        danger: '#B42318',
      },
      fontFamily: {
        display: [font.display, 'system-ui', 'sans-serif'],
        sans: [font.body, 'system-ui', 'sans-serif'],
      },
      fontSize: {
        h1: ['2.5rem', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
        'h1-lg': ['4.125rem', { lineHeight: '1.02', letterSpacing: '-0.03em' }],
        h2: ['1.875rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'h2-lg': ['2.875rem', { lineHeight: '1.08', letterSpacing: '-0.025em' }],
        h3: ['1.125rem', { lineHeight: '1.25' }],
        'h3-lg': ['1.375rem', { lineHeight: '1.25' }],
        eyebrow: ['0.8125rem', { lineHeight: '1.2', letterSpacing: '0.12em' }],
      },
      borderRadius: {
        field: radius.field,
        card: radius.card,
        'card-lg': radius.cardLg,
        section: radius.section,
        chip: radius.chip,
      },
      boxShadow: {
        card: '0 1px 2px rgba(17,26,46,.04), 0 10px 30px -12px rgba(17,26,46,.12)',
        lift: '0 2px 4px rgba(17,26,46,.05), 0 18px 40px -16px rgba(17,26,46,.22)',
        btn: '0 10px 24px -10px rgba(31,60,136,.55)',
      },
      transitionTimingFunction: { brand: motion.ease },
      transitionDuration: { micro: motion.micro, hover: motion.hover, reveal: motion.reveal },
    },
  },
  plugins: [],
} satisfies Config;
