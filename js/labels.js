// ─────────────────────────────────────────────────────────────────────────────
// labels.js — ЕДИНЫЙ ИСТОЧНИК текстов кнопок для всего сайта.
//
// Меняешь текст кнопки ЗДЕСЬ — он меняется на всех страницах (каталог logos/
// emoji/icons и SEO-страницы логотипов). Больше нигде текст руками не правь.
//
// Как это работает:
//   • В разметке у текстового элемента стоит data-label="<ключ>" (плюс запасной
//     текст на случай отключённого JS).
//   • applyLabels() при загрузке проставляет текст из LABELS по этим ключам.
//   • Рантайм-переключения (успех копирования, режим дропдауна) тоже берут
//     строки отсюда — поэтому дублей нет.
// ─────────────────────────────────────────────────────────────────────────────

// Тексты тостов (уведомлений). Динамические — функции, статические — строки.
export const TOASTS = {
  downloaded: name => `Скачано: ${name}`,
  copiedSvg:           'Скопировано SVG',
  copiedPng:           'Скопировано PNG',
  copiedEmoji:   char => `Скопировано: ${char}`,
  copiedColor:   hex  => `${hex} скопирован`,
  copyError:           'Не удалось скопировать',
  copyPngError:        'Не удалось скопировать PNG',
  zipError:            'Ошибка при создании архива',
  zipLoadError:        'Архиватор не загрузился. Перезагрузите страницу.',
  fileNotLoaded:       'Файл не загружен',
  colorsUndone:        'Цвета: отменено',
  copiedEmojiChar:     'Эмодзи скопирован',
  icnsError:           'Не удалось создать ICNS',
  imageLoadError:      'Не удалось загрузить изображение',
};

export const LABELS = {
  // Копирование
  copySvg:       'Скопировать SVG',
  copyPng:       'Скопировать PNG',
  copyEmoji:     'Скопировать символ',  // панель каталога emoji/icons
  copyEmojiPage: 'Скопировать эмодзи',  // отдельная emoji-SEO страница
  copied:        'Скопировано!',

  // Скачивание (каталог и SEO — единые подписи)
  downloadSvg: 'Скачать SVG',
  downloadPng: 'Скачать PNG',

  // Дропдаун «другие форматы»
  dlMore:   'Скачать другие форматы',
  dlZipAll: 'Скачать все (ZIP)',
  dlIco:    'Скачать ICO',
  dlIcns:   'Скачать ICNS',
  dlLiquidGlass: 'Liquid Glass PNG',

  // Прочие кнопки панели
  reportOutdated: 'Сообщить об устаревшем логотипе',
  editColors:     'Настроить цвета',
  resetColors:    'Сбросить',
  helpUpload:     'Загрузить иконку',
};

// Проставляет тексты из LABELS на все элементы с [data-label] внутри root.
// Иконки-SVG внутри кнопок не трогаются: data-label вешается на текстовый <span>.
export function applyLabels(root = document) {
  root.querySelectorAll('[data-label]').forEach(el => {
    const text = LABELS[el.dataset.label];
    if (text != null) el.textContent = text;
  });
}
