const VIRTUAL_OVERSCAN = 900;
let virtualizeRaf = 0;
let _sectionEls, _content, _layoutMq, _search, _ensureSectionCards, _onScrollTopUpdate;

export function initVirtual({ sectionEls, content, layoutMq, search, ensureSectionCards, onScrollTopUpdate }) {
  _sectionEls = sectionEls;
  _content = content;
  _layoutMq = layoutMq;
  _search = search;
  _ensureSectionCards = ensureSectionCards;
  _onScrollTopUpdate = onScrollTopUpdate;
}

export function setSectionHidden(sec, hidden) {
  if (sec.classList.contains('hidden') === hidden) return;
  sec.style.maxHeight = '';
  sec.classList.toggle('hidden', hidden);
}

export function getGridColumnCount(grid) {
  if (_layoutMq.matches) return 6;
  const width = grid.clientWidth || Math.max(1, _content.clientWidth - 48);
  return Math.max(1, Math.floor((width + 4) / 84));
}

export function estimateGridHeight(section) {
  const count = section.visibleCards.length || section.group.items.length;
  if (!count) return 0;
  const columns = getGridColumnCount(section.grid);
  const rows = Math.ceil(count / columns);
  const gap = _layoutMq.matches ? 8 : 4;
  const mobileCellWidth = Math.max(1, (section.grid.clientWidth - gap * 5) / 6);
  const fallbackRowHeight = _layoutMq.matches ? mobileCellWidth + 34 : (_search.value.trim() ? 112 : 94);
  const rowHeight = section.rowHeight || fallbackRowHeight;
  return rows * rowHeight + Math.max(0, rows - 1) * gap;
}

export function loadCardImage(card) {
  if (card._imageLoadedStarted) return;
  card._imageLoadedStarted = true;
  const img = card.querySelector('img');
  if (img?.dataset.src) img.src = img.dataset.src;
}

export function mountVirtualSection(section) {
  if (section.mounted) return;
  _ensureSectionCards(section);
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

export function unmountVirtualSection(section) {
  if (!section.mounted) return;
  section.gridHeight = section.grid.getBoundingClientRect().height || estimateGridHeight(section);
  section.grid.style.height = section.gridHeight + 'px';
  section.grid.replaceChildren();
  section.mounted = false;
}

export function ensureCardMounted(card) {
  const section = card._sectionState;
  if (!section || section.sec.classList.contains('hidden')) return;
  mountVirtualSection(section);
}

export function updateVirtualizedSections() {
  virtualizeRaf = 0;
  if (_content.style.display === 'none') return;
  // The window is the scroll container; section rects are viewport-relative.
  const minY = -VIRTUAL_OVERSCAN;
  const maxY = window.innerHeight + VIRTUAL_OVERSCAN;

  _sectionEls.forEach(section => {
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

export function scheduleVirtualizedSections() {
  if (virtualizeRaf) return;
  virtualizeRaf = requestAnimationFrame(updateVirtualizedSections);
}

export function invalidateVirtualizedLayout() {
  _sectionEls.forEach(section => {
    section.gridHeight = 0;
    section.rowHeight = 0;
    if (!section.mounted) section.grid.style.height = '';
  });
  scheduleVirtualizedSections();
}

export function resetContentScroll() {
  window.scrollTo(0, 0);
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    _onScrollTopUpdate?.();
    updateVirtualizedSections();
  });
}
