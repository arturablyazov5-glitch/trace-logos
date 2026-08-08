// ECOSYSTEMS:START
export const ecosystemLogoMap = {
  google:          'google.svg',
  meta:            'meta.svg',
  nspk:            'mir.svg',
  sber:            'sber.svg',
  sovcombank:      'sovcombank.svg',
  vk:              'vk.svg',
  yandex:          'yandex.svg',
  alfa:            'alfa-bank.svg',
  avito:           'avito.svg',
  tinkoff:         't-bank.svg',
  mts:             'mts-bank.svg',
  ozon:            'ozon.svg',
  wildberries:     'wildberries.svg',
  x5:              'x5.svg',
  openai:          'chatgpt.svg',
  anthropic:       'claude.svg',
  apple:           'apple.svg',
  microsoft:       'microsoft.svg',
  PlayStation:     'ps.svg',
  bytedance:       'tiktok.svg',
  valve:           'valve.svg',
  supercell:       'supercell.svg',
  mvideo:          'mvideo.svg',
  litres:          'litres.svg',
  magnit:          'magnit.svg',
  gwm:             'gwm.svg',
  artlebedev:      'artlebedev.svg',
  'yandex-ai':     'alisa.svg',
  domrf:           'dom-rf.svg',
  internetarchive: 'internet-archive.svg',
  magnific:        'magnific.svg',
};

export const ecosystemLabels = {
  google:          'Google',
  meta:            'Meta',
  nspk:            'НСПК',
  sber:            'Сбер',
  sovcombank:      'Совкомбанк',
  vk:              'ВК',
  yandex:          'Яндекс',
  alfa:            'Альфа-Групп',
  avito:           'Авито',
  tinkoff:         'Т-Банк',
  mts:             'МТС',
  ozon:            'Ozon',
  wildberries:     'Wildberries',
  x5:              'X5',
  kontur:          'Контур',
  openai:          'OpenAI',
  anthropic:       'Anthropic',
  apple:           'Apple',
  adobe:           'Adobe',
  microsoft:       'Microsoft',
  PlayStation:     'PlayStation',
  bytedance:       'ByteDance',
  valve:           'Valve',
  supercell:       'Supercell',
  mvideo:          'М.Видео',
  litres:          'ЛитРес',
  magnit:          'Магнит',
  gwm:             'GWM',
  artlebedev:      'Студия Лебедева',
  'yandex-ai':     'ИИ-помощники Яндекса',
  domrf:           'ДОМ.РФ',
  internetarchive: 'Internet Archive',
  magnific:        'Magnific',
};

export const ecosystemLabelsEn = {
  nspk:        'NSPK',
  sber:        'Sber',
  sovcombank:  'Sovcombank',
  vk:          'VK',
  yandex:      'Yandex',
  alfa:        'Alfa Group',
  avito:       'Avito',
  tinkoff:     'T-Bank',
  mts:         'MTS',
  kontur:      'Kontur',
  mvideo:      'M.Video',
  litres:      'LitRes',
  magnit:      'Magnit',
  artlebedev:  'Lebedev Studio',
  'yandex-ai': 'Yandex AI Assistants',
  domrf:       'DOM.RF',
};

// Custom caption for the detail-panel ecosystem section, when the plain
// ecosystem name (above) reads oddly without an "Экосистема" prefix —
// e.g. a design studio isn't itself a "logo ecosystem" like Yandex or Sber.
export const ecosystemSectionLabels = {
  artlebedev:  'Логотипы студии Лебедева',
  'yandex-ai': 'ИИ-помощники Яндекса',
};

export const ecosystemSectionLabelsEn = {
  artlebedev:  'Art. Lebedev Studio logos',
  'yandex-ai': 'Yandex AI Assistants',
};
// ECOSYSTEMS:END

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
