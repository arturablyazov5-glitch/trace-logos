import { formatReport, type Report } from './report.ts';
const base: Report = { week: '2026-10-12', end: '2026-10-19', started_at: '2026-10-01T00:00:00Z', complete: true,
  views: 1234, downloads: 42, top: { name: 'Сбер', count: 10 }, misses: [{ query: 'бренд', count: 3 }] };
Deno.test('calendar week, weekly totals, leader and empty searches', () => {
  const text = formatReport(base);
  for (const part of ['12–18 октября 2026', '<b>42</b>', 'Сбер — <b>10 раз</b>', '1. бренд — <b>3 раза</b>']) {
    if (!text.includes(part)) throw Error(`Missing ${part}`);
  }
});
Deno.test('unavailable historical week does not look like zero activity', () => {
  const text = formatReport({ ...base, complete: false, started_at: '2026-10-19T01:00:00Z' }, true);
  if (!text.includes('За эту неделю данных ещё нет') || text.includes('Просмотры логотипов:')) throw Error(text);
});
Deno.test('partial first week and genuinely empty full week', () => {
  const partial = formatReport({ ...base, complete: false, started_at: '2026-10-13T01:00:00Z' });
  if (partial.includes('учёт') || partial.includes('полных данных') || !partial.includes('Просмотры логотипов:')) throw Error('Service text leaked');
  const text = formatReport({ ...base, downloads: 0, top: null, misses: [] });
  if (!text.includes('Скачиваний за неделю не было') || !text.includes('Пустых поисков не было')) throw Error(text);
});

Deno.test('date ranges across months and years, safe HTML and Russian counts', () => {
  for (const [week, end, expected] of [
    ['2026-10-19', '2026-10-26', '19–25 октября 2026'],
    ['2026-09-28', '2026-10-05', '28 сентября — 4 октября 2026'],
    ['2026-12-28', '2027-01-04', '28 декабря 2026 — 3 января 2027'],
  ]) {
    if (!formatReport({ ...base, week, end }).includes(expected)) throw Error(expected);
  }
  const text = formatReport({ ...base, top: { name: '<Max & Co>', count: 398 }, misses: [{ query: '<b>brand</b>', count: 2 }] });
  if (!text.includes('&lt;Max &amp; Co&gt;') || !text.includes('&lt;b&gt;brand&lt;/b&gt;') || !text.includes('2 раза')) throw Error(text);
});
