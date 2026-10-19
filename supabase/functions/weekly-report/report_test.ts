import { formatReport, type Report } from './report.ts';
const base: Report = { week: '2026-10-12', end: '2026-10-19', started_at: '2026-10-01T00:00:00Z', complete: true,
  views: 1234, downloads: 42, top: { name: 'Сбер', count: 10 }, misses: [{ query: 'бренд', count: 3 }] };
Deno.test('calendar week, weekly totals, leader and empty searches', () => {
  const text = formatReport(base);
  for (const part of ['12.10.2026 — 18.10.2026', '42', 'Сбер — 10', '1. бренд — 3']) {
    if (!text.includes(part)) throw Error(`Missing ${part}`);
  }
});
Deno.test('unavailable historical week does not look like zero activity', () => {
  const text = formatReport({ ...base, complete: false, started_at: '2026-10-19T01:00:00Z' }, true);
  if (!text.includes('полных данных пока нет') || text.includes('Просмотры логотипов:')) throw Error(text);
});
Deno.test('partial first week and genuinely empty full week', () => {
  if (!formatReport({ ...base, complete: false, started_at: '2026-10-13T01:00:00Z' }).includes('часть недели')) throw Error('Partial week');
  const text = formatReport({ ...base, downloads: 0, top: null, misses: [] });
  if (!text.includes('Скачиваний за неделю не было') || !text.includes('Пустых поисков не было')) throw Error(text);
});
