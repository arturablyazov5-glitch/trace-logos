// Фича «Добавить атрибут»: кнопка в сайдбаре «Настройки» блока (рядом с
// «Изменить Z-index») навешивает произвольный HTML-атрибут на обёртку блока
// #recXXXX.
//
// Атрибут — это НЕ CSS, поставить его через <style> нельзя, поэтому carrier
// здесь содержит <script>, который на опубликованной странице делает
// document.getElementById('recXXXX').setAttribute(name, value). В самом
// редакторе T123 не исполняется — атрибут навешиваем на элемент вживую на
// каждом тике (applyLiveAttrPreview), как z-index зеркалит CSS.
//
// Хранение имени/значения: в маркер-комментарии carrier'а лежит
// «th-attr:recXXXX enc:<encodeURIComponent(JSON)>». encodeURIComponent
// исключает пробелы, кавычки, `<` и `/` — значит внутри /* */ и внутри HTML
// пейлоад безопасен (в т.ч. если значение содержит `*/` или кавычки).
//
// Сборка содержимого carrier'а и запись на сервер — общие с z-index, живут в
// carrier.js (один служебный T123-блок несёт и <style> z-index, и <script>
// атрибута). Здесь — только живой превью в редакторе и поле в сайдбаре.

import {
  ATTR_TOGGLE_CLASS,
  ATTR_WRAPPER_CLASS,
  ZINDEX_TOGGLE_CLASS,
  ZINDEX_WRAPPER_CLASS,
} from './constants.js';
import {
  getEffectiveAttrMap,
  setAttrOverride,
  commitBlock,
} from './carrier.js';

export { getEffectiveAttrMap };

// class/id/style на #recXXXX затёрли бы родные классы/стили Tilda прямо в
// редакторе (setAttribute заменяет значение целиком) и визуально сломали бы
// блок. Их всё равно можно сохранить (это выбор пользователя, на сайте
// сработает), но живьём в редакторе такие атрибуты не навешиваем.
const LIVE_PREVIEW_SKIP = new Set(['class', 'id', 'style']);

// ---- Live preview в редакторе ----
// T123 не исполняется в редакторе, поэтому атрибут навешиваем прямо на
// элемент. appliedAttrs помнит, какое ИМЯ мы навесили на каждый блок, чтобы
// снять его при смене имени/сбросе (removeAttribute нужно старое имя).
const appliedAttrs = new Map(); // numericId -> attrName

export function applyLiveAttrPreview(map) {
  // Снимаем устаревшее (блок ушёл из карты или у него сменилось имя атрибута).
  appliedAttrs.forEach((name, recId) => {
    const desired = map.get(recId);
    if (!desired || desired.name !== name) {
      const el = document.getElementById('rec' + recId);
      if (el) {
        try { el.removeAttribute(name); } catch (e) {}
      }
      appliedAttrs.delete(recId);
    }
  });

  map.forEach((info, recId) => {
    if (LIVE_PREVIEW_SKIP.has(info.name.toLowerCase())) return;
    const el = document.getElementById('rec' + recId);
    if (!el) return;
    try {
      if (el.getAttribute(info.name) !== info.value) el.setAttribute(info.name, info.value);
      appliedAttrs.set(recId, info.name);
    } catch (e) {}
  });
}

// ---- Сайдбар ----
function readInputs(nameInput, valueInput) {
  const name = nameInput.value.trim();
  const value = valueInput.value;
  return name === '' ? null : { name, value };
}

// На каждый символ — ТОЛЬКО живой превью (setAttribute на элемент), без записи
// на сервер: сохранение перерисовывает запись и закрывает сайдбар (см.
// commitAttr). Ввод остаётся в override, чтобы поле не сбрасывалось на тике.
function onAttrInput(numericId, nameInput, valueInput, wrapper) {
  if (wrapper) wrapper.dataset.userOpened = '1';
  setAttrOverride(numericId, readInputs(nameInput, valueInput));
  applyLiveAttrPreview(getEffectiveAttrMap());
}

// Коммит на сервер — только когда фокус ушёл из ВСЕЙ панели атрибута (переход
// между полями «имя» и «значение» коммит не вызывает) или по Enter.
function commitAttr(numericId, nameInput, valueInput) {
  setAttrOverride(numericId, readInputs(nameInput, valueInput));
  commitBlock(numericId);
}

