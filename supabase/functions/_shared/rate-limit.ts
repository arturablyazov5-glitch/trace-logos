// Общий IP-based rate limiter для публичных Edge Functions (без x-admin-key).
// Бакет — "endpoint:IP", атомарный инкремент делает RPC increment_rate_limit
// (см. migrations/20260728000000_create_rate_limits.sql), окно скользящее.

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('cf-connecting-ip') || 'unknown';
}

export async function checkRateLimit(
  req: Request,
  endpoint: string,
  limit: number,
  windowSeconds: number,
): Promise<{ ok: boolean; count: number }> {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const bucketKey = `${endpoint}:${clientIp(req)}`;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_rate_limit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ p_bucket_key: bucketKey, p_window_seconds: windowSeconds }),
  });

  if (!res.ok) {
    // Fail-open: если сам rate-limiter недоступен, не блокируем легитимных пользователей.
    return { ok: true, count: 0 };
  }

  const count = await res.json();
  return { ok: count <= limit, count };
}
