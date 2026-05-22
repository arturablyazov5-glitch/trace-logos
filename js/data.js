export const ecosystemLogoMap = {
  alfa:        'svgs/alfa-bank.svg',
  avito:       'svgs/avito.svg',
  google:      'svgs/google.svg',
  meta:        'svgs/meta.svg',
  mts:         'svgs/mts-bank.svg',
  nspk:        'svgs/mir.svg',
  ozon:        'svgs/ozon.svg',
  sber:        'svgs/sber.svg',
  sovcombank:  'svgs/sovcombank.svg',
  tinkoff:     'svgs/t-bank.svg',
  vk:          'svgs/vk.svg',
  openai:      'svgs/chatgpt.svg',
  wildberries: 'svgs/wildberries.svg',
  yandex:      'svgs/yandex.svg',
  apple:       'svgs/apple-pay.svg',
  bytedance:   'svgs/tiktok.svg',
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
};

export async function loadLogos() {
  const manifest = await fetch('logos/manifest.json').then(r => {
    if (!r.ok) throw new Error('manifest not found');
    return r.json();
  });
  return Promise.all(manifest.categories.map(category =>
    fetch('logos/' + category.file).then(r => {
      if (!r.ok) throw new Error(category.file + ' not found');
      return r.json();
    })
  ));
}
