// Фича «Z-index»: поле в сайдбаре «Настройки» блока задаёт z-index блоку через
// служебный T123-carrier под ним (см. carrier.js — там же живёт запись на
// сервер, теперь общая с фичей атрибутов, один блок на целевой).
//
// Этот модуль отвечает за: живой превью z-index в редакторе (T123 в редакторе
// не исполняется, поэтому CSS зеркалим в <head>), поле в сайдбаре и «прозрачную»
// синхронизацию порядка carrier'а со своим блоком при перестановке.

import {
  ZINDEX_TOGGLE_CLASS,
  ZINDEX_WRAPPER_CLASS,
  LIVE_CSS_ZINDEX_ID,
  LIVE_CSS_BLOCK_PREFIX,
  isCarrierText,
} from './constants.js';
import { getRecordWrapper, getRecordCod, isT123Wrapper, getT123Recs } from './dom.js';
import {
  getEffectiveZIndexMap,
  setZIndexOverride,
  commitBlock,
} from './carrier.js';
import { isZeroBlock, readZeroZIndex, writeZeroZIndex, prefillZeroZIndex } from './zeroindex.js';

// T1093 не поддерживает z-index (внутренняя вёрстка блока не переживает
// position:relative + overflow:visible от carrier'а) — кнопку прячем совсем.
const ZINDEX_UNSUPPORTED_CODES = ['T1093'];
function zIndexUnsupported(recId) {
  return ZINDEX_UNSUPPORTED_CODES.includes(getRecordCod(getRecordWrapper('rec' + recId)));
}

export { getEffectiveZIndexMap };

// ---- Live CSS Preview ----
//
// T123 «HTML-код» не выполняется в редакторе — виден только как текст-превью
// (r.textContent содержит буквально «<style>...</style>» как текст, не как
// распарсенный DOM). Вместо симуляции одного свойства вживую зеркалим CSS-текст
// в один <style> тег в <head> редактора на каждый tick. Тогда ЛЮБОЙ CSS из
// любого T123-блока виден в редакторе сразу, без публикации, а не только z-index.

// z-index собираем не парсингом чужого текста, а прямо из effective-карты
// (карта уже включает оптимистичные правки из поля ввода до сохранения на
// сервер) — иначе typing-preview отставал бы на время сохранения+рендера.
// Это наш собственный сгенерированный CSS, гарантированно валидный —
// достаточно одного общего тега.
function buildZIndexCss(map) {
  let css = '';
  map.forEach((val, recId) => {
    css += '#rec' + recId + '{position:relative;z-index:' + val + ' !important;overflow:visible !important;}\n';
  });
  return css;
}

function getOrCreateStyleEl(id) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('style');
    el.id = id;
    document.head.appendChild(el);
  }
  return el;
}

// Сырой CSS из ЛЮБЫХ других T123-блоков со <style> на странице (не наши
// carrier'ы — z-index для них уже строится из effective-карты выше, а их
// <script>-секция в редакторе не исполняется). ВАЖНО: у каждого исходного
// блока — СВОЙ <style>-тег, а не общий. Это пользовательский текст, не
// гарантированно валидный CSS (например, забытая закрывающая скобка в @media);
// один общий тег означал бы, что ошибка в одном блоке обрывает парсинг стилей
// ВСЕХ блоков после него в общем CSSOM. На опубликованной странице у каждого
// блока свой <style>, поэтому ошибка там локальна — воспроизводим то же здесь.
export function applyLiveCssPreview(zIndexMap) {
  const zEl = getOrCreateStyleEl(LIVE_CSS_ZINDEX_ID);
  const zCss = buildZIndexCss(zIndexMap);
  if (zEl.textContent !== zCss) zEl.textContent = zCss;

  const seen = new Set();
  getT123Recs().forEach((r) => {
    if (isCarrierText(r.textContent)) return;
    const t = r.textContent;
    if (!t.includes('<style')) return;
    // Блок со <style> И <script> вместе (прелоадеры Zero Block, попапы с
    // таймерами и т.п.) — CSS там задаёт лишь НАЧАЛЬНОЕ состояние (например,
    // полноэкранный прелоадер поверх всего), а видимый на публикации результат
    // достигается скриптом (скрыть/переключить класс через N сек). Скрипт в
    // редакторе не исполняется (см. коммент выше про carrier), поэтому голый
    // CSS зависает в начальном состоянии и перекрывает редактор. Такие блоки
    // из live-превью исключаем — показать их осмысленно без JS нельзя.
    if (t.includes('<script')) return;
    let css = '';
    const re = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let m;
    while ((m = re.exec(t))) css += m[1] + '\n';
    if (!css) return;

    const id = LIVE_CSS_BLOCK_PREFIX + r.id;
    seen.add(id);
    const el = getOrCreateStyleEl(id);
    if (el.textContent !== css) el.textContent = css;
  });

  // Убираем теги блоков, которые удалили или из которых убрали <style>.
  document.querySelectorAll('style[id^="' + LIVE_CSS_BLOCK_PREFIX + '"]').forEach((el) => {
    if (!seen.has(el.id)) el.remove();
  });
}

