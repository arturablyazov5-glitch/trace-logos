export const ecosystemLogoMap = {
  alfa:        'alfa-bank.svg',
  avito:       'avito.svg',
  google:      'google.svg',
  meta:        'meta.svg',
  mts:         'mts-bank.svg',
  nspk:        'mir.svg',
  ozon:        'ozon.svg',
  sber:        'sber.svg',
  sovcombank:  'sovcombank.svg',
  tinkoff:     't-bank.svg',
  vk:          'vk.svg',
  openai:      'chatgpt.svg',
  wildberries: 'wildberries.svg',
  yandex:      'yandex.svg',
  apple:       'apple-pay.svg',
  bytedance:   'tiktok.svg',
  valve:       'valve.svg',
  microsoft:   'microsoft.svg',
  mvideo:      'mvideo.svg',
};

export const ecosystemLabels = {
  google:      'Google',
  meta:        'Meta',
  nspk:        'НСПК',
  sber:        'Сбер',
  sovcombank:  'Совкомбанк',
  vk:          'ВК',
  yandex:      'Яндекс',
  alfa:        'Альфа-Групп',
  avito:       'Авито',
  tinkoff:     'Т-Банк',
  mts:         'МТС',
  ozon:        'Ozon',
  wildberries: 'Wildberries',
  x5:          'X5',
  kontur:      'Контур',
  openai:      'OpenAI',
  apple:       'Apple',
  adobe:       'Adobe',
  microsoft:   'Microsoft',
  PlayStation: 'PlayStation',
  bytedance:   'ByteDance',
  valve:       'Valve',
  mvideo:      'М.Видео',
};

export async function loadLogos(base = '/logos/') {
  const manifest = await fetch(base + 'manifest.json').then(r => {
    if (!r.ok) throw new Error('manifest not found');
    return r.json();
  });
  const cats = manifest.categories;
  const results = await Promise.allSettled(cats.map(cat =>
    fetch(base + cat.file).then(r => {
      if (!r.ok) throw new Error(cat.file + ' not found');
      return r.json();
    })
  ));
  return cats
    .map((cat, i) => ({ cat, result: results[i] }))
    .filter(({ result }) => {
      if (result.status === 'rejected') console.warn('loadLogos:', result.reason);
      return result.status === 'fulfilled';
    })
    .map(({ cat, result }) => {
      return { ...result.value, slug: cat.slug };
    });
}
