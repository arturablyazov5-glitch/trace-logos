const seoPageExistsCache = new Map();

let _urlMapPromise = null;
function loadUrlMap() {
  if (!_urlMapPromise) {
    const base = repoBase();
    _urlMapPromise = fetch(base + '/emoji/_url-map.json')
      .then(r => r.ok ? r.json() : {})
      .catch(() => ({}));
  }
  return _urlMapPromise;
}

export function slugifyPathPart(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}

function repoBase() {
  const m = location.pathname.match(/^(.*?)\/(?:logos|icons|emoji)\//);
  return m ? m[1] : '';
}

export function seoPageUrlForItem(item) {
  const parts = (item.figma || '').split('/').map(part => slugifyPathPart(part)).filter(Boolean);
  if (parts[0] !== 'icon' || parts.length < 3) return '';
  return repoBase() + `/logos/${parts.slice(1).join('/')}/`;
}

async function seoPageExists(url) {
  if (!url) return false;
  if (!seoPageExistsCache.has(url)) {
    const p = fetch(url, { method: 'HEAD' })
      .then(r => r.ok)
      .catch(() => { seoPageExistsCache.delete(url); return false; });
    seoPageExistsCache.set(url, p);
  }
  return seoPageExistsCache.get(url);
}

export async function updateSeoPageLink(item, activeCardRef) {
  const pageLinkEl = document.getElementById('detail-page-link');
  const btnPageLink = document.getElementById('btn-page-link');

  pageLinkEl.classList.add('hidden');

  const figmaParts = (item.figma || '').split('/').map(slugifyPathPart).filter(Boolean);
  if (figmaParts[0] === 'emoji') {
    const map = await loadUrlMap();
    const relUrl = map[item.file];
    if (!relUrl || activeCardRef?.() !== item) return;
    btnPageLink.href = repoBase() + relUrl;
    pageLinkEl.classList.remove('hidden');
    return;
  }

  const pageUrl = seoPageUrlForItem(item);
  if (!pageUrl) return;

  const exists = await seoPageExists(pageUrl);
  if (activeCardRef?.() !== item || !exists) return;

  btnPageLink.href = pageUrl;
  pageLinkEl.classList.remove('hidden');
}
