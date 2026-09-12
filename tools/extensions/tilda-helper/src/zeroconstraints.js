// Фича «Zero-блок: выравнивание absolute-элементов в автолэйауте».
//
// Задача (как в Figma): для absolute-элемента внутри Auto Layout артборда дать
// кнопки — прижать вплотную к краю/центру артборда (лево/центр/право по X,
// верх/середина/низ по Y). Дальше пользователь двигает элемент как обычно
// (drag / поля X-Y) — это отступ от края.
//
// === Что было выяснено вживую (важно, не сломать) ===
//
// 1. СЕЙВ zero-редактора берёт данные из Redux-стора `window.storeInstance`
//    (НЕ из DOM, и НЕ из `window.store` — это другой, устаревший объект!).
//    Сериализатор `allelems__getJsonData()` читает `storeInstance.getState()`.
//
// 2. `elem__setFieldValue(el, field, val)` САМ пишет в этот стор
//    (dispatch `elements/updateFields`) на ТЕКУЩЕМ брейкпоинте
//    (`storeInstance.getState().breakpoints.current`). Значит изменения
//    персистятся. Никаких ручных dispatch не нужно.
//
// 3. НЕЛЬЗЯ звать `elem__savePosition__current`/`core__savePosition__current`
//    для absolute-в-автолэйауте: они пересчитывают позицию из геометрии DOM и
//    дают мусор (база застревала axisx=center/left=−410 → на паблише элемент
//    улетал к левому краю сетки). Именно это раньше «ломало» элемент.
//
// 4. `axisx=center` для флекс-абсолюта Tilda рисует в КАНВАСЕ неверно (по сырому
//    left, игнорируя ось — элемент виден у левого края, хотя паблиш центрирует).
//    Поэтому ось НЕ трогаем: держим `axisx=left`/`axisy=top` и кладём нужную
//    позицию в сырой left/top. Тогда редактор рисует raw = ровно ту позицию
//    (WYSIWYG «бесплатно»), а паблиш при axisx=left считает так же.
//
// === Как считаем позицию (проверено на bp1200) ===
//  gridWidth = значение текущего брейкпоинта (стандартная сетка container=grid:
//    360/480/640/960/1200 → сетка той же ширины). elemW = elem__getWidth(el).
//    H-left: left=0; H-center: (gridW−elemW)/2; H-right: gridW−elemW.
//  artboardHeight = .tn-artboard[data-artboard-height(-res-<bp>)]. elemH =
//    elem__getHeight(el). V-top: top=0; V-center: (abH−elemH)/2; V-bottom: abH−elemH.
//
// setFieldValue пишет в текущий брейкпоинт — значит выравнивание применяется к
// тому вьюпорту, который открыт (per-breakpoint, как и родное редактирование
// координат в Tilda). Панель .tn-settings пересобирается — инжект идемпотентный
// на тике.

const SETTINGS_SELECTOR = '.tn-settings';
const ALIGN_ROW_CLASS = 'th-align-row';

function isApiReady() {
  return (
    typeof elem__getFieldValue === 'function' &&
    typeof elem__setFieldValue === 'function' &&
    typeof elem__isInAutolayout === 'function' &&
    typeof elem__renderViewOneField === 'function' &&
    typeof elem__getWidth === 'function' &&
    typeof elem__getHeight === 'function' &&
    typeof storeInstance === 'object' &&
    storeInstance
  );
}

function isAbsoluteAutolayout(el) {
  return el && elem__getFieldValue(el, 'absolute') === 'y' && elem__isInAutolayout(el);
}

function currentBreakpoint() {
  try {
    return storeInstance.getState().breakpoints.current;
  } catch (e) {
    return 1200;
  }
}

// Сетка container=grid шириной = значению брейкпоинта (стандарт Tilda).
function gridWidth() {
  return currentBreakpoint();
}

function artboardHeight(el) {
  const ab = el.closest('.tn-artboard');
  if (!ab) return 0;
  const bp = currentBreakpoint();
  return (
    parseFloat(ab.getAttribute('data-artboard-height-res-' + bp)) ||
    parseFloat(ab.getAttribute('data-artboard-height')) ||
    0
  );
}

