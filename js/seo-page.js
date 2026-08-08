import { svgToPngBlob, triggerConfetti, parseSvgViewBox } from './svg-utils.js';
import { animateContainerHeight, showToast, setAssetBase, trackLogoView, trackExport } from './utils.js';
import { downloadAsIco } from './export.js';
import { LABELS, TOASTS, applyLabels } from './labels.js';
import { applyI18n, t, getLang } from './i18n.js';
import { ecosystemLabels, ecosystemLabelsEn } from './data.js';
import './donate.js';   // hosting fundraiser modal — self-wires to the `tl:export` event
// header-search.js is NOT imported here — templates/partials/nav-header.html
// already loads it via its own <script type="module"> on every page,
// including this one. A redundant import here used to be harmless (same
// resolved URL → the browser deduped it), but build-cache-bust.js now stamps
// nav-header's <script src> with ?v=... while this bare import specifier
// stays unversioned — two different module URLs, so header-search.js's
// top-level code (the placeholder typewriter) ran twice on the same <input>,
// two timers overwriting each other's text (bug: "search placeholder text
// doubles/triples and overlaps").

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
    // innerHTML, not textContent: some answers carry a "see also" list linked
    // to other catalog pages (build-seo-pages.js's buildFaqSection) — the
    // dataset value is our own build-time escaped HTML, not user input.
    if (aEl && item.dataset.aEn) aEl.innerHTML = item.dataset.aEn;
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
  // "N logos" label on the "Остальные категории" cards (mobile only, css/seo-page.css)
  document.querySelectorAll('.catalog-cat-count-label[data-en]').forEach(el => {
    el.textContent = el.dataset.en;
  });
  // Sponsor banner title / text (per-sponsor EN copy, baked as data-*-en)
  const spTitle = document.querySelector('.sp-banner-title[data-title-en]');
  if (spTitle && spTitle.dataset.titleEn) spTitle.textContent = spTitle.dataset.titleEn;
  const spDesc = document.querySelector('.sp-banner-desc[data-desc-en]');
  if (spDesc && spDesc.dataset.descEn) spDesc.textContent = spDesc.dataset.descEn;
  const spCta = document.querySelector('.sp-banner-cta[data-cta-en]');
  if (spCta && spCta.dataset.ctaEn) spCta.textContent = spCta.dataset.ctaEn;

  // Ecosystem name
  const ecoLabel = document.querySelector('[data-eco-id]');
  if (ecoLabel) {
    const id = ecoLabel.dataset.ecoId;
    const enName = ecosystemLabelsEn[id] || ecosystemLabels[id] || id;
    const nameSpan = ecoLabel.querySelector('.eco-name');
    if (nameSpan) nameSpan.textContent = enName;
  }
}

// ── Mobile: "Подробнее" toggle for the about text ─────────────────────────
// The 2-line clamp is pure CSS (css/seo-page.css, mobile media query) — the
// full text stays in the HTML at all times, only its rendered height is
// clamped, so this is not a content-hiding trick that could hurt SEO.
// The button itself is `hidden` until we confirm the text actually overflows
// 2 lines — a short about doesn't need a toggle at all.
function setupLogoDescToggle() {
  const descEl = document.getElementById('logo-desc');
  const toggleBtn = document.getElementById('logo-desc-toggle');
  if (!descEl || !toggleBtn) return;

  const sync = () => {
    if (descEl.classList.contains('expanded')) return; // don't re-clamp mid-read on resize
    const overflowing = matchMedia('(max-width: 640px)').matches
      && descEl.scrollHeight > descEl.clientHeight + 1;
    toggleBtn.hidden = !overflowing;
  };
  sync();
  window.addEventListener('resize', sync);

  toggleBtn.addEventListener('click', () => {
    const expanded = descEl.classList.toggle('expanded');
    toggleBtn.setAttribute('aria-expanded', String(expanded));
    toggleBtn.textContent = t(expanded ? 'logoDescCollapse' : 'logoDescExpand');
  });
}
setupLogoDescToggle();

