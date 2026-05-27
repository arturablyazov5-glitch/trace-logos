const seoPageExistsCache = new Map();

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
  const pageUrl = seoPageUrlForItem(item);

  pageLinkEl.classList.add('hidden');
  if (!pageUrl) return;

  const exists = await seoPageExists(pageUrl);
  if (activeCardRef?.() !== item || !exists) return;

  btnPageLink.href = pageUrl;
  pageLinkEl.classList.remove('hidden');
}
