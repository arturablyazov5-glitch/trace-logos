// Фича «открыть pop-up» в плейсхолдере pop-up блоков (T702 и т.п.) в канвасе.
//
// Родной плейсхолдер предлагает открыть попап ссылкой в тексте («Кликните
// здесь, чтобы посмотреть, как он выглядит») — мелко и незаметно. Делаем
// кнопку «Открыть» справа в шапке плейсхолдера (.tmod__header), в том же
// виде, что и «Скопировать» у T123 (copycode.js, общие стили в styles.js).
//
// Приглашение из текста убираем, но САМ анкор не удаляем, а прячем: попап
// открывает делегированный обработчик Tilda по клику на a[href^="#popup"],
// поэтому кнопка просто кликает по скрытому анкору — своей логики открытия
// нет и ломаться нечему.
//
// Кнопки держатся периодическим проходом (tick): канвас перерисовывается
// при редактировании/SPA-навигации.

import { EYE_ICON_SVG } from './icons.js';

export const POPUP_OPEN_BTN_CLASS = 'th-popup-open-btn';

export function updatePopupOpenButtons() {
  document.querySelectorAll('.r .tmod__text a[href^="#popup"]').forEach((link) => {
    const header = link.closest('.tmod__header');
    if (!header || header.querySelector('.' + POPUP_OPEN_BTN_CLASS)) return;

    // Прячем приглашение: сам анкор («Кликните здесь») + хвост «, чтобы
    // посмотреть, как он выглядит.» из соседнего текстового узла.
    link.style.display = 'none';
    const tail = link.nextSibling;
    if (tail && tail.nodeType === Node.TEXT_NODE) {
      tail.textContent = tail.textContent.replace(/^[^.]*\.\s*/, '');
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = POPUP_OPEN_BTN_CLASS;
    btn.title = 'Открыть pop-up';

    const icon = document.createElement('span');
    icon.className = 'th-popup-open-icon';
    icon.innerHTML = EYE_ICON_SVG;

    const label = document.createElement('span');
    label.textContent = 'Открыть';

    btn.appendChild(icon);
    btn.appendChild(label);
    // Клик/mousedown по плейсхолдеру выбирает блок — не даём всплыть.
    btn.addEventListener('mousedown', (e) => e.stopPropagation());
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      link.click();
    });
    header.appendChild(btn);
  });
}
