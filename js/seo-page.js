import { svgToPngBlob, triggerConfetti, parseSvgViewBox } from './svg-utils.js';
import { animateContainerHeight, showToast, setAssetBase, formatFileSize } from './utils.js';
import { downloadAsIco, downloadAllAsZip, estimateIcoSize } from './export.js';
import { openIcnsModal } from './icns.js';
import { openLiquidModal } from './liquid-glass-modal.js';
import { LABELS, TOASTS, applyLabels } from './labels.js';
import { applyI18n, t, getLang } from './i18n.js';
import { ecosystemLabels, ecosystemLabelsEn } from './data.js';
import './header-search.js';

applyLabels(); // single source of button texts → js/labels.js
applyI18n();   // translate data-i18n / data-i18n-aria / data-i18n-placeholder attrs

// ── Catalog CTA title with count ──────────────────────────────────────────
const catalogTitleEl = document.querySelector('[data-catalog-count]');
if (catalogTitleEl) {
  const n = catalogTitleEl.dataset.catalogCount;
  catalogTitleEl.textContent = t('seoCatalogTitle')(n);
}

// ── EN-only translations (H1, FAQ, section names, ecosystem names) ───────
if (getLang() === 'en') {
  // H1
  const h1 = document.querySelector('h1[data-h1-en]');
  if (h1) h1.textContent = h1.dataset.h1En;

  // FAQ items
  document.querySelectorAll('.faq-item[data-q-en]').forEach(item => {
    const qEl = item.querySelector('.faq-q');
    const aEl = item.querySelector('.faq-a');
    if (qEl && item.dataset.qEn) qEl.textContent = item.dataset.qEn;
    if (aEl && item.dataset.aEn) aEl.textContent = item.dataset.aEn;
  });
  // Section name in breadcrumbs and category badge
  document.querySelectorAll('[data-section-en]').forEach(el => {
    const enName = el.dataset.sectionEn;
    if (!enName) return;
    // category badge has inner .category-name span; breadcrumb link is a plain text node
    const nameSpan = el.querySelector('.category-name');
    if (nameSpan) nameSpan.textContent = enName;
    else el.textContent = enName;
  });
  // Ecosystem name
  const ecoLabel = document.querySelector('[data-eco-id]');
  if (ecoLabel) {
    const id = ecoLabel.dataset.ecoId;
    const enName = ecosystemLabelsEn[id] || ecosystemLabels[id] || id;
    const nameSpan = ecoLabel.querySelector('.eco-name');
    if (nameSpan) nameSpan.textContent = enName;
  }
}

// ── Threads banner dismiss ──
const thBanner = document.getElementById('th-banner');
const thClose  = document.getElementById('th-banner-close');
if (thBanner && thClose) {
  thClose.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    thBanner.classList.add('hiding');
    thBanner.addEventListener('transitionend', () => thBanner.classList.add('hidden'), { once: true });
  });
}

// Page data injected by build script via window.__SEO_PAGE__
const PAGE = window.__SEO_PAGE__;

const BASE = PAGE.assetBase;
const ITEM = PAGE.item; // { figma, file, variants } — for the reused catalog export modules

// The export/icns/color modules resolve assets through svgUrl(); point it at this
// page's asset folder, and flag the section so downloadAllAsZip bundles ICO/ICNS.
setAssetBase(BASE.replace(/\/+$/, ''));
document.body.dataset.section = 'logos';

const btnRow       = document.getElementById('btn-row');
const previewCard  = document.getElementById('preview-card');
const previewMount = document.getElementById('preview-mount');
const previewImg   = document.getElementById('preview-img');
const btnCopy      = document.getElementById('btn-copy');
const btnCopyLbl   = document.getElementById('btn-copy-label');
const btnDlSvg     = document.getElementById('btn-dl-svg');
const btnDlPng     = document.getElementById('btn-dl-png');
const btnZip       = document.getElementById('btn-download-zip');
const lightbox     = document.getElementById('lightbox');
const lightboxInner = document.getElementById('lightbox-inner');
const lightboxImg  = document.getElementById('lightbox-img');
const previewDlLabel  = document.getElementById('preview-dl-label');
const lightboxDlLabel = document.getElementById('lightbox-dl-label');

