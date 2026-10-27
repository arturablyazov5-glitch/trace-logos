export type Report = {
  week: string; end: string; started_at: string; complete: boolean;
  views: number; downloads: number;
  top: { name: string; count: number } | null;
  misses: { query: string; count: number }[];
};

const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const number = (n: number) => n.toLocaleString('ru-RU');
const times = (n: number) => `${number(n)} ${n % 100 >= 11 && n % 100 <= 14 ? 'раз' : n % 10 >= 2 && n % 10 <= 4 ? 'раза' : 'раз'}`;

function period(week: string, end: string): string {
  const first = new Date(`${week}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  last.setUTCDate(last.getUTCDate() - 1);
  const day = (d: Date) => `${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
  if (first.getUTCFullYear() !== last.getUTCFullYear()) {
    return `${day(first)} ${first.getUTCFullYear()} — ${day(last)} ${last.getUTCFullYear()}`;
  }
  if (first.getUTCMonth() !== last.getUTCMonth()) {
    return `${day(first)} — ${day(last)} ${last.getUTCFullYear()}`;
  }
  return `${first.getUTCDate()}–${day(last)} ${last.getUTCFullYear()}`;
}

// Telegram HTML: escape all user-controlled names and search queries.
export function formatReport(r: Report, test = false): string {
  const lines = [
    `<b>${test ? 'Тест недельного отчёта Trace Logos' : 'Trace Logos — итоги недели'}</b>`,
    period(r.week, r.end), '',
  ];
  if (new Date(r.started_at) >= new Date(`${r.end}T00:00:00+03:00`)) {
    return lines.concat('За эту неделю данных ещё нет.').join('\n');
  }
  lines.push(
    `Просмотры логотипов: <b>${number(r.views)}</b>`,
    `Скачивания логотипов: <b>${number(r.downloads)}</b>`, '',
    '<b>Больше всего скачивали</b>',
    r.top ? `${escapeHtml(r.top.name)} — <b>${times(r.top.count)}</b>` : 'Скачиваний за неделю не было.', '',
    '<b>Не нашли в поиске</b>',
    '<i>Топ-3 за неделю</i>', '',
    ...(r.misses.length ? r.misses.map((m, i) => `${i + 1}. ${escapeHtml(m.query)} — <b>${times(m.count)}</b>`) : ['Пустых поисков не было.']),
  );
  return lines.join('\n');
}
