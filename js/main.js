import { showToast, highlight, svgUrl, previewUrl, setAssetBase, setPreviewBase, animateContainerHeight, formatFileSize } from './utils.js';
import './search-shortcut.js';
import {
  colorState, svgRawCache,
  buildColorEditor, updatePreview, updateVariantThumbnails, updateColorsResetBtn,
  pushColorHistory, undoColors, loadRawSvg, applyColorMap, setPreviewHook,
} from './color.js';
import * as glassModule from './liquid-glass.js';
import { svgForExport, svgForFigma, svgToPngBlob, downloadAllAsZip, downloadAsIco, estimateIcoSize } from './export.js';
import { openIcnsModal } from './icns.js';
import { openLiquidModal } from './liquid-glass-modal.js';
import { updateSeoPageLink, slugifyPathPart } from './seo.js';
import { ecosystemLogoMap, ecosystemLabels, loadLogos } from './data.js';
import { categoryIconSvg } from './category-icons.js';
import {
  initVirtual,
  setSectionHidden, loadCardImage, ensureCardMounted, mountVirtualSection,
  updateVirtualizedSections, scheduleVirtualizedSections,
  resetContentScroll,
} from './virtual.js';
import { initSearch, filterCards } from './search.js';
import { openReportModal } from './suggest.js';
import { openHelpModal } from './help.js';
import { LABELS, TOASTS, applyLabels } from './labels.js';

// ── DOM refs ──
const content           = document.getElementById('content');
const scrollTopBtn      = document.getElementById('scroll-top-btn');
const navSections       = document.getElementById('nav-sections');
const navEcosystems     = document.getElementById('nav-ecosystems');
const search            = document.getElementById('search');
const searchCount       = document.getElementById('search-count');
const detailBackdrop    = document.getElementById('detail-backdrop');
const detail            = document.getElementById('detail');
const sidebar           = document.getElementById('sidebar');
const burgerBtn         = document.getElementById('burger-btn');
const navDrawerBackdrop = document.getElementById('nav-drawer-backdrop');
const searchBar         = document.getElementById('search-bar');
const searchSlotDesktop = document.getElementById('search-slot-desktop');
const searchSlotMobile  = document.getElementById('search-slot-mobile');
const layoutMq = matchMedia('(max-width: 768px)');

// ── Global state ──
let totalCards = 0;
const sectionEls   = [];
const ecosystemEls = [];
const allItems     = [];
const cardByItemFile  = new Map();
const cardByItemFigma = new Map();
let activeCard = null;
let openDetailFn;
let currentDisplayType = null;

let copyBtnResetTimer = null;
let copyEmojiBtnResetTimer = null;
let detailPushedState = false;
let isClosingViaButton = false;
let activeVariantCard = null;
let currentVariant = null; // the variant vDef currently shown in the detail panel (for ICO/ICNS export)
let updatePngDownloadSize = null; // set per-variant; recomputes the "Скачать PNG" size readout

function resetCopyBtn() {
  if (copyBtnResetTimer) {
    clearTimeout(copyBtnResetTimer);
    copyBtnResetTimer = null;
    const btn = document.getElementById('btn-copy');
    if (btn) { const span = btn.querySelector('span'); if (span) span.textContent = LABELS.copySvg; btn.disabled = false; }
    const btnPng = document.getElementById('btn-copy-png');
    if (btnPng) { const span = btnPng.querySelector('span'); if (span) span.textContent = LABELS.copyPng; btnPng.disabled = false; }
  }
  if (copyEmojiBtnResetTimer) {
    clearTimeout(copyEmojiBtnResetTimer);
    copyEmojiBtnResetTimer = null;
    const btnEmoji = document.getElementById('btn-copy-emoji');
    if (btnEmoji) { const span = btnEmoji.querySelector('span:last-child'); if (span) span.textContent = LABELS.copyEmoji; btnEmoji.disabled = false; }
  }
}

function triggerConfetti(el, labelText) {
  const r = el.getBoundingClientRect();
  const ghost = document.createElement('div');
  ghost.className = 'confetti-ghost animate';
  ghost.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
  document.body.appendChild(ghost);
  setTimeout(() => ghost.remove(), 1100);

  const span = el.querySelector('span') || el;
  span.textContent = labelText || LABELS.copied;
  el.disabled = true;
  copyBtnResetTimer = setTimeout(() => { resetCopyBtn(); }, 2000);
}

// Per-variant state for the download dropdown (logos only — emoji/icons use a plain ZIP button).
// Square variants expose the full menu (ICO/ICNS/ZIP); wide/full variants collapse to a single
// "Скачать все (ZIP)" trigger since ICO/ICNS are square formats. ICO is built from item.file.
function applyDownloadVariantState(item, isSquare, file = item.file) {
  const group   = document.getElementById('btn-download-all');
  const trigger = document.getElementById('btn-download-trigger');
  const menu    = document.getElementById('btn-download-menu');
  if (!group || !trigger || !menu) return; // old plain button — nothing to configure

  group.classList.toggle('zip-only', !isSquare);
  const label = trigger.querySelector('span');
  if (label) label.textContent = isSquare ? LABELS.dlMore : LABELS.dlZipAll;
  trigger.onclick = isSquare
    ? (e) => { e.stopPropagation(); toggleDownloadMenu(); }
    : (e) => { e.stopPropagation(); downloadAllAsZip(item); };

  const icoSizeEl = document.getElementById('btn-download-ico')?.querySelector('.btn-menu-size');
  if (icoSizeEl && isSquare) {
    icoSizeEl.textContent = '';
    estimateIcoSize(file).then(sz => { if (sz) icoSizeEl.textContent = formatFileSize(sz); });
  }

  const btnLg = document.getElementById('btn-download-lg');
  if (btnLg) btnLg.classList.toggle('hidden', /\.png(\?|$)/i.test(file));
}

