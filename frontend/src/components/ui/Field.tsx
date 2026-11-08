import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

export function Field({
  id,
  label,
  required,
  optional,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[15px] font-semibold text-ink">
        {label}
        {required && (
          <>
            {' '}
            <span className="text-danger" aria-hidden>
              *
            </span>
            <span className="sr-only">(required)</span>
          </>
        )}
        {optional && <span className="font-normal text-slate"> (optional)</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Attributes linking an input to its error message. */
export const errorProps = (id: string, error?: string) => ({
  id,
  'aria-invalid': error ? true : undefined,
  'aria-describedby': error ? `${id}-error` : undefined,
});

export function SelectShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown
        size={20}
        strokeWidth={1.8}
        aria-hidden
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate"
      />
    </div>
  );
}
