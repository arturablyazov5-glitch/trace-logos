import { switchLayout, highlight, fuzzyMatchToken } from './utils.js';
import { setSectionHidden, loadCardImage, resetContentScroll, updateVirtualizedSections, scheduleVirtualizedSections } from './virtual.js';
import { animateSectionReflow } from './reflow.js';

let _sectionEls, _searchCount, _ensureSectionCards, _getTotalCards, _updateScrollTopButton, _getDisplayName, _matchesFormat, _onEmptyState;

export function initSearch({ sectionEls, searchCount, ensureSectionCards, getTotalCards, updateScrollTopButton, getDisplayName, matchesFormat, onEmptyState }) {
  _sectionEls = sectionEls;
  _searchCount = searchCount;
  _ensureSectionCards = ensureSectionCards;
  _getTotalCards = getTotalCards;
  _updateScrollTopButton = updateScrollTopButton;
  _getDisplayName = getDisplayName ?? (item => item.name);
  _matchesFormat = matchesFormat ?? (() => true);
  _onEmptyState = onEmptyState ?? (() => {});
}

// Keyboard result navigation (ArrowUp/Down + Enter) — flattened in the same
// score order the sections/cards are visually reordered into by filterCards.
let _flatResults = [];
let _activeIndex = -1;
let _activeCardEl = null;

function clearActiveCard() {
  if (_activeCardEl) _activeCardEl.classList.remove('kbd-active');
  _activeCardEl = null;
  _activeIndex = -1;
}

function setActiveCard(index) {
  if (_activeCardEl) _activeCardEl.classList.remove('kbd-active');
  _activeIndex = index;
  _activeCardEl = _flatResults[index] ?? null;
  if (_activeCardEl) {
    _activeCardEl.classList.add('kbd-active');
    _activeCardEl.scrollIntoView({ block: 'nearest' });
  }
}

export function moveSearchSelection(delta) {
  if (!_flatResults.length) return;
  const next = _activeIndex < 0
    ? (delta > 0 ? 0 : _flatResults.length - 1)
    : Math.min(Math.max(_activeIndex + delta, 0), _flatResults.length - 1);
  setActiveCard(next);
}

export function openSearchSelection() {
  const card = _activeCardEl ?? _flatResults[0];
  if (!card) return false;
  card.click();
  clearActiveCard();
  return true;
}

const STOP_WORDS = new Set(['логотип', 'лого', 'logo', 'logotype', 'логотипы']);

export function scoreWord(word, haystack) {
  if (haystack.includes(word)) return 100;
  const alt = switchLayout(word);
  if (alt !== word && haystack.includes(alt)) return 100;
  const tokens = haystack.split(/\s+/);
  let best = 0;
  for (const t of tokens) {
    if (!t) continue;
    if (t === word || (alt !== word && t === alt)) { best = Math.max(best, 90); continue; }
    if (t.startsWith(word) || (alt !== word && t.startsWith(alt))) { best = Math.max(best, 70); continue; }
    // Require 3+ chars to prevent single-letter tokens ("т", "в") from matching everything
    if (t.length >= 3 && (word.startsWith(t) || (alt !== word && alt.startsWith(t)))) { best = Math.max(best, 30); }
  }
  if (best === 0) {
    for (const t of tokens) {
      if (!t) continue;
      const dist = fuzzyMatchToken(word, t);
      if (dist > 0) best = Math.max(best, dist === 1 ? 20 : 10);
      if (alt !== word) {
        const distAlt = fuzzyMatchToken(alt, t);
        if (distAlt > 0) best = Math.max(best, distAlt === 1 ? 20 : 10);
      }
    }
  }
  return best;
}

export function matchWord(word, haystack) {
  return scoreWord(word, haystack) > 0;
}

function nameBonus(w, nameLow) {
  if (nameLow === w) return 200;
  if (nameLow.startsWith(w + ' ')) return 150;
  if (nameLow.startsWith(w)) return 130;
  if (nameLow.includes(w)) return 50;
  return 0;
}