// The download dropdown lives inside #detail, which is overflow:auto — an absolute
// menu would be clipped when the panel is scrolled. Position it fixed to the
// viewport (relative to the trigger) so it can overflow the panel, and keep it
// aligned while the panel scrolls/resizes.
function positionDownloadMenu() {
  const menu = document.getElementById('btn-download-menu');
  const trigger = document.getElementById('btn-download-trigger');
  if (!menu || !trigger || !menu.classList.contains('open')) return;
  const tr = trigger.getBoundingClientRect();
  menu.style.position = 'fixed';
  menu.style.left = tr.left + 'px';
  menu.style.width = tr.width + 'px';
  menu.style.right = 'auto';
  menu.style.top = 'auto';
  menu.style.bottom = (window.innerHeight - tr.top + 6) + 'px';
}
function closeDownloadMenu() {
  const menu = document.getElementById('btn-download-menu');
  const trigger = document.getElementById('btn-download-trigger');
  if (menu) { menu.classList.remove('open'); menu.style.cssText = ''; }
  trigger?.classList.remove('open');
}
function toggleDownloadMenu() {
  const menu = document.getElementById('btn-download-menu');
  const trigger = document.getElementById('btn-download-trigger');
  if (!menu) return;
  if (menu.classList.contains('open')) { closeDownloadMenu(); return; }
  menu.classList.add('open');
  trigger?.classList.add('open');
  positionDownloadMenu();
}

// ── Layout helpers ──
function updateScrollTopButton() {
  const contentVisible = content.style.display !== 'none';
  scrollTopBtn.classList.toggle('show', contentVisible && window.scrollY > 360);
}

function placeSearchBar() {
  const slot = layoutMq.matches ? searchSlotMobile : searchSlotDesktop;
  if (slot && searchBar.parentElement !== slot) slot.appendChild(searchBar);
}

function syncBodyScrollLock() {
  if (!layoutMq.matches) { document.body.style.overflow = ''; return; }
  const lock = detail.classList.contains('open') || sidebar.classList.contains('nav-open');
  document.body.style.overflow = lock ? 'hidden' : '';
}

function openNavDrawer() {
  sidebar.classList.add('nav-open');
  navDrawerBackdrop.classList.add('show');
  navDrawerBackdrop.setAttribute('aria-hidden', 'false');
  burgerBtn.setAttribute('aria-expanded', 'true');
  syncBodyScrollLock();
}

function closeNavDrawer() {
  sidebar.classList.remove('nav-open');
  navDrawerBackdrop.classList.remove('show');
  navDrawerBackdrop.setAttribute('aria-hidden', 'true');
  burgerBtn.setAttribute('aria-expanded', 'false');
  syncBodyScrollLock();
}

function syncDetailBackdrop(open) {
  const mobile = layoutMq.matches;
  detailBackdrop.classList.toggle('show', open && mobile);
  detailBackdrop.setAttribute('aria-hidden', open && mobile ? 'false' : 'true');
  syncBodyScrollLock();
}

function setDetailOpen(open) {
  detail.classList.toggle('open', open);
  syncDetailBackdrop(open);
  // No layout recompute here: the panel is always present (fixed), so opening/
  // closing it never changes the grid width. Recomputing would reset reserved
  // section heights and yank the scroll position to the top.
  if (open && !detailPushedState) {
    // Reflect the selected logo in the URL via its anchor id (shareable/deep-link).
    history.pushState({ detail: true }, '', activeCard ? '#' + activeCard.id : '');
    detailPushedState = true;
  }
}

// ── Cards ──
// Stable per-logo anchor id (e.g. "logo-icon-bank-tinkoff"), derived from the
// figma path with the same slug rules as the SEO pages. Lets the detail panel
// scroll straight to a card via its anchor instead of guesswork.
const usedAnchorIds = new Set();
function logoAnchorId(item) {
  const base = 'logo-' + (item.figma || item.file).split('/').map(slugifyPathPart).filter(Boolean).join('-');
  let id = base, n = 2;
  while (usedAnchorIds.has(id)) id = `${base}-${n++}`;
  usedAnchorIds.add(id);
  return id;
}

function buildCard(item, sectionState) {
  const card = document.createElement('div');
  card.id = logoAnchorId(item);
  card.className = 'card loading' + (item.comingSoon ? ' coming-soon' : '');
  card._item = item;
  card._sectionState = sectionState;

  const figmaLow = item.figma.toLowerCase();
  const raw = (item.name + ' ' + (item.tags || '') + ' ' + figmaLow).toLowerCase();
  const extra = raw.split(/\s+/).map(w => w.replace(/-/g, '')).join(' ');
  card.dataset.search = raw + ' ' + extra;

  const wrap = document.createElement('div');
  wrap.className = 'icon-wrap';
  const img = document.createElement('img');
  img.width = 48; img.height = 48;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.alt = item.name;
  img.title = item.figma;
  // Grid thumbnail uses a lightweight WebP preview when available (PNG logos);
  // the full asset (svgUrl) stays the source for the detail panel and export.
  const fullSrc = svgUrl(item.file);
  const previewSrc = previewUrl(item.file);
  img.addEventListener('load', () => card.classList.remove('loading'), { once: true });
  img.addEventListener('error', () => {
    // Graceful degradation: a missing preview falls back to the full asset once.
    if (img.dataset.src !== fullSrc) { img.dataset.src = fullSrc; img.src = fullSrc; return; }
    card.classList.remove('loading');
  });
  img.dataset.src = previewSrc ?? fullSrc;
  if (item.prerendered || item.file.endsWith('.png')) img.classList.add('prerendered');
  wrap.appendChild(img);
  card.appendChild(wrap);

  if (item.comingSoon) {
    const badge = document.createElement('div');
    badge.className = 'card-badge';
    badge.textContent = 'Скоро';
    card.appendChild(badge);
  }

  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = item.name;
  card.appendChild(label);

  const pathEl = document.createElement('div');
  pathEl.className = 'card-path';
  pathEl.textContent = item.figma;
  card.appendChild(pathEl);

  card.addEventListener('click', () => openDetailFn(item, card));
  return card;
}

function ensureSectionCards(sectionState) {
  if (sectionState.cardsBuilt) return;
  sectionState.cardsBuilt = true;
  const cards = sectionState.group.items.map(item => {
    const card = buildCard(item, sectionState);
    cardByItemFile.set(item.file, card);
    cardByItemFigma.set(item.figma, card);
    return card;
  });
  sectionState.cards = cards;
  sectionState.visibleCards = cards;
}

