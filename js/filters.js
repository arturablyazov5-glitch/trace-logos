// Format filter (SVG / PNG) for the logos catalog.
// Single source of truth for the active file format. Renders a segmented
// control into one or more host slots (topbar + mobile drawer), keeps every
// rendered control in sync, and notifies main.js on change. main.js owns the
// re-render — this module only holds state and the `matchesFormat` predicate.

export const formatState = { format: 'all' };

// Lucide-style 14px stroke icons, consistent with .nav-icon elsewhere in the sidebar.
const ICON_ALL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>';
const ICON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z"/><rect x="3" y="14" width="7" height="7" rx="1"/><circle cx="17.5" cy="17.5" r="3.5"/></svg>';
const ICON_PNG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg>';

const OPTIONS = [
  { value: 'all', label: 'Все', icon: ICON_ALL },
  { value: 'svg', label: 'SVG', icon: ICON_SVG },
  { value: 'png', label: 'PNG', icon: ICON_PNG },
];

let _onChange = null;
const _controls = [];

export function initFilters({ slots, onChange, labels }) {
  const hosts = (slots || []).filter(Boolean);
  if (!hosts.length) return;
  _onChange = onChange;
  if (labels?.all) OPTIONS[0].label = labels.all;
  hosts.forEach(renderControl);
}

function renderControl(slot) {
  const ctrl = document.createElement('div');
  ctrl.className = 'format-filter';
  ctrl.setAttribute('role', 'group');
  ctrl.setAttribute('aria-label', 'Формат файла');

  const thumb = document.createElement('span');
  thumb.className = 'format-filter__thumb';
  ctrl.appendChild(thumb);

  OPTIONS.forEach(opt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'format-filter__opt';
    btn.dataset.format = opt.value;
    btn.innerHTML = `<span class="format-filter__icon">${opt.icon}</span><span>${opt.label}</span>`;
    btn.addEventListener('click', () => setFormat(opt.value));
    ctrl.appendChild(btn);
  });

  slot.appendChild(ctrl);
  _controls.push(ctrl);
  syncControl(ctrl);
}

export function setFormat(value) {
  if (value === formatState.format) return;
  formatState.format = value;
  _controls.forEach(syncControl);
  _onChange?.();
}

function syncControl(ctrl) {
  const idx = OPTIONS.findIndex(o => o.value === formatState.format);
  ctrl.querySelectorAll('.format-filter__opt').forEach(btn => {
    const on = btn.dataset.format === formatState.format;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', String(on));
  });
  const thumb = ctrl.querySelector('.format-filter__thumb');
  if (thumb) thumb.style.transform = `translateX(${idx * 100}%)`;
}

// A card matches when no format is selected, or its source file matches.
// SVG = vector logos; PNG = raster-only logos (source-of-truth = item.file ext).
export function matchesFormat(item) {
  if (formatState.format === 'all') return true;
  const isPng = item.file.endsWith('.png');
  return formatState.format === 'png' ? isPng : !isPng;
}
