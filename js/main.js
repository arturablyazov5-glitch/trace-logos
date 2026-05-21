import { showToast, highlight, svgUrl } from './utils.js';
import {
  colorState, svgRawCache,
  buildColorEditor, updatePreview, updateVariantThumbnails, updateColorsResetBtn,
  pushColorHistory, undoColors, loadRawSvg, applyColorMap,
} from './color.js';
import { svgForExport, svgForFigma, svgToPngBlob, downloadAllAsZip } from './export.js';
import { updateSeoPageLink } from './seo.js';
import { ecosystemLogoMap, ecosystemLabels, loadLogos } from './data.js';
import './suggest.js';
import './help.js';

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
let virtualizeRaf = 0;
const VIRTUAL_OVERSCAN = 900;
const sectionEls   = [];
const ecosystemEls = [];
const allItems     = [];
const cardByItemFile  = new Map();
const cardByItemFigma = new Map();
let activeCard = null;
let openDetailFn;
let currentDisplayType = null;

function animateContainerHeight(el, changeFn, waitForImg) {
  const wasHidden = getComputedStyle(el).display === 'none';
  const oldH = wasHidden ? 0 : el.offsetHeight;

  if (!wasHidden) {
    el.style.height = oldH + 'px';
    el.style.overflow = 'hidden';
  }

  changeFn();

  const willBeHidden = getComputedStyle(el).display === 'none';

  // Нет изменений — выходим
  if (wasHidden && willBeHidden) {
    el.style.height = '';
    el.style.overflow = '';
    return;
  }

  // Скрываем: display:none не даёт анимировать — временно переопределяем
  if (willBeHidden) {
    el.style.display = 'block';
    el.style.height = oldH + 'px';
    el.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      el.getBoundingClientRect();
      el.style.transition = 'height .3s cubic-bezier(.22,.61,.36,1)';
      el.style.height = '0px';
      el.addEventListener('transitionend', (e) => {
        if (e.propertyName !== 'height') return;
        el.style.display = '';
        el.style.height = '';
        el.style.overflow = '';
        el.style.transition = '';
      }, { once: true });
    });
    return;
  }

  // Показываем или меняем высоту
  if (wasHidden) {
    el.style.height = '0px';
    el.style.overflow = 'hidden';
  }

  const finish = () => {
    el.style.height = 'auto';
    const newH = el.offsetHeight;
    if (Math.abs(newH - oldH) > 1) {
      el.style.height = (wasHidden ? 0 : oldH) + 'px';
      el.getBoundingClientRect();
      el.style.transition = 'height .3s cubic-bezier(.22,.61,.36,1)';
      el.style.height = newH + 'px';
      el.addEventListener('transitionend', (e) => {
        if (e.propertyName !== 'height') return;
        el.style.height = '';
        el.style.overflow = '';
        el.style.transition = '';
      }, { once: true });
    } else {
      el.style.height = '';
      el.style.overflow = '';
    }
  };

  if (waitForImg && !waitForImg.complete) {
    waitForImg.addEventListener('load', () => requestAnimationFrame(finish), { once: true });
  } else {
    requestAnimationFrame(finish);
  }
}

let copyBtnResetTimer = null;

function resetCopyBtn() {
  if (!copyBtnResetTimer) return;
  clearTimeout(copyBtnResetTimer);
  copyBtnResetTimer = null;
  const btn = document.getElementById('btn-copy');
  if (btn) { const span = btn.querySelector('span'); if (span) span.textContent = 'Скопировать SVG'; btn.disabled = false; }
  const btnPng = document.getElementById('btn-copy-png');
  if (btnPng) { const span = btnPng.querySelector('span'); if (span) span.textContent = 'Скопировать PNG'; btnPng.disabled = false; }
}

function triggerConfetti(el, labelText) {
  const r = el.getBoundingClientRect();
  const ghost = document.createElement('div');
  ghost.className = 'confetti-ghost animate';
  ghost.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
  document.body.appendChild(ghost);
  setTimeout(() => ghost.remove(), 1100);

  const span = el.querySelector('span') || el;
  span.textContent = labelText || 'Скопировано!';
  el.disabled = true;
  copyBtnResetTimer = setTimeout(() => { resetCopyBtn(); }, 2000);
}