// ── Navigation ──
function setActive(sectionName) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  if (sectionName === 'all') {
    document.querySelector('[data-section="all"]').classList.add('active');
    sectionEls.forEach((s, i) => {
      ensureSectionCards(s);
      const { sec, grid, cards } = s;
      cards.forEach(c => c.classList.remove('hidden'));
      sectionEls[i].visibleCards = cards;
      grid.style.height = '';
      if (sectionEls[i].mounted) { grid.replaceChildren(...cards); cards.forEach(loadCardImage); }
      setSectionHidden(sec, false);
    });
  } else {
    const found = sectionEls.find(s => s.group.section === sectionName);
    if (found) {
      found.nav.classList.add('active');
      sectionEls.forEach((s, i) => {
        ensureSectionCards(s);
        const { sec, grid, group, cards } = s;
        cards.forEach(c => c.classList.remove('hidden'));
        sectionEls[i].visibleCards = cards;
        grid.style.height = '';
        if (sectionEls[i].mounted) { grid.replaceChildren(...cards); cards.forEach(loadCardImage); }
        setSectionHidden(sec, group.section !== sectionName);
      });
    }
  }
  resetContentScroll();
}

function setActiveEcosystem(ecosystem) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const found = ecosystemEls.find(e => e.key === ecosystem);
  if (found) found.nav.classList.add('active');

  sectionEls.forEach(section => {
    ensureSectionCards(section);
    let any = false;
    const visibleCards = [];
    section.cards.forEach(card => {
      const match = card._item.ecosystem === ecosystem;
      card.classList.toggle('hidden', !match);
      if (match) { any = true; visibleCards.push(card); }
    });
    section.visibleCards = visibleCards;
    section.grid.style.height = '';
    if (section.mounted) { section.grid.replaceChildren(...visibleCards); visibleCards.forEach(loadCardImage); }
    setSectionHidden(section.sec, !any);
  });

  document.getElementById('empty').classList.remove('show');
  document.getElementById('content').style.display = '';
  resetContentScroll();
}

// ── Variant selection ──
const TYPE_LABELS = {
  svg:     'SVG',
  full:    'Full',
  full_en: 'Full EN',
  png:     'PNG Icon',
};

function isFullFile(file) {
  return /-full(\.[^.]+)?$/.test(file);
}

function getDisplayType(vDef) {
  if (vDef.type === '_original' || vDef.type === 'svg') return 'square';
  if (vDef.type === 'full' || vDef.type === 'full_en') return 'wide';
  return isFullFile(vDef.file) ? 'wide' : 'square';
}

