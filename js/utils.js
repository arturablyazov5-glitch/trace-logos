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

export const SVG_URL_V = Date.now();

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

// Returns the WebP preview URL for a PNG asset, or null when previews are not
// enabled for this page / the asset is not a local PNG. Previews are
// build-generated mirrors of assets/logos/pngs in assets/logos/previews.
export function previewUrl(file) {
  if (!_previewBase || file.startsWith('/') || !file.endsWith('.png')) return null;
  const webp = file.replace(/\.png$/, '.webp');
  return `${_previewBase}/${webp}?v=${SVG_URL_V}`;
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

// Абсолютный URL ассета (для превью в админке) из item.file.
function assetAbsUrl(file) {
  if (!file) return '';
  if (/^https?:\/\//.test(file)) return file;
  if (file.startsWith('/')) return SITE_ORIGIN + file;
  const folder = file.endsWith('.png') ? 'pngs' : 'svgs';
  return `${SITE_ORIGIN}/assets/logos/${folder}/${file}`;
}

export function trackExport(figma, format, variant) {
  if (!figma || !format) return;
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
