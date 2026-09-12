// Фича «копировать код T123 / T868»: в шапке плейсхолдера в канвасе
// (.tmod__header, справа от родного текста «Код будет выполнен…») — кнопка
// «Скопировать», копирует весь код блока. Источник кода — textContent
// превью .tmod__cards pre: Tilda рендерит туда код целиком (проверено на
// блоках до ~4.5КБ, хвосты не обрезаны), а textContent декодирует
// HTML-сущности подсветки hljs обратно в исходные символы.
//
// T868 (pop-up) использует тот же плейсхолдер-каркас, что и T123, поэтому
// кнопка переиспользуется один в один.
//
// Кнопки держатся периодическим проходом (updateT123CopyButtons на tick):
// канвас Tilda перерисовывает блоки при редактировании/SPA-навигации.

import { COPIED_TEXT, isCarrierText } from './constants.js';
import { COPY_ICON_SVG } from './icons.js';
import { getT123Recs, getT868Recs, fallbackCopy } from './dom.js';

export const T123_COPY_BTN_CLASS = 'th-t123-copy-btn';

function onCopyClick(e) {
  // Клик по плейсхолдеру открывает редактор кода — не даём ему всплыть.
  e.preventDefault();
  e.stopPropagation();
  const btn = e.currentTarget;
  const rec = btn.closest('.r');
  // Код читаем в момент клика (не кешируем — блок могли отредактировать
  // после отрисовки кнопки).
  const pre = rec && rec.querySelector('.tmod__cards pre');
  if (!pre) return;
  const text = pre.textContent.trim();
  const label = btn.querySelector('.th-t123-copy-label');
  const done = () => {
    btn.dataset.copied = '1';
    label.textContent = COPIED_TEXT;
    setTimeout(() => {
      delete btn.dataset.copied;
      label.textContent = 'Скопировать';
    }, 1200);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}

function buildCopyBtn() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = T123_COPY_BTN_CLASS;
  btn.title = 'Скопировать весь код блока';

  const icon = document.createElement('span');
  icon.className = 'th-t123-copy-icon';
  icon.innerHTML = COPY_ICON_SVG;

  const label = document.createElement('span');
  label.className = 'th-t123-copy-label';
  label.textContent = 'Скопировать';

  btn.appendChild(icon);
  btn.appendChild(label);
  // mousedown у Tilda тоже участвует в выборе блока — глушим и его.
  btn.addEventListener('mousedown', (e) => e.stopPropagation());
  btn.addEventListener('click', onCopyClick);
  return btn;
}

export function updateT123CopyButtons() {
  getT123Recs().forEach((rec) => {
    const header = rec.querySelector('.tmod__header');
    if (!header || header.querySelector('.' + T123_COPY_BTN_CLASS)) return;
    // Служебные carrier-блоки (z-index/атрибуты) редактируются через сайдбар
    // своего блока — копировать их код незачем. Маркер лежит в самом коде,
    // поэтому виден в textContent превью.
    if (isCarrierText(rec.textContent)) return;
    // Пустой T123 (код ещё не введён) — превью .tmod__cards нет, копировать нечего.
    if (!rec.querySelector('.tmod__cards pre')) return;
    header.appendChild(buildCopyBtn());
  });

  getT868Recs().forEach((rec) => {
    const header = rec.querySelector('.tmod__header');
    if (!header || header.querySelector('.' + T123_COPY_BTN_CLASS)) return;
    if (!rec.querySelector('.tmod__cards pre')) return;
    header.appendChild(buildCopyBtn());
  });
}