// Page data injected by build script via window.__SEO_PAGE__
const PAGE = window.__SEO_PAGE__;

const BASE = PAGE.assetBase;
const ITEM = PAGE.item; // { figma, file, variants } — for the reused catalog export modules

// The export/icns/color/download-modal modules resolve assets through svgUrl();
// point it at this page's asset folder, and flag the section so the ZIP/ICO/ICNS
// rows in the "other formats" modal bundle correctly.
setAssetBase(BASE.replace(/\/+$/, ''));
document.body.dataset.section = 'logos';
trackLogoView(PAGE.figma, PAGE.name, PAGE.item?.file);

const btnRow       = document.getElementById('btn-row');
const previewCard  = document.getElementById('preview-card');
const previewMount = document.getElementById('preview-mount');
const previewImg   = document.getElementById('preview-img');
const btnCopy      = document.getElementById('btn-copy');
const btnCopyLbl   = document.getElementById('btn-copy-label');
const btnDlSvg     = document.getElementById('btn-dl-svg');
const btnDlPng     = document.getElementById('btn-dl-png');
const btnDlIco     = document.getElementById('btn-download-ico');
const btnDlIcns    = document.getElementById('btn-download-icns');
const lightbox     = document.getElementById('lightbox');
const lightboxInner = document.getElementById('lightbox-inner');
const lightboxImg  = document.getElementById('lightbox-img');
const previewDlLabel  = document.getElementById('preview-dl-label');
const lightboxDlLabel = document.getElementById('lightbox-dl-label');

// Best-effort WebP counterpart of a PNG path — assets/logos/pngs/<path>.png
// mirrors assets/logos/previews/<path>.webp 1:1. Used only for the visible
// <img>; downloads/lightbox/color-editor always use the full-res source.
// Falls back to the full path via the caller's onerror handler if it 404s
// (e.g. a brand-new PNG whose preview hasn't been generated yet).
function lightPreview(pngSrc) {
  if (!/\.png(\?|$)/i.test(pngSrc) || !pngSrc.includes('/pngs/')) return pngSrc;
  return pngSrc.replace('/pngs/', '/previews/').replace(/\.png(\?|$)/i, '.webp$1');
}

let currentSrc  = PAGE.defaultSrc;
let currentWide = PAGE.defaultWide;
let currentType = PAGE.defaultType;
let currentDarkBg = false;
let copyTimer   = null;

const macosTabsEl       = document.getElementById('macos-style-tabs');
const macosTabsMobileEl = document.getElementById('macos-style-tabs-mobile');
let variantColorSrc    = currentSrc; // color PNG for the current variant (reset on variant switch)
let activeFileRel      = null;       // relative path under pngs/ when dark/light tab active
let currentMacosStyles = null;       // macos_styles for the currently selected variant

function parseMacosFromCard(card) {
  try { return card?.dataset.macos ? JSON.parse(card.dataset.macos) : null; } catch { return null; }
}

function updateTabIndicator(tabs) {
  if (!tabs) return;
  const active = tabs.querySelector('.macos-style-tab.active:not(.hidden)');
  if (!active) return;
  tabs.style.setProperty('--tab-left', active.offsetLeft + 'px');
  tabs.style.setProperty('--tab-width', active.offsetWidth + 'px');
}

function setMacosTabsStyle(style) {
  [macosTabsEl, macosTabsMobileEl].forEach(el => {
    if (!el) return;
    el.querySelectorAll('.macos-style-tab').forEach(b =>
      b.classList.toggle('active', b.dataset.style === style));
    updateTabIndicator(el);
  });
}