async function selectVariant(vDef, vcEl, item, allVariants, colorEditingDisabled) {
  if (activeVariantCard) activeVariantCard.classList.remove('active');
  activeVariantCard = vcEl;
  currentVariant = vDef;
  updatePngDownloadSize = null; // reset; only the SVG branch wires it up
  if (vcEl) vcEl.classList.add('active');

  const detailFigmaEl = document.getElementById('detail-figma');
  detailFigmaEl.textContent = item.figma;

  const isPng = vDef.file.endsWith('.png');
  const baseName = item.figma.split('/').pop().toLowerCase();
  const suffix   = (vDef.type === '_original' || vDef.type === 'png') ? '' : '-' + (vDef.type ?? vDef.label ?? '').replace(/_/g, '-').toLowerCase();

  const btnCopy        = document.getElementById('btn-copy');
  const btnCopyPng     = document.getElementById('btn-copy-png');
  const btnDownloadSvg = document.getElementById('btn-download');
  const btnDownloadPng = document.getElementById('btn-download-png');
  const btnCopyEmoji   = document.getElementById('btn-copy-emoji');
  const detailImg      = document.getElementById('detail-img');
  const preview        = detailImg.closest('.detail-preview');
  const controls       = document.getElementById('detail-controls');
  const colorsPanel    = document.getElementById('colors-panel');
  const colorsDivider  = document.getElementById('colors-divider');

  const newDisplayType = getDisplayType(vDef);
  const needsFade = currentDisplayType !== null && currentDisplayType !== newDisplayType;
  currentDisplayType = newDisplayType;

  if (needsFade) detailImg.style.opacity = '0';

  const emojiChar = (() => {
    const m = vDef.file.match(/_([0-9a-f]+(?:-[0-9a-f]+)*)\.(png|svg)$/i);
    if (!m) return null;
    try { return m[1].split('-').map(cp => String.fromCodePoint(parseInt(cp, 16))).join(''); }
    catch { return null; }
  })();

  if (btnCopyEmoji) {
    btnCopyEmoji.classList.toggle('hidden', !emojiChar);
    btnCopyPng.classList.toggle('btn-primary', !emojiChar);
    btnCopyPng.classList.toggle('btn-secondary', !!emojiChar);
    btnCopy.classList.toggle('btn-primary', !emojiChar);
    btnCopy.classList.toggle('btn-secondary', !!emojiChar);
    if (emojiChar) {
      const charEl = document.getElementById('btn-copy-emoji-char');
      if (charEl) charEl.textContent = emojiChar;
      btnCopyEmoji.onclick = () => {
        navigator.clipboard.writeText(emojiChar).then(() => {
          const r = btnCopyEmoji.getBoundingClientRect();
          const ghost = document.createElement('div');
          ghost.className = 'confetti-ghost animate';
          ghost.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
          document.body.appendChild(ghost);
          setTimeout(() => ghost.remove(), 1100);
          const textSpan = btnCopyEmoji.querySelector('span:last-child');
          textSpan.textContent = LABELS.copied;
          btnCopyEmoji.disabled = true;
          clearTimeout(copyEmojiBtnResetTimer);
          copyEmojiBtnResetTimer = setTimeout(() => { textSpan.textContent = LABELS.copyEmoji; btnCopyEmoji.disabled = false; copyEmojiBtnResetTimer = null; }, 2000);
          showToast(TOASTS.copiedEmoji(emojiChar));
        });
      };
    }
  }

  if (isPng) {
    glassModule.hide();
    animateContainerHeight(controls, () => {
      btnCopy.classList.add('hidden');
      btnDownloadSvg.classList.add('hidden');
      btnCopyPng.classList.remove('hidden');
      colorsPanel.classList.add('colors-hidden');
      colorsDivider.classList.add('colors-hidden');
    });

    const applyPng = () => {
      detailImg.src = svgUrl(vDef.file);
      detailImg.classList.remove('square');
      if (!vDef.type && isFullFile(vDef.file)) detailImg.classList.remove('prerendered');
      else detailImg.classList.add('prerendered');
      const previewEl = detailImg.closest('.detail-preview');
      if (previewEl?.classList.contains('loading')) {
        const done = () => previewEl.classList.remove('loading');
        detailImg.addEventListener('load', done, { once: true });
        detailImg.addEventListener('error', done, { once: true });
      }
    };

    if (needsFade) {
      setTimeout(() => {
        animateContainerHeight(preview, applyPng, detailImg);
        requestAnimationFrame(() => { detailImg.style.opacity = ''; });
      }, 120);
    } else {
      animateContainerHeight(preview, applyPng, detailImg);
    }

    const getPngBlob = async () => {
      const resp = await fetch(svgUrl(vDef.file));
      const buf = await resp.arrayBuffer();
      return new Blob([buf], { type: 'image/png' });
    };
    const btnSizePng = btnDownloadPng.querySelector('.btn-size');
    if (btnSizePng) { btnSizePng.textContent = ''; getPngBlob().then(b => { btnSizePng.textContent = formatFileSize(b.size); }).catch(() => {}); }
    btnCopyPng.onclick = async () => {
      btnCopyPng.disabled = true;
      try {
        const blob = await getPngBlob();
        const file = new File([blob], `${item.name}.png`, { type: 'image/png' });
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': file })]);
        triggerConfetti(btnCopyPng);
        showToast(TOASTS.copiedPng);
      } catch (e) {
        btnCopyPng.disabled = false;
        showToast(TOASTS.copyPngError);
      }
    };
    btnDownloadPng.onclick = async () => {
      const blob = await getPngBlob();
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: baseName + suffix + '.png' });
      a.click(); URL.revokeObjectURL(a.href);
      showToast(TOASTS.downloaded(baseName + suffix + '.png'));
    };
    const isSquarePng = vDef.type === '_original' || vDef.type === 'png'
      || (!vDef.type && !isFullFile(vDef.file));
    applyDownloadVariantState(item, isSquarePng, vDef.file);
    return;
  }

  // SVG-ветка
  const isSquare = vDef.type === '_original' || vDef.type === 'svg' || (!vDef.type && !isFullFile(vDef.file));
  const rawSvg = await loadRawSvg(vDef.file);

  if (!colorEditingDisabled && !Object.keys(colorState.colorMap).length) {
    const allSvgText = allVariants.map(v => svgRawCache[v.file] || '').join('\n');
    buildColorEditor(allSvgText || rawSvg);
  }

  animateContainerHeight(controls, () => {
    btnCopy.classList.remove('hidden');
    btnDownloadSvg.classList.remove('hidden');
    btnCopyPng.classList.add('hidden');
    colorsPanel.classList.toggle('colors-hidden', colorEditingDisabled);
    colorsDivider.classList.toggle('colors-hidden', colorEditingDisabled);
  });

  const applysvg = () => {
    detailImg.classList.remove('prerendered');
    updatePreview(rawSvg, isSquare);
  };

  if (needsFade) {
    setTimeout(() => {
      animateContainerHeight(preview, applysvg);
      requestAnimationFrame(() => { detailImg.style.opacity = ''; });
    }, 120);
  } else {
    animateContainerHeight(preview, applysvg);
  }

  const getExportSvg = () => applyColorMap(rawSvg);

  // Show glass panel for SVG logos only (not emoji)
  if (_pathSection !== 'emoji') {
    glassModule.show(getExportSvg());
  } else {
    glassModule.hide();
  }

  // The exported PNG is either the plain raster of the SVG, or — when Liquid Glass
  // is on — the rendered squircle icon. Shared by the size readout, copy & download.
  const getPngBlob = () => glassModule.isEnabled()
    ? glassModule.getBlob(1024)
    : svgToPngBlob(getExportSvg(), { square: isSquare, size: 1000 });

  const btnSizeSvg = btnDownloadSvg.querySelector('.btn-size');
  if (btnSizeSvg) btnSizeSvg.textContent = formatFileSize(new Blob([svgForExport(getExportSvg(), isSquare)]).size);
  const btnSizePng = btnDownloadPng.querySelector('.btn-size');
  updatePngDownloadSize = () => {
    if (!btnSizePng) return;
    btnSizePng.textContent = '';
    Promise.resolve(getPngBlob()).then(b => { if (b) btnSizePng.textContent = formatFileSize(b.size); }).catch(() => {});
  };
  updatePngDownloadSize();
  applyDownloadVariantState(item, isSquare, vDef.file);

  btnCopy.onclick = () => {
    navigator.clipboard.writeText(svgForFigma(getExportSvg(), item, isSquare))
      .then(() => { triggerConfetti(btnCopy); showToast(TOASTS.copiedSvg); })
      .catch(() => showToast(TOASTS.copyError));
  };
  btnDownloadSvg.onclick = () => {
    const blob = new Blob([svgForExport(getExportSvg(), isSquare)], { type: 'image/svg+xml' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: baseName + suffix + '.svg' });
    a.click(); URL.revokeObjectURL(a.href);
    showToast(TOASTS.downloaded(baseName + suffix + '.svg'));
  };
  btnCopyPng.onclick = async () => {
    btnCopyPng.disabled = true;
    try {
      const blob = await getPngBlob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': new File([blob], `${item.name}.png`, { type: 'image/png' }) })]);
      triggerConfetti(btnCopyPng);
      showToast(TOASTS.copiedPng);
    } catch (e) {
      showToast(TOASTS.copyPngError);
    } finally {
      btnCopyPng.disabled = false;
    }
  };
  btnDownloadPng.onclick = async () => {
    const pngBlob = await getPngBlob();
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(pngBlob), download: baseName + suffix + '.png' });
    a.click(); URL.revokeObjectURL(a.href);
    showToast(TOASTS.downloaded(baseName + suffix + '.png'));
  };
}

