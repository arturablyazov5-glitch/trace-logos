import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { checkRateLimit } from '../_shared/rate-limit.ts';

// ─────────────────────────────────────────────────────────────────────────────
// checkout — «плати сколько хочешь» для скачиваемых продуктов (расширения,
// плагины). Логика Gumroad: перед файлом стоит форма с суммой, 0 — валидная
// сумма и отдаёт файл сразу.
//
//   POST /checkout                      → публично. Создать заказ.
//                                         body: { product, amount, currency, email?, lang? }
//                                         amount = 0        → { token, free: true }
//                                         amount > 0        → { token, paymentUrl } (invoice в lava.top)
//   GET  /checkout?token=<token>        → публично. Статус заказа + подписанная
//                                         ссылка на файл, если он уже оплачен
//                                         или взят бесплатно. Это единственный
//                                         путь к файлу: сам объект лежит в
//                                         приватном бакете Storage.
//   POST /checkout?action=webhook        → lava.top. payment.success / payment.failed.
//                                         Аутентификация — заголовок X-Api-Key со
//                                         значением LAVA_WEBHOOK_KEY. Это один из двух
//                                         методов, которые сам кабинет lava предлагает
//                                         в форме «Добавить Webhook» (второй — Basic
//                                         login/пароль в URL, но там нужно городить
//                                         два секрета вместо одного — не стоит того).
//                                         В кабинете: «Вид аутентификации для Webhook»
//                                         → «API key вашего сервиса» → вставить значение
//                                         LAVA_WEBHOOK_KEY.
//   GET  /checkout                      → только с x-admin-key == ADMIN_KEY.
//                                         Сводка по продуктам + последние заказы
//                                         для вкладки «Продукты» в админке.
//
// ВАЖНО про доверие: факт возврата браузера с lava.top ничего не доказывает —
// «оплачено» ставит ТОЛЬКО вебхук. Страница /thanks/ по токену спрашивает статус
// у этой функции и до прихода вебхука честно показывает «ждём подтверждения».
// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ADMIN_KEY    = Deno.env.get('ADMIN_KEY') || '';

// Секреты платёжки. Пока не заданы — бесплатное скачивание работает полностью,
// а платный путь отвечает 503 payments_disabled (см. createOrder).
const LAVA_API_KEY     = Deno.env.get('LAVA_API_KEY') || '';
const LAVA_WEBHOOK_KEY = Deno.env.get('LAVA_WEBHOOK_KEY') || '';

const SITE_URL = Deno.env.get('SITE_URL') || 'https://trace-logos.ru';
const BUCKET   = Deno.env.get('PRODUCTS_BUCKET') || 'products';

const RATE_LIMIT = 20;
const RATE_WINDOW_SECONDS = 600;

// Ссылка на /thanks/ живёт неделю: человек мог уйти платить и вернуться назавтра.
const TOKEN_TTL_DAYS = 7;
// Сама подписанная ссылка на файл — короткая: она одноразовая по смыслу,
// страница всегда может попросить новую по тому же токену.
const SIGNED_URL_TTL_SECONDS = 900;

const CURRENCIES = ['RUB', 'USD', 'EUR'];
// Нижняя граница платежа. Ниже неё — не «мало заплатил», а промах по клавиатуре;
// комиссия съест такой платёж целиком.
const MIN_AMOUNT: Record<string, number> = { RUB: 10, USD: 1, EUR: 1 };
const MAX_AMOUNT: Record<string, number> = { RUB: 100000, USD: 1000, EUR: 1000 };

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGIN') || '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function resolveOrigin(requestOrigin: string | null): string {
  if (ALLOWED_ORIGINS.includes('*')) return '*';
  if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin;
  return ALLOWED_ORIGINS[0] || '*';
}

function corsHeaders(origin: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  };
}

function json(origin: string, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

function db(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      ...(init.headers || {}),
    },
  });
}

function newToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function cleanEmail(raw: unknown): string {
  const v = String(raw ?? '').trim().slice(0, 254);
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? v : '';
}

function cleanId(raw: unknown): string {
  return String(raw ?? '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 64);
}

// ─── Storage ────────────────────────────────────────────────────────────────
// Подписанная ссылка на приватный объект. Живёт SIGNED_URL_TTL_SECONDS —
// расшаренная в чат ссылка протухает раньше, чем ей успеют воспользоваться.
async function signedUrl(object: string, downloadName: string): Promise<string | null> {
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${object}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ expiresIn: SIGNED_URL_TTL_SECONDS }),
    },
  );
  if (!res.ok) return null;
  const data = await res.json().catch(() => null) as { signedURL?: string } | null;
  if (!data?.signedURL) return null;
  const sep = data.signedURL.includes('?') ? '&' : '?';
  return `${SUPABASE_URL}/storage/v1${data.signedURL}${sep}download=${encodeURIComponent(downloadName)}`;
}

