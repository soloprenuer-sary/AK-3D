import { PREVIEW_COOKIE, fetchPreview, previewProblem } from '@/lib/preview';

/** Opens a draft preview from the signed link WordPress gives the editor. Never cached, never indexed. */
export const dynamic = 'force-dynamic';

const HEADERS = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
};

function page(status: number, text: string): Response {
  const body =
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="robots" content="noindex,nofollow"><title>Draft preview</title></head>` +
    `<body style="font-family:system-ui,sans-serif;max-width:560px;margin:15vh auto;padding:0 20px;line-height:1.5">` +
    `<h1 style="font-size:28px">Draft preview</h1><p>${text}</p></body></html>`;
  return new Response(body, {
    status,
    headers: { ...HEADERS, 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const id = Number(url.searchParams.get('id'));
  const exp = Number(url.searchParams.get('exp'));
  const token = url.searchParams.get('token') ?? '';
  if (
    !Number.isInteger(id) ||
    id < 1 ||
    !Number.isInteger(exp) ||
    exp < 1 ||
    !/^[A-Za-z0-9_-]{16,200}$/.test(token)
  ) {
    return page(400, 'This preview link is not complete. Press Preview again in WordPress.');
  }
  if (exp * 1000 < Date.now()) return page(410, previewProblem(410));

  const r = await fetchPreview({ id, exp, token });
  if (r.status !== 200)
    return page(
      r.status === 403 || r.status === 410 || r.status === 404 ? r.status : 503,
      previewProblem(r.status),
    );

  const maxAge = Math.max(60, exp - Math.floor(Date.now() / 1000));
  const secure = url.protocol === 'https:' ? '; Secure' : '';
  return new Response(null, {
    status: 307,
    headers: {
      ...HEADERS,
      Location: `/product/preview?id=${id}`,
      'Set-Cookie': `${PREVIEW_COOKIE}=${id}.${exp}.${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`,
    },
  });
}