let currentSrc  = PAGE.defaultSrc;
let currentWide = PAGE.defaultWide;
let currentType = PAGE.defaultType;
let copyTimer   = null;

const macosTabsEl       = document.getElementById('macos-style-tabs');
const macosTabsMobileEl = document.getElementById('macos-style-tabs-mobile');
let variantColorSrc    = currentSrc; // color PNG for the current variant (reset on variant switch)
let activeFileRel      = null;       // relative path under pngs/ when dark/light tab active
let currentMacosStyles = null;       // macos_styles for the currently selected variant

function parseMacosFromCard(card) {
  try { return card?.dataset.macos ? JSON.parse(card.dataset.macos) : null; } catch { return null; }
}

function setMacosTabsStyle(style) {
  [macosTabsEl, macosTabsMobileEl].forEach(el => {
    if (!el) return;
    el.querySelectorAll('.macos-style-tab').forEach(b =>
      b.classList.toggle('active', b.dataset.style === style));
  });
}

function showMacosTabs(show, styles) {
  [macosTabsEl, macosTabsMobileEl].forEach(el => {
    if (!el) return;
    el.classList.toggle('hidden', !show);
    el.querySelector('[data-style="dark"]')?.classList.toggle('hidden', !styles?.dark);
    el.querySelector('[data-style="light"]')?.classList.toggle('hidden', !styles?.light);
  });
}

// Initialise from the active variant card
currentMacosStyles = parseMacosFromCard(document.querySelector('[data-variant].active'));
if (currentMacosStyles && macosTabsEl && !macosTabsEl.classList.contains('hidden')) {
  showMacosTabs(true, currentMacosStyles);
}

function updatePreviewDlLabel() {
  const text = currentType === 'svg' ? LABELS.downloadSvg : LABELS.downloadPng;
  if (previewDlLabel)  previewDlLabel.textContent  = text;
  if (lightboxDlLabel) lightboxDlLabel.textContent = text;
}

// ── Инициализация PNG-кнопки для дефолтного варианта ──
initPngBtn(currentSrc, currentWide, currentType, document.querySelector('[data-variant].active')?.dataset.png);
updatePreviewDlLabel();

// ── macOS style tabs ──
function onMacosTabClick(e) {
  const btn = e.target.closest('.macos-style-tab');
  if (!btn || btn.classList.contains('hidden')) return;
  const style = btn.dataset.style;
  if (style === 'color') {
    activeFileRel = null;
    currentSrc = variantColorSrc;
  } else {
    activeFileRel = currentMacosStyles[style];
    currentSrc = BASE + 'pngs/' + activeFileRel;
  }
  setMacosTabsStyle(style);
  previewImg.src = currentSrc;
  initPngBtn(currentSrc, false, 'png', undefined);
}
macosTabsEl?.addEventListener('click', onMacosTabClick);
macosTabsMobileEl?.addEventListener('click', onMacosTabClick);

// ── Переключение вариантов ──
document.getElementById('variants-grid')?.addEventListener('click', e => {
  const card = e.target.closest('[data-variant]');
  if (!card) return;

  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

  document.querySelectorAll('[data-variant]').forEach(el =>
    el.classList.toggle('active', el === card));

  currentSrc  = card.dataset.src;
  currentWide = card.dataset.wide === 'true';
  currentType = card.dataset.type;
  variantColorSrc = currentSrc;
  activeFileRel = null;
  updatePreviewDlLabel();

  // macOS style tabs: show only for square PNG variants that have styles
  currentMacosStyles = parseMacosFromCard(card);
  const showTabs = currentType === 'png' && !currentWide && !!currentMacosStyles;
  showMacosTabs(showTabs, currentMacosStyles);
  if (showTabs) setMacosTabsStyle('color');

  // Wide variants → ZIP-only; square → full ICO/ICNS menu. Before the height
  // animation so its overflow clip isn't reset mid-flight.
  syncDownloadMode();

  previewCard.classList.toggle('light-bg', currentWide);
  previewMount.className = currentWide ? 'preview-wide' : 'preview-icon';
  previewImg.src = currentSrc;
  previewImg.alt = card.querySelector('.variant-label').textContent;

  animateContainerHeight(btnRow, () => {
    if (currentType === 'svg') {
      btnCopy.style.display = '';
      btnDlSvg.style.display = '';
      btnDlSvg.href = currentSrc;
      btnDlSvg.download = currentSrc.split('/').pop();
    } else {
      btnCopy.style.display = 'none';
      btnDlSvg.style.display = 'none';
    }
    initPngBtn(currentSrc, currentWide, currentType, card.dataset.png);
  });
  resetCopy();
});

