import clsx from 'clsx';
import { preload } from 'react-dom';
import { responsiveImage } from '@/lib/image';

/**
 * Fixed-aspect photo slot (no CLS). Until the client supplies photography it renders a
 * neutral placeholder; the shot description is only visible in development.
 *
 * Images go through Next's optimiser (AVIF/WebP, srcset) but render as a plain <img> from
 * the server, without shipping next/image's client component.
 */
export function Photo({
  image,
  src = image?.url,
  alt = image?.alt ?? '',
  label,
  className,
  priority,
  sizes = '(min-width: 1024px) 50vw, 100vw',
}: {
  image?: { url: string; alt: string } | null;
  src?: string;
  alt?: string;
  label: string;
  className?: string; // must include an aspect-[w/h] class
  priority?: boolean;
  sizes?: string;
}) {
  if (src) {
    const { src: url, srcSet } = responsiveImage(src);
    // LCP image: preload it and fetch at high priority.
    if (priority) preload(url, { as: 'image', imageSrcSet: srcSet, imageSizes: sizes, fetchPriority: 'high' });
    return (
      <div className={clsx('photo-placeholder relative overflow-hidden', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={clsx('relative overflow-hidden', className)}>
      <div className="photo-placeholder absolute inset-0" data-photo={label} aria-hidden>
        {process.env.NODE_ENV !== 'production' && (
          <span className="absolute bottom-3 left-3 max-w-[85%] rounded-lg bg-white/90 px-2 py-1 text-[11px] leading-tight text-slate">
            PHOTO · {label}
          </span>
        )}
      </div>
    </div>
  );
}