// Прижать по горизонтали: ось всегда left, кладём сырой left.
function alignH(el, where) {
  const gw = gridWidth();
  const ew = elem__getWidth(el);
  const left = where === 'left' ? 0 : where === 'center' ? Math.round((gw - ew) / 2) : gw - ew;
  elem__setFieldValue(el, 'axisx', 'left');
  elem__setFieldValue(el, 'left', String(left));
  if (typeof elem__drawAxis === 'function') elem__drawAxis(el);
  elem__renderViewOneField(el, 'left');
}

// Прижать по вертикали: ось всегда top, кладём сырой top.
function alignV(el, where) {
  const ah = artboardHeight(el);
  const eh = elem__getHeight(el);
  const top = where === 'top' ? 0 : where === 'center' ? Math.round((ah - eh) / 2) : ah - eh;
  elem__setFieldValue(el, 'axisy', 'top');
  elem__setFieldValue(el, 'top', String(top));
  if (typeof elem__drawAxis === 'function') elem__drawAxis(el);
  elem__renderViewOneField(el, 'top');
}

// SVG-иконки (вертикальные полосы = ось X, горизонтальные = ось Y).
const ICONS = {
  'H:left': '<svg width="18" height="18" viewBox="0 0 18 18"><rect x="2" y="2" width="1.6" height="14" fill="currentColor"/><rect x="5" y="5" width="8" height="3" rx="1" fill="currentColor"/><rect x="5" y="10" width="5" height="3" rx="1" fill="currentColor"/></svg>',
  'H:center': '<svg width="18" height="18" viewBox="0 0 18 18"><rect x="8.2" y="2" width="1.6" height="14" fill="currentColor"/><rect x="4" y="5" width="10" height="3" rx="1" fill="currentColor"/><rect x="5.5" y="10" width="7" height="3" rx="1" fill="currentColor"/></svg>',
  'H:right': '<svg width="18" height="18" viewBox="0 0 18 18"><rect x="14.4" y="2" width="1.6" height="14" fill="currentColor"/><rect x="5" y="5" width="8" height="3" rx="1" fill="currentColor"/><rect x="8" y="10" width="5" height="3" rx="1" fill="currentColor"/></svg>',
  'V:top': '<svg width="18" height="18" viewBox="0 0 18 18"><rect x="2" y="2" width="14" height="1.6" fill="currentColor"/><rect x="5" y="5" width="3" height="8" rx="1" fill="currentColor"/><rect x="10" y="5" width="3" height="5" rx="1" fill="currentColor"/></svg>',
  'V:center': '<svg width="18" height="18" viewBox="0 0 18 18"><rect x="2" y="8.2" width="14" height="1.6" fill="currentColor"/><rect x="5" y="4" width="3" height="10" rx="1" fill="currentColor"/><rect x="10" y="5.5" width="3" height="7" rx="1" fill="currentColor"/></svg>',
  'V:bottom': '<svg width="18" height="18" viewBox="0 0 18 18"><rect x="2" y="14.4" width="14" height="1.6" fill="currentColor"/><rect x="5" y="5" width="3" height="8" rx="1" fill="currentColor"/><rect x="10" y="8" width="3" height="5" rx="1" fill="currentColor"/></svg>',
};

const GROUPS = [
  { kind: 'H', fn: alignH, values: ['left', 'center', 'right'] },
  { kind: 'V', fn: alignV, values: ['top', 'center', 'bottom'] },
];

// Какая кнопка сейчас «активна» — если текущая позиция ровно совпадает с
// краем/центром (±1px). После ручного сдвига подсветка снимается (как в Figma).
function activeValue(el, kind) {
  if (kind === 'H') {
    if (elem__getFieldValue(el, 'axisx') !== 'left') return null;
    const gw = gridWidth();
    const ew = elem__getWidth(el);
    const left = parseFloat(elem__getFieldValue(el, 'left')) || 0;
    if (Math.abs(left - 0) <= 1) return 'left';
    if (Math.abs(left - (gw - ew) / 2) <= 1) return 'center';
    if (Math.abs(left - (gw - ew)) <= 1) return 'right';
    return null;
  }
  if (elem__getFieldValue(el, 'axisy') !== 'top') return null;
  const ah = artboardHeight(el);
  const eh = elem__getHeight(el);
  const top = parseFloat(elem__getFieldValue(el, 'top')) || 0;
  if (Math.abs(top - 0) <= 1) return 'top';
  if (Math.abs(top - (ah - eh) / 2) <= 1) return 'center';
  if (Math.abs(top - (ah - eh)) <= 1) return 'bottom';
  return null;
}

