// ─────────────────────────────────────────────────────────────────────────────
// <search-box> — единый источник «chrome» поискового инпута.
// Оборачивает существующий <input> (host задаёт его id / placeholder / aria /
// data-i18n — поведение разное: каталог фильтрует на месте, шапка ведёт автокомплит),
// а компонент инжектит лупу, крестик-очистку, их стили и логику очистки.
//
// Использование:
//   <search-box class="search-wrap"><input id="search" ...></search-box>
//   <search-box class="seo-search-wrap"><input id="seo-search" ...></search-box>
//
// Крестик при клике чистит value и диспатчит штатное 'input'-событие — на него
// уже реагируют и main.js (filterCards), и header-search.js (runSearch/close).
// Класс обёртки (search-wrap / seo-search-wrap) сохраняется на самом элементе,
// поэтому существующие стили и search-shortcut.js (closest) работают без изменений.
//
// Темизация цвета крестика — через переменные с фолбэком (каталог = хардкод-хекс,
// сайт переопределяет --search-clear-color токенами в seo-page.css).
// ─────────────────────────────────────────────────────────────────────────────

const STYLE_ID = 'search-box-styles';
const STYLE = `
.search-icon {
  position: absolute;
  pointer-events: none;
}
.search-clear {
  display: none;
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--search-clear-color, #555);
  border-radius: 4px;
  flex-shrink: 0;
}
.search-clear:hover { color: var(--search-clear-hover, #e5e5e5); }
search-box > input:not(:placeholder-shown) ~ .search-clear { display: flex; }
search-box > input:not(:placeholder-shown) ~ .search-shortcut-kbd { display: none; }
`;

const ICON_SVG = '<svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>';
const CLEAR_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLE;
  document.head.appendChild(style);
}

class SearchBox extends HTMLElement {
  connectedCallback() {
    if (this._upgraded) return;
    const input = this.querySelector('input');
    if (!input) return;            // host must provide the input
    this._upgraded = true;
    ensureStyle();

    // Лупа — перед инпутом
    input.insertAdjacentHTML('beforebegin', ICON_SVG);

    // Крестик — сразу после инпута (sibling, чтобы :not(:placeholder-shown) ~ работал)
    const isEn = document.documentElement.lang === 'en';
    const btn = document.createElement('button');
    btn.className = 'search-clear';
    btn.type = 'button';
    btn.tabIndex = -1;
    btn.setAttribute('aria-label', isEn ? 'Clear search' : 'Очистить поиск');
    btn.innerHTML = CLEAR_SVG;
    input.insertAdjacentElement('afterend', btn);

    btn.addEventListener('click', () => {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
    });
  }
}

if (!customElements.get('search-box')) {
  customElements.define('search-box', SearchBox);
}