function scoreCard(words, card) {
  const haystack = card.dataset.search;
  const nameLow = card._item.name.toLowerCase().replace(/-/g, '');
  let total = 0;
  for (const w of words) {
    const s = scoreWord(w, haystack);
    if (s === 0) return 0;
    total += s + nameBonus(w, nameLow);
  }
  return total;
}

function updateSearchCount(visible, hasQuery) {
  if (!hasQuery) {
    _searchCount.classList.remove('visible');
    _searchCount.textContent = '';
    return;
  }
  _searchCount.textContent = visible + ' из ' + _getTotalCards();
  _searchCount.classList.add('visible');
}

export function filterCards(q, { animate = false } = {}) {
  const words = q.trim().toLowerCase().replace(/-/g, '').split(/\s+/).filter(w => w && !STOP_WORDS.has(w));
  const rawWords = q.trim().split(/\s+/).filter(Boolean);
  const hasQuery = words.length > 0;
  let visibleCardCount = 0;
  const hitSections = [];

  _sectionEls.forEach(section => {
    _ensureSectionCards(section);
    let sectionBestScore = 0;

    const doMutate = () => {
      const matchingCards = [];
      section.cards.forEach(card => {
        const score = !_matchesFormat(card._item) ? 0
          : !hasQuery ? 1
          : card._item.comingSoon ? 0 // excluded from search matching — not part of the ready-catalog denominator
          : scoreCard(words, card);
        const match = score > 0;
        card.classList.toggle('hidden', !match);
        if (!match) return;
        card._searchScore = score;
        visibleCardCount++;
        matchingCards.push(card);

        const item = card._item;
        const labelEl = card.querySelector('.label');
        const pathEl = card.querySelector('.card-path');
        if (hasQuery) {
          labelEl.innerHTML = highlight(_getDisplayName(item), rawWords);
          pathEl.innerHTML = highlight(item.figma, rawWords);
          card.classList.add('show-path');
        } else {
          labelEl.textContent = _getDisplayName(item);
          pathEl.textContent = item.figma;
          card.classList.remove('show-path');
        }

        if (score > sectionBestScore) sectionBestScore = score;
      });

      if (hasQuery && matchingCards.length > 1) {
        matchingCards.sort((a, b) => b._searchScore - a._searchScore);
      }

      section.visibleCards = matchingCards;
      section.grid.style.height = '';
      if (section.mounted) { section.grid.replaceChildren(...matchingCards); matchingCards.forEach(loadCardImage); }
    };

    if (animate) animateSectionReflow(section, doMutate);
    else doMutate();

    const any = section.visibleCards.length > 0;
    setSectionHidden(section.sec, !any);
    if (any) hitSections.push({ section, score: sectionBestScore });
  });

  // Reorder sections by relevance score when searching
  if (hasQuery && hitSections.length > 1) {
    hitSections.sort((a, b) => b.score - a.score);
    const container = hitSections[0].section.sec.parentElement;
    if (container) {
      for (const { section } of hitSections) container.appendChild(section.sec);
    }
  } else if (!hasQuery) {
    // Restore original manifest order
    const container = _sectionEls[0]?.sec?.parentElement;
    if (container) {
      for (const section of _sectionEls) container.appendChild(section.sec);
    }
  }

  updateSearchCount(visibleCardCount, hasQuery);
  const isEmpty = hitSections.length === 0 && hasQuery;
  document.getElementById('empty').classList.toggle('show', isEmpty);
  document.getElementById('content').style.display = isEmpty ? 'none' : '';
  if (isEmpty) {
    _onEmptyState();
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const allNav = document.querySelector('[data-section="all"]');
    if (allNav) allNav.classList.add('active');
  }

  // Highlight the top result so Enter has an obvious, visible target without
  // requiring an arrow-key press first — mirrors a command-palette flow.
  _flatResults = hasQuery ? hitSections.flatMap(h => h.section.visibleCards) : [];
  if (_flatResults.length) setActiveCard(0);
  else clearActiveCard();
  if (hasQuery && !animate) resetContentScroll();
  else requestAnimationFrame(() => { _updateScrollTopButton(); scheduleVirtualizedSections(); });
}