function buildAlignRow(el) {
  const row = document.createElement('div');
  row.className = ALIGN_ROW_CLASS;

  const label = document.createElement('div');
  label.className = 'th-align-label';
  label.textContent = 'Выравнивание';
  row.appendChild(label);

  const wrap = document.createElement('div');
  wrap.className = 'th-align-groups';

  GROUPS.forEach((grp) => {
    const g = document.createElement('div');
    g.className = 'th-align-group';
    const active = activeValue(el, grp.kind);
    grp.values.forEach((val) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'th-align-btn';
      btn.innerHTML = ICONS[grp.kind + ':' + val];
      btn.title = val;
      if (val === active) btn.classList.add('th-align-btn_active');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          grp.fn(el, val);
        } catch (err) {
          console.warn('[Tilda Helper] выравнивание не сработало:', err);
        }
        // Сразу подсветить нажатую (панель может и не перестроиться).
        g.querySelectorAll('.th-align-btn').forEach((b) => b.classList.remove('th-align-btn_active'));
        btn.classList.add('th-align-btn_active');
      });
      g.appendChild(btn);
    });
    wrap.appendChild(g);
  });

  row.appendChild(wrap);
  return row;
}

function injectAlignmentControls() {
  if (!isApiReady()) return;
  const panel = document.querySelector(SETTINGS_SELECTOR);
  if (!panel) return;

  const elemId = panel.getAttribute('data-for-elem-id');
  if (!elemId) return;
  const el = document.querySelector('[data-elem-id="' + elemId + '"]');

  if (!isAbsoluteAutolayout(el)) {
    const stale = panel.querySelector('.' + ALIGN_ROW_CLASS);
    if (stale) stale.remove();
    return;
  }

  const existing = panel.querySelector('.' + ALIGN_ROW_CLASS);
  if (existing && existing.dataset.forElem === elemId) {
    refreshActive(existing, el); // элемент мог сдвинуться — обновить подсветку
    return;
  }
  if (existing) existing.remove();

  const row = buildAlignRow(el);
  row.dataset.forElem = elemId;
  // Вставляем ВНУТРЬ белой секции позиции (там X/Y/W/H), сверху — чтобы
  // выравнивание было в одной карточке с координатами, а не висело на сером
  // фоне панели. Фолбэк — в начало панели.
  const posSection = panel.querySelector('.sui-panel__section-pos');
  if (posSection) posSection.insertBefore(row, posSection.firstChild);
  else panel.insertBefore(row, panel.firstChild);
}

// Обновить подсветку активной кнопки без пересборки строки.
function refreshActive(row, el) {
  const groups = row.querySelectorAll('.th-align-group');
  GROUPS.forEach((grp, i) => {
    const g = groups[i];
    if (!g) return;
    const active = activeValue(el, grp.kind);
    const btns = g.querySelectorAll('.th-align-btn');
    grp.values.forEach((val, j) => {
      if (btns[j]) btns[j].classList.toggle('th-align-btn_active', val === active);
    });
  });
}

let stylesInjected = false;
function ensureAlignStyles() {
  if (stylesInjected) return;
  if (typeof document === 'undefined' || !document.head) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.setAttribute('data-th-align', '1');
  style.textContent = `
.${ALIGN_ROW_CLASS}{padding:2px 0 14px;margin-bottom:14px;border-bottom:1px solid rgba(0,0,0,.08);}
.${ALIGN_ROW_CLASS} .th-align-label{font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:#8b8b8b;margin-bottom:8px;}
.${ALIGN_ROW_CLASS} .th-align-groups{display:flex;gap:10px;}
.${ALIGN_ROW_CLASS} .th-align-group{display:flex;background:#f0f0f0;border-radius:7px;padding:2px;gap:2px;}
.${ALIGN_ROW_CLASS} .th-align-btn{display:flex;align-items:center;justify-content:center;width:30px;height:26px;border:none;background:transparent;border-radius:5px;cursor:pointer;color:#6b6b6b;padding:0;}
.${ALIGN_ROW_CLASS} .th-align-btn:hover{background:rgba(0,0,0,.06);color:#2b2b2b;}
.${ALIGN_ROW_CLASS} .th-align-btn_active{background:#fff;color:#1a1a1a;box-shadow:0 1px 2px rgba(0,0,0,.14);}
`;
  document.head.appendChild(style);
}

export function runZeroConstraints() {
  ensureAlignStyles();
  injectAlignmentControls();
}
