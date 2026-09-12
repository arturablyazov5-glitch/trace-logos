// SVG-иконки. Бейджи ID/класса используют 14×14 currentColor (наследуют
// чёрный цвет текста кнопки Tilda); иконки верхней панели — 17×17.

// Иконка копирования (Feather "copy"), подогнана под размер нативных
// иконок Tilda (14×14, currentColor).
export const COPY_ICON_SVG = `
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  `;

// Иконка для бейджа CSS-класса блока — та же иконка копирования, что и у ID.
export const CLASS_ICON_SVG = COPY_ICON_SVG;

// Иконка для бейджа «Скопировать код» (Feather "code", 14×14, currentColor).
export const CODE_ICON_SVG = `
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
  `;

// Иконка «Открыть» pop-up блока (Feather "eye", 14×14, currentColor).
export const EYE_ICON_SVG = `
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  `;

// Иконки для верхней панели (Feather icons, 17×17, currentColor).
export const PUBLISH_ICON_SVG = `
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
      <polyline points="16 16 12 12 8 16"></polyline>
      <line x1="12" y1="12" x2="12" y2="21"></line>
    </svg>
  `;
export const SETTINGS_ICON_SVG = `
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  `;
export const MORE_ICON_SVG = `
    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" stroke="none">
      <circle cx="12" cy="5" r="1.6"></circle>
      <circle cx="12" cy="12" r="1.6"></circle>
      <circle cx="12" cy="19" r="1.6"></circle>
    </svg>
  `;

// Иконка «Мультипревью» (три экрана разной ширины: десктоп/планшет/телефон)
// для кнопки в верхней панели редактора. 17×17, currentColor.
export const MULTIPREVIEW_ICON_SVG = `
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
         stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="1.5" y="4" width="12" height="9" rx="1"></rect>
      <rect x="15" y="6.5" width="7.5" height="13.5" rx="1"></rect>
      <line x1="4.5" y1="16" x2="10.5" y2="16"></line>
    </svg>
  `;

// Иконка для поля Z-index (Feather "layers"), как background-image для
// ::before нативного .t-button__text (там уже зарезервирован слот 14×14 под
// фоновую SVG-картинку, currentColor в data-URI не резолвится, поэтому
// цвет прошит явно (#333 — совпадает с цветом текста нативных кнопок).
export const ZINDEX_ICON_DATA_URL =
  'url("data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" ' +
      'fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>' +
      '<polyline points="2 17 12 22 22 17"></polyline>' +
      '<polyline points="2 12 12 17 22 12"></polyline>' +
      '</svg>'
  ) +
  '")';

// Иконка для кнопки «Добавить атрибут» (Feather "tag"), тем же способом —
// background-image для ::before нативного .t-button__text (слот 14×14, цвет
// прошит явно #333, т.к. currentColor в data-URI не резолвится).
export const ATTR_ICON_DATA_URL =
  'url("data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" ' +
      'fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>' +
      '<line x1="7" y1="7" x2="7.01" y2="7"></line>' +
      '</svg>'
  ) +
  '")';
