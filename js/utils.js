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

export const SVG_URL_V = Date.now();

export function svgUrl(file) {
  return 'svgs/' + file + '?v=' + SVG_URL_V;
}