// ── Layout helpers ──
function updateScrollTopButton() {
  const contentVisible = content.style.display !== 'none';
  scrollTopBtn.classList.toggle('show', contentVisible && content.scrollTop > 360);
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
  setTimeout(() => search.focus({ preventScroll: true }), 320);
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
  requestAnimationFrame(invalidateVirtualizedLayout);
}

// ── Virtualization ──
function setSectionHidden(sec, hidden) {
  if (sec.classList.contains('hidden') === hidden) return;
  sec.style.maxHeight = '';
  sec.classList.toggle('hidden', hidden);
}

function getGridColumnCount(grid) {
  if (layoutMq.matches) return 6;
  const width = grid.clientWidth || Math.max(1, content.clientWidth - 48);
  return Math.max(1, Math.floor((width + 4) / 84));
}

function estimateGridHeight(section) {
  const count = section.visibleCards.length || section.group.items.length;
  if (!count) return 0;
  const columns = getGridColumnCount(section.grid);
  const rows = Math.ceil(count / columns);
  const gap = layoutMq.matches ? 8 : 4;
  const mobileCellWidth = Math.max(1, (section.grid.clientWidth - gap * 5) / 6);
  const fallbackRowHeight = layoutMq.matches ? mobileCellWidth + 34 : (search.value.trim() ? 112 : 94);
  const rowHeight = section.rowHeight || fallbackRowHeight;
  return rows * rowHeight + Math.max(0, rows - 1) * gap;
}

function loadCardImage(card) {
  if (card._imageLoadedStarted) return;
  card._imageLoadedStarted = true;
  const img = card.querySelector('img');
  if (img?.dataset.src) img.src = img.dataset.src;
}

function mountVirtualSection(section) {
  if (section.mounted) return;
  ensureSectionCards(section);
  section.grid.style.height = '';
  section.grid.replaceChildren(...section.visibleCards);
  section.visibleCards.forEach(loadCardImage);
  section.mounted = true;
  requestAnimationFrame(() => {
    const sample = section.grid.querySelector('.card:not(.hidden)');
    if (sample) section.rowHeight = sample.getBoundingClientRect().height || section.rowHeight;
    section.gridHeight = section.grid.getBoundingClientRect().height || section.gridHeight;
  });
}

function unmountVirtualSection(section) {
  if (!section.mounted) return;
  section.gridHeight = section.grid.getBoundingClientRect().height || estimateGridHeight(section);
  section.grid.style.height = section.gridHeight + 'px';
  section.grid.replaceChildren();
  section.mounted = false;
}

function ensureCardMounted(card) {
  const section = card._sectionState;
  if (!section || section.sec.classList.contains('hidden')) return;
  mountVirtualSection(section);
}

function updateVirtualizedSections() {
  virtualizeRaf = 0;
  if (content.style.display === 'none') return;
  const contentRect = content.getBoundingClientRect();
  const minY = contentRect.top - VIRTUAL_OVERSCAN;
  const maxY = contentRect.bottom + VIRTUAL_OVERSCAN;

  sectionEls.forEach(section => {
    if (section.sec.classList.contains('hidden') || (!section.visibleCards.length && section.cardsBuilt)) {
      unmountVirtualSection(section);
      section.grid.style.height = '';
      return;
    }
    if (!section.mounted && !section.grid.style.height) {
      section.grid.style.height = estimateGridHeight(section) + 'px';
    }
    const rect = section.sec.getBoundingClientRect();
    const shouldMount = rect.bottom >= minY && rect.top <= maxY;
    if (shouldMount) mountVirtualSection(section);
    else unmountVirtualSection(section);
  });
}

function scheduleVirtualizedSections() {
  if (virtualizeRaf) return;
  virtualizeRaf = requestAnimationFrame(updateVirtualizedSections);
}

function invalidateVirtualizedLayout() {
  sectionEls.forEach(section => {
    section.gridHeight = 0;
    section.rowHeight = 0;
    if (!section.mounted) section.grid.style.height = '';
  });
  scheduleVirtualizedSections();
}

