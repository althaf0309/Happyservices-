// Responsive URLs for Next's built-in image optimiser (/_next/image). It serves AVIF/WebP
// per the browser's Accept header (images.formats in next.config.ts). Building the srcset
// here instead of using next/image keeps its client component out of every page bundle.
// Widths must be in images.deviceSizes (Next's defaults).
const WIDTHS = [640, 750, 828, 1080, 1200, 1920] as const;

const optimised = (src: string, width: number) => `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;

export function responsiveImage(src: string) {
  return {
    src: optimised(src, 1920),
    srcSet: WIDTHS.map((w) => `${optimised(src, w)} ${w}w`).join(', '),
  };
}
