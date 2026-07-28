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
  supercell:   'supercell.svg',
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
  supercell:   'Supercell',
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

// variants[].labelKey points into base + 'labels.json' (only logos have one —
// emoji variants are always inline {label, file}). Resolved once here so every
// other module keeps reading v.label/v.label_en exactly as before.
function resolveVariantLabels(cats, labels) {
  if (!labels) return;
  for (const cat of cats) {
    for (const item of cat.items || []) {
      for (const v of item.variants || []) {
        if (!v.labelKey) continue;
        const entry = labels[v.labelKey];
        if (!entry) { console.warn('loadLogos: unknown labelKey', v.labelKey); continue; }
        v.label = entry.label;
        if (entry.label_en) v.label_en = entry.label_en;
      }
    }
  }
}

export async function loadLogos(base = '/logos/') {
  const manifest = await fetch(base + 'manifest.json').then(r => {
    if (!r.ok) throw new Error('manifest not found');
    return r.json();
  });
  const cats = manifest.categories;
  const [results, labels] = await Promise.all([
    Promise.allSettled(cats.map(cat =>
      fetch(base + cat.file).then(r => {
        if (!r.ok) throw new Error(cat.file + ' not found');
        return r.json();
      })
    )),
    fetch(base + 'labels.json').then(r => (r.ok ? r.json() : null)).catch(() => null),
  ]);
  const loaded = cats
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
  resolveVariantLabels(loaded, labels);
  return loaded;
}
