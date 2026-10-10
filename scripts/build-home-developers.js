#!/usr/bin/env node
// Owns the DEVELOPERS marker block. Product previews are shared with /developers/.
// Styles: developers-ui.bundle.css; copy interaction: js/developers.js.
const fs   = require('fs');
const path = require('path');
const { demos } = require('./lib/developer-demos');
const { loadDict } = require('./lib/en-transform');

const ROOT       = path.resolve(__dirname, '..');
const INDEX_HTML = path.join(ROOT, 'index.html');
const DRY_RUN    = process.argv.includes('--dry-run');

const HTML_MARKER_RE = /([ \t]*)(<!-- DEVELOPERS:START -->)[\s\S]*?([ \t]*)(<!-- DEVELOPERS:END -->)/;

// Порядок карточек; якоря совпадают с id секций на /developers/.
const CARDS = [
  { key: 'Vscode', icon: 'code',     anchor: 'vscode' },
  { key: 'Npm',    icon: 'terminal', anchor: 'npm' },
  { key: 'Api',    icon: 'braces',   anchor: 'api' },
];

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function main() {
  const ru = loadDict().ru;
  const t = key => {
    if (typeof ru[key] !== 'string' || !ru[key]) throw new Error(`js/i18n-dict-ru.js: нет ключа ${key}`);
    return `<span data-i18n="${key}">${esc(ru[key])}</span>`;
  };

  const demo = demos(ru);
  const actions = {
    Vscode: `<a class="dev-action" href="https://marketplace.visualstudio.com/items?itemName=trace-logos.trace-logos" target="_blank" rel="noopener">${t('homeDevInstall')} <span aria-hidden="true">↗</span></a>`,
    Npm: `<div class="blog-code dev-install"><code>npm i trace-logos</code><button type="button" class="blog-code-copy" data-i18n-aria="homeDevCopyAria" aria-label="${esc(ru.homeDevCopyAria)}"><span data-i18n="developersCopy">${esc(ru.developersCopy)}</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></div>`,
    Api: `<a class="dev-action" href="/logos.json" target="_blank" rel="noopener">${t('homeDevOpenJson')} <span aria-hidden="true">↗</span></a>`,
  };
  const cards = CARDS.map(c => `        <article class="dev-product">
          <div class="dev-product-copy"><h3><a href="developers/#${c.anchor}">${t(`homeDev${c.key}Title`)}</a></h3></div>
          ${demo[c.key]}
          <div class="dev-product-action">${actions[c.key]}</div>
        </article>`).join('\n');
  const body = `    <section class="section home-developers" aria-labelledby="h-developers">
      <div class="section-head">
        <div><h2 id="h-developers">${t('homeDevTitle')}</h2><div class="sub">${t('homeDevSub')}</div></div>
        <a class="section-link" href="developers/">${t('homeDevMore')}</a>
      </div>
      ${demo.badges}
      <div class="dev-products">${cards}</div>
      <script type="module" src="js/developers.min.js"></script>
    </section>`;

  const src = fs.readFileSync(INDEX_HTML, 'utf8');
  if (!HTML_MARKER_RE.test(src)) throw new Error('index.html: не найдены маркеры DEVELOPERS:START/END');
  const patched = src.replace(HTML_MARKER_RE, (m, p1, p2, p3, p4) => `${p1}${p2}\n${body}\n${p3}${p4}`);

  if (DRY_RUN) {
    console.log(`developers: ${CARDS.length} карточки${patched === src ? ', без изменений' : ', есть изменения'}`);
    return;
  }
  if (patched !== src) fs.writeFileSync(INDEX_HTML, patched, 'utf8');
  console.log(patched !== src
    ? `✓ index.html — блок «Для разработчиков» синхронизирован (${CARDS.length} карточки)`
    : '  · «Для разработчиков» уже синхронизирован, изменений нет');
}

main();