function initPngBtn(src, wide, type, pngSrc) {
  if (type === 'svg') {
    btnDlPng.style.display = '';
    btnDlPng.removeAttribute('href');
    btnDlPng.download = src.split('/').pop().replace('.svg', '.png');
    btnDlPng.onclick = e => { e.preventDefault(); downloadPngFromSvg(src, btnDlPng.download, !wide); };
  } else if (pngSrc || type === 'png') {
    const target = pngSrc || src;
    btnDlPng.style.display = '';
    btnDlPng.href = target;
    btnDlPng.download = target.split('/').pop();
    btnDlPng.onclick = null;
  } else {
    btnDlPng.style.display = 'none';
  }
}

function svgForFigma(svg) {
  let out = svg.trim();
  if (!currentWide) {
    out = out
      .replace(/^(<svg[^>]*?)\bwidth="[^"]*"/, '$1width="32"')
      .replace(/^(<svg[^>]*?)\bheight="[^"]*"/, '$1height="32"');
  } else {
    const vb = parseSvgViewBox(out);
    const w = (vb && vb.h > 0) ? Math.round((24 * vb.w / vb.h) * 100) / 100 : 24;
    out = out
      .replace(/^(<svg[^>]*?)\bwidth="[^"]*"/, `$1width="${w}"`)
      .replace(/^(<svg[^>]*?)\bheight="[^"]*"/, '$1height="24"');
  }
  if (PAGE.figma) out = out.replace(/^<svg/, `<svg id="${PAGE.figma}"`);
  return out;
}

// ── Копировать SVG ──
btnCopy.addEventListener('click', function() {
  fetch(currentSrc)
    .then(r => r.text())
    .then(svg => navigator.clipboard.writeText(svgForFigma(svg)))
    .then(() => {
      triggerConfetti(btnCopy);
      showToast(TOASTS.copiedSvg);
      btnCopyLbl.textContent = LABELS.copied;
      btnCopy.disabled = true;
      if (copyTimer) clearTimeout(copyTimer);
      copyTimer = setTimeout(resetCopy, 2000);
    });
});

function resetCopy() {
  btnCopy.disabled = false;
  btnCopyLbl.textContent = LABELS.copySvg;
}

// ── SVG → PNG ──
function downloadPngFromSvg(svgUrl, filename, square) {
  fetch(svgUrl)
    .then(r => r.text())
    .then(svg => svgToPngBlob(svg, { square, size: 1000 }))
    .then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      showToast(TOASTS.downloaded(filename));
    });
}

// ── Fullscreen / Lightbox ──
function openLightbox() {
  lightboxInner.className = 'lightbox-inner' + (currentWide ? ' wide' : '');
  lightboxImg.src = currentSrc;
  lightboxImg.alt = previewImg.alt;
  lightbox.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lightbox.classList.add('hidden');
  document.body.style.overflow = '';
}

// ── Цвета бренда: копирование hex по клику ──
document.querySelectorAll('.color-swatch').forEach(sw => {
  sw.addEventListener('click', async () => {
    const hex = sw.dataset.color;
    try {
      await navigator.clipboard.writeText(hex);
      triggerConfetti(sw);
      showToast(TOASTS.copiedColor(hex));
    } catch { showToast(TOASTS.copyError); }
  });
});