// ── Detail panel ──
function scrollCardIntoView(card) {
  ensureCardMounted(card);
  // A smooth scroll races with virtual sections mounting/resizing along the way
  // (their reserved heights are only estimates) — the animation would land off
  // target and blank sections would flash past. So pre-mount every section
  // between the current viewport and the target: their heights become real up
  // front, nothing resizes mid-flight, and the smooth scroll lands exactly.
  const targetIdx = sectionEls.indexOf(card._sectionState);
  if (targetIdx !== -1) {
    let currentIdx = 0;
    for (let i = 0; i < sectionEls.length; i++) {
      if (sectionEls[i].sec.getBoundingClientRect().bottom > 0) { currentIdx = i; break; }
    }
    for (let i = Math.min(currentIdx, targetIdx); i <= Math.max(currentIdx, targetIdx); i++) {
      mountVirtualSection(sectionEls[i]);
    }
  }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  card.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
}

function closeDetail() {
  setDetailOpen(false);
  if (activeCard) { activeCard.classList.remove('active'); activeCard = null; }
  if (detailPushedState) {
    detailPushedState = false;
    isClosingViaButton = true;
    history.back();
  }
}

function isFlagItem(item) {
  return item.figma?.startsWith('Icon/Flag/');
}

openDetailFn = function (item, card) {
  if (layoutMq.matches) closeNavDrawer();

  if (activeCard === card) { closeDetail(); return; }
  resetCopyBtn();
  if (activeCard) activeCard.classList.remove('active');
  activeCard = card;
  card.classList.add('active');

  // Selecting a logo (e.g. from the ecosystem block lower in the panel) scrolls
  // the panel's own scroll back to the top so its info starts from the preview.
  detail.scrollTop = 0;

  const detailImg      = document.getElementById('detail-img');
  const detailName     = document.getElementById('detail-name');
  const detailFigmaEl  = document.getElementById('detail-figma');
  const variantsGrid   = document.getElementById('variants-grid');
  const detailVariants = document.getElementById('detail-variants');

  detailImg.src = svgUrl(item.file);
  detailImg.alt = item.name;
  detailImg.classList.add('square');
  detailImg.classList.remove('prerendered');
  detailImg.closest('.detail-preview').classList.add('loading');
  detailName.textContent = item.name;
  detailFigmaEl.textContent = item.figma;

  const detailActionsEl     = document.getElementById('detail-actions');
  const detailActionsHelpEl = document.getElementById('detail-actions-help');
  const detailActionsLabel  = document.getElementById('detail-actions-label');
  const reportBtn = document.getElementById('btn-report-outdated');
  if (item.comingSoon) {
    detailActionsEl.style.display = 'none';
    detailActionsHelpEl.style.display = '';
    detailActionsLabel.style.display = 'none';
    document.getElementById('btn-help').onclick = () => openHelpModal(item.name);
    if (reportBtn) reportBtn.classList.add('hidden');
  } else {
    detailActionsEl.style.display = '';
    detailActionsHelpEl.style.display = 'none';
    detailActionsLabel.style.display = '';
    if (reportBtn) {
      reportBtn.classList.remove('hidden');
      reportBtn.onclick = () => openReportModal(item.name);
    }
  }

  // Reset color state for new logo
  colorState.colorMap = {};
  colorState.colorEditorSourceSvg = '';
  colorState.colorHistoryNeedsInit = true;
  const colorEditingDisabled = isFlagItem(item) || !!item.comingSoon || _pathSection === 'emoji';

  const colorsPanel    = document.getElementById('colors-panel');
  const colorsDivider  = document.getElementById('colors-divider');
  const colorsHeader   = document.getElementById('colors-header');
  const colorsSection  = document.getElementById('colors-section');
  colorsPanel.classList.toggle('colors-hidden', colorEditingDisabled);
  colorsDivider.classList.toggle('colors-hidden', colorEditingDisabled);
  colorsHeader.classList.remove('open');
  colorsSection.classList.add('hidden');
  colorsHeader.onclick = () => {
    if (colorEditingDisabled || !colorsSection.children.length) return;
    colorsHeader.classList.toggle('open');
    colorsSection.classList.toggle('hidden');
  };

  // Variant definitions
  variantsGrid.innerHTML = '';
  const originalLabel = (() => {
    if (item.file.endsWith('.png')) {
      const vendor = item.file.split('/')[0];
      if (vendor && vendor !== item.file) return vendor.charAt(0).toUpperCase() + vendor.slice(1);
      return 'App Icon';
    }
    return 'SVG Icon';
  })();
  const rawVariants = Array.isArray(item.variants) ? item.variants : [];
  const allVariants = rawVariants.length > 0
    ? [
        { label: originalLabel, type: '_original', file: item.file },
        ...rawVariants.map(v => ({ ...v, label: v.label ?? TYPE_LABELS[v.type] ?? v.type ?? '' })),
      ]
    : [];

  document.getElementById('colors-reset-btn').onclick = (e) => {
    e.stopPropagation();
    if (colorEditingDisabled) return;
    if (!colorState.colorUndoRedo) pushColorHistory();
    for (const key of Object.keys(colorState.colorMap)) colorState.colorMap[key] = key;
    const allSvgForReset = allVariants.map(v => svgRawCache[v.file] || '').join('\n');
    buildColorEditor(allSvgForReset || colorState.currentRawSvg);
    if (colorState.currentRawSvg) updatePreview(colorState.currentRawSvg, colorState.currentIsSquare);
    updateVariantThumbnails();
    updateColorsResetBtn();
    colorsSection.classList.remove('hidden');
    colorsHeader.classList.add('open');
  };

  const downloadAllBtn = document.getElementById('btn-download-all');
  // New dropdown (logos) exposes ICO/ICNS for any logo → always available.
  // Old plain button (emoji/icons) is ZIP-only → keep original "show when >1 file" rule.
  const hasDownloadDropdown = !!document.getElementById('btn-download-trigger');
  const downloadableSvgCount = allVariants.length || 1;

  animateContainerHeight(detailVariants, () => {
    detailVariants.classList.toggle('hidden', allVariants.length === 0);
    downloadAllBtn.classList.toggle('hidden', !(hasDownloadDropdown || downloadableSvgCount > 1));
  });

  // Estimate ZIP size in background
  const btnSizeZip = (document.getElementById('btn-download-zip') || downloadAllBtn)?.querySelector('.btn-size');
  if (btnSizeZip) btnSizeZip.textContent = ''; // clear stale size from a previously-opened logo
  if (btnSizeZip && downloadableSvgCount > 1) {
    (async () => {
      const variants = allVariants.length > 0
        ? allVariants
        : [{ type: '_original', file: item.file }];
      let total = 0;
      for (const v of variants) {
        try {
          if (v.file.endsWith('.png')) {
            const resp = await fetch(svgUrl(v.file));
            const buf = await resp.arrayBuffer();
            total += buf.byteLength * 2; // png once + approx same for zip entry
          } else {
            const raw = await loadRawSvg(v.file);
            const sq = v.type === '_original' || v.type === 'svg' || (!v.type && !isFullFile(v.file));
            total += new Blob([svgForExport(applyColorMap(raw), sq)]).size;
            const png = await svgToPngBlob(applyColorMap(raw), { square: sq, size: 512 });
            total += png.size;
          }
        } catch { /* skip */ }
      }
      if (total > 0 && !downloadAllBtn.classList.contains('hidden')) {
        btnSizeZip.textContent = '~' + formatFileSize(total);
      }
    })();
  }

  activeVariantCard = null;
  currentVariant = null;

  // Reset variant thumbnails list
  colorState.variantImgEls = [];
  const variantCards = [];

  allVariants.forEach(vDef => {
    const vc = document.createElement('div');
    const isWide = vDef.type === 'full' || vDef.type === 'full_en' || (!vDef.type && isFullFile(vDef.file));
    const isSquareVariant = vDef.type === '_original' || vDef.type === 'svg' || vDef.type === 'png'
      || (!vDef.type && !isFullFile(vDef.file));
    vc.className = 'variant-card' + (isWide ? ' wide' : isSquareVariant ? ' favicon' : '');
    const vi = document.createElement('img');
    vi.src = svgUrl(vDef.file);
    if (vDef.file.endsWith('.png')) vi.classList.add('prerendered');
    colorState.variantImgEls.push({ file: vDef.file, imgEl: vi });
    const vl = document.createElement('div');
    vl.className = 'variant-label';
    vl.textContent = vDef.label;
    vc.append(vi, vl);
    vc.addEventListener('click', () => {
      detail.scrollTop = 0;
      selectVariant(vDef, vc, item, allVariants, colorEditingDisabled);
    });
    variantsGrid.appendChild(vc);
    variantCards.push({ vDef, vc });
  });

  const svgOnlyVariants = allVariants.filter(v => !v.file.endsWith('.png'));
  Promise.all(svgOnlyVariants.map(v => loadRawSvg(v.file))).then(() => {
    if (variantCards.length > 0) {
      const { vDef, vc } = variantCards[0];
      selectVariant(vDef, vc, item, allVariants, colorEditingDisabled);
    }
  });

  if (!allVariants.length) {
    selectVariant({ type: '_original', file: item.file }, null, item, allVariants, colorEditingDisabled);
  }

  // Ecosystem block
  const ecosystemEl      = document.getElementById('detail-ecosystem');
  const ecosystemGrid    = document.getElementById('ecosystem-grid');
  const ecosystemLabelEl = document.getElementById('ecosystem-label');
  if (item.ecosystem) {
    const members = allItems.filter(i => i.ecosystem === item.ecosystem);
    if (members.length > 1) {
      ecosystemLabelEl.textContent = ecosystemLabels[item.ecosystem] || 'Экосистема';
      const sameEcosystem = ecosystemGrid.dataset.ecosystem === item.ecosystem;
      if (!sameEcosystem) {
        ecosystemGrid.innerHTML = '';
        ecosystemGrid.dataset.ecosystem = item.ecosystem;
        for (const sib of members) {
          const ec = document.createElement('div');
          ec.className = 'ecosystem-card';
          ec.dataset.file = sib.file;
          ec.dataset.figma = sib.figma;
          ec.title = sib.figma;
          const ei = document.createElement('img');
          ei.src = svgUrl(sib.file);
          ei.alt = sib.name;
          ei.loading = 'lazy';
          ei.decoding = 'async';
          const el = document.createElement('div');
          el.className = 'ecosystem-label';
          el.textContent = sib.name;
          ec.append(ei, el);
          ec.addEventListener('click', () => {
            const sibCard = cardByItemFigma.get(sib.figma) || cardByItemFile.get(sib.file);
            if (!sibCard) return;
            if (sibCard.classList.contains('hidden') || sibCard.closest('.section')?.classList.contains('hidden')) {
              search.value = '';
              filterCards('');
              setActive('all');
              requestAnimationFrame(() => openDetailFn(sib, sibCard));
              return;
            }
            openDetailFn(sib, sibCard);
          });
          ecosystemGrid.appendChild(ec);
        }
      }
      ecosystemGrid.querySelectorAll('.ecosystem-card').forEach(ec => {
        ec.classList.toggle('active', ec.dataset.figma === item.figma);
      });
      ecosystemEl.classList.remove('hidden');
    } else {
      ecosystemGrid.innerHTML = '';
      delete ecosystemGrid.dataset.ecosystem;
      ecosystemEl.classList.add('hidden');
    }
  } else {
    ecosystemGrid.innerHTML = '';
    delete ecosystemGrid.dataset.ecosystem;
    ecosystemEl.classList.add('hidden');
  }

  // Note
  const noteEl   = document.getElementById('detail-note');
  const noteText = document.getElementById('detail-note-text');
  if (item.note) { noteText.textContent = item.note; noteEl.classList.remove('hidden'); }
  else noteEl.classList.add('hidden');

  // Brand link
  const brandLinkEl  = document.getElementById('detail-brand-link');
  const btnBrandLink = document.getElementById('btn-brand-link');
  if (item.brandUrl) { btnBrandLink.href = item.brandUrl; brandLinkEl.classList.remove('hidden'); }
  else brandLinkEl.classList.add('hidden');

  updateSeoPageLink(item, () => activeCard?._item);

  if (!detail.classList.contains('open')) {
    setDetailOpen(true);
  } else {
    syncDetailBackdrop(true);
    // Panel already open, switching logos — update the hash in place (no new
    // history entry, so one Back still closes the panel).
    if (detailPushedState) history.replaceState({ detail: true }, '', '#' + card.id);
  }

  // Dropdown wiring
  const downloadMenu = document.getElementById('btn-download-menu');
  const downloadTrigger = document.getElementById('btn-download-trigger');
  if (downloadTrigger && downloadMenu) {
    downloadTrigger.onclick = (e) => { e.stopPropagation(); toggleDownloadMenu(); };
  }
  const btnIco = document.getElementById('btn-download-ico');
  if (btnIco) btnIco.onclick = () => { closeDownloadMenu(); downloadAsIco(item, currentVariant?.file ?? item.file); };
  const btnIcns = document.getElementById('btn-download-icns');
  if (btnIcns) btnIcns.onclick = () => { closeDownloadMenu(); openIcnsModal(item, currentVariant?.file ?? item.file); };
  const btnLg = document.getElementById('btn-download-lg');
  if (btnLg) btnLg.onclick = () => { closeDownloadMenu(); openLiquidModal(item, currentVariant?.file ?? item.file); };
  const btnZip = document.getElementById('btn-download-zip');
  if (btnZip) {
    // New dropdown — ZIP bundles SVG+PNG (+ICO+ICNS for square logos), so it always
    // has content and stays enabled even for single-file logos.
    btnZip.onclick = () => { closeDownloadMenu(); downloadAllAsZip(item); };
    btnZip.classList.remove('btn-menu-item--disabled');
  } else {
    // Old plain button (emoji/icons) — the button itself triggers the ZIP.
    downloadAllBtn.onclick = downloadableSvgCount > 1 ? () => downloadAllAsZip(item) : null;
  }

  scrollCardIntoView(card);
};

