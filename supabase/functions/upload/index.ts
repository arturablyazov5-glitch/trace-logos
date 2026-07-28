import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { sanitizeSvg, validateSvgBytes } from '../_shared/svg-sanitizer.ts';
import { checkRateLimit } from '../_shared/rate-limit.ts';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;
const RATE_LIMIT = 5;
const RATE_WINDOW_SECONDS = 600; // 5 запросов / 10 минут с одного IP

function sanitizeText(str: string): string {
  return String(str || '').replace(/[<>"'&]/g, '').trim().slice(0, 200);
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

  const rate = await checkRateLimit(req, 'upload', RATE_LIMIT, RATE_WINDOW_SECONDS);
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

  const iconName = sanitizeText(formData.get('icon_name') as string || '');
  if (!iconName) return cors({ error: 'icon_name is required' }, 400);

  const uploads = (formData.getAll('file') as File[]).filter(f => f && f.size > 0);
  if (uploads.length === 0) return cors({ error: 'At least one file is required' }, 400);
  if (uploads.length > MAX_FILES) return cors({ error: `Too many files (max ${MAX_FILES})` }, 400);

  const filesToSend: { label: string; filename: string; content: string }[] = [];

  for (let i = 0; i < uploads.length; i++) {
    const file = uploads[i];
    const label = file.name || `Файл ${i + 1}`;

    if (file.size > MAX_FILE_SIZE) return cors({ error: `${label}: file too large (max 5MB)` }, 413);

    const bytes = new Uint8Array(await file.arrayBuffer());

    const validation = validateSvgBytes(bytes);
    if (!validation.ok) return cors({ error: `${label}: ${validation.reason}` }, 422);

    let svgText: string;
    try {
      svgText = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch (_) {
      return cors({ error: `${label}: invalid text encoding` }, 422);
    }

    try {
      svgText = sanitizeSvg(svgText);
    } catch (e: unknown) {
      return cors({ error: `${label}: ${e instanceof Error ? e.message : 'Invalid SVG'}` }, 422);
    }

    const base = (file.name || `${i + 1}`).replace(/\.svg$/i, '');
    filesToSend.push({ label, filename: `${iconName} — ${base}.svg`, content: svgText });
  }

  const errors: string[] = [];
  for (const f of filesToSend) {
    const fd = new FormData();
    fd.append('chat_id', CHAT_ID);
    fd.append('document', new Blob([f.content], { type: 'image/svg+xml' }), f.filename);
    fd.append('caption', `🎨 Помощь с иконкой: ${iconName}\nФайл: ${f.label}`);

    const res  = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, { method: 'POST', body: fd });
    const data = await res.json();
    if (!data.ok) errors.push(`${f.label}: ${data.description}`);
  }

  if (errors.length > 0) return cors({ error: 'Telegram delivery failed: ' + errors.join('; ') }, 502);

  return cors({ ok: true, sent: filesToSend.length }, 200);
});
