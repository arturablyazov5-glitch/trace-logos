import { showToast, highlight, svgUrl, previewUrl, setAssetBase, setPreviewBase, animateContainerHeight, formatFileSize, trackLogoView, trackExport, trackSearchNoResults } from './utils.js';
import './search-shortcut.js';
import './donate.js';   // hosting fundraiser modal — self-wires to the `tl:export` event
import {
  colorState, svgRawCache,
  buildColorEditor, updatePreview, updateVariantThumbnails, updateColorsResetBtn,
  pushColorHistory, undoColors, loadRawSvg, applyColorMap, extractColors,
} from './color.js';
import { svgForExport, svgForFigma, svgToPngBlob, downloadAllAsZip, estimateZipSize } from './export.js';
import { updateSeoPageLink, slugifyPathPart } from './seo.js';
import { ecosystemLogoMap, ecosystemLabels, ecosystemLabelsEn, ecosystemSectionLabels, ecosystemSectionLabelsEn, loadLogos } from './data.js';
import { categoryIconSvg } from './category-icons.js';
import {
  initVirtual,
  setSectionHidden, loadCardImage, ensureCardMounted, mountVirtualSection,
  updateVirtualizedSections, scheduleVirtualizedSections,
  resetContentScroll,
} from './virtual.js';
import { initSearch, filterCards, moveSearchSelection, openSearchSelection } from './search.js';
import { initFilters, matchesFormat, formatState, setFormat } from './filters.js';
import { animateSectionReflow } from './reflow.js';
import { openReportModal } from './suggest.js';
import { openHelpModal } from './help.js';
import { LABELS, TOASTS, applyLabels } from './labels.js';
import { t, setLang, getLang } from './i18n.js';
import { initSidebarIndicator } from './microanim.js';
import { trackCardOpen } from './easter-achievements.js';
import { checkCatalogEnd } from './easter-confetti.js';
import { playAmongUsEscape } from './easter-amongus.js';
import { playGoogleAssemble } from './easter-google.js';
import { showDoodleJumpWidget, hideDoodleJumpWidget } from './easter-doodlejump.js';

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
let activePngFile = null;          // tracks the currently displayed PNG (incl. dark/light tab)
let selectVariantGen = 0;          // bumped on every selectVariant call; lets a stale async
                                    // continuation (e.g. a slow loadRawSvg) detect it's been
                                    // superseded by a faster later switch and bail out
let zipSizeReqId = 0;

// item.ecosystem may be a single key (string) or several (array) — normalize once.
function itemEcosystems(item) {
  return Array.isArray(item.ecosystem) ? item.ecosystem : item.ecosystem ? [item.ecosystem] : [];
}

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

// Per-variant state for the download trigger (logos only — emoji/icons use a plain ZIP button).
// The trigger always opens the "other formats" modal; square-only rows (ICO/ICNS/Liquid
// Glass) are shown/hidden inside the modal itself based on isSquare.
function applyDownloadVariantState(item, isSquare, file = item.file, darkBg = false) {
  const trigger = document.getElementById('btn-download-trigger');
  if (!trigger) return; // old plain button — nothing to configure

  trigger.onclick = async (e) => {
    e.stopPropagation();
    const { openDownloadModal } = await import('./download-modal.js');
    openDownloadModal(item, file, isSquare, darkBg);
  };
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
  const raw = (item.name + ' ' + (item.name_en || '') + ' ' + (item.tags || '') + ' ' + figmaLow).toLowerCase();
  const extra = raw.split(/\s+/).map(w => w.replace(/-/g, '')).join(' ');
  card.dataset.search = raw + ' ' + extra;

  const wrap = document.createElement('div');
  wrap.className = 'icon-wrap';
  const img = document.createElement('img');
  img.width = 48; img.height = 48;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.alt = logoAlt(item);
  img.title = item.figma;
  // Grid thumbnail uses a lightweight WebP preview when available (PNG logos);
  // the full asset (svgUrl) stays the source for the detail panel and export.
  // `item.thumb` overrides the thumbnail only: brands with no official square
  // mark keep a square stand-in here so the grid stays uniform, while `file`
  // (the downloadable/API/CDN primary) remains the real horizontal logo.
  const thumbFile = item.thumb ?? item.file;
  const fullSrc = svgUrl(thumbFile);
  const previewSrc = previewUrl(thumbFile);
  img.addEventListener('load', () => card.classList.remove('loading'), { once: true });
  img.addEventListener('error', () => {
    // Graceful degradation: a missing preview falls back to the full asset once.
    if (img.dataset.src !== fullSrc) { img.dataset.src = fullSrc; img.src = fullSrc; return; }
    card.classList.remove('loading');
  });
  img.dataset.src = previewSrc ?? fullSrc;
  if (item.prerendered ?? thumbFile.endsWith('.png')) img.classList.add('prerendered');
  wrap.appendChild(img);
  card.appendChild(wrap);

  if (item.comingSoon) {
    const badge = document.createElement('div');
    badge.className = 'card-badge';
    badge.dataset.i18n = 'comingSoon';
    badge.textContent = t('comingSoon');
    card.appendChild(badge);
  }

  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = displayName(item);
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
// Remembers the current non-search view so the format filter can re-apply it.
let currentView = { kind: 'all', value: null };

// Renders a section's cards through `cardPredicate` AND the active format
// filter — the single place both the category/ecosystem views resolve card
// visibility. Returns the number of cards left visible.
function renderSectionCards(section, cardPredicate, { animate = false } = {}) {
  ensureSectionCards(section);
  const doMutate = () => {
    const visibleCards = [];
    section.cards.forEach(card => {
      const match = cardPredicate(card) && matchesFormat(card._item);
      card.classList.toggle('hidden', !match);
      if (match) visibleCards.push(card);
    });
    section.visibleCards = visibleCards;
    section.grid.style.height = '';
    if (section.mounted) { section.grid.replaceChildren(...visibleCards); visibleCards.forEach(loadCardImage); }
  };
  if (animate) animateSectionReflow(section, doMutate);
  else doMutate();
  return section.visibleCards.length;
}

function setActive(sectionName, { animate = false } = {}) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  currentView = sectionName === 'all' ? { kind: 'all', value: null } : { kind: 'section', value: sectionName };

  if (sectionName === 'all') {
    document.querySelector('[data-section="all"]').classList.add('active');
    sectionEls.forEach(s => {
      const n = renderSectionCards(s, () => true, { animate });
      setSectionHidden(s.sec, n === 0);
    });
  } else {
    const found = sectionEls.find(s => s.group.section === sectionName);
    if (found) {
      found.nav.classList.add('active');
      sectionEls.forEach(s => {
        if (s.group.section !== sectionName) { ensureSectionCards(s); setSectionHidden(s.sec, true); return; }
        const n = renderSectionCards(s, () => true, { animate });
        setSectionHidden(s.sec, n === 0);
      });
    }
  }
  if (animate) scheduleVirtualizedSections();
  else resetContentScroll();
  syncViewToUrl();
}

