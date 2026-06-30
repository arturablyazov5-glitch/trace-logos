/**
 * <lang-switcher> — standalone web component, no imports needed.
 * Detects current language from window.__LANG__ or /en/ URL prefix.
 * Navigates to /en/<path> or strips /en prefix on switch.
 */
class LangSwitcher extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this._render();
    document.addEventListener('langchange', () => this._render());
  }

  _getLang() {
    if (typeof window.__LANG__ === 'string') return window.__LANG__;
    return location.pathname.startsWith('/en/') ? 'en' : 'ru';
  }

  _setLang(lang) {
    if (lang === this._getLang()) return;
    const p = location.pathname;
    if (lang === 'en') {
      location.href = '/en' + p + location.search;
    } else {
      const stripped = p.startsWith('/en') ? p.slice(3) || '/' : p;
      location.href = stripped + location.search;
    }
  }

  _render() {
    const lang = this._getLang();
    this.shadowRoot.innerHTML = `
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :host { position: relative; flex-shrink: 0; display: inline-flex; align-items: center; }
        .btn {
          display: flex; align-items: center; gap: 4px;
          padding: 0 10px; height: 32px;
          border: none; border-radius: 8px;
          background: transparent; color: rgba(255,255,255,.8);
          font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          cursor: pointer; white-space: nowrap;
          transition: background .15s, color .15s;
        }
        .btn:hover { background: rgba(255,255,255,.08); color: #fff; }
        .chevron { flex-shrink: 0; transition: transform .15s; }
        .btn[aria-expanded="true"] .chevron { transform: rotate(180deg); }
        @media (max-width: 1200px) { .chevron { display: none; } }
        .dropdown {
          position: absolute; top: calc(100% + 6px); right: 0; z-index: 200;
          background: #1c1c1c; border: 1px solid #2a2a2a;
          border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,.55);
          min-width: 160px; padding: 4px;
        }
        .dropdown.hidden { display: none; }
        .option {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px; padding: 8px; border-radius: 8px; cursor: pointer;
          font-size: 13px; color: rgba(255,255,255,.75);
          transition: background .1s, color .1s;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .option:hover { background: rgba(255,255,255,.07); color: #fff; }
        .option.active { color: #fff; }
        .option:not(.active) .check { display: none; }
        .check { flex-shrink: 0; opacity: .7; }
        @media (max-width: 900px) {
          .btn span { display: none; }
          .btn { padding: 0 6px; }
        }
      </style>
      <button type="button" class="btn" aria-expanded="false" aria-haspopup="listbox" aria-label="Switch language">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
        </svg>
        <span>${lang === 'en' ? 'English' : 'Русский'}</span>
        <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      <div class="dropdown hidden" role="listbox">
        <div class="option ${lang === 'ru' ? 'active' : ''}" data-lang="ru" role="option" aria-selected="${lang === 'ru'}">
          <span>Русский</span>
          <svg class="check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <div class="option ${lang === 'en' ? 'active' : ''}" data-lang="en" role="option" aria-selected="${lang === 'en'}">
          <span>English</span>
          <svg class="check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
      </div>
    `;

    const btn      = this.shadowRoot.querySelector('.btn');
    const dropdown = this.shadowRoot.querySelector('.dropdown');

    const close = () => { dropdown.classList.add('hidden'); btn.setAttribute('aria-expanded', 'false'); };
    const open  = () => { dropdown.classList.remove('hidden'); btn.setAttribute('aria-expanded', 'true'); };

    btn.addEventListener('click', e => {
      e.stopPropagation();
      dropdown.classList.contains('hidden') ? open() : close();
    });

    this.shadowRoot.querySelectorAll('.option').forEach(opt => {
      opt.addEventListener('click', e => {
        e.stopPropagation();
        this._setLang(opt.dataset.lang);
      });
    });

    const closeOnOutside = () => close();
    const closeOnEsc     = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('click', closeOnOutside);
    document.addEventListener('keydown', closeOnEsc);

    // Clean up old listeners on re-render
    this._cleanup?.();
    this._cleanup = () => {
      document.removeEventListener('click', closeOnOutside);
      document.removeEventListener('keydown', closeOnEsc);
    };
  }

  disconnectedCallback() {
    this._cleanup?.();
  }
}

customElements.define('lang-switcher', LangSwitcher);
