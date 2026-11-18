/**
 * Sends a customer's file for a quote straight from the browser to WordPress, in pieces of 2 MB.
 * Sending in pieces keeps every request small (hosts limit the size of one request) and lets a
 * failed upload carry on where it stopped. The token from the quote request proves the file belongs
 * to that request.
 */

const BASE = (process.env.NEXT_PUBLIC_WC_STORE_API_URL ?? '').replace(
  /\/wc\/store\/v1\/?$/,
  '/akrinity/v1',
);

export const CHUNK_BYTES = 2 * 1024 * 1024;

export interface UploadTicket {
  id: number;
  token: string;
  exp: number;
}

const MESSAGES: Record<string, string> = {
  forbidden: 'The upload link has expired. Send the request again, or send the file on WhatsApp.',
  closed: 'This request is no longer taking a file.',
  too_big: 'The file is too large.',
  bad_file_type: 'This file type is not supported.',
  bad_size: 'The upload piece was the wrong size.',
  write_failed: 'The server could not save the file. Please try again.',
};

async function sendPiece(
  url: string,
  body: Blob,
): Promise<{ ok: boolean; code: string; next?: number }> {
  try {
    // text/plain keeps this a "simple" request, so the browser does not need a permission check first.
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body,
    });
    if (res.ok) return { ok: true, code: '' };
    const d = (await res.json().catch(() => ({}))) as { code?: string; next?: number };
    return { ok: false, code: d.code ?? String(res.status), next: d.next };
  } catch {
    return { ok: false, code: 'network' };
  }
}

/** Uploads the file. Returns null when it is stored, or a message to show. */
export async function uploadQuoteFile(
  file: File,
  ticket: UploadTicket,
  onProgress: (percent: number) => void,
): Promise<string | null> {
  if (!BASE) return 'File upload is not set up yet.';
  const total = Math.max(1, Math.ceil(file.size / CHUNK_BYTES));
  let i = 0;
  let guard = 0;
  while (i < total && guard++ < total * 4 + 10) {
    const url =
      `${BASE}/quote-file?id=${ticket.id}&exp=${ticket.exp}&token=${encodeURIComponent(ticket.token)}` +
      `&index=${i}&total=${total}`;
    const piece = file.slice(i * CHUNK_BYTES, (i + 1) * CHUNK_BYTES);
    let result = await sendPiece(url, piece);
    for (let attempt = 1; !result.ok && result.code === 'network' && attempt < 3; attempt++) {
      await new Promise((r) => setTimeout(r, 800 * attempt));
      result = await sendPiece(url, piece);
    }
    if (result.ok) {
      i++;
      onProgress(Math.round((i / total) * 100));
      continue;
    }
    // The server already has this piece (its reply was lost) or wants a different one: carry on from there.
    if (
      result.code === 'out_of_order' &&
      typeof result.next === 'number' &&
      result.next >= 0 &&
      result.next <= total
    ) {
      i = result.next;
      onProgress(Math.round((i / total) * 100));
      continue;
    }
    return result.code === 'network'
      ? 'The connection dropped. Check your internet and try again.'
      : (MESSAGES[result.code] ?? 'The upload did not finish. Please try again.');
  }
  return null;
}
