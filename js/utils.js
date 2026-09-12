import { ASSET_VERSION } from './version.js';

export function animateContainerHeight(el, changeFn, waitForImg) {
  const wasHidden = getComputedStyle(el).display === 'none';
  const oldH = wasHidden ? 0 : el.offsetHeight;

  if (!wasHidden) {
    el.style.height = oldH + 'px';
    el.style.overflow = 'hidden';
  }

  changeFn();

  const willBeHidden = getComputedStyle(el).display === 'none';

  if (wasHidden && willBeHidden) {
    el.style.height = '';
    el.style.overflow = '';
    return;
  }

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

let toastTimer;

export function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1600);
}

export function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function highlight(text, words) {
  if (!words || !words.length) return escapeHtml(text);
  const sorted = [...new Set(words.filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!sorted.length) return escapeHtml(text);
  const re = new RegExp(sorted.map(escapeRegExp).join('|'), 'gi');
  let result = '';
  let last = 0;
  text.replace(re, (m, idx) => {
    result += escapeHtml(text.slice(last, idx)) + '<mark>' + escapeHtml(m) + '</mark>';
    last = idx + m.length;
    return m;
  });
  result += escapeHtml(text.slice(last));
  return result;
}

const RU_TO_EN = 'йцукенгшщзхъфывапролджэячсмитьбю'.split('').reduce((m, c, i) => {
  m[c] = 'qwertyuiop[]asdfghjkl;\'zxcvbnm,.'.split('')[i]; return m; }, {});
const EN_TO_RU = Object.fromEntries(Object.entries(RU_TO_EN).map(([r, e]) => [e, r]));

export function switchLayout(str) {
  const hasRu = /[а-яё]/i.test(str);
  const map = hasRu ? RU_TO_EN : EN_TO_RU;
  return str.split('').map(c => map[c.toLowerCase()] ?? c).join('');
}

export const SVG_URL_V = ASSET_VERSION;

let _assetBase = '../assets/logos';
export function setAssetBase(base) { _assetBase = base; }

// Lightweight WebP grid previews (logos only). When unset, previewUrl()
// returns null and callers fall back to the real asset via svgUrl().
let _previewBase = null;
export function setPreviewBase(base) { _previewBase = base; }

export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  const kb = bytes / 1024;
  if (kb < 100) return kb.toFixed(1) + ' KB';
  return Math.round(kb) + ' KB';
}

export function svgUrl(file) {
  if (file.startsWith('/')) return `..${file}?v=${SVG_URL_V}`;
  const folder = file.endsWith('.png') ? 'pngs' : 'svgs';
  return `${_assetBase}/${folder}/${file}?v=${SVG_URL_V}`;
}

// Returns the WebP preview URL for a PNG or SVG logo asset, or null when
// previews are not enabled for this page / the file is neither. Previews are
// build-generated mirrors of assets/logos/{pngs,svgs} in assets/logos/previews
// (build-webp-previews.js) — every logo gets one, so this never has to guess
// whether a specific file qualifies.
export function previewUrl(file) {
  if (!_previewBase || file.startsWith('/')) return null;
  if (file.endsWith('.png')) return `${_previewBase}/${file.replace(/\.png$/, '.webp')}?v=${SVG_URL_V}`;
  if (file.endsWith('.svg')) return `${_previewBase}/${file.replace(/\.svg$/, '.webp')}?v=${SVG_URL_V}`;
  return null;
}

// ── Fuzzy search (Levenshtein) ───────────────────────────────────────────

export function levenshtein(a, b, threshold) {
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > threshold) return threshold + 1;
  if (la > lb) return levenshtein(b, a, threshold);
  const prev = new Array(la + 1);
  for (let i = 0; i <= la; i++) prev[i] = i;
  for (let j = 1; j <= lb; j++) {
    let corner = prev[0];
    prev[0] = j;
    let rowMin = prev[0];
    for (let i = 1; i <= la; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const val = Math.min(prev[i] + 1, prev[i - 1] + 1, corner + cost);
      corner = prev[i];
      prev[i] = val;
      if (val < rowMin) rowMin = val;
    }
    if (rowMin > threshold) return threshold + 1;
  }
  return prev[la];
}

function hasNonTextChars(s) {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c > 0x4FF && !(c >= 0x80 && c <= 0x24F)) return true;
  }
  return false;
}

export function fuzzyMatchToken(word, token) {
  if (word.length < 3 || token.length < 3) return -1;
  if (hasNonTextChars(token)) return -1;
  const threshold = word.length <= 4 ? 1 : 2;
  const dist = levenshtein(word, token, threshold);
  return dist <= threshold ? dist : -1;
}

// ── Трекинг популярности логотипов ───────────────────────────────────────
// Открытие detail-панели в каталоге и заход на SEO-страницу логотипа
// суммируются в один счётчик (ключ — item.figma) в Supabase.
const TRACK_URL = 'https://wezryybxxwicysnbmhkz.supabase.co/functions/v1/track';
const SITE_ORIGIN = 'https://trace-logos.ru';