function resetContentScroll() {
  content.scrollTop = 0;
  requestAnimationFrame(() => {
    content.scrollTop = 0;
    updateScrollTopButton();
    updateVirtualizedSections();
  });
}

// ── Cards ──
function buildCard(item, sectionState) {
  const card = document.createElement('div');
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
  img.addEventListener('load', () => card.classList.remove('loading'), { once: true });
  img.addEventListener('error', () => card.classList.remove('loading'), { once: true });
  img.dataset.src = svgUrl(item.file);
  if (item.prerendered) img.classList.add('prerendered');
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

// ── Search ──
function matchWord(word, haystack) {
  if (haystack.includes(word)) return true;
  const tokens = haystack.split(/\s+/);
  return tokens.some(t => t && (word.startsWith(t) || t.startsWith(word)));
}

function updateSearchCount(visible, hasQuery) {
  if (!hasQuery) {
    searchCount.classList.remove('visible');
    searchCount.textContent = '';
    return;
  }
  searchCount.textContent = visible + ' из ' + totalCards;
  searchCount.classList.add('visible');
}

function filterCards(q) {
  const words = q.trim().toLowerCase().replace(/-/g, '').split(/\s+/).filter(Boolean);
  const rawWords = q.trim().split(/\s+/).filter(Boolean);
  const hasQuery = words.length > 0;
  let visibleCardCount = 0;
  let sectionsWithHits = 0;

  sectionEls.forEach(section => {
    ensureSectionCards(section);
    let any = false;
    const matchingCards = [];
    section.cards.forEach(card => {
      const match = !hasQuery || words.every(w => matchWord(w, card.dataset.search));
      card.classList.toggle('hidden', !match);
      if (!match) return;
      any = true;
      visibleCardCount++;
      matchingCards.push(card);

      const item = card._item;
      const labelEl = card.querySelector('.label');
      const pathEl = card.querySelector('.card-path');
      if (hasQuery) {
        labelEl.innerHTML = highlight(item.name, rawWords);
        pathEl.innerHTML = highlight(item.figma, rawWords);
        card.classList.add('show-path');
      } else {
        labelEl.textContent = item.name;
        pathEl.textContent = item.figma;
        card.classList.remove('show-path');
      }
    });
    section.visibleCards = matchingCards;
    section.grid.style.height = '';
    if (section.mounted) { section.grid.replaceChildren(...matchingCards); matchingCards.forEach(loadCardImage); }
    setSectionHidden(section.sec, !any);
    if (any) sectionsWithHits++;
  });

  updateSearchCount(visibleCardCount, hasQuery);
  const isEmpty = sectionsWithHits === 0 && hasQuery;
  document.getElementById('empty').classList.toggle('show', isEmpty);
  document.getElementById('content').style.display = isEmpty ? 'none' : '';
  if (hasQuery) resetContentScroll();
  else requestAnimationFrame(() => { updateScrollTopButton(); updateVirtualizedSections(); });
}

// ── Detail panel ──
function withDetailTransition(mutator) {
  mutator();
  return Promise.resolve();
}

function scrollCardIntoView(card, afterTransition = Promise.resolve()) {
  afterTransition.catch(() => {}).finally(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ensureCardMounted(card);
        card.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    });
  });
}