// Панель раскрыта, если атрибут уже задан или пользователь раскрыл её кнопкой;
// тогда сама кнопка-переключатель прячется (иначе дубль над панелью).
function renderAttrState(recId, toggle, wrapper) {
  const isOpen = getEffectiveAttrMap().has(recId) || wrapper.dataset.userOpened === '1';
  toggle.style.display = isOpen ? 'none' : '';
  wrapper.style.display = isOpen ? '' : 'none';
}

export function updateAttributeSidebarField() {
  const form = document.querySelector('.pe-settings-form[data-rec-id]');
  if (!form) return;
  const recId = form.dataset.recId;
  const body = form.querySelector('.edrec__wrapper.panel-body');
  if (!body) return;
  const properties = body.querySelector('.pe-properties');
  const itemsList = properties && properties.querySelector('.pe-properties__items');
  if (!itemsList) return;

  // Кнопку ставим сразу ПОСЛЕ кнопки «Изменить Z-index» (та форсит себя в
  // firstChild ряда на каждом тике — см. zindex.js), а при её отсутствии — в
  // начало ряда. Так две наши кнопки не дерутся за одну позицию.
  const zToggle = itemsList.querySelector('.' + ZINDEX_TOGGLE_CLASS);
  let toggle = itemsList.querySelector('.' + ATTR_TOGGLE_CLASS);
  if (!toggle) {
    toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 't-button pe-properties__item ' + ATTR_TOGGLE_CLASS;
    toggle.innerHTML = '<span class="t-button__text">Добавить атрибут</span>';
  }
  if (zToggle) {
    if (toggle.previousElementSibling !== zToggle) itemsList.insertBefore(toggle, zToggle.nextSibling);
  } else if (toggle !== itemsList.firstChild) {
    itemsList.insertBefore(toggle, itemsList.firstChild);
  }

  // Раскрывающаяся панель — перед рядом кнопок; ставим её перед панелью
  // z-index (если та есть), иначе прямо перед рядом кнопок.
  const zWrapper = properties.querySelector('.' + ZINDEX_WRAPPER_CLASS);
  let wrapper = properties.querySelector('.' + ATTR_WRAPPER_CLASS);
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.className = 'pe-properties__wrapper ' + ATTR_WRAPPER_CLASS;
    wrapper.innerHTML =
      '<div class="th-attr-fields">' +
        '<div class="pe-form-group">' +
          '<label class="pe-label">Имя атрибута</label>' +
          '<div class="pe-input__wrapper">' +
          '<input class="pe-input th-attr-name" type="text" placeholder="data-…"></div>' +
        '</div>' +
        '<div class="pe-form-group">' +
          '<label class="pe-label">Значение</label>' +
          '<div class="pe-input__wrapper">' +
          '<input class="pe-input th-attr-value" type="text" placeholder="Значение"></div>' +
        '</div>' +
      '</div>';

    const nameInput = wrapper.querySelector('.th-attr-name');
    const valueInput = wrapper.querySelector('.th-attr-value');
    const onInput = () => onAttrInput(wrapper.dataset.recId, nameInput, valueInput, wrapper);
    nameInput.addEventListener('input', onInput);
    valueInput.addEventListener('input', onInput);
    // Коммитим, когда фокус ушёл ИЗ панели целиком: relatedTarget внутри
    // wrapper (перескок имя↔значение) — не коммит; наружу или null — коммит.
    wrapper.addEventListener('focusout', (e) => {
      if (wrapper.contains(e.relatedTarget)) return;
      commitAttr(wrapper.dataset.recId, nameInput, valueInput);
    });
    [nameInput, valueInput].forEach((inp) =>
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') inp.blur();
      })
    );

    toggle.addEventListener('click', () => {
      wrapper.dataset.userOpened = '1';
      renderAttrState(toggle.dataset.recId, toggle, wrapper);
      nameInput.focus();
    });
  }
  if (zWrapper) {
    if (wrapper.nextElementSibling !== zWrapper) properties.insertBefore(wrapper, zWrapper);
  } else if (wrapper.nextSibling !== itemsList) {
    properties.insertBefore(wrapper, itemsList);
  }

  if (wrapper.dataset.recId !== recId) {
    wrapper.dataset.recId = recId;
    toggle.dataset.recId = recId;
    delete wrapper.dataset.userOpened;
    const map = getEffectiveAttrMap();
    const info = map.get(recId);
    wrapper.querySelector('.th-attr-name').value = info ? info.name : '';
    wrapper.querySelector('.th-attr-value').value = info ? info.value : '';
  }
  renderAttrState(recId, toggle, wrapper);
}
