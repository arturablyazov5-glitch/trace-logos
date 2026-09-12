// Фича «бинарные select'ы Zero-панели → тумблеры».
//
// Родная панель настроек (sui-panel, не React — обычные DOM-слушатели)
// рисует часть полей как <select> с ровно двумя опциями — по сути,
// бинарный переключатель. Заменяем визуально на тумблер, тот же приём,
// что и с языком Zero-блока (zeroblock.js): реальный select не трогаем
// логически, просто прячем и синхронизируем через него — value +
// 'input'/'change', как ручной выбор в UI. Панель пересобирается при смене
// выделения — тумблер держим идемпотентным периодическим проходом (tick),
// как и остальные фичи.
//
// FIELDS — список полей-кандидатов: Scale Grid Container (upscale:
// grid/window), Flex (flex: ""/auto), Zoomable (zoomable: ""/y),
// Pointer events (pevent: ""/none), Visibility (hidden: n/y).

const TOGGLE_CLASS = 'th-upscale-toggle';

const FIELDS = [
  { field: 'upscale', on: 'window', off: 'grid', title: 'Scale Grid Container' },
  { field: 'flex', on: 'auto', off: '', title: 'Flex' },
  { field: 'zoomable', on: 'y', off: '', title: 'Zoomable' },
  { field: 'pevent', on: '', off: 'none', title: 'Pointer events' },
  { field: 'hidden', on: 'n', off: 'y', title: 'Visibility' },
];

function syncToggle(toggle, select, onValue) {
  const on = select.value === onValue;
  toggle.classList.toggle(TOGGLE_CLASS + '_on', on);
  toggle.setAttribute('aria-checked', on ? 'true' : 'false');
}

function buildToggle(select, cfg) {
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = TOGGLE_CLASS;
  toggle.setAttribute('role', 'switch');
  toggle.title = cfg.title;

  const thumb = document.createElement('span');
  thumb.className = TOGGLE_CLASS + '__thumb';
  toggle.appendChild(thumb);

  toggle.addEventListener('mousedown', (e) => e.stopPropagation());
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    select.value = select.value === cfg.on ? cfg.off : cfg.on;
    // 'input' на случай слушателей на этом событии, 'change' — основной
    // сигнал для sui-панели (native assignment + dispatchEvent достаточен,
    // без трюка с прототипным сеттером — см. enforceDefaultLanguage).
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    syncToggle(toggle, select, cfg.on);
  });

  return toggle;
}

function layoutInOneLine(group) {
  const table = group.querySelector('table');
  if (table) table.classList.add(TOGGLE_CLASS + '-row');
  // Инлайновая ширина у label (под перенос в две строки в исходной вёрстке)
  // мешает разместить лейбл и тумблер в одну строку — снимаем.
  const label = group.querySelector('label.sui-label');
  if (label) label.style.width = 'auto';
}

function updateFieldToggle(cfg) {
  document.querySelectorAll('.tn-settings [data-control-field="' + cfg.field + '"]').forEach((group) => {
    const select = group.querySelector('select[name="' + cfg.field + '"]');
    if (!select) return;
    // ВАЖНО: у самого <select> тоже есть класс "sui-select" (наравне с
    // "sui-input"), поэтому select.closest('.sui-select') находит сам select,
    // а не div-обёртку — прячем именно родителя, иначе остаётся видна
    // стрелочка div.sui-select::after (родная CSS-иконка дропдауна).
    const wrap = select.parentElement;
    if (!wrap || !wrap.classList.contains('sui-select')) return;

    layoutInOneLine(group);

    let toggle = group.querySelector('.' + TOGGLE_CLASS);
    if (!toggle) {
      wrap.style.display = 'none';
      toggle = buildToggle(select, cfg);
      wrap.insertAdjacentElement('afterend', toggle);
    }
    syncToggle(toggle, select, cfg.on);
  });
}

let stylesInjected = false;
function ensureUpscaleToggleStyles() {
  if (stylesInjected) return;
  if (typeof document === 'undefined' || !document.head) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.setAttribute('data-th-upscale-toggle', '1');
  style.textContent = `
.${TOGGLE_CLASS}-row{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;}
.${TOGGLE_CLASS}-row tbody,.${TOGGLE_CLASS}-row tr{display:contents;}
.${TOGGLE_CLASS}-row td{width:auto!important;padding:0;min-width:0;}
.${TOGGLE_CLASS}-row td:last-child{display:flex;justify-content:flex-end;}
.${TOGGLE_CLASS}{position:relative;display:inline-block;width:36px;height:20px;padding:0;border:none;border-radius:10px;background:#d5d5d5;cursor:pointer;flex-shrink:0;transition:background-color .15s ease;}
.${TOGGLE_CLASS}__thumb{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s ease;}
.${TOGGLE_CLASS}_on{background:#2d6cdf;}
.${TOGGLE_CLASS}_on .${TOGGLE_CLASS}__thumb{transform:translateX(16px);}
`;
  document.head.appendChild(style);
}

export function runUpscaleToggle() {
  ensureUpscaleToggleStyles();
  FIELDS.forEach(updateFieldToggle);
}
