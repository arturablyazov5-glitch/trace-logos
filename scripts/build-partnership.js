#!/usr/bin/env node
// Owns /partnership/ and /en/partnership/. Copy lives in the shared dictionaries.
const fs = require('fs');
const path = require('path');
const { loadTemplate } = require('./lib/render');
const { loadDict, bakeI18n, enChrome, hreflangBlock } = require('./lib/en-transform');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://trace-logos.ru';
const dicts = loadDict();
const template = loadTemplate(path.join(ROOT, 'templates/partnership-page.html'));
const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

for (const lang of ['ru', 'en']) {
  const dict = dicts[lang];
  const url = `${BASE}/${lang === 'en' ? 'en/' : ''}partnership/`;
  const vars = {
    ...Object.fromEntries(Object.entries(dict).filter(([key]) => key.startsWith('partnership'))
      .map(([key, value]) => [key, escape(value)])),
    REL: '../', HOME_REL: '../', CANONICAL_URL: `${BASE}/partnership/`,
    HREFLANG_TAGS: hreflangBlock(`${BASE}/partnership/`, `${BASE}/en/partnership/`),
    EMBED_CODE: escape(`<a href="${BASE}/?utm_source=your-service">\n  <img src="${BASE}/assets/partnership/badge-dark.svg" alt="${dict.partnershipBadgeAlt}" width="199" height="63">\n</a>`),
    JSON_LD: JSON.stringify({
      '@context': 'https://schema.org', '@type': 'WebPage',
      name: dict.partnershipTitle, description: dict.partnershipDescription,
      url, inLanguage: lang,
    }),
  };
  let html = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in vars)) throw new Error(`Unknown partnership placeholder: ${key}`);
    return vars[key];
  });
  if (lang === 'en') html = enChrome(bakeI18n(html, dict), 'partnership/index.html');
  const out = path.join(ROOT, lang === 'en' ? 'en/partnership/index.html' : 'partnership/index.html');
  if (!process.argv.includes('--dry-run')) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, html);
  }
  console.log(`✓ ${path.relative(ROOT, out)}`);
}