function setActiveEcosystem(ecosystem, { animate = false } = {}) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  currentView = { kind: 'ecosystem', value: ecosystem };
  const found = ecosystemEls.find(e => e.key === ecosystem);
  if (found) found.nav.classList.add('active');

  sectionEls.forEach(section => {
    const n = renderSectionCards(section, card => itemEcosystems(card._item).includes(ecosystem), { animate });
    setSectionHidden(section.sec, n === 0);
  });

  document.getElementById('empty').classList.remove('show');
  document.getElementById('content').style.display = '';
  if (animate) scheduleVirtualizedSections();
  else resetContentScroll();
  syncViewToUrl();
}

// ── Variant selection ──
const TYPE_LABELS = {
  svg:     'SVG',
  full:    'Full',
  full_en: 'Full EN',
  png:     'PNG Icon',
};

// Apple icon set versions (folder apple/<n>/...). Drives the _original chip label
// and the "iOS NN …" variant labels in category JSON.
const APPLE_VERSION_LABELS = {
  '26': 'iOS 26 Tahoe',
  '27': 'iOS 27 Golden Gate',
};

function isFullFile(file) {
  return /-full(\.[^.]+)?$/.test(file);
}

function updateTabIndicator(tabs) {
  if (!tabs) return;
  const active = tabs.querySelector('.macos-style-tab.active:not(.hidden)');
  if (!active) return;
  tabs.style.setProperty('--tab-left', active.offsetLeft + 'px');
  tabs.style.setProperty('--tab-width', active.offsetWidth + 'px');
}

// Single authority for a variant's shape. `_original` (the synthetic chip for
// item.file) carries no type of its own, so it derives its shape from the
// filename exactly like an untyped variant does — it must NOT be assumed
// square: items with `thumb` (no official square mark) have a `-full` primary,
// and hardcoding square there dropped the checkerboard backing behind wide
// artwork and offered ICO/ICNS for a horizontal logo.
function getDisplayType(vDef) {
  if (vDef.type === 'svg') return 'square';
  if (vDef.type === 'full' || vDef.type === 'full_en') return 'wide';
  return isFullFile(vDef.file) ? 'wide' : 'square';
}