// ── Режим «не считать меня» (для админа / своих тестов) ──────────────────
// Включается ТОЛЬКО вручную через URL-токен ?notrack — сам по себе никогда.
// Состояние хранится в localStorage (привязан к origin), поэтому «едет» с
// тобой по всем страницам сайта и переживает перезагрузки, пока не сбросишь
// через ?notrack=off. Все track*-вызовы его уважают (один guard на источник).
const NOTRACK_TOKEN = 'notrack';   // ?notrack — включить, ?notrack=off — выключить
const NOTRACK_KEY = 'tl_notrack';

function syncNotrackFlag() {
  try {
    const params = new URLSearchParams(location.search);
    if (!params.has(NOTRACK_TOKEN)) return;
    if (params.get(NOTRACK_TOKEN) === 'off') localStorage.removeItem(NOTRACK_KEY);
    else localStorage.setItem(NOTRACK_KEY, '1');
  } catch { /* localStorage недоступен — игнорируем */ }
}

export function isTrackingDisabled() {
  try { return localStorage.getItem(NOTRACK_KEY) === '1'; } catch { return false; }
}

// Бейдж «не записываюсь» — наглядный индикатор режима.
// Если на странице есть статический слот (#notrack-slot, напр. в детал-панели
// каталога) — заполняем его. Иначе создаём плавающий бейдж (главная, SEO).
const NOTRACK_LABEL = 'Режим разработчика';
// Lucide «code-2» icon paths — инлайн, чтобы не зависеть от CDN на всех страницах
const NOTRACK_ICON = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>';
// Попап: тумблер в стиле icns-модалки; ::before-мост закрывает зазор и не даёт hover прерваться
const NOTRACK_INNER = `${NOTRACK_ICON}<span>${NOTRACK_LABEL}</span><div class="notrack-popup"><span class="notrack-popup-tip">Статистика не записывается</span><label class="notrack-toggle"><span class="notrack-toggle-label">Режим разработчика</span><input type="checkbox" checked onchange="if(!this.checked){localStorage.removeItem('tl_notrack');location.href=location.pathname}"><span class="notrack-switch"></span></label></div>`;

function injectNotrackStyles() {
  if (document.getElementById('notrack-styles')) return;
  const s = document.createElement('style');
  s.id = 'notrack-styles';
  s.textContent = `
    #notrack-badge { position: relative; }

    .notrack-popup {
      display: none;
      position: absolute;
      bottom: calc(100% + 10px);
      left: 50%;
      transform: translateX(-50%);
      min-width: 210px;
      background: #1e1e1e;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 12px 14px;
      flex-direction: column;
      gap: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,.5);
      z-index: 100000;
    }
    /* Прозрачный мост — закрывает зазор между бейджем и попапом */
    .notrack-popup::before {
      content: '';
      position: absolute;
      top: 100%;
      left: 0; right: 0;
      height: 14px;
    }
    /* Стрелка вниз */
    .notrack-popup::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: #333;
    }
    #notrack-badge:hover .notrack-popup,
    #notrack-slot:hover .notrack-popup { display: flex; }

    .notrack-popup-tip {
      font: 400 11px/1.4 system-ui,sans-serif;
      color: #666;
    }

    /* Тумблер — копия .icns-toggle / .icns-switch */
    .notrack-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      cursor: pointer;
      user-select: none;
    }
    .notrack-toggle input { position: absolute; opacity: 0; width: 0; height: 0; }
    .notrack-toggle-label {
      font: 500 12px/1 system-ui,sans-serif;
      color: #ccc;
    }
    .notrack-switch {
      position: relative;
      flex-shrink: 0;
      width: 32px; height: 18px;
      border-radius: 999px;
      background: #3a3a3a;
      transition: background .18s ease;
    }
    .notrack-switch::after {
      content: '';
      position: absolute;
      top: 2px; left: 2px;
      width: 14px; height: 14px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 2px rgba(0,0,0,.35);
      transition: transform .18s ease;
    }
    .notrack-toggle input:checked + .notrack-switch { background: #34c759; }
    .notrack-toggle input:checked + .notrack-switch::after { transform: translateX(14px); }
  `;
  document.head.appendChild(s);
}

function showNotrackBadge() {
  injectNotrackStyles();
  const slot = document.getElementById('notrack-slot');
  if (slot) {
    if (!slot.innerHTML.trim()) slot.innerHTML = NOTRACK_INNER;
    slot.hidden = false;
    return;
  }
  if (document.getElementById('notrack-badge')) return;
  const b = document.createElement('div');
  b.id = 'notrack-badge';
  b.innerHTML = NOTRACK_INNER;
  b.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:99999;' +
    'display:flex;align-items:center;gap:6px;' +
    'background:#161616;color:#fff;border:1px solid #333;border-radius:999px;' +
    'padding:6px 12px;font:500 12px/1 system-ui,sans-serif;opacity:.85;' +
    'cursor:default;user-select:none';
  document.body.appendChild(b);
}

syncNotrackFlag();
if (isTrackingDisabled()) {
  if (document.body) showNotrackBadge();
  else document.addEventListener('DOMContentLoaded', showNotrackBadge);
}

