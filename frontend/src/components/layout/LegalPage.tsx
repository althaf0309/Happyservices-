import type { ReactNode } from 'react';
import type { LegalPageContent } from '@/types/api';
import { Breadcrumbs } from './Breadcrumbs';

/**
 * Renders the admin's plain-text format: blank line = paragraph, "## " = heading,
 * consecutive "- " lines = a bullet list.
 */
function LegalBody({ body }: { body: string }) {
  const blocks = body.replace(/\r\n/g, '\n').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
      {blocks.map((block, i) => {
        if (block.startsWith('## ')) return <h2 key={i}>{block.slice(3)}</h2>;
        const lines = block.split('\n');
        if (lines.every((l) => l.startsWith('- '))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{l.slice(2)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{block}</p>;
      })}
    </>
  );
}

/** Shows the client's published text from the admin; until then, the built-in draft with a notice. */
export function LegalPage({
  title,
  path,
  content,
  children,
}: {
  title: string;
  path: string;
  content: LegalPageContent | null;
  children: ReactNode; // draft fallback
}) {
  return (
    <>
      <Breadcrumbs items={[{ name: title, href: path }]} />
      <article className="container-x max-w-3xl py-10 lg:py-14">
        <h1 className="h1">{content?.title ?? title}</h1>
        {content ? (
          <p className="mt-4 text-sm text-slate">
            Last updated{' '}
            {new Date(content.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        ) : (
          <p role="note" className="mt-6 rounded-field border border-marigold bg-marigold/10 p-4 text-[15px]">
            Draft wording based on how the site handles your details. Final text to be confirmed by Happy Services before
            launch.
          </p>
        )}
        <div className="mt-8 space-y-4 text-slate [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc">
          {content ? <LegalBody body={content.body} /> : children}
        </div>
      </article>
    </>
  );
}
