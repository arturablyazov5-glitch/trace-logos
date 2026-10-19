export type Report = {
  week: string; end: string; started_at: string; complete: boolean;
  views: number; downloads: number;
  top: { name: string; count: number } | null;
  misses: { query: string; count: number }[];
};
export function formatReport(r: Report, test = false): string {
  const date = (s: string) => s.split('-').reverse().join('.');
  const last = new Date(`${r.end}T00:00:00Z`);
  last.setUTCDate(last.getUTCDate() - 1);
  const lines = [test ? 'Тест недельного отчёта Trace Logos' : 'Trace Logos — итоги недели', '',
    `${date(r.week)} — ${date(last.toISOString().slice(0, 10))}`];
  if (!r.complete) {
    const started = new Date(r.started_at).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    lines.push('', `Недельный учёт включён ${started} МСК.`, '', 'За этот период полных данных пока нет.');
    if (new Date(r.started_at) >= new Date(`${r.end}T00:00:00+03:00`)) {
      return lines.concat('', 'Просмотры, скачивания, лидер и топ-3 пустых поисков появятся после накопления данных.').join('\n');
    }
    lines.push('', 'Ниже — только накопленная часть недели.');
  }
  lines.push('', `Просмотры логотипов: ${r.views.toLocaleString('ru-RU')}`,
    '', `Скачивания логотипов: ${r.downloads.toLocaleString('ru-RU')}`, '',
    r.top ? `Больше всего скачивали: ${r.top.name} — ${r.top.count.toLocaleString('ru-RU')} раз` : 'Скачиваний за неделю не было.',
    '', 'Не нашли в поиске — топ-3 за неделю:', '');
  lines.push(...(r.misses.length ? r.misses.map((m, i) => `${i + 1}. ${m.query} — ${m.count} раз`) : ['Пустых поисков не было.']));
  return lines.join('\n');
}
