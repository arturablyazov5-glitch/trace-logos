// Иконки у кнопок «Actions» и «File» в сайдбаре Zero-редактора:
// - .sui-element-action-section (Copy/Delete/Lock/Group/Ungroup)
// - .sui-file-buttons-container (Delete/Edit/Original size/to Vector)
// Copy/Delete/Lock и все кнопки File — только иконка (текст гасится),
// Group/Ungroup — иконка + текст (по просьбе пользователя, эти два действия
// менее очевидны без подписи).
//
// Чисто CSS-решение: иконка рисуется псевдоэлементом через mask-image +
// background-color:currentColor — поэтому наследует родные цвета/hover
// кнопки, а пересоздание sui-панели при смене выделения ничему не мешает
// (стиль один, живёт в <head>).

// Feather-иконки (24×24, stroke). Для mask важна только альфа, поэтому
// цвет обводки внутри SVG произвольный (black).
const ICONS = {
  // Copy (дублировать)
  dupl: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  // Delete (корзина, Feather "trash-2" без внутренних линий)
  del: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  // Lock (замок)
  lock: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  // Group (два элемента в пунктирной рамке-группе)
  group: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="3" stroke-dasharray="4 3"/><rect x="6.5" y="6.5" width="6" height="6" rx="1"/><rect x="11.5" y="11.5" width="6" height="6" rx="1"/></svg>`,
  // Ungroup (элементы разъезжаются, рамка «разорвана»)
  ungroup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/><line x1="16" y1="8" x2="19" y2="5"/><line x1="8" y1="16" x2="5" y2="19"/></svg>`,
  // File: Delete (та же корзина, что и у Actions)
  'file-del': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  // File: Edit (карандаш)
  'file-edit': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`,
  // File: Original size (стрелки врозь по диагонали — «развернуть»)
  'file-reset': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
  // File: to Vector (перо)
  'file-vector': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`,
};

function maskUrl(svg) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// Ключ иконки → реальный CSS-класс кнопки (там, где они расходятся).
const BUTTON_CLASS = {
  'file-del': 'sui-file-del',
  'file-edit': 'sui-file-edit',
  'file-reset': 'sui-file-reset',
  'file-vector': 'sui-file-to-vector',
};

export function injectZeroActionIconStyles() {
  if (document.getElementById('th-action-icons-style')) return;
  const style = document.createElement('style');
  style.id = 'th-action-icons-style';
  const perButton = Object.entries(ICONS)
    .map(([name, svg]) => {
      const cls = BUTTON_CLASS[name] || `sui-btn-${name}`;
      return `
    .${cls}::before {
      -webkit-mask-image: ${maskUrl(svg)};
      mask-image: ${maskUrl(svg)};
    }`;
    })
    .join('\n');
  style.textContent = `
    .sui-element-action-section .sui-btn,
    .sui-file-buttons-container .sui-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    /* Copy/Delete/Lock и все кнопки File — гасим текстовый лейбл, оставляя
       только иконку. */
    .sui-element-action-section .sui-btn-dupl,
    .sui-element-action-section .sui-btn-del,
    .sui-element-action-section .sui-btn-lock,
    .sui-file-buttons-container .sui-btn {
      font-size: 0 !important;
      line-height: 0 !important;
    }
    /* Group/Ungroup — иконка слева от текста. */
    .sui-element-action-section .sui-btn-group,
    .sui-element-action-section .sui-btn-ungroup {
      gap: 6px;
    }
    .sui-element-action-section .sui-btn::before,
    .sui-file-buttons-container .sui-btn::before {
      content: '';
      display: block;
      width: 15px;
      height: 15px;
      flex: 0 0 auto;
      background-color: currentColor;
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
      -webkit-mask-position: center;
      mask-position: center;
      -webkit-mask-size: contain;
      mask-size: contain;
    }
    ${perButton}
  `;
  (document.head || document.documentElement).appendChild(style);
}
