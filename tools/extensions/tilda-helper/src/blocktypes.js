// Фича «правила UI по типу блока»: точечные подпорки под конкретные типы
// блоков Tilda (T123, T178, T228, DV11...) — прячем то, что для них
// бесполезно или мешает (кнопки панели, поля сайдбара «Настройки»). Не
// связано с бейджами (badges.js) и не связано с z-index carrier'ами
// (zindex.js), поэтому вынесено отдельно.

import { isCarrierText } from './constants.js';
import { getRecordWrapper, isT123Wrapper, getRecordCod } from './dom.js';

// Кнопка «Контент» бесполезна у этих типов (по просьбе пользователя).
const HIDE_CONTENT_CODES = ['T178', 'T228', 'DV11', 'DV01'];

// Кнопка «Настройки» отдельно скрывается у T173, T809, T223 (по просьбе
// пользователя), в дополнение к ЛЮБОМУ T123 (см. isT123 ниже).
const HIDE_SETTINGS_CODES = ['T173', 'T809', 'T223'];

// Бейдж «Скопировать код» бесполезен у этих типов (по просьбе пользователя),
// в дополнение к ЛЮБОМУ T123 — используется badges.js. T868 получил свою
// кнопку «Скопировать» в шапке плейсхолдера (copycode.js) — панельный бейдж
// дублирует её, прячем.
export const HIDE_CODE_BADGE_CODES = ['T173', 'T809', 'T178', 'T228', 'DV11', 'T218', 'T223', 'T868'];

// Помечает панель блока (`.tp-record-ui`) CSS-классами, которые дальше
// использует styles.js, чтобы точечно спрятать отдельные кнопки:
// - .th-carrier-panel — carrier T123 z-index-фичи (см. zindex.js): панель
//   пустая, кроме «Удалить», блоком управляет поле Z-index в сайдбаре.
// - .th-hide-settings-panel — ЛЮБОЙ блок T123 («HTML-код»: там нечего
//   настраивать, кроме кода) + T173, T809 (по просьбе пользователя): прячем
//   только «Настройки».
// - .th-hide-content-panel — блоки из HIDE_CONTENT_CODES: прячем «Контент».
// Возвращает isCarrier — вызывающий код (badges.js) использует его отдельно
// для подмены плейсхолдер-текста carrier'а.
export function applyBlockTypePanelClasses(panel, rec, wrapper) {
  const isCarrier = isT123Wrapper(wrapper) && isCarrierText(rec.textContent);
  panel.classList.toggle('th-carrier-panel', isCarrier);
  rec.classList.toggle('th-carrier-block', isCarrier);

  // Раньше T123 отличали через rec.querySelector('.tmod') — неверно, .tmod
  // встречается и у других типов (напр. T173, T178, T228, DV11), из-за чего
  // «Настройки» пряталась не только у T123. Надёжный признак — код типа
  // блока (тот же способ, что и isCarrier).
  const cod = getRecordCod(wrapper);
  // Alias-блоки (ссылка на блок с другой страницы, у обёртки есть
  // data-alias-record-type) настроек не имеют — прячем «Настройки».
  const isAlias = !!(wrapper && wrapper.hasAttribute('data-alias-record-type'));
  const hideSettings = isT123Wrapper(wrapper) || HIDE_SETTINGS_CODES.includes(cod) || isAlias;
  panel.classList.toggle('th-hide-settings-panel', hideSettings);

  const hideContent = HIDE_CONTENT_CODES.includes(cod);
  panel.classList.toggle('th-hide-content-panel', hideContent);

  return isCarrier;
}

// Поля сайдбара «Настройки», бесполезные у отдельных типов блоков (по
// просьбе пользователя). Каждое поле надёжно опознаётся по нативному
// атрибуту data-tpl-field на .pe-form-group (см. tilda-editor-dom).
// Мобильная пара отступов (data-split, отдельная .pe-form-group_hidden) не
// трогается — она и так скрыта нативно, пока не включена галочка.
// DV11/T228/T218: «Отступ сверху/снизу», «Выключить эффект появления при
// скролле», «Диапазон видимости на устройствах».
const HIDDEN_TPL_FIELDS_BY_CODE = {
  DV11: ['margintop', 'animationoff', 'screenmax'],
  T228: ['margintop', 'animationoff', 'screenmax'],
  T218: ['margintop', 'animationoff', 'screenmax'],
};
const ALL_HIDEABLE_TPL_FIELDS = ['margintop', 'animationoff', 'screenmax', 'blockbackground'];

export function updateHiddenSidebarFields() {
  const form = document.querySelector('.pe-settings-form[data-rec-id]');
  if (!form) return;
  const body = form.querySelector('.edrec__wrapper.panel-body');
  if (!body) return;

  const wrapper = getRecordWrapper('rec' + form.dataset.recId);
  const cod = getRecordCod(wrapper);
  const fieldsToHide = HIDDEN_TPL_FIELDS_BY_CODE[cod] || [];

  ALL_HIDEABLE_TPL_FIELDS.forEach((field) => {
    const group = body.querySelector('.pe-form-group[data-tpl-field="' + field + '"]');
    if (group) group.style.display = fieldsToHide.includes(field) ? 'none' : '';
  });
}
