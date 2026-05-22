import { switchLayout, highlight } from './utils.js';
import { setSectionHidden, loadCardImage, resetContentScroll, updateVirtualizedSections, scheduleVirtualizedSections } from './virtual.js';

let _sectionEls, _searchCount, _ensureSectionCards, _getTotalCards, _updateScrollTopButton;

export function initSearch({ sectionEls, searchCount, ensureSectionCards, getTotalCards, updateScrollTopButton }) {
  _sectionEls = sectionEls;
  _searchCount = searchCount;
  _ensureSectionCards = ensureSectionCards;
  _getTotalCards = getTotalCards;
  _updateScrollTopButton = updateScrollTopButton;
}

export function matchWord(word, haystack) {
  if (haystack.includes(word)) return true;
  const alt = switchLayout(word);
  if (alt !== word && haystack.includes(alt)) return true;
  const tokens = haystack.split(/\s+/);
  return tokens.some(t => t && (
    word.startsWith(t) || t.startsWith(word) ||
    (alt !== word && (alt.startsWith(t) || t.startsWith(alt)))
  ));
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

export function filterCards(q) {
  const words = q.trim().toLowerCase().replace(/-/g, '').split(/\s+/).filter(Boolean);
  const rawWords = q.trim().split(/\s+/).filter(Boolean);
  const hasQuery = words.length > 0;
  let visibleCardCount = 0;
  let sectionsWithHits = 0;

  _sectionEls.forEach(section => {
    _ensureSectionCards(section);
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
  else requestAnimationFrame(() => { _updateScrollTopButton(); scheduleVirtualizedSections(); });
}