// ── Event listeners ──
document.addEventListener('click', (e) => {
  const menu = document.getElementById('btn-download-menu');
  if (menu?.classList.contains('open') && !e.target.closest('#btn-download-all') && !e.target.closest('#btn-download-menu')) {
    closeDownloadMenu();
  }
});

// Keep the fixed-position menu aligned with its trigger while the detail panel scrolls.
document.getElementById('detail')?.addEventListener('scroll', positionDownloadMenu, { passive: true });
window.addEventListener('resize', positionDownloadMenu);

window.addEventListener('scroll', () => {
  updateScrollTopButton();
  scheduleVirtualizedSections();
}, { passive: true });

scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
detailBackdrop.addEventListener('click', closeDetail);
document.getElementById('detail-close').onclick = closeDetail;

burgerBtn.addEventListener('click', () => {
  if (sidebar.classList.contains('nav-open')) closeNavDrawer(); else openNavDrawer();
});
navDrawerBackdrop.addEventListener('click', closeNavDrawer);

layoutMq.addEventListener('change', () => {
  placeSearchBar();
  if (!layoutMq.matches) closeNavDrawer();
  syncDetailBackdrop(detail.classList.contains('open'));
  sectionEls.forEach(section => {
    section.gridHeight = 0;
    section.rowHeight = 0;
    if (section.mounted) section.grid.style.height = '';
  });
  scheduleVirtualizedSections();
});