function showMacosTabs(show, styles) {
  [macosTabsEl, macosTabsMobileEl].forEach(el => {
    if (!el) return;
    el.classList.toggle('hidden', !show);
    el.querySelector('[data-style="dark"]')?.classList.toggle('hidden', !styles?.dark);
    el.querySelector('[data-style="light"]')?.classList.toggle('hidden', !styles?.light);
    if (show) requestAnimationFrame(() => updateTabIndicator(el));
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
  const preview = lightPreview(currentSrc);
  previewImg.src = preview;
  if (preview !== currentSrc) previewImg.addEventListener('error', () => { previewImg.src = currentSrc; }, { once: true });
  initPngBtn(currentSrc, false, 'png', undefined);
  updateEmbedForVariant(currentSrc);
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

  currentDarkBg = card.dataset.darkBg === 'true';
  previewCard.classList.toggle('light-bg', currentWide && !currentDarkBg);
  previewCard.classList.toggle('dark-bg', currentWide && currentDarkBg);
  previewMount.className = currentWide ? 'preview-wide' : 'preview-icon';
  // Drop the stale width/height attrs from the initial SSR render (e.g. 160×160
  // for a square default) — with them still set, the browser's img[width][height]
  // aspect-ratio hint keeps using the OLD ratio for this box even after src swaps
  // to a differently-shaped variant, which used to stretch preview-wide images
  // (no object-fit there) before real ratio could take over.
  previewImg.removeAttribute('width');
  previewImg.removeAttribute('height');
  previewImg.src = card.dataset.preview || currentSrc;
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
  updateEmbedForVariant(currentSrc);
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
  // ICO/ICNS — square PNG variants only, same rule as the catalog's detail
  // panel (main.js's isSquarePng). Not offered for SVG or wide/full lockups.
  const isSquarePng = type !== 'svg' && !wide;
  if (btnDlIco) {
    btnDlIco.classList.toggle('hidden', !isSquarePng);
    if (isSquarePng) btnDlIco.onclick = () => downloadAsIco(ITEM, currentFile());
  }
  if (btnDlIcns) {
    btnDlIcns.classList.toggle('hidden', !isSquarePng);
    if (isSquarePng) btnDlIcns.onclick = async () => {
      const { openIcnsModal } = await import('./icns.js');
      openIcnsModal(ITEM, currentFile());
    };
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
      trackExport(PAGE.figma, 'copy-svg', PAGE.item?.file || '');
      btnCopyLbl.textContent = LABELS.copied;
      btnCopy.disabled = true;
      if (copyTimer) clearTimeout(copyTimer);
      copyTimer = setTimeout(resetCopy, 2000);
    })
    .catch(() => showToast(TOASTS.copyError));
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
      trackExport(PAGE.figma, filename.endsWith('.png') ? 'png' : 'svg', PAGE.item?.file || '');
    });
}

// ── Fullscreen / Lightbox ──
function openLightbox() {
  lightboxInner.className = 'lightbox-inner' + (currentWide ? ' wide' : '') + (currentDarkBg ? ' dark-bg' : '');
  lightboxImg.src = currentSrc;
  lightboxImg.alt = previewImg.alt;
  lightbox.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lightbox.classList.add('hidden');
  document.body.style.overflow = '';
}

// ── Цвета бренда: клик копирует выделенный формат и переключает на другой ──
document.querySelectorAll('.color-swatch').forEach(sw => {
  sw.addEventListener('click', async () => {
    const format = sw.dataset.format;
    const value  = format === 'rgb' ? sw.dataset.rgb : sw.dataset.hex;
    const copied = format === 'rgb' ? `RGB ${value}` : value;
    try {
      await navigator.clipboard.writeText(value);
      triggerConfetti(sw);
      showToast(TOASTS.copiedColor(copied));
    } catch { showToast(TOASTS.copyError); return; }
    const next = format === 'rgb' ? 'hex' : 'rgb';
    sw.dataset.format = next;
    sw.querySelectorAll('.color-swatch-line').forEach(line => {
      line.classList.toggle('is-active', line.dataset.role === next);
    });
  });
});

// ── Встроить на сайт: <a href="страница"><img src="файл"></a>-сниппет ──
// No format/variant picker of its own — one variant is one file. Mirrors
// whatever the visitor already made the active download in #variants-grid,
// via updateEmbedForVariant(src) called from that click handler above.
const embedCode     = document.getElementById('embed-code');
const embedWidth    = document.getElementById('embed-width');
const embedCopyBtn  = document.getElementById('btn-embed-copy');
const embedCopyLbl  = document.getElementById('embed-copy-label');
let embedCopyTimer  = null;