// ─── lava.top ───────────────────────────────────────────────────────────────
// POST /api/v3/invoice с суммой: оффер должен быть опубликован в кабинете с
// признаком «Цена по запросу через API», иначе lava вернёт цену оффера, а не нашу.
async function createInvoice(opts: {
  offerId: string;
  email: string;
  amount: number;
  currency: string;
  lang: string;
  token: string;
}): Promise<{ id: string; paymentUrl: string } | { error: string }> {
  // paymentMethod/paymentProvider намеренно не передаются: поле опционально
  // (по умолчанию — CARD), а его enum ýже, чем можно было предположить —
  // BANK131/UNLIMINT из первой версии были угаданы неверно и разваливали
  // каждый платный запрос 502-м. Схема сверена по реальному OpenAPI
  // (gate.lava.top/docs/documentation.yaml), не по стороннему SDK.
  const res = await fetch('https://gate.lava.top/api/v3/invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': LAVA_API_KEY },
    body: JSON.stringify({
      email: opts.email,
      offerId: opts.offerId,
      currency: opts.currency,
      amount: opts.amount,
      buyerLanguage: opts.lang === 'ru' ? 'RU' : 'EN',
      // Реальную выдачу файла всё равно решает вебхук, а не этот редирект —
      // но так покупатель, вернувшись в браузер, сразу попадает на нужный
      // заказ, а не на общую страницу lava.
      successful_return_url: `${SITE_URL}/thanks/?t=${opts.token}`,
      failure_return_url:    `${SITE_URL}/thanks/?t=${opts.token}`,
      cancel_return_url:     `${SITE_URL}/thanks/?t=${opts.token}`,
    }),
  });

  const data = await res.json().catch(() => null) as
    | { id?: string; paymentUrl?: string; error?: string; message?: string }
    | null;

  if (!res.ok || !data?.paymentUrl) {
    return { error: data?.error || data?.message || `lava_http_${res.status}` };
  }
  return { id: String(data.id || ''), paymentUrl: data.paymentUrl };
}

// ─── Создание заказа ────────────────────────────────────────────────────────
async function createOrder(origin: string, req: Request): Promise<Response> {
  const rate = await checkRateLimit(req, 'checkout', RATE_LIMIT, RATE_WINDOW_SECONDS);
  if (!rate.ok) return json(origin, { error: 'Too many requests' }, 429);

  let payload: { product?: string; amount?: unknown; currency?: string; email?: string; lang?: string };
  try {
    payload = await req.json();
  } catch (_) {
    return json(origin, { error: 'Invalid JSON' }, 400);
  }

  const productId = cleanId(payload.product);
  if (!productId) return json(origin, { error: 'product_required' }, 400);

  const currency = CURRENCIES.includes(String(payload.currency || '').toUpperCase())
    ? String(payload.currency).toUpperCase()
    : 'RUB';

  // Строка, пробелы, запятая как разделитель — всё это прилетает из живого поля ввода.
  const amount = Math.round(Number(String(payload.amount ?? 0).replace(',', '.').trim()) * 100) / 100;
  if (!Number.isFinite(amount) || amount < 0) return json(origin, { error: 'bad_amount' }, 400);

  const lang = payload.lang === 'en' ? 'en' : 'ru';

  const prodRes = await db(`products?id=eq.${encodeURIComponent(productId)}&active=eq.true&select=*`);
  const products = await prodRes.json().catch(() => []) as Array<{
    id: string; storage_object: string; download_name: string; lava_offer_id: string | null;
  }>;
  const product = products[0];
  if (!product) return json(origin, { error: 'unknown_product' }, 404);

  const token = newToken();
  const expires = new Date(Date.now() + TOKEN_TTL_DAYS * 864e5).toISOString();

  // ── Бесплатно ─────────────────────────────────────────────────────────────
  if (amount === 0) {
    const ins = await db('orders', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        product_id: productId, amount: 0, currency, status: 'free',
        token, token_expires_at: expires, lang,
      }),
    });
    if (!ins.ok) return json(origin, { error: 'db_error' }, 500);
    return json(origin, { token, free: true, status: 'free' });
  }

  // ── Платно ────────────────────────────────────────────────────────────────
  if (amount < (MIN_AMOUNT[currency] ?? 1)) return json(origin, { error: 'amount_too_small' }, 400);
  if (amount > (MAX_AMOUNT[currency] ?? 1000)) return json(origin, { error: 'amount_too_large' }, 400);

  const email = cleanEmail(payload.email);
  if (!email) return json(origin, { error: 'email_required' }, 400);

  // Платёжка ещё не подключена: продукт есть, оффера нет. Клиент показывает
  // «оплата временно недоступна, забрать бесплатно можно» — а не молчаливую ошибку.
  if (!LAVA_API_KEY || !product.lava_offer_id) {
    return json(origin, { error: 'payments_disabled' }, 503);
  }

  const invoice = await createInvoice({
    offerId: product.lava_offer_id, email, amount, currency, lang, token,
  });
  if ('error' in invoice) return json(origin, { error: 'payment_provider', detail: invoice.error }, 502);

  const ins = await db('orders', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      product_id: productId, amount, currency, email, status: 'pending',
      lava_invoice_id: invoice.id, token, token_expires_at: expires, lang,
    }),
  });
  if (!ins.ok) return json(origin, { error: 'db_error' }, 500);

  return json(origin, { token, paymentUrl: invoice.paymentUrl, status: 'pending' });
}

