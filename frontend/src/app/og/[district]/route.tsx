import { ImageResponse } from 'next/og';
import { api } from '@/lib/api';

/** Open Graph image per district (1200×630). */
export async function GET(_request: Request, { params }: { params: Promise<{ district: string }> }) {
  const { district } = await params;
  const districts = await api.locations();
  const d = districts.find((x) => x.slug === district);
  if (!d) return new Response('Not found', { status: 404 });

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: '#1F3C88',
          color: '#FFFFFF',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 36, fontWeight: 700 }}>
          Happy Services<span style={{ color: '#F5B83D', marginLeft: 16 }}>·</span>
          <span style={{ marginLeft: 16, opacity: 0.8, fontWeight: 400 }}>Home &amp; appliance care</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 30, color: '#F5B83D', textTransform: 'uppercase', letterSpacing: 4 }}>{d.tagline || 'Kerala'}</div>
          <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.05, marginTop: 12 }}>{`Services in ${d.name}`}</div>
          <div style={{ fontSize: 32, marginTop: 24, opacity: 0.85 }}>{d.towns.map((t) => t.name).join(' · ')}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' } },
  );
}