document.getElementById('lightbox-close').addEventListener('click', e => { e.stopPropagation(); closeLightbox(); });
previewCard.addEventListener('click', openLightbox);
lightbox.addEventListener('click', closeLightbox);
document.getElementById('lightbox-body').addEventListener('click', e => e.stopPropagation());

// ── Preview overlay: download + menu ──
const ICON_COPY = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
const ICON_SVG  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
const ICON_PNG  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
const ICON_ZIP  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><rect x="1" y="3" width="22" height="5" rx="1"/><path d="M10 12h4"/></svg>`;

const btnExpand      = document.getElementById('btn-expand');
const btnMenu        = document.getElementById('btn-menu');
const btnPreviewDl   = document.getElementById('btn-preview-dl');
const previewMenu    = document.getElementById('preview-menu');
const btnLightboxDl  = document.getElementById('lightbox-dl-btn');
const btnLightboxMenu = document.getElementById('lightbox-menu-btn');
const lightboxMenu   = document.getElementById('lightbox-menu');

function buildMenuItems(container, closeMenu) {
  container.innerHTML = '';
  const items = [];
  if (currentType === 'svg') {
    items.push({ icon: ICON_COPY, label: LABELS.copySvg, action: () => btnCopy.click() });
    items.push({ icon: ICON_SVG,  label: LABELS.downloadSvg, action: () => { btnDlSvg.click(); } });
  }
  items.push({ icon: ICON_PNG, label: LABELS.downloadPng, action: () => btnDlPng.click() });
  if (!currentWide) {
    if (btnIco)  items.push({ icon: ICON_PNG, label: LABELS.dlIco,  action: () => btnIco.click() });
    if (btnIcns) items.push({ icon: ICON_PNG, label: LABELS.dlIcns, action: () => btnIcns.click() });
    if (btnLg && currentType !== 'png') items.push({ icon: ICON_PNG, label: LABELS.dlLiquidGlass, action: () => btnLg.click() });
  }
  if (btnZip) {
    items.push({ icon: ICON_ZIP, label: LABELS.dlZipAll, action: () => btnZip.click() });
  }
  items.forEach(({ icon, label, action }) => {
    const btn = document.createElement('button');
    btn.className = 'preview-menu-item';
    btn.innerHTML = `${icon}<span>${label}</span>`;
    btn.addEventListener('click', e => { e.stopPropagation(); closeMenu(); action(); });
    container.appendChild(btn);
  });
}

function openPreviewMenu()  { buildMenuItems(previewMenu, closePreviewMenu); previewMenu.classList.remove('hidden'); }
function closePreviewMenu() { previewMenu.classList.add('hidden'); }
function openLightboxMenu()  { buildMenuItems(lightboxMenu, closeLightboxMenu); lightboxMenu.classList.remove('hidden'); }
function closeLightboxMenu() { lightboxMenu.classList.add('hidden'); }

function downloadCurrent() {
  const a = document.createElement('a');
  a.href = currentSrc;
  a.download = currentSrc.split('/').pop();
  a.click();
}

btnExpand.addEventListener('click', e => { e.stopPropagation(); openLightbox(); });

btnDlSvg.addEventListener('click', () => showToast(TOASTS.downloaded(btnDlSvg.download)));
btnDlPng.addEventListener('click', () => { if (btnDlPng.href) showToast(TOASTS.downloaded(btnDlPng.download)); });

btnMenu.addEventListener('click', e => {
  e.stopPropagation();
  previewMenu.classList.contains('hidden') ? openPreviewMenu() : closePreviewMenu();
});

btnPreviewDl.addEventListener('click', e => { e.stopPropagation(); downloadCurrent(); });
btnLightboxDl.addEventListener('click', e => { e.stopPropagation(); downloadCurrent(); });

btnLightboxMenu.addEventListener('click', e => {
  e.stopPropagation();
  lightboxMenu.classList.contains('hidden') ? openLightboxMenu() : closeLightboxMenu();
});

document.addEventListener('click', e => {
  if (!previewMenu.contains(e.target) && e.target !== btnMenu) closePreviewMenu();
  if (!lightboxMenu.contains(e.target) && e.target !== btnLightboxMenu) closeLightboxMenu();
});

previewCard.addEventListener('mouseleave', closePreviewMenu);

// ── Esc: лайтбокс → меню (живой поиск в шапке — js/header-search.js) ──
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!lightbox.classList.contains('hidden')) { closeLightbox(); return; }
    closePreviewMenu();
    closeLightboxMenu();
  }
});

// ── Download dropdown: ICO / ICNS / Скачать всё — reuses the catalog modules ──
const dlGroup   = document.getElementById('btn-download-all');
const dlTrigger = document.getElementById('btn-download-trigger');
const dlMenu    = document.getElementById('btn-download-menu');
const btnIco    = document.getElementById('btn-download-ico');
const btnIcns   = document.getElementById('btn-download-icns');
const btnLg     = document.getElementById('btn-download-lg');

function closeDlMenu() {
  dlMenu?.classList.remove('open');
  dlTrigger?.classList.remove('open');
  // Restore btn-row's height-animation clip once the menu is closed.
  if (btnRow) btnRow.style.overflow = '';
}

// ICO/ICNS follow the currently-shown variant (including dark/light tab).
function currentFile() {
  if (activeFileRel) return activeFileRel;
  // currentSrc = BASE + 'pngs/' + relPath; extract the pngs-relative path.
  const pngsPrefix = BASE.replace(/\/+$/, '') + '/pngs/';
  if (currentSrc.startsWith(pngsPrefix)) return currentSrc.slice(pngsPrefix.length).split('?')[0];
  return currentSrc.split('/').pop().split('?')[0]; // SVG or unexpected fallback
}

// ICO/ICNS only make sense for square variants. Wide `-full` variants collapse
// the dropdown to a single "Скачать всё (ZIP)" button (the catalog does the same
// in main.js). Re-evaluated per variant — the gate is the SELECTED variant's
// shape (currentWide), not the primary file.
function syncDownloadMode() {
  if (!dlGroup) return;
  const lbl = dlTrigger.querySelector('span');
  if (currentWide) {
    dlGroup.classList.add('zip-only');
    if (lbl) lbl.textContent = LABELS.dlZipAll;
    closeDlMenu();
  } else {
    dlGroup.classList.remove('zip-only');
    if (lbl) lbl.textContent = LABELS.dlMore;
    const icoSizeEl = btnIco?.querySelector('.btn-menu-size');
    if (icoSizeEl) {
      icoSizeEl.textContent = '';
      estimateIcoSize(currentFile()).then(sz => { if (sz) icoSizeEl.textContent = formatFileSize(sz); });
    }
  }
  if (btnLg) btnLg.classList.toggle('hidden', currentType === 'png');
}

if (dlGroup && ITEM) {
  dlTrigger.addEventListener('click', e => {
    e.stopPropagation();
    if (currentWide) { downloadAllAsZip(ITEM); return; } // wide variant — no menu, straight to ZIP
    const willOpen = !dlMenu.classList.contains('open');
    dlMenu.classList.toggle('open');
    dlTrigger.classList.toggle('open');
    // The menu pops upward and would otherwise be clipped by btn-row's
    // overflow:hidden (left from the variant-switch height animation) — lift it.
    if (btnRow) btnRow.style.overflow = willOpen ? 'visible' : '';
  });
  btnIco?.addEventListener('click', () => { closeDlMenu(); downloadAsIco(ITEM, currentFile()); });
  btnIcns?.addEventListener('click', () => { closeDlMenu(); openIcnsModal(ITEM, currentFile()); });
  btnLg?.addEventListener('click', () => { closeDlMenu(); openLiquidModal(ITEM, currentFile()); });
  btnZip?.addEventListener('click', () => { closeDlMenu(); downloadAllAsZip(ITEM); });
  document.addEventListener('click', e => { if (!dlGroup.contains(e.target)) closeDlMenu(); });

  syncDownloadMode(); // initial state for the default variant
}

// ── Report outdated ──
const WORKER_URL = 'https://wezryybxxwicysnbmhkz.supabase.co/functions/v1/suggest';
const reportBtn = document.getElementById('btn-report-outdated');
const reportOverlay = document.getElementById('suggest-overlay');
if (reportBtn && reportOverlay) {
  const reportForm = document.getElementById('suggest-form');
  const reportResult = document.getElementById('suggest-result');
  const reportSubmit = document.getElementById('suggest-submit');

  document.getElementById('suggest-name').value = PAGE.name;

  document.getElementById('suggest-file').addEventListener('change', function () {
    const label = document.getElementById('suggest-file-label');
    const nameEl = document.getElementById('suggest-file-name');
    label.classList.toggle('has-file', !!this.files[0]);
    nameEl.textContent = this.files[0] ? this.files[0].name : 'Выбрать файл';
  });

  reportBtn.addEventListener('click', () => reportOverlay.classList.add('open'));
  document.getElementById('suggest-close').addEventListener('click', closeReportModal);
  reportOverlay.addEventListener('click', e => { if (e.target === reportOverlay) closeReportModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && reportOverlay.classList.contains('open')) closeReportModal(); });

  function closeReportModal() {
    reportOverlay.classList.remove('open');
    reportForm.reset();
    document.getElementById('suggest-name').value = PAGE.name;
    document.getElementById('suggest-comment').value = 'Логотип устарел, прошу обновить';
    document.getElementById('suggest-file-name').textContent = 'Выбрать файл';
    document.getElementById('suggest-file-label').classList.remove('has-file');
    reportResult.className = 'suggest-result';
    reportResult.textContent = '';
    reportSubmit.disabled = false;
  }

  reportForm.addEventListener('submit', async e => {
    e.preventDefault();
    const url = document.getElementById('suggest-url').value.trim();
    const comment = document.getElementById('suggest-comment').value.trim();
    const file = document.getElementById('suggest-file').files[0];

    if (url && !/^https?:\/\/.+\..+/.test(url)) {
      document.getElementById('suggest-url').classList.add('input-error');
      reportResult.className = 'suggest-result error';
      reportResult.textContent = 'Введите корректную ссылку (например, https://brand.com).';
      return;
    }
    if (file && file.size > 1 * 1024 * 1024) {
      document.getElementById('suggest-file-label').classList.add('file-error');
      reportResult.className = 'suggest-result error';
      reportResult.textContent = 'Файл слишком большой. Максимум — 1 МБ.';
      return;
    }

    reportSubmit.disabled = true;
    reportResult.className = 'suggest-result';
    reportResult.textContent = '';

    try {
      const fd = new FormData();
      fd.append('brand', PAGE.name);
      if (url) fd.append('url', url);
      if (comment) fd.append('comment', comment);
      if (file) fd.append('file', file, file.name);

      const res = await fetch(WORKER_URL, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
      if (data.ok) {
        reportForm.style.display = 'none';
        document.getElementById('suggest-modal-titles').style.display = 'none';
        const success = document.getElementById('suggest-success');
        success.classList.add('show');
        const bg = success.querySelector('.t-form-success-popup__content-icon-background');
        const check = success.querySelector('.t-form-success-popup__content-icon-check');
        bg.style.animation = 'none'; check.style.animation = 'none';
        void bg.offsetWidth;
        bg.style.animation = 'iconBackgroundOpacity .106s linear forwards, iconBackgroundTransform 1.103s cubic-bezier(.445,.05,.55,.95) forwards';
        check.style.animation = 'checkIconOpacity 51ms linear .437s forwards, checkIconDraw .666s cubic-bezier(.39,.575,.565,1) .437s forwards, checkIconScale .435s cubic-bezier(.445,.05,.55,.95) .437s forwards';
      } else {
        throw new Error(data.description);
      }
    } catch (err) {
      reportResult.className = 'suggest-result error';
      reportResult.textContent = 'Ошибка отправки. Попробуйте ещё раз.';
      reportSubmit.disabled = false;
    }
  });
}
