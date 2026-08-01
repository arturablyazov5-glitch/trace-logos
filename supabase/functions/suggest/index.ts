import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { sanitizeSvg, validateSvgBytes } from '../_shared/svg-sanitizer.ts';
import { checkRateLimit, isDuplicateSubmit } from '../_shared/rate-limit.ts';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const RATE_LIMIT = 5;
const RATE_WINDOW_SECONDS = 600; // 5 запросов / 10 минут с одного IP
const DEDUP_WINDOW_SECONDS = 20; // повторная отправка той же формы в этом окне не шлётся в Telegram повторно

function sanitizeText(str: string): string {
  return String(str || '').replace(/[<>"'&]/g, '').trim().slice(0, 200);
}

function sanitizeUrl(str: string): string {
  const v = String(str || '').trim().slice(0, 500);
  if (!v) return '';
  if (!/^https?:\/\//i.test(v)) return '';
  if (/javascript\s*:|vbscript\s*:/i.test(v)) return '';
  return v;
}

function cors(body: unknown, status: number): Response {
  const origin = Deno.env.get('ALLOWED_ORIGIN') || '*';
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
  return new Response(JSON.stringify(body), { status, headers });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    const origin = Deno.env.get('ALLOWED_ORIGIN') || '*';
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') return cors({ error: 'Method not allowed' }, 405);

  const rate = await checkRateLimit(req, 'suggest', RATE_LIMIT, RATE_WINDOW_SECONDS);
  if (!rate.ok) return cors({ error: 'Слишком много запросов, попробуйте позже' }, 429);

  const BOT_TOKEN = Deno.env.get('BOT_TOKEN');
  const CHAT_ID   = Deno.env.get('CHAT_ID');
  if (!BOT_TOKEN || !CHAT_ID) return cors({ error: 'Server misconfigured' }, 500);

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (_) {
    return cors({ error: 'Invalid form data' }, 400);
  }

  const brand   = sanitizeText(formData.get('brand')   as string || '');
  const url     = sanitizeUrl(formData.get('url')      as string || '');
  const comment = sanitizeText(formData.get('comment') as string || '');

  if (!brand) return cors({ error: 'brand is required' }, 400);

  const file = formData.get('file') as File | null;
  const hasFile = file && file.size > 0;

  const signature = [brand, url, comment, hasFile ? `${file.name}:${file.size}` : '']
    .join('|').toLowerCase();
  if (await isDuplicateSubmit(req, 'suggest', signature, DEDUP_WINDOW_SECONDS)) {
    return cors({ ok: true }, 200);
  }

  let text = `📌 Новая иконка\n\nБренд: ${brand}`;
  if (url)     text += `\nСсылка: ${url}`;
  if (comment) text += `\nКомментарий: ${comment}`;

  if (hasFile) {
    if (file.size > MAX_FILE_SIZE) return cors({ error: 'File too large (max 5MB)' }, 413);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const ext = (file.name || '').split('.').pop()?.toLowerCase() ?? '';

    let blob: Blob;
    let filename: string;

    if (ext === 'svg') {
      const validation = validateSvgBytes(bytes);
      if (!validation.ok) return cors({ error: validation.reason }, 422);

      let svgText: string;
      try {
        svgText = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      } catch (_) {
        return cors({ error: 'Invalid file encoding' }, 422);
      }

      try {
        svgText = sanitizeSvg(svgText);
      } catch (e: unknown) {
        return cors({ error: e instanceof Error ? e.message : 'Invalid SVG' }, 422);
      }

      blob = new Blob([svgText], { type: 'image/svg+xml' });
      filename = `${brand}.svg`;
    } else {
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      blob = new Blob([bytes], { type: mime });
      filename = `${brand}.${ext}`;
    }

    const fd = new FormData();
    fd.append('chat_id', CHAT_ID);
    fd.append('document', blob, filename);
    fd.append('caption', text);

    const res  = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, { method: 'POST', body: fd });
    const data = await res.json();
    if (!data.ok) return cors({ error: data.description }, 502);
  } else {
    const res  = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text }),
    });
    const data = await res.json();
    if (!data.ok) return cors({ error: data.description }, 502);
  }

  return cors({ ok: true }, 200);
});