// ---- Синхронизация порядка carrier'а со своим блоком ----

// Считаем рассинхрон подряд идущими тиками, чтобы не чинить порядок
// посреди ещё не завершённого перетаскивания блока пользователем.
const carrierMisplacedTicks = new Map(); // carrierId -> счётчик

export function reorderMisplacedCarriers() {
  // Если у target'а временно оказалось НЕСКОЛЬКО carrier'ов (юзер продублировал
  // блок либо остались старые раздельные th-zi/th-attr блоки до консолидации)
  // — трогаем только первый (канонический). Иначе каждый добивался бы позиции
  // «сразу за target», бесконечно вытесняя друг друга.
  const canonicalByTarget = new Map(); // targetFullId -> carrierRec

  getT123Recs().forEach((carrierRec) => {
    // И z-index (th-zi:), и атрибутные (th-attr:) секции помечены
    // «th-<тип>:recXXXX» — carrier должен «ехать» за своим блоком.
    const m = carrierRec.textContent.match(/th-(?:zi|attr):(rec\d+)/);
    if (!m) return;
    if (!canonicalByTarget.has(m[1])) canonicalByTarget.set(m[1], carrierRec);
  });

  canonicalByTarget.forEach((carrierRec, targetFullId) => {
    const targetWrapper = getRecordWrapper(targetFullId);
    const carrierWrapper = getRecordWrapper(carrierRec.id);
    if (!targetWrapper || !carrierWrapper || targetWrapper.nextElementSibling === carrierWrapper) {
      carrierMisplacedTicks.delete(carrierRec.id);
      return;
    }

    const ticks = (carrierMisplacedTicks.get(carrierRec.id) || 0) + 1;
    carrierMisplacedTicks.set(carrierRec.id, ticks);
    if (ticks < 2) return;

    targetWrapper.parentNode.insertBefore(carrierWrapper, targetWrapper.nextSibling);
    carrierMisplacedTicks.delete(carrierRec.id);
    if (typeof window.tp__saveRecordsSort === 'function') window.tp__saveRecordsSort();
  });
}

function isCarrierRecordWrapper(wrapper) {
  if (!isT123Wrapper(wrapper)) return false;
  const rec = document.getElementById(wrapper.id.replace(/^record/, 'rec'));
  return !!(rec && isCarrierText(rec.textContent));
}

// «Юнит» перестановки для кнопок «вверх»/«вниз» — блок + его carrier (если
// есть), одним целым: юзеру не нужно двигать T123 отдельным шагом, он
// должен «прозрачно» пропускаться при перестановке соседних блоков.
function reorderUnitFor(wrapper) {
  const next = wrapper.nextElementSibling;
  return isCarrierRecordWrapper(next) ? [wrapper, next] : [wrapper];
}