// ─── Статус заказа + выдача файла ───────────────────────────────────────────
async function orderStatus(origin: string, token: string): Promise<Response> {
  const clean = token.replace(/[^a-f0-9]/gi, '').slice(0, 64);
  if (!clean) return json(origin, { error: 'bad_token' }, 400);

  const res = await db(
    `orders?token=eq.${clean}&select=status,amount,currency,lang,token_expires_at,products(title,storage_object,download_name)`,
  );
  const rows = await res.json().catch(() => []) as Array<{
    status: string; amount: string; currency: string; lang: string; token_expires_at: string;
    products: { title: string; storage_object: string; download_name: string } | null;
  }>;
  const order = rows[0];
  if (!order) return json(origin, { error: 'unknown_token' }, 404);

  if (new Date(order.token_expires_at).getTime() < Date.now()) {
    return json(origin, { status: 'expired' }, 410);
  }

  const base = {
    status: order.status,
    amount: Number(order.amount),
    currency: order.currency,
    title: order.products?.title || '',
  };

  if (order.status !== 'free' && order.status !== 'paid') return json(origin, base);
  if (!order.products) return json(origin, base);

  const url = await signedUrl(order.products.storage_object, order.products.download_name);
  if (!url) return json(origin, { ...base, error: 'file_unavailable' }, 500);

  await db('rpc/register_download', { method: 'POST', body: JSON.stringify({ p_token: clean }) });

  return json(origin, { ...base, downloadUrl: url, fileName: order.products.download_name });
}

// ─── Вебхук lava.top ────────────────────────────────────────────────────────
async function handleWebhook(origin: string, req: Request): Promise<Response> {
  if (!LAVA_WEBHOOK_KEY || req.headers.get('x-api-key') !== LAVA_WEBHOOK_KEY) {
    return json(origin, { error: 'forbidden' }, 403);
  }

  // Схема — PurchaseWebhookLog из реального OpenAPI (gate.lava.top/docs/documentation.yaml,
  // путь /example-of-webhook-route-contract), не догадка: eventType 'payment.success' |
  // 'payment.failed' (плюс подписочные и refund/chargeback события, которые нас не
  // касаются — у нас только разовые покупки), contractId — id именно этого счёта.
  let body: { eventType?: string; contractId?: string; status?: string; errorMessage?: string };
  try {
    body = await req.json();
  } catch (_) {
    return json(origin, { error: 'Invalid JSON' }, 400);
  }

  // Пейлоад целиком в лог — так причина отказа видна в Supabase → Edge
  // Functions → Logs даже если структура вебхука когда-нибудь поменяется
  // и errorMessage переедет в другое поле.
  console.log('lava webhook:', JSON.stringify(body));

  const invoiceId = String(body.contractId || '').trim();
  if (!invoiceId) return json(origin, { error: 'no_contract' }, 400);

  const eventType = body.eventType || '';
  if (eventType !== 'payment.success' && eventType !== 'payment.failed') {
    // Подписки/рефанды/чарджбеки — не наш сценарий (только разовые покупки).
    // 200 нужен, чтобы lava не пересылала это же событие ещё 19 раз подряд.
    return json(origin, { ok: true, note: 'ignored_event' });
  }

  const patch = eventType === 'payment.success'
    ? { status: 'paid', paid_at: new Date().toISOString() }
    // errorMessage — реальная причина отказа от lava (например, банк отклонил
    // карту) — сохраняем как есть, без перевода/классификации: это техническая
    // строка для нас, не для показа покупателю.
    : { status: 'failed', failure_reason: (body.errorMessage || '').slice(0, 500) };

  await db(`orders?lava_invoice_id=eq.${encodeURIComponent(invoiceId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(patch),
  });

  return json(origin, { ok: true });
}

// ─── Сводка для админки ─────────────────────────────────────────────────────
async function adminStats(origin: string): Promise<Response> {
  const [prodRes, orderRes] = await Promise.all([
    db('products?select=id,title,active,lava_offer_id&order=id'),
    db('orders?select=product_id,amount,currency,status,download_count,created_at,paid_at,email,lang,failure_reason&order=created_at.desc&limit=500'),
  ]);
  const products = await prodRes.json().catch(() => []);
  const orders   = await orderRes.json().catch(() => []);
  return json(origin, { products, orders });
}

serve(async (req: Request) => {
  const origin = resolveOrigin(req.headers.get('origin'));
  const url = new URL(req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method === 'POST') {
    if (url.searchParams.get('action') === 'webhook') return handleWebhook(origin, req);
    return createOrder(origin, req);
  }

  if (req.method === 'GET') {
    const token = url.searchParams.get('token');
    if (token) return orderStatus(origin, token);

    const key = req.headers.get('x-admin-key') || '';
    if (!ADMIN_KEY || key !== ADMIN_KEY) return json(origin, { error: 'Unauthorized' }, 401);
    return adminStats(origin);
  }

  return json(origin, { error: 'Method not allowed' }, 405);
});