search.addEventListener('input', () => {
  const q = search.value.toLowerCase().trim();
  filterCards(q);
  if (q) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelector('[data-section="all"]').classList.add('active');
  }
});

document.addEventListener('keydown', (e) => {
  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key === 'z' && !e.shiftKey) {
    if (document.activeElement === search) return;
    const colorsPanel = document.getElementById('colors-panel');
    if (detail.classList.contains('open') && !colorsPanel.classList.contains('colors-hidden')) {
      if (undoColors()) { e.preventDefault(); showToast(TOASTS.colorsUndone); }
    }
    return;
  }
  // Автофокус в поиск при наборе букв вне инпутов
  if (!mod && !e.altKey && e.key.length === 1 && /\S/.test(e.key)) {
    const tag = document.activeElement?.tagName;
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;
    if (!isInput) {
      search.focus();
      // символ сам попадёт в инпут через нативный ввод
    }
  }
  if (e.key !== 'Escape') return;
  if (layoutMq.matches && sidebar.classList.contains('nav-open')) { closeNavDrawer(); return; }
  if (detail.classList.contains('open')) {
    closeDetail();
  } else if (search.value) {
    search.value = '';
    filterCards('');
  }
});

window.addEventListener('popstate', () => {
  if (isClosingViaButton) { isClosingViaButton = false; return; }
  if (!detail.classList.contains('open')) return;
  detailPushedState = false;
  detail.classList.remove('open');
  syncDetailBackdrop(false);
  if (activeCard) { activeCard.classList.remove('active'); activeCard = null; }
});

// ── Init ──
// We drive scrolling ourselves (resetContentScroll on category switch,
// scrollCardIntoView on open). The detail panel's pushState/back is only a
// back-button hook — let the browser NOT restore scroll on it, or closing the
// panel would yank the window back to where it was before opening.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

applyLabels(); // single source of button texts → js/labels.js
glassModule.init({
  // Glass on → it's a rendered PNG icon: hide the SVG copy/download, show PNG copy.
  // (Download PNG stays visible; its handler already produces the glass render.)
  onToggle(on) {
    document.getElementById('btn-copy').classList.toggle('hidden', on);
    document.getElementById('btn-download').classList.toggle('hidden', on);
    document.getElementById('btn-copy-png').classList.toggle('hidden', !on);
    updatePngDownloadSize?.();
  },
});
setPreviewHook(styledSvg => { if (glassModule.isEnabled()) glassModule.refresh(styledSvg); });

placeSearchBar();

initVirtual({ sectionEls, content, layoutMq, search, ensureSectionCards, onScrollTopUpdate: updateScrollTopButton });
initSearch({ sectionEls, searchCount, ensureSectionCards, getTotalCards: () => totalCards, updateScrollTopButton });

const _pathSection = window.__ASSET_SECTION__ ?? (location.pathname.split('/').filter(Boolean).at(-1) ?? 'logos');
const _manifestBase = window.__MANIFEST_BASE__ ?? './';
const _assetBase = window.__ASSET_BASE__ ?? ('../assets/' + _pathSection);
setAssetBase(_assetBase);
// Lightweight WebP grid previews exist only for logos (see build-webp-previews.js).
if (_pathSection === 'logos') setPreviewBase(_assetBase + '/previews');
document.body.dataset.section = _pathSection;

