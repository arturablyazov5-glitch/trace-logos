// "Download other formats" modal — replaces the old dropdown menu with a modal so every
// format (square app-icon formats + WebP/PDF/AI/EPS + ZIP) can be picked without reopening.
// Lazy-built on first open, same pattern as icns.js/liquid-glass-modal.js: ensureStyles()
// injects CSS on first use, buildDom() runs once and is reused for every subsequent open.
// Shared by the catalog SPA (main.js) and static SEO pages (seo-page.js).
//
// Nothing here computes a byte size until the user actually hovers/focuses a row — opening
// the modal only draws the live preview canvas (cheap, and needed immediately). Each row's
// size is fetched lazily on first hover and cached (sizeCache) so re-hovering, or reopening
// the modal for the same file/size/radius, is instant instead of rebuilding the blob again.
import { downloadAsIco, downloadAllAsZip, estimateIcoSize, estimateZipSize } from './export.js';
import { downloadFormat, estimateFormatSize, renderToCanvas, resolveAspectRatio, sourceForFile, supportsWebp } from './format-export.js';
import { formatFileSize } from './utils.js';
import { t } from './i18n.js';
// Side-effect import: registers <support-btn> so the modal can reuse the exact
// same button (components/support-btn.js) instead of building its own.
import '../components/support-btn.js';

const SIZE_OPTIONS = [256, 512, 1000, 2000];
const DEFAULT_SIZE = 1000;

let dom = null;
let state = null; // { item, file, isSquare, darkBg, size, radiusPct, aspectRatio }
let previewReqId = 0;

// Keyed by `${format}|${file}|${size}|${radiusPct}` (or `ico|${file}` / `zip|${item.figma}`,
// neither of which depend on size/radius) → bytes. Persists for the whole page lifetime, so
// reopening the modal for a logo already inspected this session shows sizes instantly.
const sizeCache = new Map();

