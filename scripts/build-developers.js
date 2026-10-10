#!/usr/bin/env node
// Owns /developers/ and /en/developers/ (RU + EN in one pass, like build-partnership.js).
// Copy lives in the shared dictionaries (developers* keys); code samples live here —
// they are language-neutral and every one of them is checked by running it.
const fs = require('fs');
const path = require('path');
const { demos } = require('./lib/developer-demos');
const { loadTemplate } = require('./lib/render');
const { loadDict, bakeI18n, enChrome, hreflangBlock } = require('./lib/en-transform');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://trace-logos.ru';
const NPM_URL = 'https://www.npmjs.com/package/trace-logos';
const MARKETPLACE_URL = 'https://marketplace.visualstudio.com/items?itemName=trace-logos.trace-logos';
const OPEN_VSX_URL = 'https://open-vsx.org/extension/trace-logos/trace-logos';
const GITHUB_URL = 'https://github.com/arturablyazov5-glitch/trace-logos-integrations';
const dicts = loadDict();
const template = loadTemplate(path.join(ROOT, 'templates/developers-page.html'));
const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Dictionary copy marks identifiers with `backticks` → <code>; plain text for JSON-LD.
const rich = value => escape(value).replace(/`([^`]+)`/g, '<code>$1</code>');
const plain = value => String(value).replace(/`/g, '');

const CODE = {
  NPM_CLI: ['sh', `npx trace-logos get telegram --svg --out ./assets
npx trace-logos search telegram --json`],
  NPM_LIB: ['js', `import { TraceLogos } from 'trace-logos';

const tl = new TraceLogos();
await tl.load();
const [logo] = tl.search('telegram', { limit: 1 });
console.log(logo.name, tl.pageUrl(logo));`],
  API_JS: ['js', `const res = await fetch(
  'https://trace-logos.ru/logos.json'
);
const { logos } = await res.json();
const logo = logos.find(
  ({ name }) => name === 'Telegram'
);
console.log(logo.svgUrl, logo.url);`],
};

// Same copy behavior as .blog-code, styled as a page action. Code is never translated.
function commandButton(code, dict, primary = false) {
  return `<div class="blog-code dev-command${primary ? ' dev-command-primary' : ''}">
    <code>${escape(code)}</code>
    <button type="button" class="blog-code-copy" aria-label="${escape(dict.developersCopyCommand)}: ${escape(code)}" data-copy-label="${escape(dict.developersCopy)}" data-copied-label="${escape(dict.developersCopied)}">
      <span aria-live="polite">${escape(dict.developersCopy)}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
    </button>
  </div>`;
}

// Markup of the shared .blog-code component (css/code-block.css + js/blog-code.js),
// identical to the fenced-code output of scripts/build-blog.js.
function codeBlock([label, code], dict) {
  return `<div class="blog-code">
      <div class="blog-code-head">
        <span class="blog-code-lang">${escape(label)}</span>
        <button type="button" class="blog-code-copy" aria-label="${escape(dict.developersCopy)}" data-copy-label="${escape(dict.developersCopy)}" data-copied-label="${escape(dict.developersCopied)}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span aria-live="polite">${escape(dict.developersCopy)}</span>
        </button>
      </div>
      <pre><code>${escape(code)}</code></pre>
    </div>`;
}

const FAQ_KEYS = [1, 2, 3, 4, 5];

for (const lang of ['ru', 'en']) {
  const dict = dicts[lang];
  const prefix = lang === 'en' ? 'en/' : '';
  const url = `${BASE}/${prefix}developers/`;
  const home = `${BASE}/${prefix}`;
  const faq = FAQ_KEYS.map(n => ({ q: dict[`developersFaqQ${n}`], a: dict[`developersFaqA${n}`] }));
  if (faq.some(f => !f.q || !f.a)) throw new Error(`developersFaq*: missing ${lang} copy`);

  const software = (name, extra) => ({
    '@type': 'SoftwareApplication', name, applicationCategory: 'DeveloperApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'RUB' },
    license: 'https://opensource.org/licenses/MIT',
    author: { '@type': 'Organization', name: "Trace Logo's", url: `${BASE}/` },
    ...extra,
  });

  const preview = demos(dict);
  const vars = {
    COMMAND_HERO: commandButton('npx trace-logos search telegram', dict, true),
    COMMAND_NPM: commandButton('npm i trace-logos', dict, true),
    COMMAND_VSCODE: commandButton('ext install trace-logos.trace-logos', dict),
    COMMAND_API: commandButton(`${BASE}/logos.json`, dict),
    DEMO_VSCODE: preview.Vscode, DEMO_NPM: preview.Npm, DEMO_API: preview.Api, DEV_BADGES: preview.badges,
    ...Object.fromEntries(Object.entries(dict)
      .filter(([key, value]) => key.startsWith('developers') && typeof value === 'string')
      .map(([key, value]) => [key, rich(value)])),
    partnershipTerms: escape(dict.partnershipTerms),
    REL: '../', HOME_REL: '../', CANONICAL_URL: `${BASE}/developers/`,
    HREFLANG_TAGS: hreflangBlock(`${BASE}/developers/`, `${BASE}/en/developers/`),
    ...Object.fromEntries(Object.entries(CODE).map(([key, block]) => [`CODE_${key}`, codeBlock(block, dict)])),
    FAQ_ITEMS: faq.map(f => `      <details class="faq-item">
        <summary class="faq-q">${rich(f.q)}</summary>
        <div class="faq-a">${rich(f.a)}</div>
      </details>`).join('\n'),
    JSON_LD: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage', '@id': `${url}#webpage`, url, inLanguage: lang,
          name: plain(dict.developersMetaTitle), description: plain(dict.developersDescription),
          isPartOf: { '@id': `${BASE}/#website` },
          breadcrumb: { '@id': `${url}#breadcrumb` },
        },
        {
          '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: "Trace Logo's", item: home },
            { '@type': 'ListItem', position: 2, name: plain(dict.developersTitle), item: url },
          ],
        },
        software('trace-logos', {
          description: plain(dict.developersNpmText),
          operatingSystem: 'macOS, Windows, Linux (Node.js 18.17+)',
          downloadUrl: NPM_URL, softwareVersion: '0.1.0',
          sameAs: [NPM_URL, GITHUB_URL],
        }),
        software('Trace Logos for VS Code', {
          description: plain(dict.developersVscodeText),
          operatingSystem: 'Visual Studio Code 1.85+',
          downloadUrl: MARKETPLACE_URL,
          sameAs: [MARKETPLACE_URL, OPEN_VSX_URL, GITHUB_URL],
        }),
        {
          '@type': 'FAQPage', '@id': `${url}#faq`,
          mainEntity: faq.map(f => ({
            '@type': 'Question', name: plain(f.q),
            acceptedAnswer: { '@type': 'Answer', text: plain(f.a) },
          })),
        },
      ],
    }).replace(/</g, '\\u003c'),
  };

  let html = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in vars)) throw new Error(`Unknown developers placeholder: ${key}`);
    return vars[key];
  });
  if (lang === 'en') html = enChrome(bakeI18n(html, dict), 'developers/index.html');
  const out = path.join(ROOT, lang === 'en' ? 'en/developers/index.html' : 'developers/index.html');
  if (!process.argv.includes('--dry-run')) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, html);
  }
  console.log(`✓ ${path.relative(ROOT, out)}`);
}
