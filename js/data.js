export const ecosystemLogoMap = {
  alfa:        '../assets/logos/svgs/alfa-bank.svg',
  avito:       '../assets/logos/svgs/avito.svg',
  google:      '../assets/logos/svgs/google.svg',
  meta:        '../assets/logos/svgs/meta.svg',
  mts:         '../assets/logos/svgs/mts-bank.svg',
  nspk:        '../assets/logos/svgs/mir.svg',
  ozon:        '../assets/logos/svgs/ozon.svg',
  sber:        '../assets/logos/svgs/sber.svg',
  sovcombank:  '../assets/logos/svgs/sovcombank.svg',
  tinkoff:     '../assets/logos/svgs/t-bank.svg',
  vk:          '../assets/logos/svgs/vk.svg',
  openai:      '../assets/logos/svgs/chatgpt.svg',
  wildberries: '../assets/logos/svgs/wildberries.svg',
  yandex:      '../assets/logos/svgs/yandex.svg',
  apple:       '../assets/logos/svgs/apple-pay.svg',
  bytedance:   '../assets/logos/svgs/tiktok.svg',
  valve:       '../assets/logos/svgs/valve.svg',
  microsoft:   '../assets/logos/svgs/microsoft.svg',
  mvideo:      '../assets/logos/svgs/mvideo.svg',
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
  const results = await Promise.allSettled(manifest.categories.map(category =>
    fetch(base + category.file).then(r => {
      if (!r.ok) throw new Error(category.file + ' not found');
      return r.json();
    })
  ));
  return results
    .filter(r => { if (r.status === 'rejected') { console.warn('loadLogos:', r.reason); } return r.status === 'fulfilled'; })
    .map(r => r.value);
}
