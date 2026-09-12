// Фича «скопировать якорь» в плейсхолдере блока якорной ссылки (T173).
//
// Родной плейсхолдер показывает имя якоря («Якорная ссылка. Имя: contact»),
// но чтобы использовать его в ссылке, имя надо переписать руками и добавить
// «#». Кнопка «Скопировать» справа в шапке плейсхолдера кладёт в буфер имя
// сразу в формате ссылки: «#contact».
//
// Внешний вид и поведение — как у «Скопировать» T123 (copycode.js): тот же
// класс th-t123-copy-btn даёт стили и зелёное состояние [data-copied] даром.
// Имя читаем в момент клика из textContent родной кнопки-редактора имени
// (data-edit-link-field="anchor") — после переименования там актуальный текст.
//
// Кнопки держатся периодическим проходом (tick): канвас перерисовывается
// при редактировании/SPA-навигации. Пока имя якоря не задано (родной
// плейсхолдер "не задано") — копировать нечего, кнопка скрыта.

import { COPIED_TEXT } from './constants.js';
import { COPY_ICON_SVG } from './icons.js';
import { fallbackCopy } from './dom.js';

export const ANCHOR_COPY_BTN_CLASS = 'th-anchor-copy-btn';

// Родная кнопка-редактор имени показывает этот текст-плейсхолдер, пока
// имя якоря не задано автором блока — копировать в этом случае нечего.
const ANCHOR_NAME_PLACEHOLDER = 'не задано';

function getAnchorName(header) {
  const nameBtn = header && header.querySelector('button[data-edit-link-field="anchor"]');
  if (!nameBtn) return null;
  const name = nameBtn.textContent.trim();
  if (!name || name === ANCHOR_NAME_PLACEHOLDER) return null;
  return name;
}

function onCopyClick(e) {
  e.preventDefault();
  e.stopPropagation();
  const btn = e.currentTarget;
  const header = btn.closest('.tmod__header');
  const name = getAnchorName(header);
  if (!name) return;
  const text = '#' + name;
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

export function updateAnchorCopyButtons() {
  document
    .querySelectorAll('.r .tmod__text button[data-edit-link-field="anchor"]')
    .forEach((nameBtn) => {
      const header = nameBtn.closest('.tmod__header');
      if (!header) return;

      let btn = header.querySelector('.' + ANCHOR_COPY_BTN_CLASS);
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'th-t123-copy-btn ' + ANCHOR_COPY_BTN_CLASS;
        btn.title = 'Скопировать ссылку на якорь';

        const icon = document.createElement('span');
        icon.className = 'th-t123-copy-icon';
        icon.innerHTML = COPY_ICON_SVG;

        const label = document.createElement('span');
        label.className = 'th-t123-copy-label';
        label.textContent = 'Скопировать';

        btn.appendChild(icon);
        btn.appendChild(label);
        // Клик/mousedown по плейсхолдеру выбирает блок — не даём всплыть.
        btn.addEventListener('mousedown', (e) => e.stopPropagation());
        btn.addEventListener('click', onCopyClick);
        header.appendChild(btn);
      }

      // Пока имя не задано — копировать нечего, прячем кнопку.
      btn.hidden = !getAnchorName(header);
    });
}
