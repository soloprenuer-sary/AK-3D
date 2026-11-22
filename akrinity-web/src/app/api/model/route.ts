/**
 * Same-site copy of a product's 3D file, used only when the file host does not allow this website to
 * read the file directly (CORS). It serves files from the WordPress uploads folder and nothing else.
 * Vercel limits a reply to about 4.5 MB, so larger models need the host to send CORS headers instead.
 */

export const runtime = 'nodejs';

const TYPES = new Set(['stl', 'glb', 'gltf', 'obj', '3mf']);
const MAX_BYTES = 4_400_000;

export async function GET(request: Request): Promise<Response> {
  const wp = (process.env.WP_URL ?? '').replace(/\/$/, '');
  const raw = new URL(request.url).searchParams.get('u') ?? '';
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return new Response('Bad address', { status: 400 });
  }
  const base = wp ? new URL(wp) : null;
  const ext = url.pathname.split('.').pop()?.toLowerCase() ?? '';
  if (
    !base ||
    url.origin !== base.origin ||
    !url.pathname.startsWith('/wp-content/uploads/') ||
    !TYPES.has(ext)
  ) {
    return new Response('Not allowed', { status: 403 });
  }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) return new Response('Not found', { status: 404 });
    const length = Number(res.headers.get('content-length') ?? 0);
    if (length > MAX_BYTES) return new Response('Too large', { status: 413 });
    const data = await res.arrayBuffer();
    if (data.byteLength > MAX_BYTES) return new Response('Too large', { status: 413 });
    return new Response(data, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Unavailable', { status: 502 });
  }
}
