import {
  AirVent,
  Cctv,
  Flame,
  Hammer,
  PaintRoller,
  Refrigerator,
  Sofa,
  Tv,
  WashingMachine,
  Wrench,
  Zap,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

// Keys match Service.icon from the API.
const SERVICE_ICONS: Record<string, LucideIcon> = {
  ac: AirVent,
  fridge: Refrigerator,
  washer: WashingMachine,
  tv: Tv,
  plumbing: Wrench,
  electrical: Zap,
  painting: PaintRoller,
  cctv: Cctv,
  interior: Sofa,
  welding: Hammer,
  gas: Flame,
};

/** 24px, 1.8 stroke outline icons (Lucide). */
export function ServiceIcon({ icon, ...props }: { icon: string } & LucideProps) {
  const Cmp = SERVICE_ICONS[icon] ?? Wrench;
  return <Cmp size={24} strokeWidth={1.8} aria-hidden {...props} />;
}

export const iconProps = { size: 24, strokeWidth: 1.8, 'aria-hidden': true } as const;