// Переставляет юнит блока на место юнита соседа, целиком перепрыгивая
// через carrier(ы) обеих сторон. Возвращает false, если двигать некуда —
// тогда вызывающий код падает обратно на нативный tp__upRecord/downRecord.
function moveRecordUnit(numericId, direction) {
  const wrapper = getRecordWrapper('rec' + numericId);
  if (!wrapper || isCarrierRecordWrapper(wrapper)) return false;
  const unit = reorderUnitFor(wrapper);

  if (direction === 'down') {
    const tail = unit[unit.length - 1];
    const neighborHead = tail.nextElementSibling;
    if (!neighborHead || !neighborHead.getAttribute('recordid')) return false;
    const neighborUnit = reorderUnitFor(neighborHead);
    let anchor = neighborUnit[neighborUnit.length - 1];
    unit.forEach((el) => {
      anchor.insertAdjacentElement('afterend', el);
      anchor = el;
    });
  } else {
    let neighborHead = unit[0].previousElementSibling;
    if (!neighborHead || !neighborHead.getAttribute('recordid')) return false;
    // Сосед сверху — чужой carrier: его настоящий владелец (юнит соседа)
    // начинается ещё на блок выше.
    if (isCarrierRecordWrapper(neighborHead)) {
      neighborHead = neighborHead.previousElementSibling;
      if (!neighborHead || !neighborHead.getAttribute('recordid')) return false;
    }
    unit.forEach((el) => neighborHead.insertAdjacentElement('beforebegin', el));
  }
  return true;
}

// tp__upRecord/tp__downRecord родные — двигают ровно на одну соседнюю
// запись, поэтому наш carrier то и дело оказывался между блоком и его
// соседом (или сам блок утыкался в чужой carrier). Подменяем реализацию:
// если рядом carrier — двигаем юнитом (см. moveRecordUnit), иначе отдаём
// управление нативной функции без изменений. Патчим лениво на тике, т.к.
// в момент инициализации content-script'а window.tp__upRecord может быть
// ещё не определён (грузится позже основным бандлом редактора).
let reorderPatched = false;
export function ensureReorderPatched() {
  if (reorderPatched) return;
  if (typeof window.tp__upRecord !== 'function' || typeof window.tp__downRecord !== 'function') return;
  const nativeUp = window.tp__upRecord;
  const nativeDown = window.tp__downRecord;

  function afterMove(numericId) {
    if (window.tp_view && typeof window.tp_view.updateStyles === 'function') window.tp_view.updateStyles();
    if (typeof window.tp__scrollToRecord === 'function') window.tp__scrollToRecord(numericId);
    window.clearTimeout(window.autosavesort_timer);
    window.autosavesort_timer = window.setTimeout(window.tp__saveRecordsSort, 4000);
  }

  window.tp__upRecord = function (numericId) {
    if (moveRecordUnit(numericId, 'up')) return afterMove(numericId);
    return nativeUp.apply(this, arguments);
  };
  window.tp__downRecord = function (numericId) {
    if (moveRecordUnit(numericId, 'down')) return afterMove(numericId);
    return nativeDown.apply(this, arguments);
  };
  reorderPatched = true;
}

// ---- Поле в сайдбаре ----

function parseVal(input) {
  const raw = input.value.trim();
  return raw === '' ? null : raw;
}

// На каждый символ — ТОЛЬКО живой превью (правим <style> в head), без записи
// на сервер. Сохранение перерисовывает запись и снимает выделение с блока →
// сайдбар закрывается; поэтому его нельзя дёргать по таймеру, пока пользователь
// ещё в поле (см. commitZIndex).
function onZIndexInput(numericId, input) {
  const wrapper = input.closest('.' + ZINDEX_WRAPPER_CLASS);
  if (wrapper) wrapper.dataset.userOpened = '1';
  setZIndexOverride(numericId, parseVal(input));
  applyLiveCssPreview(getEffectiveZIndexMap());
}

// Коммит на сервер — когда пользователь закончил (фокус ушёл из поля / Enter).
// Zero-блок (T396) не использует T123-carrier: пишем z-index в РОДНЫЕ поля
// артборда (overflow:visible + poszindex), см. zeroindex.js. Оптимистичный
// override НЕ трогаем — он держит live-превью #recXXXX в редакторе, пока Zero
// сохраняется и перерисовывается; при сбросе (val=null) снимаем и его.
function commitZIndex(numericId, input) {
  const val = parseVal(input);
  if (isZeroBlock(numericId)) {
    writeZeroZIndex(numericId, val);
    if (val === null) setZIndexOverride(numericId, null);
    return;
  }
  setZIndexOverride(numericId, val);
  commitBlock(numericId);
}

