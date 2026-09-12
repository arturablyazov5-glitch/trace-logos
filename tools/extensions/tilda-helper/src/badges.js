// Фича «бейджи»: рядом с нативными кнопками панели блока показываем ID блока
// (#recXXXX) и его CSS-класс — клик копирует. Плюс верхняя панель редактора
// (mainmenu) переводится на иконки. Бейджи держатся периодическим проходом
// (updateBadges на tick), т.к. панели Tilda пересоздаются при изменениях.

import {
  BADGE_CLASS,
  CLASS_BADGE_CLASS,
  CODE_BADGE_CLASS,
  COPIED_TEXT,
  CARRIER_PLACEHOLDER_TEXT,
} from './constants.js';
import {
  COPY_ICON_SVG,
  CLASS_ICON_SVG,
  CODE_ICON_SVG,
  PUBLISH_ICON_SVG,
  SETTINGS_ICON_SVG,
  MORE_ICON_SVG,
} from './icons.js';
import { getAllRecs, getRecordWrapper, findRecForPanel, fallbackCopy, isT123Wrapper, getRecordCod } from './dom.js';
import { applyBlockTypePanelClasses, HIDE_CODE_BADGE_CODES } from './blocktypes.js';

// Верхняя панель редактора (mainmenu): «Предпросмотр» скрывается, а
// «Опубликовать» / «Настройки» / «Еще» остаются теми же элементами (id,
// data-action, обработчики не трогаем) — меняется только содержимое (innerHTML
// на иконку), поэтому вся штатная логика Tilda продолжает работать.
export function updateTopToolbar() {
  // Скрыть кнопку «Предпросмотр» целиком (переключатель Предпросмотр/Редактирование).
  const previewLi = document.querySelector('.tp-menu__navbar__item_preview');
  if (previewLi && previewLi.style.display !== 'none') {
    previewLi.style.display = 'none';
  }

  // «Отменить»/«Вернуть»: Tilda сама ставит disabled на кнопку, когда
  // нечего отменять/возвращать, но саму <li> не прячет — прячем сами.
  updateUndoRedoVisibility('undo');
  updateUndoRedoVisibility('redo');

  // «Опубликовать» → иконка + текст (единственная кнопка топбара с текстом)
  const publishBtn = document.getElementById('page_menu_publishlink');
  if (publishBtn && !publishBtn.dataset.thIcon) {
    publishBtn.dataset.thIcon = '1';
    publishBtn.classList.add('th-icon-text');
    publishBtn.title = 'Опубликовать';
    publishBtn.setAttribute('aria-label', 'Опубликовать');
    publishBtn.innerHTML = PUBLISH_ICON_SVG + '<span class="th-icon-text__label">Опубликовать</span>';
  }

  // «Настройки» → иконка
  const settingsBtn = document.querySelector('button[data-action="settings"]');
  if (settingsBtn && !settingsBtn.dataset.thIcon) {
    settingsBtn.dataset.thIcon = '1';
    settingsBtn.classList.add('th-icon-only');
    settingsBtn.title = 'Настройки';
    settingsBtn.setAttribute('aria-label', 'Настройки');
    settingsBtn.innerHTML = SETTINGS_ICON_SVG;
  }

  // «Еще» → три точки
  const moreBtn = document.querySelector('button[data-action="dropdown"]');
  if (moreBtn && !moreBtn.dataset.thIcon) {
    moreBtn.dataset.thIcon = '1';
    moreBtn.classList.add('th-icon-only');
    moreBtn.title = 'Еще';
    moreBtn.setAttribute('aria-label', 'Еще');
    moreBtn.innerHTML = MORE_ICON_SVG;
  }
}

function updateUndoRedoVisibility(action) {
  const li = document.querySelector('.tp-menu__navbar__item_' + action);
  if (!li) return;
  const btn = li.querySelector('button[data-action="' + action + '"]');
  const disabled = !btn || btn.disabled;
  li.style.display = disabled ? 'none' : '';
}

