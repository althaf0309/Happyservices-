import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { CATALOG_TAG } from '@/lib/api';

/** On-demand ISR: the backend calls this after ServiceArea / FAQ / Review changes. */
export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET;
  const body = (await request.json().catch(() => ({}))) as { secret?: string };
  const secret = request.headers.get('x-revalidate-secret') ?? body.secret;

  if (!expected || secret !== expected) {
    return NextResponse.json({ revalidated: false }, { status: 401 });
  }
  revalidateTag(CATALOG_TAG);
  revalidatePath('/', 'layout');
  return NextResponse.json({ revalidated: true, now: Date.now() });
}