// Раскрывает панель поля, если z-index уже задан или юзер раскрыл её кнопкой;
// при этом кнопка-переключатель прячется — иначе на экране одновременно
// видны и кнопка «Z-index», и открытая панель «Z-index» над ней (дубль).
function renderZIndexState(recId, toggle, wrapper) {
  if (zIndexUnsupported(recId)) {
    toggle.style.display = 'none';
    wrapper.style.display = 'none';
    return;
  }
  const hasZero = isZeroBlock(recId) && readZeroZIndex(recId) != null;
  const isOpen = getEffectiveZIndexMap().has(recId) || hasZero || wrapper.dataset.userOpened === '1';
  toggle.style.display = isOpen ? 'none' : '';
  wrapper.style.display = isOpen ? '' : 'none';
}

export function updateZIndexSidebarField() {
  const form = document.querySelector('.pe-settings-form[data-rec-id]');
  if (!form) return;
  const recId = form.dataset.recId;
  const body = form.querySelector('.edrec__wrapper.panel-body');
  if (!body) return;
  const properties = body.querySelector('.pe-properties');
  const itemsList = properties && properties.querySelector('.pe-properties__items');
  if (!itemsList) return;

  // Кнопка — первым элементом того же ряда, что «Добавить в библиотеку» /
  // «CSS Class Name» / «Якорная ссылка» (реальные классы Tilda: t-button
  // pe-properties__item, текст — span.t-button__text). Иконка — через
  // ::before того же span (см. CSS), а не отдельный <span>: у
  // .t-button__text уже зарезервирован под неё слот 14×14 сам по себе,
  // добавление ещё одного элемента задвоило бы отступ.
  let toggle = itemsList.querySelector('.' + ZINDEX_TOGGLE_CLASS);
  if (!toggle) {
    toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 't-button pe-properties__item ' + ZINDEX_TOGGLE_CLASS;
    toggle.innerHTML = '<span class="t-button__text">Изменить Z-index</span>';
    itemsList.insertBefore(toggle, itemsList.firstChild);
  } else if (toggle !== itemsList.firstChild) {
    // Панель Tilda пересоздаётся при смене блока — переносим кнопку в начало.
    itemsList.insertBefore(toggle, itemsList.firstChild);
  }

  // Раскрывающаяся панель — вставлена в .pe-properties ПЕРЕД рядом кнопок,
  // как и родная панель CSS Class Name (`.pe-properties__wrapper`).
  let wrapper = properties.querySelector('.' + ZINDEX_WRAPPER_CLASS);
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.className = 'pe-properties__wrapper ' + ZINDEX_WRAPPER_CLASS;
    wrapper.innerHTML =
      '<div class="pe-form-group">' +
        '<label class="pe-label">Z-index</label>' +
        '<div class="pe-input__wrapper">' +
        '<input class="pe-input" type="number" step="1" placeholder="Не задан"></div>' +
      '</div>';
    properties.insertBefore(wrapper, itemsList);

    const input = wrapper.querySelector('input');
    input.addEventListener('input', () => onZIndexInput(wrapper.dataset.recId, input));
    // change у number-инпута срабатывает на blur/Enter — коммитим тогда.
    input.addEventListener('change', () => commitZIndex(wrapper.dataset.recId, input));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') input.blur();
    });

    toggle.addEventListener('click', () => {
      wrapper.dataset.userOpened = '1';
      renderZIndexState(toggle.dataset.recId, toggle, wrapper);
      wrapper.querySelector('input').focus();
    });
  } else if (wrapper.nextSibling !== itemsList) {
    properties.insertBefore(wrapper, itemsList);
  }

  if (wrapper.dataset.recId !== recId) {
    wrapper.dataset.recId = recId;
    toggle.dataset.recId = recId;
    delete wrapper.dataset.userOpened;
    const input = wrapper.querySelector('input');
    const map = getEffectiveZIndexMap();
    if (map.has(recId)) input.value = map.get(recId);
    else if (isZeroBlock(recId)) {
      input.value = readZeroZIndex(recId) || '';
      // Значение могло быть задано в прошлой сессии — оно лежит только в
      // `code` на сервере, дотягиваем асинхронно (см. prefillZeroZIndex).
      prefillZeroZIndex(recId, (v) => {
        if (wrapper.dataset.recId !== recId) return; // юзер уже выбрал другой блок
        if (document.activeElement === input) return; // юзер печатает — не мешаем
        if (input.value !== '') return;
        input.value = v;
        renderZIndexState(recId, toggle, wrapper);
      });
    } else input.value = '';
  }
  renderZIndexState(recId, toggle, wrapper);
}
