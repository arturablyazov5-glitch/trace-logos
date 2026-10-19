import { formatReport, type Report } from './report.ts';
const env = (key: string) => Deno.env.get(key) || '';
Deno.serve(async (req) => {
  const service = env('SUPABASE_SERVICE_ROLE_KEY');
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!(env('WEEKLY_REPORT_KEY') && req.headers.get('x-report-key') === env('WEEKLY_REPORT_KEY')) &&
      !(service && req.headers.get('authorization') === `Bearer ${service}`) &&
      !(env('ADMIN_KEY') && req.headers.get('x-admin-key') === env('ADMIN_KEY'))) {
    return new Response('Unauthorized', { status: 401 });
  }
  const headers = { apikey: service, Authorization: `Bearer ${service}`, 'Content-Type': 'application/json' };
  const db = async (path: string, init: RequestInit = {}) => {
    const r = await fetch(`${env('SUPABASE_URL')}/rest/v1/${path}`, { ...init, headers: { ...headers, ...init.headers } });
    if (!r.ok) throw new Error(`Database request failed: ${r.status}`);
    return r;
  };
  try {
    const test = new URL(req.url).searchParams.get('test') === '1';
    const report: Report = await (await db('rpc/get_weekly_logo_report', { method: 'POST', body: '{}' })).json();
    if (!env('BOT_TOKEN') || !env('CHAT_ID')) throw new Error('Telegram is not configured');
    if (!test) {
      // Unique week claim prevents duplicates, including concurrent invocations.
      // An uncertain Telegram outcome stays claimed; never blindly resend it.
      const claim = await db('weekly_report_deliveries?on_conflict=week', {
        method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
        body: JSON.stringify({ week: report.week }),
      });
      if (!(await claim.json()).length) return Response.json({ ok: true, skipped: 'already claimed' });
    }
    const telegram = await fetch(`https://api.telegram.org/bot${env('BOT_TOKEN')}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env('CHAT_ID'), text: formatReport(report, test) }),
    });
    const result = await telegram.json();
    if (!telegram.ok || !result.ok) throw new Error(`Telegram rejected message: ${result.error_code || telegram.status}`);
    if (!test) await db(`weekly_report_deliveries?week=eq.${report.week}`, {
      method: 'PATCH', body: JSON.stringify({ status: 'sent', message_id: result.result.message_id }),
    });
    return Response.json({ ok: true, test, message_id: result.result.message_id, week: report.week });
  } catch (e) {
    console.error(e instanceof Error ? e.message : 'Weekly report failed');
    return Response.json({ error: 'Weekly report failed' }, { status: 500 });
  }
});