// icns.js is only needed (947 lines, canvas renderer) if the user actually clicks the ICNS
// row, so it's never statically imported here — this just shares its overlay/modal/close CSS,
// duplicated as a plain <link> injection instead of importing the module for it.
export function ensureStyles() {
  if (!document.querySelector('link[data-icns-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('../css/icns.css', import.meta.url).href;
    link.dataset.icnsCss = '1';
    document.head.appendChild(link);
  }
  if (!document.querySelector('link[data-dl-modal-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('../css/download-modal.css', import.meta.url).href;
    link.dataset.dlModalCss = '1';
    document.head.appendChild(link);
  }
  if (!document.querySelector('link[data-support-btn-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('../css/support-btn.css', import.meta.url).href;
    link.dataset.supportBtnCss = '1';
    document.head.appendChild(link);
  }
  // Size tabs reuse the sidebar's segmented-control look (.format-filter, SVG/PNG
  // switcher) — pull in its CSS instead of re-styling a near-identical control.
  if (!document.querySelector('link[data-filters-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('../css/filters.css', import.meta.url).href;
    link.dataset.filtersCss = '1';
    document.head.appendChild(link);
  }
}

const ICON_ICO = `<svg width="15" height="15" viewBox="0 0 32 32" fill="currentColor"><path d="M15.49 6H6V15.492H15.492L15.49 6ZM26 6H16.508V15.492H26V6ZM15.49 16.508H6V26H15.492L15.49 16.508ZM26 16.508H16.508V26H26V16.508Z"/></svg>`;
const ICON_ICNS = `<svg width="15" height="15" viewBox="0 0 32 32" fill="currentColor"><path d="M23.8457 11.5898C22.4743 12.4367 21.6274 13.8892 21.6274 15.503C21.6274 17.3178 22.7166 18.9715 24.3703 19.6572C24.0484 20.6909 23.5722 21.67 22.9577 22.5612C22.0709 23.8115 21.1429 25.103 19.7714 25.103C18.4 25.103 17.9966 24.2961 16.3829 24.2961C14.8103 24.2961 14.2457 25.143 12.9543 25.143C11.6629 25.143 10.776 23.9738 9.768 22.5212C8.43657 20.5041 7.67086 18.1647 7.63086 15.7041C7.63086 11.711 10.2114 9.57268 12.7931 9.57268C14.1646 9.57268 15.2937 10.4607 16.1417 10.4607C16.9474 10.4607 18.2389 9.53268 19.7714 9.53268C20.5678 9.51148 21.3569 9.68835 22.068 10.0474C22.7791 10.4064 23.39 10.9364 23.8457 11.5898ZM19.0457 7.83896C19.7314 7.03211 20.0937 6.0241 20.1349 4.97496C20.1349 4.85382 20.1349 4.69268 20.0937 4.57153C18.9223 4.69283 17.8409 5.25501 17.0686 6.1441C16.3829 6.91096 15.9794 7.87896 15.9394 8.9281C15.9394 9.04925 15.9394 9.17039 15.9794 9.29039C16.0606 9.29039 16.1817 9.33153 16.2629 9.33153C17.3509 9.25153 18.36 8.68582 19.0457 7.83896Z"/></svg>`;
const ICON_LG = `<svg width="15" height="15" viewBox="0 0 32 32" fill="currentColor"><path d="M22 4H10C6.686 4 4 6.686 4 10v12c0 3.314 2.686 6 6 6h12c3.314 0 6-2.686 6-6V10c0-3.314-2.686-6-6-6Zm-4.5 7a.5.5 0 0 1 0-1C19.985 10 22 12.015 22 14.5a.5.5 0 0 1-1 0C21 12.567 19.433 11 17.5 11Z"/></svg>`;
const ICON_FILE = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>`;
const ICON_ZIP = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><rect x="1" y="3" width="22" height="5" rx="1"/><path d="M10 12h4"/></svg>`;

function row({ id, icon, labelKey, extra = '', className = '' }) {
  return `<button type="button" class="dl-modal-item ${className}"${id ? ` id="${id}"` : ''} data-row>${icon}<span class="dl-modal-label" data-label="${labelKey}">${t(labelKey)}</span>${extra}</button>`;
}

function sizeTab(s) {
  return `<button type="button" class="dl-size-tab format-filter__opt${s === DEFAULT_SIZE ? ' active' : ''}" data-size="${s}">${s}×${s}</button>`;
}

function buildDom() {
  const overlay = document.createElement('div');
  overlay.className = 'icns-overlay';
  overlay.innerHTML = `
    <div class="icns-modal dl-modal dl-modal--wide" role="dialog" aria-modal="true" aria-labelledby="dl-modal-title">
      <button type="button" class="icns-close" aria-label="${t('detailCloseAriaLabel')}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div class="icns-header">
        <div class="icns-title" id="dl-modal-title" data-label="dlMore">${t('dlMore')}</div>
      </div>
      <div class="dl-modal-body">
        <div class="dl-modal-preview-col">
          <div class="icns-preview-box" id="dl-preview-box">
            <canvas class="dl-modal-canvas" id="dl-preview-canvas"></canvas>
          </div>
          <div class="icns-controls" id="dl-radius-row">
            <div class="icns-row">
              <div class="icns-label"><span data-label="dlRadius">${t('dlRadius')}</span><span class="icns-val" id="dl-radius-val">0%</span></div>
              <input type="range" class="icns-range" id="dl-radius-range" min="0" max="50" step="1" value="0">
            </div>
          </div>
        </div>
        <div class="dl-modal-grid">
          ${row({ id: 'dl-row-ico', icon: ICON_ICO, labelKey: 'dlIco', extra: '<span class="dl-modal-size"></span>', className: 'dl-modal-item--square' })}
          ${row({ id: 'dl-row-icns', icon: ICON_ICNS, labelKey: 'dlIcns', className: 'dl-modal-item--square' })}
          ${row({ id: 'dl-row-lg', icon: ICON_LG, labelKey: 'dlLiquidGlass', extra: '<span class="dl-modal-badge">Beta</span>', className: 'dl-modal-item--square' })}
          ${row({ id: 'dl-row-webp', icon: ICON_FILE, labelKey: 'dlWebp', extra: '<span class="dl-modal-size"></span>' })}
          ${row({ id: 'dl-row-pdf', icon: ICON_FILE, labelKey: 'dlPdf', extra: '<span class="dl-modal-size"></span>' })}
          ${row({ id: 'dl-row-ai', icon: ICON_FILE, labelKey: 'dlAi', extra: '<span class="dl-modal-size"></span>' })}
          ${row({ id: 'dl-row-eps', icon: ICON_FILE, labelKey: 'dlEps', extra: '<span class="dl-modal-size"></span>' })}
        </div>
      </div>
      <div class="icns-row dl-size-row">
        <div class="icns-label"><span data-label="dlSize">${t('dlSize')}</span></div>
        <div class="dl-size-tabs format-filter" id="dl-size-tabs" role="group" aria-label="${t('dlSize')}">
          <span class="format-filter__thumb"></span>
          ${SIZE_OPTIONS.map(sizeTab).join('')}
          <button type="button" class="dl-size-tab format-filter__opt" data-size="custom" data-label="dlCustomSize">${t('dlCustomSize')}</button>
        </div>
        <input type="number" class="dl-size-custom-input hidden" id="dl-size-custom-input" min="16" max="4096" step="1" placeholder="${DEFAULT_SIZE}">
      </div>
      <button type="button" class="dl-modal-item dl-modal-item--zip" id="btn-download-zip">
        ${ICON_ZIP}<span class="btn-label" data-label="dlZipAll">${t('dlZipAll')}</span><span class="btn-size"></span>
        <span class="btn-progress"></span>
      </button>
      <support-btn></support-btn>
    </div>`;
  document.body.appendChild(overlay);

  dom = {
    overlay,
    previewBox: overlay.querySelector('#dl-preview-box'),
    squareRows: overlay.querySelectorAll('.dl-modal-item--square'),
    radiusRow: overlay.querySelector('#dl-radius-row'),
    radiusRange: overlay.querySelector('#dl-radius-range'),
    radiusVal: overlay.querySelector('#dl-radius-val'),
    sizeTabsEl: overlay.querySelector('#dl-size-tabs'),
    sizeTabs: overlay.querySelectorAll('.dl-size-tab'),
    sizeThumb: overlay.querySelector('#dl-size-tabs .format-filter__thumb'),
    sizeCustomInput: overlay.querySelector('#dl-size-custom-input'),
    previewCanvas: overlay.querySelector('#dl-preview-canvas'),
    ico: overlay.querySelector('#dl-row-ico'),
    icoSize: overlay.querySelector('#dl-row-ico .dl-modal-size'),
    icns: overlay.querySelector('#dl-row-icns'),
    lg: overlay.querySelector('#dl-row-lg'),
    webp: overlay.querySelector('#dl-row-webp'),
    webpSize: overlay.querySelector('#dl-row-webp .dl-modal-size'),
    pdf: overlay.querySelector('#dl-row-pdf'),
    pdfSize: overlay.querySelector('#dl-row-pdf .dl-modal-size'),
    ai: overlay.querySelector('#dl-row-ai'),
    aiSize: overlay.querySelector('#dl-row-ai .dl-modal-size'),
    eps: overlay.querySelector('#dl-row-eps'),
    epsSize: overlay.querySelector('#dl-row-eps .dl-modal-size'),
    zip: overlay.querySelector('#btn-download-zip'),
    zipSize: overlay.querySelector('#btn-download-zip .btn-size'),
  };

  overlay.querySelector('.icns-close').onclick = close;
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });

  dom.ico.onclick = () => runRow(dom.ico, () => downloadAsIco(state.item, state.file));
  dom.icns.onclick = async () => {
    close();
    const { openIcnsModal } = await import('./icns.js');
    openIcnsModal(state.item, state.file);
  };
  dom.lg.onclick = async () => {
    close();
    const { openLiquidModal } = await import('./liquid-glass-modal.js');
    openLiquidModal(state.item, state.file);
  };
  dom.webp.onclick = () => runRow(dom.webp, () => downloadFormat(state.item, state.file, state.isSquare, 'webp', state.size, state.radiusPct));
  dom.pdf.onclick = () => runRow(dom.pdf, () => downloadFormat(state.item, state.file, state.isSquare, 'pdf', state.size, state.radiusPct));
  dom.ai.onclick = () => runRow(dom.ai, () => downloadFormat(state.item, state.file, state.isSquare, 'ai', state.size, state.radiusPct));
  dom.eps.onclick = () => runRow(dom.eps, () => downloadFormat(state.item, state.file, state.isSquare, 'eps', state.size, state.radiusPct));
  dom.zip.onclick = () => downloadAllAsZip(state.item);

  // Lazy size loaders — nothing here runs until the row is actually hovered/focused.
  dom.lazy = {
    ico:  attachLazySize(dom.ico,  dom.icoSize,  () => state && `ico|${state.file}`, () => estimateIcoSize(state.file)),
    webp: attachLazySize(dom.webp, dom.webpSize, () => state && `webp|${state.file}|${state.size}|${state.radiusPct}`, () => estimateFormatSize(state.file, state.isSquare, 'webp', state.size, state.radiusPct)),
    pdf:  attachLazySize(dom.pdf,  dom.pdfSize,  () => state && `pdf|${state.file}|${state.size}|${state.radiusPct}`,  () => estimateFormatSize(state.file, state.isSquare, 'pdf',  state.size, state.radiusPct)),
    ai:   attachLazySize(dom.ai,   dom.aiSize,   () => state && `ai|${state.file}|${state.size}|${state.radiusPct}`,   () => estimateFormatSize(state.file, state.isSquare, 'ai',   state.size, state.radiusPct)),
    eps:  attachLazySize(dom.eps,  dom.epsSize,  () => state && `eps|${state.file}|${state.size}|${state.radiusPct}`,  () => estimateFormatSize(state.file, state.isSquare, 'eps',  state.size, state.radiusPct)),
    zip:  attachLazySize(dom.zip,  dom.zipSize,  () => state && `zip|${state.item.figma}`, () => estimateZipSize(state.item), '~'),
  };

  dom.radiusRange.oninput = () => {
    state.radiusPct = Number(dom.radiusRange.value);
    dom.radiusVal.textContent = state.radiusPct + '%';
    scheduleRefresh();
  };
  dom.sizeTabsEl.onclick = e => {
    const btn = e.target.closest('.dl-size-tab');
    if (!btn) return;
    setActiveSizeTab(btn);
    if (btn.dataset.size === 'custom') {
      dom.sizeCustomInput.classList.remove('hidden');
      dom.sizeCustomInput.focus();
      if (dom.sizeCustomInput.value) {
        state.size = Number(dom.sizeCustomInput.value) || state.size;
        scheduleRefresh();
      }
      return;
    }
    dom.sizeCustomInput.classList.add('hidden');
    state.size = Number(btn.dataset.size);
    scheduleRefresh();
  };
  dom.sizeCustomInput.oninput = () => {
    const v = Math.round(Number(dom.sizeCustomInput.value));
    if (!v || v < 16) return;
    state.size = Math.min(4096, v);
    scheduleRefresh();
  };
}

// Toggles .active and slides the shared .format-filter__thumb behind the clicked
// tab — same mechanic as filters.js's syncControl, just keyed by DOM index instead
// of an options array (labels here are computed, not a static list).
function setActiveSizeTab(btn) {
  const tabs = [...dom.sizeTabs];
  const idx = tabs.indexOf(btn);
  tabs.forEach(b => b.classList.toggle('active', b === btn));
  if (dom.sizeThumb && idx >= 0) dom.sizeThumb.style.transform = `translateX(${idx * 100}%)`;
}

// Rewrites every non-custom size tab's label with the logo's real aspect ratio
// once known (square logos just show 256×256 etc; wide/full logos show the
// actual rendered height, e.g. 256×64, instead of a misleading square guess).
function updateSizeTabLabels() {
  const ratio = state.isSquare ? 1 : (state.aspectRatio || 1);
  dom.sizeTabs.forEach(b => {
    if (b.dataset.size === 'custom') return;
    const s = Number(b.dataset.size);
    const h = state.isSquare ? s : Math.max(1, Math.round(s / ratio));
    b.textContent = `${s}×${h}`;
  });
}

// Fetches `format`'s byte size the first time this row is hovered/focused for its
// current key (file+size+radius, or just file/item for ico/zip), then caches it.
// Re-hovering the same key (no size/radius change since) is a no-op; hovering
// again after the key changed (size/radius picker moved) recomputes once.
function attachLazySize(el, sizeEl, keyFn, computeFn, prefix = '') {
  let lastKey = null;
  const show = bytes => { sizeEl.textContent = bytes ? prefix + formatFileSize(bytes) : ''; };
  const trigger = async () => {
    const key = keyFn();
    if (key == null || key === lastKey) return;
    lastKey = key;
    if (sizeCache.has(key)) { show(sizeCache.get(key)); return; }
    const bytes = await computeFn();
    sizeCache.set(key, bytes);
    if (key !== lastKey) return; // superseded by a newer hover / size-radius change
    show(bytes);
  };
  el.addEventListener('pointerenter', trigger);
  el.addEventListener('focus', trigger);
  return {
    reset() { lastKey = null; sizeEl.textContent = ''; },
  };
}

async function runRow(btn, task) {
  if (btn.disabled) return;
  btn.disabled = true;
  try { await task(); } finally { btn.disabled = false; }
}

function close() {
  dom.overlay.classList.remove('open');
}

// Redraws the live preview canvas with the current size/radius, guarded by its own reqId.
// Also keeps the canvas's own aspect-ratio in sync with what actually got rendered, instead
// of a fixed CSS aspect-ratio — a wide/full logo's real proportions vary logo to logo.
async function refreshPreview() {
  const reqId = ++previewReqId;
  const { file, isSquare, size, radiusPct } = state;
  try {
    const source = await sourceForFile(file);
    if (!source || reqId !== previewReqId) return;
    const canvas = await renderToCanvas(source, isSquare, size, isSquare ? radiusPct : 0);
    if (reqId !== previewReqId) return;
    dom.previewCanvas.width = canvas.width;
    dom.previewCanvas.height = canvas.height;
    dom.previewCanvas.style.aspectRatio = `${canvas.width} / ${canvas.height}`;
    dom.previewCanvas.getContext('2d').drawImage(canvas, 0, 0);
  } catch { /* leave last good preview on screen */ }
}

// Radius/size changed: redraw the preview, and clear (without recomputing) every
// row whose byte size actually depends on size/radius — ICO and ZIP don't, so
// they're left alone. The clear here is a cheap DOM write; the real (cached) work
// happens lazily again on the next hover via attachLazySize's key mismatch.
function scheduleRefresh() {
  refreshPreview();
  dom.lazy.webp.reset();
  dom.lazy.pdf.reset();
  dom.lazy.ai.reset();
  dom.lazy.eps.reset();
}

export async function openDownloadModal(item, file = item.file, isSquare = true, darkBg = false) {
  ensureStyles();
  if (!dom) buildDom();
  state = { item, file, isSquare, darkBg, size: DEFAULT_SIZE, radiusPct: 0, aspectRatio: 1 };

  dom.squareRows.forEach(el => el.classList.toggle('hidden', !isSquare));
  dom.radiusRow.classList.toggle('hidden', !isSquare);
  dom.webp.classList.toggle('hidden', !supportsWebp());
  dom.previewBox.classList.toggle('wide', !isSquare);
  dom.previewBox.classList.toggle('dark-bg', !!darkBg);
  dom.radiusRange.value = 0;
  dom.radiusVal.textContent = '0%';
  setActiveSizeTab([...dom.sizeTabs].find(b => Number(b.dataset.size) === DEFAULT_SIZE));
  dom.sizeCustomInput.classList.add('hidden');
  dom.sizeCustomInput.value = '';
  updateSizeTabLabels();

  Object.values(dom.lazy).forEach(l => l.reset());

  dom.overlay.classList.add('open');
  refreshPreview();

  if (!isSquare) {
    const ratio = await resolveAspectRatio(file);
    if (!state || state.file !== file) return; // superseded by a newer open
    state.aspectRatio = ratio;
    updateSizeTabLabels();
  }
}
