import type { ReactNode } from 'react';

/** Content column + booking card: sticky in the right column on desktop, inline section under 1024px. */
export function WithBookingAside({ children, form }: { children: ReactNode; form: ReactNode }) {
  return (
    <div className="container-x grid gap-14 py-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12 lg:py-14">
      <div className="min-w-0 space-y-14 lg:space-y-20">{children}</div>
      <aside id="book" aria-label="Book a service" className="scroll-mt-24 lg:sticky lg:top-[108px] lg:self-start">
        {form}
      </aside>
    </div>
  );
}