function closeDetail() {
  withDetailTransition(() => setDetailOpen(false));
  if (activeCard) { activeCard.classList.remove('active'); activeCard = null; }
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

  const detailImg      = document.getElementById('detail-img');
  const detailName     = document.getElementById('detail-name');
  const detailFigmaEl  = document.getElementById('detail-figma');
  const variantsGrid   = document.getElementById('variants-grid');
  const detailVariants = document.getElementById('detail-variants');

  detailImg.src = svgUrl(item.file);
  detailImg.alt = item.name;
  detailImg.classList.add('square');
  detailImg.classList.remove('prerendered');
  detailName.textContent = item.name;
  detailFigmaEl.textContent = item.figma;

  const detailActionsEl     = document.getElementById('detail-actions');
  const detailActionsHelpEl = document.getElementById('detail-actions-help');
  const detailActionsLabel  = document.getElementById('detail-actions-label');
  if (item.comingSoon) {
    detailActionsEl.style.display = 'none';
    detailActionsHelpEl.style.display = '';
    detailActionsLabel.style.display = 'none';
    document.getElementById('btn-help').onclick = () => window.openHelpModal(item.name);
  } else {
    detailActionsEl.style.display = '';
    detailActionsHelpEl.style.display = 'none';
    detailActionsLabel.style.display = '';
  }

  // Reset color state for new logo
  colorState.colorMap = {};
  colorState.colorEditorSourceSvg = '';
  colorState.colorHistoryNeedsInit = true;
  const colorEditingDisabled = isFlagItem(item) || !!item.comingSoon;

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

  // Variant definitions (closure for reset button)
  variantsGrid.innerHTML = '';
  const variantDefs = [
    { label: 'Favicon',   key: 'favicon'  },
    { label: 'Full',      key: 'full'     },
    { label: 'Full EN',   key: 'full_en'  },
    { label: 'SVG',       key: 'svg'      },
    { label: 'PNG Icon',  key: 'png'      },
  ];
  const available = variantDefs.filter(v => item.variants?.[v.key]);
  const originalLabel = item.prerendered ? 'App Icon' : 'Favicon';
  const allVariants = available.length > 0
    ? [{ label: originalLabel, key: '_original', file: item.file }, ...available.map(v => ({ ...v, file: item.variants[v.key] }))]
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
  const downloadableSvgCount = allVariants.length || 1;

  animateContainerHeight(detailVariants, () => {
    detailVariants.classList.toggle('hidden', allVariants.length === 0);
    downloadAllBtn.classList.toggle('hidden', downloadableSvgCount <= 1);
  });

  let activeVariantCard = null;

  // Определяет тип отображения варианта
  function getDisplayType(vDef) {
    if (vDef.file.endsWith('.png')) return 'square';
    return (vDef.key === '_original' || vDef.key === 'svg' || vDef.key === 'favicon') ? 'square' : 'wide';
  }

  async function selectVariant(vDef, vcEl) {
    if (activeVariantCard) activeVariantCard.classList.remove('active');
    activeVariantCard = vcEl;
    vcEl.classList.add('active');
    detailFigmaEl.textContent = item.figma;

    const isPng = vDef.file.endsWith('.png');
    const baseName = item.figma.split('/').pop().toLowerCase();
    const suffix   = vDef.key === '_original' ? '' : '-' + vDef.key.replace(/_/g, '-');

    const btnCopy        = document.getElementById('btn-copy');
    const btnCopyPng     = document.getElementById('btn-copy-png');
    const btnDownloadSvg = document.getElementById('btn-download');
    const btnDownloadPng = document.getElementById('btn-download-png');
    const detailImg      = document.getElementById('detail-img');
    const preview        = detailImg.closest('.detail-preview');
    const controls       = document.getElementById('detail-controls');

    // Фейд только при смене типа отображения (square↔wide, svg↔png и т.д.)
    const newDisplayType = getDisplayType(vDef);
    const needsFade = currentDisplayType !== null && currentDisplayType !== newDisplayType;
    currentDisplayType = newDisplayType;

    if (needsFade) detailImg.style.opacity = '0';

    btnCopy.classList.toggle('hidden', isPng);
    btnDownloadSvg.classList.toggle('hidden', isPng);
    btnCopyPng.classList.toggle('hidden', !isPng);

    if (isPng) {
      // Анимируем controls (кнопки + панель цветов) и preview одновременно
      animateContainerHeight(controls, () => {
        colorsPanel.classList.add('colors-hidden');
        colorsDivider.classList.add('colors-hidden');
      });

      const applyPng = () => {
        detailImg.src = svgUrl(vDef.file);
        detailImg.classList.remove('square');
        detailImg.classList.add('prerendered');
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
      btnCopyPng.onclick = async () => {
        const blob = await getPngBlob();
        const file = new File([blob], `${item.name}.png`, { type: 'image/png' });
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': file })]);
        triggerConfetti(btnCopyPng);
        showToast(`Скопировано PNG: ${item.name}`);
      };
      btnDownloadPng.onclick = async () => {
        const blob = await getPngBlob();
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: baseName + suffix + '.png' });
        a.click(); URL.revokeObjectURL(a.href);
        showToast(`Скачано PNG: ${item.name}`);
      };
      return;
    }

    // SVG-ветка
    btnCopyPng.classList.add('hidden');
    const isSquare = vDef.key === '_original' || vDef.key === 'svg' || vDef.key === 'favicon';
    const rawSvg = await loadRawSvg(vDef.file);

    if (!colorEditingDisabled && !Object.keys(colorState.colorMap).length) {
      const allSvgText = allVariants.map(v => svgRawCache[v.file] || '').join('\n');
      buildColorEditor(allSvgText);
    }

    // Анимируем controls (кнопки + панель цветов) и preview одновременно
    animateContainerHeight(controls, () => {
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

    btnCopy.onclick = () => {
      navigator.clipboard.writeText(svgForFigma(getExportSvg(), item, isSquare))
        .then(() => triggerConfetti(btnCopy));
    };
    btnDownloadSvg.onclick = () => {
      const blob = new Blob([svgForExport(getExportSvg(), isSquare)], { type: 'image/svg+xml' });
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: baseName + suffix + '.svg' });
      a.click(); URL.revokeObjectURL(a.href);
      showToast(`Скачано: ${item.name}${suffix ? ' (' + vDef.label + ')' : ''}`);
    };
    btnDownloadPng.onclick = async () => {
      const pngBlob = await svgToPngBlob(getExportSvg(), { square: isSquare, size: 512 });
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(pngBlob), download: baseName + suffix + '.png' });
      a.click(); URL.revokeObjectURL(a.href);
      showToast(`Скачано PNG: ${item.name}`);
    };
  }

  // Reset variant thumbnails list
  colorState.variantImgEls = [];
  const variantCards = [];

  allVariants.forEach(vDef => {
    const vc = document.createElement('div');
    const isWide = vDef.key === 'full' || vDef.key === 'full_en';
    const isSquareVariant = vDef.key === '_original' || vDef.key === 'favicon' || vDef.key === 'svg' || vDef.key === 'png';
    vc.className = 'variant-card' + (isWide ? ' wide' : isSquareVariant ? ' favicon' : '');
    const vi = document.createElement('img');
    vi.src = svgUrl(vDef.file);
    if (vDef.file.endsWith('.png')) vi.classList.add('prerendered');
    colorState.variantImgEls.push({ file: vDef.file, imgEl: vi });
    const vl = document.createElement('div');
    vl.className = 'variant-label';
    vl.textContent = vDef.label;
    vc.append(vi, vl);
    vc.addEventListener('click', () => selectVariant(vDef, vc));
    variantsGrid.appendChild(vc);
    variantCards.push({ vDef, vc });
  });

  const svgOnlyVariants = allVariants.filter(v => !v.file.endsWith('.png'));
  Promise.all(svgOnlyVariants.map(v => loadRawSvg(v.file))).then(() => {
    if (variantCards.length > 0) {
      const { vDef, vc } = variantCards[0];
      selectVariant(vDef, vc);
    }
  });

  if (!allVariants.length) {
    const isPng = item.file.endsWith('.png');
    const btnCopy        = document.getElementById('btn-copy');
    const btnCopyPng     = document.getElementById('btn-copy-png');
    const btnDownloadSvg = document.getElementById('btn-download');
    const btnDownloadPng = document.getElementById('btn-download-png');
    btnCopy.classList.toggle('hidden', isPng);
    btnDownloadSvg.classList.toggle('hidden', isPng);
    btnCopyPng.classList.toggle('hidden', !isPng);

    if (isPng) {
      const detailImg = document.getElementById('detail-img');
      detailImg.src = svgUrl(item.file);
      detailImg.classList.remove('square');
      detailImg.classList.add('prerendered');
      const baseName = item.figma.split('/').pop().toLowerCase();
      const getPngBlob = async () => {
        const resp = await fetch(svgUrl(item.file));
        const buf = await resp.arrayBuffer();
        return new Blob([buf], { type: 'image/png' });
      };
      btnCopyPng.onclick = async () => {
        const blob = await getPngBlob();
        const file = new File([blob], `${item.name}.png`, { type: 'image/png' });
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': file })]);
        triggerConfetti(btnCopyPng);
        showToast(`Скопировано PNG: ${item.name}`);
      };
      btnDownloadPng.onclick = async () => {
        const blob = await getPngBlob();
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: baseName + '.png' });
        a.click(); URL.revokeObjectURL(a.href);
        showToast(`Скачано PNG: ${item.name}`);
      };
    } else {
      btnCopyPng.classList.add('hidden');
      loadRawSvg(item.file).then(raw => {
        if (!colorEditingDisabled) buildColorEditor(raw);
        updatePreview(raw, true);
        const baseName = item.figma.split('/').pop().toLowerCase();
        const getExportSvg = () => applyColorMap(raw);
        btnCopy.onclick = () => {
          navigator.clipboard.writeText(svgForFigma(getExportSvg(), item, true))
            .then(() => triggerConfetti(btnCopy));
        };
        btnDownloadSvg.onclick = () => {
          const blob = new Blob([svgForExport(getExportSvg(), true)], { type: 'image/svg+xml' });
          const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: baseName + '.svg' });
          a.click(); URL.revokeObjectURL(a.href);
          showToast(`Скачано: ${item.name}`);
        };
        btnDownloadPng.onclick = async () => {
          const pngBlob = await svgToPngBlob(getExportSvg(), { square: true, size: 512 });
          const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(pngBlob), download: baseName + '.png' });
          a.click(); URL.revokeObjectURL(a.href);
          showToast(`Скачано PNG: ${item.name}`);
        };
      });
    }
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

  let transition = Promise.resolve();
  if (!detail.classList.contains('open')) {
    transition = withDetailTransition(() => setDetailOpen(true));
  } else {
    syncDetailBackdrop(true);
  }

  downloadAllBtn.onclick = downloadableSvgCount > 1 ? () => downloadAllAsZip(item) : null;
  scrollCardIntoView(card, transition);
};

