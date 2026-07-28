// Liquid Glass PNG export modal.
// Renderer infrastructure (renderIcon, prepareSource, neighbor images) lives in
// icns.js as the single source of truth — this module only owns the modal UI.
import {
  renderIcon, MACOS_PCT, prepareSource, ensureStyles,
  loadNeighbors, getNeighborImgs, onNeighborsLoaded,
} from './icns.js';
import { showToast, formatFileSize } from './utils.js';
import { TOASTS } from './labels.js';
import { t } from './i18n.js';

const PREVIEW_SIZE = 256;
// innerPaddingPct stores the SLIDER POSITION (0–100).
// 0 = big glyph, 50 = original (default), 100 = small glyph.
// Mapped to actual padding via sliderToActual() before passing to renderIcon.
const DEFAULTS = {
  radiusPct: MACOS_PCT,
  paddingPct: 10,
  innerPaddingPct: 50,
  shadow: true,
  glass: true,
  bg: 'auto',
};

// Maps slider position (0–100) → actual innerPaddingPct % for renderIcon.
// At 50 → 0% (original), below 50 → negative (bigger glyph), above → smaller.
function sliderToActual(v) { return (v - 50) * 0.3; }

let dom = null;
let source = null;
const opts = { ...DEFAULTS };
let sizeBusy = false;
let sizeDirty = false;

onNeighborsLoaded(() => renderPreview());

function isPristine() {
  return opts.radiusPct === DEFAULTS.radiusPct
    && opts.innerPaddingPct === DEFAULTS.innerPaddingPct
    && opts.shadow === DEFAULTS.shadow
    && opts.glass === DEFAULTS.glass;
}

function renderPreview() {
  if (!dom) return;
  dom.reset.classList.toggle('show', !isPristine());
  const T = PREVIEW_SIZE;
  const dist = T * 1.05;
  const W = Math.ceil(2 * (dist + T / 2));
  dom.preview.width = W;
  dom.preview.height = T;
  const ctx = dom.preview.getContext('2d');
  ctx.clearRect(0, 0, W, T);
  const cx = W / 2, cy = T / 2;
  const neighbors = getNeighborImgs();
  if (neighbors) {
    neighbors.forEach((im, i) => {
      if (!im.complete || !im.naturalWidth) return;
      const ncx = cx + (i === 0 ? -dist : dist);
      ctx.drawImage(im, ncx - T / 2, cy - T / 2, T, T);
    });
  }
  if (source) ctx.drawImage(renderIcon(source, T, { ...opts, innerPaddingPct: sliderToActual(opts.innerPaddingPct) }), cx - T / 2, cy - T / 2);
  scheduleSize();
}

async function scheduleSize() {
  if (!source) { if (dom) dom.dlSize.textContent = ''; return; }
  if (sizeBusy) { sizeDirty = true; return; }
  sizeBusy = true;
  do {
    sizeDirty = false;
    try {
      const renderOpts = { ...opts, paddingPct: 0, innerPaddingPct: sliderToActual(opts.innerPaddingPct) };
      const canvas = renderIcon(source, 1024, renderOpts);
      const blob = await new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(), 'image/png'));
      if (dom) dom.dlSize.textContent = formatFileSize(blob.size);
    } catch { /* keep previous */ }
  } while (sizeDirty && source);
  sizeBusy = false;
}

function buildDom() {
  const overlay = document.createElement('div');
  overlay.className = 'icns-overlay';
  overlay.innerHTML = `
    <div class="icns-modal" role="dialog" aria-modal="true" aria-labelledby="lg-title">
      <button type="button" class="icns-close" aria-label="${t('suggestCloseAria')}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div class="icns-header">
        <div class="icns-title" id="lg-title">Liquid Glass PNG</div>
        <div class="icns-sub">${t('lgModalSub')}</div>
      </div>
      <div class="icns-preview-box">
        <button type="button" class="icns-reset" aria-label="${t('icnsResetAria')}" title="${t('resetColors')}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
        <canvas class="icns-preview" width="${PREVIEW_SIZE}" height="${PREVIEW_SIZE}"></canvas>
      </div>
      <div class="icns-controls">
        <div class="icns-row">
          <span class="icns-label">${t('lgRadius')} <b class="icns-val" data-for="radius"></b></span>
          <input type="range" class="icns-range" data-k="radiusPct" min="0" max="100" step="1" style="--tickx: calc(8px + ${MACOS_PCT / 100} * (100% - 16px))">
        </div>
        <div class="icns-row icns-inner-pad-row">
          <span class="icns-label">${t('lgInnerPad')} <b class="icns-val" data-for="innerPad"></b></span>
          <input type="range" class="icns-range" data-k="innerPaddingPct" min="0" max="100" step="1" style="--tickx: calc(8px + 0.5 * (100% - 16px))">
        </div>
        <label class="icns-toggle">
          <span>${t('lgShadow')}</span>
          <input type="checkbox" class="icns-shadow">
          <span class="icns-switch" aria-hidden="true"></span>
        </label>
      </div>
      <button type="button" class="btn btn-primary icns-download">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span class="icns-dl-label">${t('lgDownloadPng')}</span>
        <span class="btn-size icns-dl-size"></span>
      </button>
    </div>`;
  document.body.appendChild(overlay);

  dom = {
    overlay,
    preview: overlay.querySelector('.icns-preview'),
    radius: overlay.querySelector('[data-k="radiusPct"]'),
    innerPad: overlay.querySelector('[data-k="innerPaddingPct"]'),
    innerPadRow: overlay.querySelector('.icns-inner-pad-row'),
    innerPadVal: overlay.querySelector('[data-for="innerPad"]'),
    shadow: overlay.querySelector('.icns-shadow'),
    radiusVal: overlay.querySelector('[data-for="radius"]'),
    reset: overlay.querySelector('.icns-reset'),
    download: overlay.querySelector('.icns-download'),
    dlLabel: overlay.querySelector('.icns-dl-label'),
    dlSize: overlay.querySelector('.icns-dl-size'),
  };

  overlay.querySelector('.icns-close').onclick = close;
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });

  dom.radius.oninput = () => {
    cancelAnimationFrame(resetRaf);
    opts.radiusPct = +dom.radius.value;
    dom.radiusVal.textContent = Math.round(opts.radiusPct) + '%';
    renderPreview();
  };
  dom.innerPad.oninput = () => {
    cancelAnimationFrame(resetRaf);
    opts.innerPaddingPct = +dom.innerPad.value;
    dom.innerPadVal.textContent = Math.round(opts.innerPaddingPct) + '%';
    renderPreview();
  };
  dom.shadow.onchange = () => { opts.shadow = dom.shadow.checked; renderPreview(); };
  dom.reset.onclick = animateReset;
  dom.download.onclick = doDownload;

  loadNeighbors();
}

