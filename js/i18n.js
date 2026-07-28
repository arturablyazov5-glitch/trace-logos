// i18n runtime. Translations live in one file per language (js/i18n-dict-<lang>.js);
// only the current page's language is fetched, so an RU visitor never downloads the
// English strings and vice versa (~27 KB saved per visit). Node build scripts read
// every language at once via loadDict() in scripts/lib/en-transform.js to bake the
// /en/ static HTML.
//
// There is NO cross-language fallback: a key missing from a dictionary renders as the
// raw key, never as another language's string. scripts/test-i18n.js enforces key and
// value-type parity between the dictionaries and fails the build on any drift — that
// check is what replaced the old runtime fallback.
//
// Pages carry <link rel="modulepreload" href="…/js/i18n-dict-ru.js"> so the browser
// starts this fetch while the module graph is still loading; without it the dynamic
// import below would only fire after the whole static graph resolved, costing a round
// trip. The tag is hand-written in the 5 sources that reach this module (templates/
// partials/nav-header.html, templates/category-page.html, index.html, logos/index.html,
// emoji/index.html); enChrome() in scripts/lib/en-transform.js rewrites -ru → -en for
// the /en/ mirror. Adding a new module entry point? Add the hint there too.

export const LANGS = ['ru', 'en'];
export const DEFAULT = 'ru';

function _pathLang(pathname = window.location.pathname) {
  const first = pathname.split('/').filter(Boolean)[0];
  return LANGS.includes(first) ? first : null;
}

function _stripLangPrefix(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (LANGS.includes(parts[0])) parts.shift();
  return '/' + parts.join('/') + (pathname.endsWith('/') && parts.length ? '/' : '');
}

function _detectLang() {
  if (LANGS.includes(window.__LANG__)) return window.__LANG__;
  return _pathLang() ?? DEFAULT;
}

const _lang = _detectLang();

// Static specifier per branch (not a template literal) so the preload hint, the import
// map-less browser resolver and any future tooling all see a literal, analysable URL.
const { DICT } = _lang === 'en'
  ? await import('./i18n-dict-en.js')
  : await import('./i18n-dict-ru.js');

export function getLang() { return _lang; }

export function t(key) {
  return DICT[key] ?? key;
}

export function setLang(lang) {
  if (!LANGS.includes(lang) || lang === _lang) return;
  const stripped = _stripLangPrefix(window.location.pathname);
  const nextPath = lang === DEFAULT ? stripped : `/${lang}${stripped}`;
  window.location.href = nextPath + window.location.search;
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
