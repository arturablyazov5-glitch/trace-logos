// Фича «Автовключение продвинутого режима» на страницах списка проектов
// (/projects/…) — и в списке сайтов, и в списке страниц одного сайта.
//
// Тильда сама предлагает «продвинутый режим» (компактная таблица вместо
// крупных превью-плиток) только когда элементов больше 15 — флаг лежит в
// localStorage.powermode и читается как фолбэк, если сервер не прислал
// window.powermode (см. td-p-all.min.js). Здесь включаем его всегда, не
// дожидаясь порога.
export function initProjectsPowerMode() {
  try {
    localStorage.setItem('powermode', 'y');
    if (!window.powermode && typeof window.td__project__initPowerMode === 'function') {
      window.powermode = 'y';
      window.td__project__initPowerMode();
    }
  } catch (e) {}
  injectProjectsStyles();
}

// Скруглённые углы у плиток списка сайтов (по просьбе пользователя).
function injectProjectsStyles() {
  if (document.getElementById('th-projects-style')) return;
  const style = document.createElement('style');
  style.id = 'th-projects-style';
  style.textContent = `
    .td-sites-grid__item {
      border-radius: 12px;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}