// Абсолютный URL ассета (для превью в админке) из item.file.
function assetAbsUrl(file) {
  if (!file) return '';
  if (/^https?:\/\//.test(file)) return file;
  if (file.startsWith('/')) return SITE_ORIGIN + file;
  const folder = file.endsWith('.png') ? 'pngs' : 'svgs';
  // _assetBase уже несёт текущий раздел (logos/emoji/icons) — setAssetBase()
  // выставляет его из main.js. Раньше здесь была захардкожена "logos", из-за
  // чего превью эмодзи и иконок в админке всегда 404-ились.
  const section = _assetBase.match(/assets\/([^/]+)/)?.[1] ?? 'logos';
  return `${SITE_ORIGIN}/assets/${section}/${folder}/${file}`;
}

export function trackExport(figma, format, variant) {
  if (!figma || !format) return;
  // Every export path in the app funnels through here, so this is the one place
  // that can announce "a file just left the site". js/donate.js listens for it.
  // Fired before the analytics guards below on purpose: the donate prompt is UI,
  // not tracking — it must not depend on analytics consent or on the host.
  document.dispatchEvent(new CustomEvent('tl:export', { detail: { figma, format, variant: variant || '' } }));
  if (isTrackingDisabled()) return;
  const host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '') return;
  fetch(TRACK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ figma, format, variant: variant || '' }),
    keepalive: true,
  }).catch(() => {});
}

export function trackLogoView(figma, name, file) {
  if (!figma) return;
  if (isTrackingDisabled()) return;
  // Локальную разработку не считаем, чтобы не засорять боевую статистику.
  const host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '') return;

  fetch(TRACK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ figma, name: name || '', img: assetAbsUrl(file) }),
    keepalive: true, // переживает уход со страницы (актуально для SEO-страниц)
  }).catch(() => {});
}

// ── Трекинг кликов по промо-баннеру (sidebar, landologovo и т.п.) ────────
export function trackBannerClick(bannerId) {
  if (!bannerId) return;
  if (isTrackingDisabled()) return;
  const host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '') return;
  fetch(TRACK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ banner: bannerId }),
    keepalive: true, // клик открывает внешний сайт в новой вкладке, но keepalive не помешает
  }).catch(() => {});
}

// ── Трекинг использования UI-фильтров ───────────────────────────────────
// Храним в той же таблице, что и баннеры, с namespace `ui:*`: админка уже
// показывает эти счетчики, а отдельная функция не размазывает смысл по коду.
export function trackFormatFilterClick(format) {
  const value = String(format || '').trim().toLowerCase();
  if (!['all', 'svg', 'png'].includes(value)) return;
  trackBannerClick(`ui:format-filter:${value}`);
}

// ── Трекинг поисковых запросов ───────────────────────────────────────────
// Поиск в шапке динамический — фильтрует на каждое нажатие клавиши, без
// Enter/сабмита. Слать в Supabase каждую промежуточную букву («т», «те»,
// «тес»…) бессмысленно, поэтому ждём паузу в наборе (settle-таймер) и шлём
// только «застывший» запрос — тот, на котором пользователь на секунду
// остановился. Это ловит и «дописал слово и посмотрел на результат», и
// «начал печатать и стёр» (settle просто не наступает, ничего не летит).
// В отличие от прежнего trackSearchNoResults, шлём ВСЕ запросы, а не только
// нулевые — resultsCount едет вместе с текстом, разбирать по нулю или нет
// удобнее уже в админке, чем терять контекст на клиенте.
let searchQueryTimer = null;
let pendingSearchLog = null;   // { query, resultsCount } — ждёт settle
let lastLoggedSearchQuery = null; // не шлём подряд идентичный запрос дважды

function sendSearchQuery(query, resultsCount) {
  fetch(TRACK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ searchQuery: query, resultsCount }),
    keepalive: true,
  }).catch(() => {});
  lastLoggedSearchQuery = query;
  pendingSearchLog = null;
}

export function trackSearchQuery(query, resultsCount) {
  if (isTrackingDisabled()) return;
  const host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '') return;
  const q = (query || '').trim().toLowerCase();
  clearTimeout(searchQueryTimer);
  if (q.length < 2) { pendingSearchLog = null; return; }
  pendingSearchLog = { query: q, resultsCount };
  searchQueryTimer = setTimeout(() => {
    if (pendingSearchLog && pendingSearchLog.query !== lastLoggedSearchQuery) {
      sendSearchQuery(pendingSearchLog.query, pendingSearchLog.resultsCount);
    }
  }, 1200);
}

// Досылает незалогированный запрос сразу, не дожидаясь settle-таймера —
// иначе «напечатал и тут же ушёл со страницы/убрал фокус» теряется.
export function flushSearchQuery() {
  clearTimeout(searchQueryTimer);
  if (pendingSearchLog && pendingSearchLog.query !== lastLoggedSearchQuery) {
    sendSearchQuery(pendingSearchLog.query, pendingSearchLog.resultsCount);
  }
}
