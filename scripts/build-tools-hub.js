#!/usr/bin/env node
/**
 * /tools/ owns its hand-authored cards and FAQ. Derive JSON-LD from that
 * visible content, rather than maintaining a second catalogue in the head.
 * Edit content outside TOOLS-SEO markers, then run this before EN/sitemap.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'tools/index.html');

function text(html) {
  return html.replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

function build(html, lang = 'ru') {
  const URL_BASE = `https://trace-logos.ru/${lang === 'en' ? 'en/' : ''}tools/`;
  const tools = [...html.matchAll(/<!-- TOOL:([\w-]+):START -->([\s\S]*?)<!-- TOOL:\1:END -->/g)]
    .map(([, id, card], i) => {
      const name = card.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/)?.[1];
      const description = card.match(/<(?:p|div) class="(?:ext-desc|ff-desc|tool-desc)">([\s\S]*?)<\/(?:p|div)>/)?.[1];
      if (!name || !description || !card.includes(`id="${id}"`)) throw new Error(`Incomplete tool card: ${id}`);
      const href = card.match(/^\s*<a\b[^>]*href="([^"]+)"/)?.[1]
        || card.match(/href="(https:\/\/www\.figma\.com\/community\/plugin\/[^\"]+)"/)?.[1]
        || `#${id}`;
      const item = {
        '@type': 'SoftwareApplication', '@id': `${URL_BASE}#${id}-app`,
        name: text(name), description: text(description), url: new URL(href, URL_BASE).href,
        applicationCategory: 'DesignApplication',
      };
      const manifest = path.join(ROOT, 'tools/extensions', id, 'manifest.json');
      if (fs.existsSync(manifest)) {
        const version = JSON.parse(fs.readFileSync(manifest, 'utf8')).version;
        item.softwareVersion = version;
        item.applicationCategory = 'BrowserApplication';
        // A version badge must agree with the actual extension source.
        if (!card.includes(`v${version}</span>`)) throw new Error(`Stale version badge: ${id}`);
      }
      return { '@type': 'ListItem', position: i + 1, item };
    });
  if (!tools.length || new Set(tools.map(t => t.item['@id'])).size !== tools.length) throw new Error('Empty or duplicate tools');
  const faq = [...html.matchAll(/<details class="faq-item">\s*<summary class="faq-q">([\s\S]*?)<\/summary>\s*<p class="faq-a">([\s\S]*?)<\/p>\s*<\/details>/g)]
    .map(([, q, a]) => ({ '@type': 'Question', name: text(q), acceptedAnswer: { '@type': 'Answer', text: text(a) } }));
  const date = html.match(/<time datetime="(\d{4}-\d{2}-\d{2})">/)?.[1];
  if (!date || !faq.length) throw new Error('Missing content review date or FAQ');
  const graph = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'CollectionPage', '@id': `${URL_BASE}#webpage`, url: URL_BASE,
        name: text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1]),
        description: html.match(/<meta name="description" content="([^"]+)"/)[1],
        inLanguage: lang === 'en' ? 'en-US' : 'ru-RU', dateModified: date,
        image: 'https://trace-logos.ru/assets/og/tools.png',
        breadcrumb: { '@id': `${URL_BASE}#breadcrumb` }, mainEntity: { '@id': `${URL_BASE}#catalog` } },
      { '@type': 'BreadcrumbList', '@id': `${URL_BASE}#breadcrumb`, itemListElement: [
        { '@type': 'ListItem', position: 1, name: lang === 'en' ? 'Home' : 'Главная', item: `https://trace-logos.ru/${lang === 'en' ? 'en/' : ''}` },
        { '@type': 'ListItem', position: 2, name: lang === 'en' ? 'Tools' : 'Инструменты', item: URL_BASE },
      ] },
      { '@type': 'ItemList', '@id': `${URL_BASE}#catalog`, name: lang === 'en' ? 'Trace Logo’s tools' : 'Инструменты Trace Logo’s',
        numberOfItems: tools.length, itemListOrder: 'https://schema.org/ItemListUnordered', itemListElement: tools },
      { '@type': 'FAQPage', '@id': `${URL_BASE}#h-faq`, inLanguage: lang === 'en' ? 'en-US' : 'ru-RU', mainEntity: faq },
    ],
  };
  const block = `<!-- TOOLS-SEO:START -->\n  <script type="application/ld+json">\n${JSON.stringify(graph, null, 2).replace(/</g, '\\u003c')}\n  </script>\n  <!-- TOOLS-SEO:END -->`;
  if (!html.includes('<!-- TOOLS-SEO:START -->')) throw new Error('Missing SEO markers');
  return html.replace(/<!-- TOOLS-SEO:START -->[\s\S]*?<!-- TOOLS-SEO:END -->/, block);
}

if (require.main === module) {
  const html = fs.readFileSync(FILE, 'utf8');
  const result = build(html);
  if (!process.argv.includes('--dry-run') && result !== html) fs.writeFileSync(FILE, result);
  console.log(`tools hub: ${result === html ? 'up to date' : 'SEO derived from current cards and FAQ'}`);
}
module.exports = { build };