loadLogos(_manifestBase).then(logos => {
  let readyTotal = 0;
  for (const group of logos) {
    const readyCount = group.items.filter(item => !item.comingSoon).length;
    readyTotal += readyCount;
    totalCards += group.items.length;
    group.items.forEach(item => allItems.push(item));

    const nav = document.createElement('div');
    nav.className = 'nav-item';
    nav.dataset.section = group.section;
    nav.dataset.slug = group.slug;
    nav.innerHTML = `${categoryIconSvg(group.slug)}<span class="nav-label">${group.section}</span><span class="count">${readyCount}</span>`;
    navSections.appendChild(nav);

    const sec = document.createElement('div');
    sec.className = 'section';
    sec.dataset.section = group.section;
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = group.section;
    sec.appendChild(title);
    const grid = document.createElement('div');
    grid.className = 'grid';
    sec.appendChild(grid);
    content.appendChild(sec);

    sectionEls.push({
      nav, sec, grid, group,
      cards: [], visibleCards: [],
      cardsBuilt: false, mounted: false,
      gridHeight: 0, rowHeight: 0,
    });
  }

  // «Показать ещё» для категорий
  (function () {
    const VISIBLE = 5;
    const items = Array.from(navSections.querySelectorAll('.nav-item'));
    if (items.length <= VISIBLE) return;
    items.slice(VISIBLE).forEach(el => { el.style.display = 'none'; });
    const btn = document.createElement('button');
    btn.className = 'show-more-btn';
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg><span>Показать ещё ${items.length - VISIBLE}</span>`;
    navSections.appendChild(btn);
    btn.addEventListener('click', () => {
      const expanded = btn.classList.toggle('expanded');
      items.slice(VISIBLE).forEach(el => { el.style.display = expanded ? '' : 'none'; });
      btn.querySelector('span').textContent = expanded ? 'Скрыть' : `Показать ещё ${items.length - VISIBLE}`;
    });
  })();

  const ecosystemCounts = allItems.reduce((acc, item) => {
    if (item.ecosystem) acc.set(item.ecosystem, (acc.get(item.ecosystem) || 0) + (item.comingSoon ? 0 : 1));
    return acc;
  }, new Map());

  const ECOSYSTEM_ORDER = [
    'yandex', 'sber', 'vk', 'tinkoff', 'google', 'alfa', 'ozon', 'wildberries',
    'meta', 'apple', 'mts', 'nspk', 'sovcombank', 'openai', 'anthropic', 'microsoft',
    'x5', 'avito', 'kontur', 'adobe', 'PlayStation',
  ];
  [...ecosystemCounts.entries()]
    .sort(([a], [b]) => {
      const ai = ECOSYSTEM_ORDER.indexOf(a);
      const bi = ECOSYSTEM_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return (ecosystemLabels[a] || a).localeCompare(ecosystemLabels[b] || b, 'ru');
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .forEach(([key, count]) => {
      const nav = document.createElement('div');
      nav.className = 'nav-item';
      nav.dataset.ecosystem = key;
      const logoFile = ecosystemLogoMap[key];
      const logoHtml = logoFile
        ? `<img class="nav-logo" src="${svgUrl(logoFile)}" width="16" height="16" alt="" aria-hidden="true">`
        : `<span class="nav-logo nav-logo-initial">${(ecosystemLabels[key] || key).slice(0, 1)}</span>`;
      nav.innerHTML = `${logoHtml}<span class="nav-label">${ecosystemLabels[key] || key}</span><span class="count">${count}</span>`;
      navEcosystems.appendChild(nav);
      ecosystemEls.push({ nav, key });
    });

  (function () {
    const VISIBLE = 10;
    const items = Array.from(navEcosystems.querySelectorAll('.nav-item'));
    if (items.length <= VISIBLE) return;
    items.slice(VISIBLE).forEach(el => { el.style.display = 'none'; });
    const btn = document.createElement('button');
    btn.className = 'show-more-btn';
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg><span>Показать ещё ${items.length - VISIBLE}</span>`;
    navEcosystems.appendChild(btn);
    btn.addEventListener('click', () => {
      const expanded = btn.classList.toggle('expanded');
      items.slice(VISIBLE).forEach(el => { el.style.display = expanded ? '' : 'none'; });
      btn.querySelector('span').textContent = expanded ? 'Скрыть' : `Показать ещё ${items.length - VISIBLE}`;
    });
  })();

  document.getElementById('ecosystems-label').classList.toggle('hidden', ecosystemEls.length === 0);

  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      search.value = '';
      filterCards('');
      if (el.dataset.ecosystem) setActiveEcosystem(el.dataset.ecosystem);
      else setActive(el.dataset.section);
      if (layoutMq.matches) closeNavDrawer();
    });
  });

  updateVirtualizedSections();

  if (totalCards === 0) {
    document.getElementById('empty-section').classList.add('show');
  }

  window.__logosReadyCount = readyTotal;
  document.dispatchEvent(new CustomEvent('logos-count-ready', { detail: readyTotal }));

  requestIdleCallback
    ? requestIdleCallback(() => sectionEls.forEach(s => ensureSectionCards(s)), { timeout: 2000 })
    : setTimeout(() => sectionEls.forEach(s => ensureSectionCards(s)), 300);

  // Pre-filter by category: via ?s=<slug> (breadcrumbs) or window.__CAT_SLUG__ (category pages)
  const sParam = new URLSearchParams(location.search).get('s') || window.__CAT_SLUG__;
  if (sParam) {
    const found = sectionEls.find(s => s.group.slug === sParam);
    if (found) setActive(found.group.section);
  }

  // Pre-fill search: via ?q=<query> (from SEO page search redirect)
  const qParam = new URLSearchParams(location.search).get('q');
  if (qParam) {
    search.value = qParam;
    filterCards(qParam.toLowerCase().trim());
    search.focus();
  }

  // Deep-link: #logo-... in the URL opens that logo's panel and scrolls to it.
  const hashId = decodeURIComponent(location.hash.slice(1));
  if (hashId.startsWith('logo-')) {
    // Re-base the current entry without the hash so closing returns here in-page
    // (then openDetailFn re-pushes the hash entry on top).
    history.replaceState(null, '', location.pathname + location.search);
    let target = null;
    for (const s of sectionEls) {
      ensureSectionCards(s);
      target = s.cards.find(c => c.id === hashId);
      if (target) break;
    }
    if (target) openDetailFn(target._item, target);
  }
});
