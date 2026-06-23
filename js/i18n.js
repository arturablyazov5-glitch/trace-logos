// i18n runtime. Translations live in i18n-dict.js (single source, shared with
// Node build scripts that bake English into /en/ static HTML).
import { DICT, DEFAULT } from './i18n-dict.js';

function _detectLang() {
  if (typeof window.__LANG__ === 'string' && DICT[window.__LANG__]) return window.__LANG__;
  if (window.location.pathname.startsWith('/en/')) return 'en';
  return DEFAULT;
}

let _lang = _detectLang();

export function getLang() { return _lang; }

export function t(key) {
  return DICT[_lang]?.[key] ?? DICT[DEFAULT][key] ?? key;
}

export function setLang(lang) {
  if (!DICT[lang] || lang === _lang) return;
  const p = window.location.pathname;
  if (lang === 'en') {
    window.location.href = '/en' + p + window.location.search;
  } else {
    const stripped = p.startsWith('/en') ? p.slice(3) || '/' : p;
    window.location.href = stripped + window.location.search;
  }
}

export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const val = t(el.dataset.i18n);
    if (val != null) el.textContent = val;
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const val = t(el.dataset.i18nPlaceholder);
    if (val != null) el.placeholder = val;
  });
  root.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const val = t(el.dataset.i18nAria);
    if (val != null) el.setAttribute('aria-label', val);
  });
  // "Show more" sidebar buttons — collapsed only (expanded ones show "show less")
  root.querySelectorAll('span[data-show-more-count]').forEach(el => {
    const btn = el.closest('.show-more-btn');
    if (btn && !btn.classList.contains('expanded')) {
      el.textContent = t('showMore')(Number(el.dataset.showMoreCount));
    }
  });
}

// Set initial <html lang>
document.documentElement.lang = _lang;
