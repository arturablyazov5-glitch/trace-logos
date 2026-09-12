// Общие имена классов, маркеры и тексты, которыми пользуются обе фичи
// (бейджи и z-index). Держим в одном месте, чтобы CSS (styles.js) и логика
// ссылались на один и тот же строковый литерал.

export const BADGE_CLASS = 'th-block-id-badge';
export const CLASS_BADGE_CLASS = 'th-block-class-badge';
export const CODE_BADGE_CLASS = 'th-block-code-badge';
export const COPIED_TEXT = 'Скопировано';

// Carrier-блок z-index помечен комментарием «th-zi:recXXXX» — по нему находим
// carrier конкретного блока (см. zindex.js).
export const CARRIER_MARKER_PREFIX = 'th-zi:'; // + full rec id (rec2031118111)

// Carrier-блок произвольного атрибута помечен «th-attr:recXXXX» (см.
// attributes.js). Внутри — <script>, вешающий атрибут на #recXXXX на
// опубликованной странице (в редакторе имитируем setAttribute вживую).
export const ATTR_MARKER_PREFIX = 'th-attr:';

// Оба типа наших служебных carrier'ов (z-index и атрибуты) опознаются одинаково —
// это T123 с нашим маркером. Общая проверка нужна логике, которая не различает
// тип carrier'а: скрытие панели, синий фон, синхронизация порядка со своим блоком.
export function isCarrierText(text) {
  return text.includes(CARRIER_MARKER_PREFIX) || text.includes(ATTR_MARKER_PREFIX);
}

export const ZINDEX_TOGGLE_CLASS = 'th-zindex-toggle-btn';
export const ZINDEX_WRAPPER_CLASS = 'th-zindex-wrapper';

export const ATTR_TOGGLE_CLASS = 'th-attr-toggle-btn';
export const ATTR_WRAPPER_CLASS = 'th-attr-wrapper';

// tplid шаблона «T123 HTML-код» = "131" (НЕ 123 — проверено перехватом
// tp__addRecord при клике по карточке T123 в библиотеке).
export const T123_TPLID = '131';

// tplid Zero-блока (T396) = "396" — проверено по window.$tpls (маппинг
// id↔cod всех шаблонов библиотеки).
export const T396_TPLID = '396';

export const LIVE_CSS_ZINDEX_ID = 'th-live-css-zindex';
export const LIVE_CSS_BLOCK_PREFIX = 'th-live-css-';

// Родная заглушка T123 в канвасе редактора («Код будет выполнен на
// опубликованной странице…») вводит в заблуждение именно у carrier-блока:
// эффект (z-index или атрибут) виден в редакторе сразу, и блок никто не
// должен редактировать руками — им управляет поле в сайдбаре блока выше.
// Подменяем текст на понятное объяснение (общее для обоих типов carrier'а).
export const CARRIER_PLACEHOLDER_TEXT =
  'Служебный блок Tilda Helper. Задаёт z‑index или атрибут блоку выше. ' +
  'Управляйте им через поля в настройках того блока';