let resetRaf = 0;
function animateReset() {
  cancelAnimationFrame(resetRaf);
  const from = { radiusPct: opts.radiusPct, innerPaddingPct: opts.innerPaddingPct };
  opts.shadow = DEFAULTS.shadow;
  opts.bg = DEFAULTS.bg;
  dom.shadow.checked = DEFAULTS.shadow;
  const start = performance.now();
  const DUR = 280;
  const tick = now => {
    const k = Math.min(1, (now - start) / DUR);
    const e = 1 - Math.pow(1 - k, 3);
    opts.radiusPct = from.radiusPct + (DEFAULTS.radiusPct - from.radiusPct) * e;
    opts.innerPaddingPct = from.innerPaddingPct + (DEFAULTS.innerPaddingPct - from.innerPaddingPct) * e;
    dom.radius.value = Math.round(opts.radiusPct);
    dom.radiusVal.textContent = Math.round(opts.radiusPct) + '%';
    dom.innerPad.value = Math.round(opts.innerPaddingPct);
    dom.innerPadVal.textContent = Math.round(opts.innerPaddingPct) + '%';
    renderPreview();
    if (k < 1) {
      resetRaf = requestAnimationFrame(tick);
    } else {
      Object.assign(opts, DEFAULTS);
      dom.radius.value = DEFAULTS.radiusPct;  dom.radiusVal.textContent = DEFAULTS.radiusPct + '%';
      dom.innerPad.value = DEFAULTS.innerPaddingPct; dom.innerPadVal.textContent = DEFAULTS.innerPaddingPct + '%';
      renderPreview();
    }
  };
  resetRaf = requestAnimationFrame(tick);
}

function close() {
  dom.overlay.classList.remove('open');
}

async function doDownload() {
  if (!source) return;
  dom.download.disabled = true;
  dom.dlLabel.textContent = 'Готовлю…';
  try {
    const canvas = renderIcon(source, 1024, { ...opts, paddingPct: 0, innerPaddingPct: sliderToActual(opts.innerPaddingPct) });
    const blob = await new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('render failed')), 'image/png'));
    const name = (source.file || source.item.file).replace(/^.*\//, '').replace(/\.[^.]+$/, '').toLowerCase();
    const fname = name + '-liquid-glass.png';
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: fname });
    a.click();
    URL.revokeObjectURL(a.href);
    showToast(TOASTS.downloaded(fname));
    close();
  } catch {
    showToast(TOASTS.imageLoadError);
  } finally {
    dom.download.disabled = false;
    dom.dlLabel.textContent = 'Скачать PNG';
  }
}

export async function openLiquidModal(item, file = item.file) {
  ensureStyles();
  if (!dom) buildDom();
  Object.assign(opts, DEFAULTS);
  dom.radius.value = opts.radiusPct;
  dom.radiusVal.textContent = opts.radiusPct + '%';
  dom.innerPad.value = opts.innerPaddingPct;
  dom.innerPadVal.textContent = opts.innerPaddingPct + '%';
  dom.shadow.checked = opts.shadow;
  source = null;
  // Hide the inner-padding control until we know the logo has a separable glyph;
  // for plate-only logos (everything detected as background) it does nothing.
  dom.innerPadRow.hidden = true;
  renderPreview();
  dom.overlay.classList.add('open');

  try {
    source = { ...(await prepareSource(file)), item, file };
    dom.innerPadRow.hidden = !source.hasGlyph;
    renderPreview();
  } catch {
    showToast(TOASTS.imageLoadError);
    close();
  }
}