function absUrl(relPath) {
  return relPath ? new URL(relPath, location.href).href : '';
}

function renderEmbedCode() {
  if (!embedCode) return;
  const width = Math.min(4000, Math.max(8, parseInt(embedWidth.value, 10) || 200));
  embedCode.textContent = `<a href="${embedCode.dataset.pageUrl}"><img src="${embedCode.dataset.src}" alt="${embedCode.dataset.alt}" width="${width}"></a>`;
}

function updateEmbedForVariant(src) {
  if (!embedCode) return;
  embedCode.dataset.src = absUrl(src);
  renderEmbedCode();
}

if (embedCode) {
  renderEmbedCode();
  embedWidth.addEventListener('input', renderEmbedCode);

  // Same confirm-in-place pattern as the "Скопировать SVG" button above
  // (resetCopy): the label flips to "Скопировано" and the button disables
  // for 2s, so the click has a visible result at the cursor, not only in
  // the toast down in the corner.
  embedCopyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(embedCode.textContent);
    } catch { showToast(TOASTS.copyError); return; }
    trackExport(PAGE.figma, 'embed', PAGE.item?.file || '');
    triggerConfetti(embedCopyBtn);
    showToast(t('toast.embedCopied'));
    embedCopyLbl.textContent = LABELS.copied;
    embedCopyBtn.disabled = true;
    clearTimeout(embedCopyTimer);
    embedCopyTimer = setTimeout(() => {
      embedCopyBtn.disabled = false;
      embedCopyLbl.textContent = t('seoEmbedCopy');
    }, 2000);
  });
}

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
  if (ITEM) {
    items.push({ icon: ICON_ZIP, label: LABELS.dlMore, action: () => openDownloadModalForCurrent() });
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

btnDlSvg.addEventListener('click', () => { showToast(TOASTS.downloaded(btnDlSvg.download)); trackExport(PAGE.figma, 'svg', PAGE.item?.file || ''); });
btnDlPng.addEventListener('click', () => { if (btnDlPng.href) { showToast(TOASTS.downloaded(btnDlPng.download)); trackExport(PAGE.figma, 'png', PAGE.item?.file || ''); } });

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

// ── Download dropdown: opens the shared "other formats" modal ──
const dlGroup   = document.getElementById('btn-download-all');
const dlTrigger = document.getElementById('btn-download-trigger');

// ICO/ICNS/WebP/PDF/AI/EPS follow the currently-shown variant (including dark/light tab).
function currentFile() {
  if (activeFileRel) return activeFileRel;
  // currentSrc = BASE + 'pngs/' + relPath; extract the pngs-relative path.
  const pngsPrefix = BASE.replace(/\/+$/, '') + '/pngs/';
  if (currentSrc.startsWith(pngsPrefix)) return currentSrc.slice(pngsPrefix.length).split('?')[0];
  return currentSrc.split('/').pop().split('?')[0]; // SVG or unexpected fallback
}

// Square-only rows (ICO/ICNS/Liquid Glass) are shown/hidden inside the modal
// itself based on isSquare — re-read the SELECTED variant's shape (currentWide)
// fresh on every open, rather than caching it.
async function openDownloadModalForCurrent() {
  const { openDownloadModal } = await import('./download-modal.js');
  openDownloadModal(ITEM, currentFile(), !currentWide, currentDarkBg);
}

if (dlGroup && ITEM) {
  dlTrigger.addEventListener('click', e => { e.stopPropagation(); openDownloadModalForCurrent(); });
  // FAQ answer for "how do I download as ICO" ships its own button — reuses
  // the same download path as the (easy-to-miss) dropdown item.
  document.getElementById('btn-faq-download-ico')?.addEventListener('click', () => downloadAsIco(ITEM, currentFile()));
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
    if (reportSubmit.disabled) return;
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
