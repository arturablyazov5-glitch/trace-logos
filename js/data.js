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
  anthropic:   'claude.svg',
  wildberries: 'wildberries.svg',
  yandex:      'yandex.svg',
  apple:       'apple.svg',
  bytedance:   'tiktok.svg',
  valve:       'valve.svg',
  microsoft:   'microsoft.svg',
  mvideo:      'mvideo.svg',
  artlebedev:  'artlebedev.svg',
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
  anthropic:   'Anthropic',
  apple:       'Apple',
  adobe:       'Adobe',
  microsoft:   'Microsoft',
  PlayStation: 'PlayStation',
  bytedance:   'ByteDance',
  valve:       'Valve',
  mvideo:      'М.Видео',
  artlebedev:  'Студия Лебедева',
};

export const ecosystemLabelsEn = {
  nspk:       'NSPK',
  sber:       'Sber',
  sovcombank: 'Sovcombank',
  vk:         'VK',
  yandex:     'Yandex',
  alfa:       'Alfa Group',
  avito:      'Avito',
  tinkoff:    'T-Bank',
  mts:        'MTS',
  kontur:     'Kontur',
  mvideo:     'M.Video',
  artlebedev: 'Art. Lebedev Studio',
};

// Custom caption for the detail-panel ecosystem section, when the plain
// ecosystem name (above) reads oddly without an "Экосистема" prefix —
// e.g. a design studio isn't itself a "logo ecosystem" like Yandex or Sber.
export const ecosystemSectionLabels = {
  artlebedev: 'Логотипы студии Лебедева',
};

export const ecosystemSectionLabelsEn = {
  artlebedev: 'Art. Lebedev Studio logos',
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
      // Emoji manifest categories have no explicit slug → derive from the filename.
      const slug = cat.slug || cat.file.split('/').pop().replace(/\.json$/, '');
      // cat.section_en (from manifest) takes priority over the category JSON field.
      const section_en = cat.section_en ?? result.value.section_en;
      return { ...result.value, slug, section_en };
    });
}
