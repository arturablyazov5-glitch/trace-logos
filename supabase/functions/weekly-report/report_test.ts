import { formatReport, type Report } from './report.ts';
const base: Report = { week: '2026-10-12', end: '2026-10-19', started_at: '2026-10-01T00:00:00Z', complete: true,
  views: 1234, downloads: 42, total_views: 48000, total_downloads: 6500, top: { name: 'Сбер', count: 10 }, misses: [{ query: 'бренд', count: 3 }], ads_support: [] };
Deno.test('calendar week, weekly totals, leader and empty searches', () => {
  const text = formatReport(base);
  for (const part of ['12–18 октября 2026', '<b>42</b>', 'Сбер — <b>10 раз</b>', '1. бренд — <b>3 раза</b>', '<b>За всё время</b>\nПросмотры логотипов: <b>48\u00a0000</b>\nСкачивания логотипов: <b>6\u00a0500</b>']) {
    if (!text.includes(part)) throw Error(`Missing ${part}`);
  }
});
Deno.test('unavailable historical week does not look like zero activity', () => {
  const text = formatReport({ ...base, complete: false, started_at: '2026-10-19T01:00:00Z' }, true);
  const [weekly, lifetime] = text.split('<b>За всё время</b>');
  if (!weekly.includes('За эту неделю данных ещё нет') || weekly.includes('Просмотры логотипов:') || !lifetime?.includes('6\u00a0500')) throw Error(text);
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

Deno.test('A/B totals show both groups and distinguish no data from zero conversion', () => {
  const text = formatReport({ ...base, ads_support: [
    { with_ads: true, browsers: 800, clicked: 10 },
  ] });
  if (!text.includes('С рекламой: <b>10 из 800</b> нажали «Поддержать» (1,25\u00a0%)') ||
      !text.includes('Без рекламы: <b>0 из 0</b> нажали «Поддержать» (—)')) throw Error(text);
  if (!formatReport({ ...base, ads_support: null }).includes('Данные недоступны.')) throw Error('Missing unavailable state');
});