function onBadgeClick(e) {
  e.preventDefault();
  e.stopPropagation();
  const badge = e.currentTarget;
  const textSpan = badge.querySelector('.tp-record-ui__button-text');
  const text = '#' + badge.dataset.rec;
  const done = () => {
    badge.dataset.copied = '1';
    textSpan.textContent = COPIED_TEXT;
    setTimeout(() => {
      delete badge.dataset.copied;
      textSpan.textContent = '#' + badge.dataset.rec;
    }, 1200);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}

function onClassBadgeClick(e) {
  e.preventDefault();
  e.stopPropagation();
  const badge = e.currentTarget;
  const textSpan = badge.querySelector('.tp-record-ui__button-text');
  const text = badge.dataset.cls;
  const done = () => {
    badge.dataset.copied = '1';
    textSpan.textContent = COPIED_TEXT;
    setTimeout(() => {
      delete badge.dataset.copied;
      textSpan.textContent = badge.dataset.cls;
    }, 1200);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}

// «Скопировать код» — весь HTML блока со стилями (outerHTML обёртки
// #record<numericId>: внутри и разметка, и <style>, и <script> блока), чтобы
// целиком закинуть блок в ИИ. DOM берём в момент клика (не кешируем — блок
// могли отредактировать после отрисовки бейджа).
function onCodeBadgeClick(e) {
  e.preventDefault();
  e.stopPropagation();
  const badge = e.currentTarget;
  const textSpan = badge.querySelector('.tp-record-ui__button-text');
  const rec = document.getElementById(badge.dataset.rec);
  const wrapper = getRecordWrapper(badge.dataset.rec);
  const source = wrapper || rec;
  if (!source) return;
  const text = source.outerHTML;
  const done = () => {
    badge.dataset.copied = '1';
    textSpan.textContent = COPIED_TEXT;
    setTimeout(() => {
      delete badge.dataset.copied;
      textSpan.textContent = 'Скопировать код';
    }, 1200);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}

export function updateBadges() {
  const panels = document.querySelectorAll('.tp-record-ui');
  if (!panels.length) return;
  const recs = getAllRecs();
  if (!recs.length) return;

  panels.forEach((panel) => {
    const rec = findRecForPanel(panel, recs);
    if (!rec) return;

    const wrapper = getRecordWrapper(rec.id);
    const isCarrier = applyBlockTypePanelClasses(panel, rec, wrapper);

    const row = panel.querySelector('.tp-record-ui__container_top .tp-record-ui__row');
    if (!row) return;

    let badge = row.querySelector('.' + BADGE_CLASS);
    let textSpan;
    if (!badge) {
      const group = document.createElement('div');
      group.className = 'tp-record-ui__group';
      badge = document.createElement('button');
      badge.type = 'button';
      badge.className = 'tp-record-ui__button tp-record-ui__button_white ' + BADGE_CLASS;
      badge.title = 'ID блока — клик, чтобы скопировать';

      const icon = document.createElement('span');
      icon.className = 'tp-record-ui__icon th-block-id-icon';
      icon.innerHTML = COPY_ICON_SVG;

      textSpan = document.createElement('span');
      textSpan.className = 'tp-record-ui__button-text';

      badge.appendChild(icon);
      badge.appendChild(textSpan);
      badge.addEventListener('click', onBadgeClick);
      group.appendChild(badge);
      row.appendChild(group);
    } else {
      textSpan = badge.querySelector('.tp-record-ui__button-text');
    }

    if (badge.dataset.rec !== rec.id && !badge.dataset.copied) {
      badge.dataset.rec = rec.id;
      textSpan.textContent = '#' + rec.id;
    }

    // CSS-класс блока лежит не на самом .r.t-rec, а на его обёртке
    // сортировки div#record<numericId> — атрибут data-custom-class
    // (см. tilda-internal-api). Бейдж показываем только если класс задан.
    const customClass = wrapper && wrapper.getAttribute('data-custom-class');
    let classBadge = row.querySelector('.' + CLASS_BADGE_CLASS);
    if (customClass) {
      if (!classBadge) {
        const classGroup = document.createElement('div');
        classGroup.className = 'tp-record-ui__group';
        classBadge = document.createElement('button');
        classBadge.type = 'button';
        classBadge.className = 'tp-record-ui__button tp-record-ui__button_white ' + CLASS_BADGE_CLASS;
        classBadge.title = 'CSS класс блока — клик, чтобы скопировать';

        const classIcon = document.createElement('span');
        classIcon.className = 'tp-record-ui__icon th-block-class-icon';
        classIcon.innerHTML = CLASS_ICON_SVG;

        const classTextSpan = document.createElement('span');
        classTextSpan.className = 'tp-record-ui__button-text';

        classBadge.appendChild(classIcon);
        classBadge.appendChild(classTextSpan);
        classBadge.addEventListener('click', onClassBadgeClick);
        classGroup.appendChild(classBadge);
        row.appendChild(classGroup);
      }
      const classTextSpan = classBadge.querySelector('.tp-record-ui__button-text');
      if (classBadge.dataset.cls !== customClass && !classBadge.dataset.copied) {
        classBadge.dataset.cls = customClass;
        classTextSpan.textContent = customClass;
      }
    } else if (classBadge) {
      classBadge.closest('.tp-record-ui__group').remove();
    }

    // Бейдж «Скопировать код» — последним в ряду, у всех блоков, кроме
    // T123 («HTML-код»: код и так целиком в редакторе контента) и типов
    // из HIDE_CODE_BADGE_CODES (по просьбе пользователя).
    const cod = getRecordCod(wrapper);
    const hideCodeBadge = isT123Wrapper(wrapper) || HIDE_CODE_BADGE_CODES.includes(cod);
    let codeBadge = row.querySelector('.' + CODE_BADGE_CLASS);
    if (!hideCodeBadge) {
      if (!codeBadge) {
        const codeGroup = document.createElement('div');
        codeGroup.className = 'tp-record-ui__group';
        codeBadge = document.createElement('button');
        codeBadge.type = 'button';
        codeBadge.className = 'tp-record-ui__button tp-record-ui__button_white ' + CODE_BADGE_CLASS;
        codeBadge.title = 'Скопировать весь HTML блока со стилями';

        const codeIcon = document.createElement('span');
        codeIcon.className = 'tp-record-ui__icon th-block-code-icon';
        codeIcon.innerHTML = CODE_ICON_SVG;

        const codeTextSpan = document.createElement('span');
        codeTextSpan.className = 'tp-record-ui__button-text';
        codeTextSpan.textContent = 'Скопировать код';

        codeBadge.appendChild(codeIcon);
        codeBadge.appendChild(codeTextSpan);
        codeBadge.addEventListener('click', onCodeBadgeClick);
        codeGroup.appendChild(codeBadge);
        row.appendChild(codeGroup);
      }
      codeBadge.dataset.rec = rec.id;
    } else if (codeBadge) {
      codeBadge.closest('.tp-record-ui__group').remove();
    }

    if (isCarrier) updateCarrierPlaceholderText(rec);
  });
}

function updateCarrierPlaceholderText(rec) {
  const holder = rec.querySelector('.tmod__text');
  if (!holder || holder.dataset.thPlaceholderSet) return;
  const leaf = holder.querySelector('div');
  if (!leaf) return;
  leaf.textContent = CARRIER_PLACEHOLDER_TEXT;
  holder.dataset.thPlaceholderSet = '1';
}
