import clsx from 'clsx';
import Link from 'next/link';
import type { ComponentProps } from 'react';

export type ButtonVariant = 'primary' | 'whatsapp' | 'outline' | 'white' | 'outline-light' | 'ghost';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-happy text-white shadow-btn hover:bg-happy-deep',
  whatsapp: 'bg-whatsapp text-white hover:bg-[#086a39]',
  outline: 'border border-line bg-white text-happy hover:border-happy',
  white: 'bg-white text-happy hover:bg-happy-50',
  'outline-light': 'border border-white/50 text-white hover:bg-white/10',
  ghost: 'text-happy hover:bg-happy-50',
};

/** Tap targets: 52px on mobile, 44px+ on desktop. Hover lift 1px, 280ms. */
export function buttonClasses(variant: ButtonVariant = 'primary', className?: string) {
  return clsx(
    'inline-flex min-h-[52px] items-center justify-center gap-2 rounded-field px-5 text-base font-semibold',
    'transition-[transform,background-color,border-color,box-shadow] duration-hover ease-brand hover:-translate-y-px lg:min-h-[48px]',
    'disabled:pointer-events-none disabled:opacity-70',
    VARIANTS[variant],
    className,
  );
}

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: ButtonVariant };

export function LinkButton({ variant, className, ...props }: LinkButtonProps) {
  return <Link className={buttonClasses(variant, className)} {...props} />;
}