async function selectVariant(vDef, vcEl, item, allVariants, colorEditingDisabled) {
  const myGen = ++selectVariantGen;
  if (activeVariantCard) activeVariantCard.classList.remove('active');
  activeVariantCard = vcEl;
  currentVariant = vDef;
  updatePngDownloadSize = null; // reset; only the SVG branch wires it up
  if (vcEl) vcEl.classList.add('active');

  const detailFigmaEl = document.getElementById('detail-figma');
  detailFigmaEl.textContent = item.figma;

  const isPng = vDef.file.endsWith('.png');
  const baseName = item.figma.split('/').pop().toLowerCase();
  const suffix   = (vDef.type === '_original' || vDef.type === 'png') ? '' : '-' + (vDef.type ?? vDef.label ?? '').replace(/[\s_]+/g, '-').toLowerCase();

  const btnCopy        = document.getElementById('btn-copy');
  const btnCopyPng     = document.getElementById('btn-copy-png');
  const btnDownloadSvg = document.getElementById('btn-download');
  const btnDownloadPng = document.getElementById('btn-download-png');
  const btnCopyEmoji   = document.getElementById('btn-copy-emoji');
  const detailImg      = document.getElementById('detail-img');
  const variantLabel   = (_isEnUrl && vDef.label_en) ? vDef.label_en : vDef.label;
  detailImg.alt = vDef.type === '_original' ? logoAlt(item) : logoAlt(item, variantLabel);
  const preview        = detailImg.closest('.detail-preview');
  preview.classList.add('loading');
  preview.classList.toggle('dark-checker', !!vDef.darkBg);
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
    animateContainerHeight(controls, () => {
      btnCopy.classList.add('hidden');
      btnDownloadSvg.classList.add('hidden');
      btnCopyPng.classList.remove('hidden');
      colorsPanel.classList.add('colors-hidden');
      colorsDivider.classList.add('colors-hidden');
    });

    const applyPng = () => {
      const isWide = getDisplayType(vDef) === 'wide';
      const roundedSquarePng = !isWide && (vDef.prerendered ?? item.prerendered) === false;
      detailImg.classList.toggle('square', roundedSquarePng);
      if (isWide || roundedSquarePng) detailImg.classList.remove('prerendered');
      else detailImg.classList.add('prerendered');
      const preview = previewUrl(vDef.file);
      detailImg.src = preview ?? svgUrl(vDef.file);
      if (preview) detailImg.addEventListener('error', () => { detailImg.src = svgUrl(vDef.file); }, { once: true });
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

    activePngFile = vDef.file;

    const getPngBlob = async () => {
      const resp = await fetch(svgUrl(activePngFile));
      const buf = await resp.arrayBuffer();
      return new Blob([buf], { type: 'image/png' });
    };
    const btnSizePng = btnDownloadPng.querySelector('.btn-size');
    if (btnSizePng) { btnSizePng.textContent = ''; getPngBlob().then(b => { if (myGen === selectVariantGen) btnSizePng.textContent = formatFileSize(b.size); }).catch(() => {}); }
    btnCopyPng.onclick = async () => {
      btnCopyPng.disabled = true;
      try {
        const blob = await getPngBlob();
        const file = new File([blob], `${item.name}.png`, { type: 'image/png' });
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': file })]);
        triggerConfetti(btnCopyPng);
        showToast(TOASTS.copiedPng);
        trackExport(item.figma, 'copy-png', vDef.file);
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
      trackExport(item.figma, 'png', vDef.file);
    };

    // macOS style tabs: per-variant. The _original (primary) uses item-level
    // macos_styles; each iOS-version variant carries its own. iOS 26 has dark+light
    // (3 tabs), iOS 27 has dark only (2 tabs), color-only icons have none (hidden).
    const variantStyles = vDef.type === '_original'
      ? (item.macos_styles || null)
      : (vDef.macos_styles || null);
    const macosStylesTabs = document.getElementById('macos-style-tabs');
    macosStylesTabs?.classList.toggle('hidden', !variantStyles);
    if (variantStyles) {
      macosStylesTabs.querySelectorAll('.macos-style-tab').forEach(btn => {
        const s = btn.dataset.style;
        btn.classList.toggle('active', s === 'color');
        btn.classList.toggle('hidden', s !== 'color' && !variantStyles[s]);
      });
      requestAnimationFrame(() => updateTabIndicator(macosStylesTabs));
      macosStylesTabs.onclick = (e) => {
        const btn = e.target.closest('.macos-style-tab');
        if (!btn || btn.classList.contains('hidden')) return;
        macosStylesTabs.querySelectorAll('.macos-style-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateTabIndicator(macosStylesTabs);
        const s = btn.dataset.style;
        activePngFile = s === 'color' ? vDef.file : variantStyles[s];
        const preview = previewUrl(activePngFile);
        detailImg.src = preview ?? svgUrl(activePngFile);
        if (preview) detailImg.addEventListener('error', () => { detailImg.src = svgUrl(activePngFile); }, { once: true });
      };
    }

    // `type:"png"` means "PNG Icon" — square by convention regardless of name.
    const isSquarePng = vDef.type === 'png' || getDisplayType(vDef) === 'square';
    applyDownloadVariantState(item, isSquarePng, vDef.file, !!vDef.darkBg);
    return;
  }

  // SVG-ветка
  activePngFile = null;
  document.getElementById('macos-style-tabs')?.classList.add('hidden');
  const isSquare = getDisplayType(vDef) === 'square';
  const rawSvg = await loadRawSvg(vDef.file);
  // A faster later switch may have already resumed and rendered while this
  // fetch was in flight — stop before touching the preview/buttons/color
  // editor, or a slow variant could overwrite a fresher one once it lands.
  if (myGen !== selectVariantGen) return;

  if (!colorEditingDisabled) {
    buildColorEditor(rawSvg);
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

  const getPngBlob = () => svgToPngBlob(getExportSvg(), { square: isSquare, size: 1000 });

  const btnSizeSvg = btnDownloadSvg.querySelector('.btn-size');
  if (btnSizeSvg) btnSizeSvg.textContent = formatFileSize(new Blob([svgForExport(getExportSvg(), isSquare)]).size);
  const btnSizePng = btnDownloadPng.querySelector('.btn-size');
  updatePngDownloadSize = () => {
    if (!btnSizePng) return;
    btnSizePng.textContent = '';
    Promise.resolve(getPngBlob()).then(b => { if (b && myGen === selectVariantGen) btnSizePng.textContent = formatFileSize(b.size); }).catch(() => {});
  };
  updatePngDownloadSize();
  applyDownloadVariantState(item, isSquare, vDef.file, !!vDef.darkBg);

  btnCopy.onclick = () => {
    navigator.clipboard.writeText(svgForFigma(getExportSvg(), item, isSquare))
      .then(() => { triggerConfetti(btnCopy); showToast(TOASTS.copiedSvg); trackExport(item.figma, 'copy-svg', vDef.file); })
      .catch(() => showToast(TOASTS.copyError));
  };
  btnDownloadSvg.onclick = () => {
    const blob = new Blob([svgForExport(getExportSvg(), isSquare)], { type: 'image/svg+xml' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: baseName + suffix + '.svg' });
    a.click(); URL.revokeObjectURL(a.href);
    showToast(TOASTS.downloaded(baseName + suffix + '.svg'));
    trackExport(item.figma, 'svg', vDef.file);
  };
  btnCopyPng.onclick = async () => {
    btnCopyPng.disabled = true;
    try {
      const blob = await getPngBlob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': new File([blob], `${item.name}.png`, { type: 'image/png' }) })]);
      triggerConfetti(btnCopyPng);
      showToast(TOASTS.copiedPng);
      trackExport(item.figma, 'copy-png', activePngFile || item.file);
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
    trackExport(item.figma, 'png', activePngFile || item.file);
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
  detail.classList.add('detail-swap');
  if (activeCard) { activeCard.classList.remove('active'); activeCard = null; }
  hideDoodleJumpWidget();
  if (detailPushedState) {
    detailPushedState = false;
    isClosingViaButton = true;
    history.back();
  }
  const dur = layoutMq.matches ? 0 : 150;
  setTimeout(() => {
    setDetailOpen(false);
    detail.classList.remove('detail-swap');
  }, dur);
}

// A previously-opened logo has nothing to do with an empty search result —
// leaving its detail panel open shows stale context the visible (empty) grid
// contradicts. Also keeps the "reset format" hint in sync with the format
// filter, which can change without a fresh empty→non-empty transition (e.g.
// switching formats from the sidebar while already viewing an empty result).
function handleEmptySearch() {
  if (detail.classList.contains('open')) closeDetail();
  const resetBtn = document.getElementById('empty-reset-format');
  if (resetBtn) resetBtn.classList.toggle('hidden', formatState.format === 'all');
  trackSearchNoResults(search.value);
}

function isFlagItem(item) {
  return item.figma?.startsWith('Icon/Flag/');
}

openDetailFn = function (item, card) {
  if (layoutMq.matches) closeNavDrawer();

  if (activeCard === card) { closeDetail(); return; }
  trackLogoView(item.figma, item.name, item.file);
  trackCardOpen(item);
  resetCopyBtn();

  if (activeCard) activeCard.classList.remove('active');
  activeCard = card;
  card.classList.add('active');

  detail.scrollTop = 0;

  const detailImg      = document.getElementById('detail-img');
  const detailName     = document.getElementById('detail-name');
  const detailFigmaEl  = document.getElementById('detail-figma');
  const variantsGrid   = document.getElementById('variants-grid');
  const detailVariants = document.getElementById('detail-variants');

  detailImg.src = previewUrl(item.file) ?? svgUrl(item.file);
  detailImg.alt = logoAlt(item);
  // Provisional shape until selectVariant resolves — same rule it uses, so a
  // wide primary doesn't flash without its checkerboard backing on open.
  detailImg.classList.toggle('square', getDisplayType({ file: item.file }) === 'square');
  detailImg.classList.remove('prerendered');
  const detailPreview = detailImg.closest('.detail-preview');
  detailPreview.classList.add('loading');
  detailName.textContent = displayName(item);
  detailFigmaEl.textContent = item.figma;
  document.body.classList.toggle('has-minicrewmate', item.figma === 'Icon/Game/AmongUs');
  if (item.figma === 'Icon/Game/DoodleJump') showDoodleJumpWidget(); else hideDoodleJumpWidget();

  // macOS style tabs — visibility and onclick are handled per-variant in selectVariant
  activePngFile = null;
  document.getElementById('macos-style-tabs')?.classList.add('hidden');

  const detailActionsEl     = document.getElementById('detail-actions');
  const detailActionsHelpEl = document.getElementById('detail-actions-help');
  const detailActionsLabel  = document.getElementById('detail-actions-label');
  const reportBtn = document.getElementById('btn-report-outdated');
  if (item.comingSoon) {
    detailActionsEl.style.display = 'none';
    detailActionsHelpEl.style.display = '';
    detailActionsLabel.style.display = 'none';
    document.getElementById('btn-help').onclick = () => openHelpModal(displayName(item));
    if (reportBtn) reportBtn.classList.add('hidden');
  } else {
    detailActionsEl.style.display = '';
    detailActionsHelpEl.style.display = 'none';
    detailActionsLabel.style.display = '';
    if (reportBtn) {
      reportBtn.classList.remove('hidden');
      reportBtn.onclick = () => openReportModal(displayName(item));
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
    const wasOpen = colorsHeader.classList.contains('open');
    colorsHeader.classList.toggle('open');
    colorsSection.classList.toggle('hidden');
    if (wasOpen) {
      // После закрытия подтягиваем scroll так, чтобы colors-panel был виден
      const detail = document.getElementById('detail');
      const panelTop = colorsPanel.getBoundingClientRect().top - detail.getBoundingClientRect().top + detail.scrollTop;
      if (detail.scrollTop > panelTop) detail.scrollTop = Math.max(0, panelTop - 8);
    }
  };

  // Variant definitions
  variantsGrid.innerHTML = '';
  const originalLabel = (() => {
    if (item.file.endsWith('.png')) {
      // Apple app icons live under apple/<version>/... — label the primary by its iOS version.
      const m = item.file.match(/^apple\/(\d+)\//);
      if (m) return APPLE_VERSION_LABELS[m[1]] ?? `iOS ${m[1]}`;
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
    for (const key of extractColors(colorState.currentRawSvg)) colorState.colorMap[key] = key;
    buildColorEditor(colorState.currentRawSvg);
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

  // Estimate ZIP size for the old plain button (emoji/icons) — the dropdown interface
  // (logos) shows its ZIP size inside the "other formats" modal instead, computed by
  // download-modal.js/estimateZipSize() on open (that button doesn't exist in the DOM
  // yet at this point — it's built lazily by download-modal.js's buildDom()).
  const btnSizeZipEager = hasDownloadDropdown ? null : downloadAllBtn?.querySelector('.btn-size');
  if (btnSizeZipEager) btnSizeZipEager.textContent = ''; // clear stale size from a previously-opened logo
  if (!hasDownloadDropdown && downloadableSvgCount > 1) {
    const reqId = ++zipSizeReqId;
    estimateZipSize(item).then(total => {
      if (reqId !== zipSizeReqId) return; // superseded by a newer card open
      if (total <= 0 || downloadAllBtn.classList.contains('hidden')) return;
      if (btnSizeZipEager) btnSizeZipEager.textContent = '~' + formatFileSize(total);
    });
  }

  activeVariantCard = null;
  currentVariant = null;

  // Reset variant thumbnails list
  colorState.variantImgEls = [];
  const variantCards = [];

  allVariants.forEach(vDef => {
    const vc = document.createElement('div');
    const isWide = getDisplayType(vDef) === 'wide';
    const isSquareVariant = !isWide;
    vc.className = 'variant-card' + (isWide ? ' wide' : isSquareVariant ? ' favicon' : '') + (vDef.darkBg ? ' dark-checker' : '');
    const vi = document.createElement('img');
    const variantPreview = previewUrl(vDef.file);
    vi.src = variantPreview ?? svgUrl(vDef.file);
    if (variantPreview) vi.addEventListener('error', () => { vi.src = svgUrl(vDef.file); }, { once: true });
    if ((vDef.prerendered ?? item.prerendered) !== false && vDef.file.endsWith('.png')) vi.classList.add('prerendered');
    colorState.variantImgEls.push({ file: vDef.file, imgEl: vi });
    const vl = document.createElement('div');
    vl.className = 'variant-label';
    const vlText = (_isEnUrl && vDef.label_en) ? vDef.label_en : vDef.label;
    vl.textContent = vlText;
    vi.alt = logoAlt(item, vlText);
    vc.append(vi, vl);
    vc.addEventListener('click', () => {
      detail.scrollTop = 0;
      selectVariant(vDef, vc, item, allVariants, colorEditingDisabled);
      if (item.figma === 'Icon/Game/AmongUs' && vDef.labelKey === 'amongus') playAmongUsEscape(vc);
      if (item.figma === 'Icon/Search/Google' && vDef.type === 'full') playGoogleAssemble(vc, vDef.file);
    });
    variantsGrid.appendChild(vc);
    variantCards.push({ vDef, vc });
  });

  if (variantCards.length > 0) {
    const { vDef, vc } = variantCards[0];
    selectVariant(vDef, vc, item, allVariants, colorEditingDisabled);
  } else {
    selectVariant({ type: '_original', file: item.file }, null, item, allVariants, colorEditingDisabled);
  }

  // Warm the raw-SVG cache for the remaining variants in the background so their
  // thumbnails re-color instantly once the user edits colors (updateVariantThumbnails
  // already skips any not-yet-cached ones) — without making the first variant wait
  // on every other one to finish loading first.
  const svgOnlyVariants = allVariants.filter(v => !v.file.endsWith('.png'));
  if (svgOnlyVariants.length > 1) {
    Promise.all(svgOnlyVariants.map(v => loadRawSvg(v.file))).then(updateVariantThumbnails);
  }

  // Ecosystem block — an item can belong to more than one ecosystem (e.g. a
  // logo designed by Art. Lebedev that also belongs to its own brand group).
  // Render one divider+label+grid group per ecosystem that has other members.
  const ecosystemEl = document.getElementById('detail-ecosystem');
  const itemEcoIds = itemEcosystems(item);
  const ecoGroups = itemEcoIds
    .map(ecoId => ({ ecoId, members: allItems.filter(i => itemEcosystems(i).includes(ecoId)) }))
    .filter(g => g.members.length > 1);

  ecosystemEl.innerHTML = '';
  if (ecoGroups.length) {
    for (const { ecoId, members } of ecoGroups) {
      const divider = document.createElement('div');
      divider.className = 'detail-divider';
      const label = document.createElement('div');
      label.className = 'detail-section-label';
      label.textContent = _ecoSectionLabels[ecoId] || _ecoLabels[ecoId] || t('detailEcosystem');
      const grid = document.createElement('div');
      grid.className = 'ecosystem-grid';
      grid.dataset.ecosystem = ecoId;
      for (const sib of members) {
        const ec = document.createElement('div');
        ec.className = 'ecosystem-card';
        ec.classList.toggle('active', sib.figma === item.figma);
        ec.dataset.file = sib.file;
        ec.dataset.figma = sib.figma;
        ec.title = sib.figma;
        const ei = document.createElement('img');
        // Tile image only — `dataset.file` above stays the real primary,
        // it is the lookup key for the sibling's card.
        ei.src = svgUrl(sib.thumb ?? sib.file);
        ei.alt = logoAlt(sib);
        ei.loading = 'lazy';
        ei.decoding = 'async';
        const el = document.createElement('div');
        el.className = 'ecosystem-label';
        el.textContent = displayName(sib);
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
        grid.appendChild(ec);
      }
      ecosystemEl.append(divider, label, grid);
    }
    ecosystemEl.classList.remove('hidden');
  } else {
    ecosystemEl.classList.add('hidden');
  }

  // Note
  const noteEl   = document.getElementById('detail-note');
  const noteText = document.getElementById('detail-note-text');
  if (item.note) { noteText.textContent = item.note; noteEl.classList.remove('hidden'); }
  else noteEl.classList.add('hidden');

  // "No official square icon" explainer — `thumb` means the grid tile is a
  // stand-in we drew, so the square the visitor clicked is deliberately absent
  // from the variants below.
  document.getElementById('detail-noicon')?.classList.toggle('hidden', !item.thumb);

  // Brand link
  const brandLinkEl  = document.getElementById('detail-brand-link');
  const btnBrandLink = document.getElementById('btn-brand-link');
  if (item.brandUrl) { btnBrandLink.href = item.brandUrl; brandLinkEl.classList.remove('hidden'); }
  else brandLinkEl.classList.add('hidden');

  updateSeoPageLink(item, () => activeCard?._item);

  if (!detail.classList.contains('open')) {
    detail.classList.add('detail-swap', 'detail-enter');
    setDetailOpen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => detail.classList.remove('detail-swap'));
    });
    setTimeout(() => detail.classList.remove('detail-enter'), 600);
  } else {
    syncDetailBackdrop(true);
    if (detailPushedState) history.replaceState({ detail: true }, '', '#' + card.id);
  }

  // Logos: the trigger's onclick (opens the "other formats" modal) is wired inside
  // applyDownloadVariantState, already called from selectVariant() above for the
  // initial variant. Only the old plain button (emoji/icons) needs wiring here —
  // the button itself triggers the ZIP directly, no modal.
  if (!hasDownloadDropdown) {
    downloadAllBtn.onclick = downloadableSvgCount > 1 ? () => downloadAllAsZip(item) : null;
  }

  scrollCardIntoView(card);
};

window.addEventListener('scroll', () => {
  updateScrollTopButton();
  scheduleVirtualizedSections();
  checkCatalogEnd(search.value.trim() !== '');
}, { passive: true });

scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
detailBackdrop.addEventListener('click', closeDetail);
document.getElementById('detail-close').onclick = closeDetail;

burgerBtn.addEventListener('click', () => {
  if (sidebar.classList.contains('nav-open')) closeNavDrawer(); else openNavDrawer();
});
document.getElementById('drawer-close-btn')?.addEventListener('click', closeNavDrawer);
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

const mobileSearchGo = document.getElementById('mobile-search-go');
search.addEventListener('input', () => {
  const q = search.value.toLowerCase().trim();
  filterCards(q);
  if (q) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelector('[data-section="all"]').classList.add('active');
  }
  mobileSearchGo?.classList.toggle('visible', search.value.length > 0);
});
search.addEventListener('keydown', (e) => {
  if (!search.value.trim()) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); moveSearchSelection(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moveSearchSelection(-1); }
  else if (e.key === 'Enter') { e.preventDefault(); openSearchSelection(); }
});
mobileSearchGo?.addEventListener('click', closeNavDrawer);

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

placeSearchBar();

const _isEnUrl = location.pathname.startsWith('/en/');
// EN catalog: logos use `name_en`; if name is already Latin — return it as-is;
// emoji extract English words from `tags` ("<emoji_char> english name russian name").
// RU always uses `name`.
const displayName = item => {
  if (!_isEnUrl) return item.name;
  if (item.name_en) return item.name_en;
  if (!/[а-яёА-ЯЁ]/.test(item.name)) return item.name;
  if (item.tags) {
    const en = item.tags.split(/\s+/).filter(t => /[a-z]/i.test(t) && !/[а-яё]/i.test(t)).join(' ');
    if (en) return en.charAt(0).toUpperCase() + en.slice(1);
  }
  return item.name;
};
const _altPrefix = { logos: ['Логотип', 'Logo'], emoji: ['Эмодзи', 'Emoji'], icons: ['Иконка', 'Icon'] };
const logoAlt = (item, suffix) => {
  const [ru, en] = _altPrefix[_pathSection] ?? _altPrefix.logos;
  const base = `${_isEnUrl ? en : ru} ${displayName(item)}`;
  return suffix ? `${base} — ${suffix}` : base;
};

initVirtual({ sectionEls, content, layoutMq, search, ensureSectionCards, onScrollTopUpdate: updateScrollTopButton });
initSearch({ sectionEls, searchCount, ensureSectionCards, getTotalCards: () => totalCards, updateScrollTopButton, getDisplayName: displayName, matchesFormat, onEmptyState: handleEmptySearch });
// Format filter (SVG / PNG). Re-applies the current search or category/ecosystem
// view whenever the selected format changes. Slots exist only on the logos page.
function reapplyView() {
  syncViewToUrl();
  const q = search.value.toLowerCase().trim();
  if (q) { filterCards(q, { animate: true }); return; }
  if (currentView.kind === 'ecosystem') setActiveEcosystem(currentView.value, { animate: true });
  else setActive(currentView.kind === 'section' ? currentView.value : 'all', { animate: true });
}
// Keeps the current category/ecosystem/format view shareable via ?s=<slug>,
// ?eco=<key> and ?format=svg|png (replaceState, so navigating the catalog
// doesn't spam back-button history). Called from setActive/setActiveEcosystem
// on every view change, and from reapplyView so a format change while a
// search is active still syncs (reapplyView returns before touching
// currentView in that case, so it's the only path that reaches the format
// half of this for a searching user).
function syncViewToUrl() {
  const url = new URL(location.href);

  if (formatState.format === 'all') url.searchParams.delete('format');
  else url.searchParams.set('format', formatState.format);

  url.searchParams.delete('s');
  url.searchParams.delete('eco');
  if (currentView.kind === 'section') {
    const found = sectionEls.find(s => s.group.section === currentView.value);
    if (found) url.searchParams.set('s', found.group.slug);
  } else if (currentView.kind === 'ecosystem') {
    url.searchParams.set('eco', currentView.value);
  }

  history.replaceState(history.state, '', url.pathname + url.search + url.hash);
}
initFilters({
  slots: [document.getElementById('format-filter-sidebar')],
  onChange: reapplyView,
  labels: { all: _isEnUrl ? 'All' : 'Все' },
});
initSidebarIndicator();
const _ecoLabels = _isEnUrl ? { ...ecosystemLabels, ...ecosystemLabelsEn } : ecosystemLabels;
const _ecoSectionLabels = _isEnUrl ? ecosystemSectionLabelsEn : ecosystemSectionLabels;
const _pathSection = window.__ASSET_SECTION__ ?? (location.pathname.split('/').filter(Boolean).find(s => s !== 'en') ?? 'logos');
const _manifestBase = window.__MANIFEST_BASE__ ?? (_isEnUrl ? `/${_pathSection}/` : './');
const _assetBase = window.__ASSET_BASE__ ?? (_isEnUrl ? `/assets/${_pathSection}` : `../assets/${_pathSection}`);
setAssetBase(_assetBase);
// Lightweight WebP grid previews exist only for logos (see build-webp-previews.js).
if (_pathSection === 'logos') setPreviewBase(_assetBase + '/previews');
document.body.dataset.section = _pathSection;

// Empty search state — see handleEmptySearch for the detail-panel/reset-format sync.
document.getElementById('empty-reset-format')?.addEventListener('click', () => setFormat('all'));

loadLogos(_manifestBase).then(logos => {
  // Drop the build-time pre-rendered grid (scripts/lib/static-grid.js) — it
  // exists for crawlers/first paint; the live grid below replaces it.
  content.querySelector('.ssr-grid')?.remove();
  let readyTotal = 0;
  for (const group of logos) {
    const readyCount = group.items.filter(item => !item.comingSoon).length;
    readyTotal += readyCount;
    totalCards += readyCount;
    group.items.forEach(item => allItems.push(item));

    const nav = document.createElement('div');
    nav.className = 'nav-item';
    nav.dataset.section = group.section;
    nav.dataset.slug = group.slug;
    const _sectionLabel = (_isEnUrl && group.section_en) ? group.section_en : group.section;
    nav.innerHTML = `${categoryIconSvg(group.slug)}<span class="nav-label">${_sectionLabel}</span><span class="count">${readyCount}</span>`;
    navSections.appendChild(nav);

    const sec = document.createElement('div');
    sec.className = 'section';
    sec.dataset.section = group.section;
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = _sectionLabel;
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
    const showMoreSpan1 = document.createElement('span');
    showMoreSpan1.dataset.showMoreCount = items.length - VISIBLE;
    showMoreSpan1.textContent = t('showMore')(items.length - VISIBLE);
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>`;
    btn.appendChild(showMoreSpan1);
    navSections.appendChild(btn);
    btn.addEventListener('click', () => {
      const expanded = btn.classList.toggle('expanded');
      items.slice(VISIBLE).forEach(el => { el.style.display = expanded ? '' : 'none'; });
      btn.querySelector('span').textContent = expanded ? t('showLess') : t('showMore')(items.length - VISIBLE);
    });
  })();

  const ecosystemCounts = allItems.reduce((acc, item) => {
    for (const ecoId of itemEcosystems(item)) {
      acc.set(ecoId, (acc.get(ecoId) || 0) + (item.comingSoon ? 0 : 1));
    }
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
      if (ai === -1 && bi === -1) return (_ecoLabels[a] || a).localeCompare(_ecoLabels[b] || b, _isEnUrl ? 'en' : 'ru');
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
        : `<span class="nav-logo nav-logo-initial">${(_ecoLabels[key] || key).slice(0, 1)}</span>`;
      nav.innerHTML = `${logoHtml}<span class="nav-label">${_ecoLabels[key] || key}</span><span class="count">${count}</span>`;
      navEcosystems.appendChild(nav);
      ecosystemEls.push({ nav, key });
    });

  (function () {
    const VISIBLE = 7;
    const items = Array.from(navEcosystems.querySelectorAll('.nav-item'));
    if (items.length <= VISIBLE) return;
    items.slice(VISIBLE).forEach(el => { el.style.display = 'none'; });
    const btn = document.createElement('button');
    btn.className = 'show-more-btn';
    const showMoreSpan2 = document.createElement('span');
    showMoreSpan2.dataset.showMoreCount = items.length - VISIBLE;
    showMoreSpan2.textContent = t('showMore')(items.length - VISIBLE);
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>`;
    btn.appendChild(showMoreSpan2);
    navEcosystems.appendChild(btn);
    btn.addEventListener('click', () => {
      const expanded = btn.classList.toggle('expanded');
      items.slice(VISIBLE).forEach(el => { el.style.display = expanded ? '' : 'none'; });
      btn.querySelector('span').textContent = expanded ? t('showLess') : t('showMore')(items.length - VISIBLE);
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

  // Read every URL-driven filter param up front, before calling setFormat/
  // setActive/setActiveEcosystem — those now sync the URL as a side effect
  // (syncViewToUrl), which would strip a param this code hasn't read yet if
  // we re-read location.search after an earlier one has already run.
  const _initParams = new URLSearchParams(location.search);
  const formatParam = _initParams.get('format');
  const sParam = _initParams.get('s') || window.__CAT_SLUG__;
  const ecoParam = _initParams.get('eco') || window.__ECO_SLUG__;

  // Pre-select format filter: via ?format=svg|png (shareable link)
  if (formatParam === 'svg' || formatParam === 'png') setFormat(formatParam);

  // Pre-filter by category: via ?s=<slug> (breadcrumbs) or window.__CAT_SLUG__ (category pages)
  if (sParam) {
    const found = sectionEls.find(s => s.group.slug === sParam);
    if (found) setActive(found.group.section);
  } else if (ecoParam) {
    // Pre-filter by ecosystem: via ?eco=<key> or window.__ECO_SLUG__ (ecosystem pages)
    setActiveEcosystem(ecoParam);
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
