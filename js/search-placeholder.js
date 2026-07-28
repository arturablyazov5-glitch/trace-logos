// ─────────────────────────────────────────────────────────────────────────────
// search-placeholder.js — «живой» плейсхолдер (печатает/стирает примеры
// запросов) для #search — живого фильтра каталога на /logos/ и /emoji/
// (main.js/search.js). Отдельный модуль, а не часть main.js/search.js: не
// трогает их DI-логику фильтрации, сам себя инициализирует и сам получает
// данные — тот же движок, что и у header-search.js (placeholder-typewriter.js).
// ─────────────────────────────────────────────────────────────────────────────
import { initPlaceholderTypewriter } from './placeholder-typewriter.js';

const input = document.getElementById('search');
if (input) {
  const IS_EN = window.__LANG__ === 'en';
  // Тот же способ определения секции, что и в main.js (_pathSection): первый
  // сегмент пути, пропуская 'en'.
  const SECTION = location.pathname.split('/').filter(Boolean).find(s => s !== 'en') ?? 'logos';
  const IS_EMOJI = SECTION === 'emoji';

  const LOGO_TEMPLATES = IS_EN ? [
    'Logo {name} download SVG',
    '{name} icon ICO',
    '{name} SVG and PNG',
    'Download {name} logo',
    'Download logo {name}',
    '{name} in vector, free',
    '{name} brand colors',
  ] : [
    'Лого {name} скачать SVG',
    'Значок {name} ICO',
    '{name} SVG и PNG',
    '{name} логотип скачать',
    'Скачать логотип {name}',
    '{name} в векторе бесплатно',
    'Цвета логотипа {name}',
  ];
  const EMOJI_TEMPLATES = IS_EN ? [
    'Emoji {name}',
    '{name} emoji PNG',
    'Download {name} emoji',
    'Emoji 🔥',
    'Emoji 😂',
    'Emoji 😀',
    'Grinning face emoji',
  ] : [
    'Эмодзи {name}',
    '{name} эмодзи PNG',
    'Скачать эмодзи {name}',
    'Эмодзи 🔥',
    'Эмодзи 😂',
    'Эмодзи 😀',
    'Улыбается эмодзи',
  ];

  initPlaceholderTypewriter(
    input,
    IS_EMOJI ? EMOJI_TEMPLATES : LOGO_TEMPLATES,
    () => fetch(`/${SECTION}.json`)
      .then(r => r.json())
      .then(d => (d[SECTION] || []).map(it => it.name).filter(Boolean))
      .catch(() => [])
  );
}