// ── Event listeners ──
content.addEventListener('scroll', () => {
  updateScrollTopButton();
  scheduleVirtualizedSections();
}, { passive: true });

scrollTopBtn.addEventListener('click', () => content.scrollTo({ top: 0, behavior: 'smooth' }));
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

window.addEventListener('wheel', (e) => {
  if (e.target.closest('#detail') || e.target.closest('aside')) return;
  if (e.ctrlKey || e.metaKey) return;
  content.scrollTop += e.deltaY;
  if (e.deltaY !== 0) e.preventDefault();
}, { passive: false });

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
      if (undoColors()) { e.preventDefault(); showToast('Цвета: отменено'); }
    }
    return;
  }
  if (e.key !== 'Escape') return;
  if (layoutMq.matches && sidebar.classList.contains('nav-open')) { closeNavDrawer(); return; }
  if (detail.classList.contains('open')) {
    withDetailTransition(() => setDetailOpen(false));
    if (activeCard) { activeCard.classList.remove('active'); activeCard = null; }
  } else if (search.value) {
    search.value = '';
    filterCards('');
  }
});

// ── Init ──
placeSearchBar();

loadLogos().then(logos => {
  for (const group of logos) {
    const readyCount = group.items.filter(item => !item.comingSoon).length;
    totalCards += group.items.length;
    group.items.forEach(item => allItems.push(item));

    const nav = document.createElement('div');
    nav.className = 'nav-item';
    nav.dataset.section = group.section;
    nav.innerHTML = `<span class="nav-label">${group.section}</span><span class="count">${readyCount}</span>`;
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
    'meta', 'apple', 'mts', 'nspk', 'sovcombank', 'openai', 'microsoft',
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
      const logo = ecosystemLogoMap[key];
      const logoHtml = logo
        ? `<img class="nav-logo" src="${logo}" width="16" height="16" alt="" aria-hidden="true">`
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

  requestIdleCallback
    ? requestIdleCallback(() => sectionEls.forEach(s => ensureSectionCards(s)), { timeout: 2000 })
    : setTimeout(() => sectionEls.forEach(s => ensureSectionCards(s)), 300);
});
