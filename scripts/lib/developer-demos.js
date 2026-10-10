// Shared product previews for the homepage and /developers/. Data comes from logos.json.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function demos(dict) {
  const t = key => `<span data-i18n="${key}">${esc(dict[key])}</span>`;
  const logos = JSON.parse(fs.readFileSync(path.join(ROOT, 'logos.json'), 'utf8')).logos;
  const find = slug => {
    const logo = logos.find(l => l.url?.endsWith(`/${slug}/`));
    if (!logo) throw new Error(`Developer demo: missing ${slug}`);
    return logo;
  };
  const telegram = find('telegram');
  const rows = ['telegram', 'vk', 'sber'].map((slug, i) => {
    const logo = find(slug);
    const preview = `/assets/logos/previews/${slug}.webp`;
    if (!fs.existsSync(path.join(ROOT, preview))) throw new Error(`Missing ${preview}`);
    const key = `homeDevBrand${i + 1}`;
    return `<div class="dev-pick-row${i === 0 ? ' dev-pick-selected' : ''}"><img src="${preview}" width="28" height="28" alt="" loading="lazy"><div>${t(key)}<small>${esc(logo.categorySlug)} · SVG${logo.pngUrl ? ' / PNG' : ''}</small></div><span class="dev-pick-format">.svg</span></div>`;
  }).join('');
  // Captured from npx trace-logos@0.1.0 search telegram --limit 3 (non-TTY).
  const output = '1. Telegram  (telegram)  Мессенджеры и соцсети  [svg png]\n2. Walt  (walt)  Платежи и карты  [svg]\n3. Т-Бизнес Секреты  (tbusinesssecrets)  Музыка и медиа  [svg png]';
  const json = JSON.stringify({name: telegram.name, svgUrl: telegram.svgUrl, url: telegram.url}, null, 2);
  const highlighted = esc(json).replace(/(&quot;[^\n]*?&quot;)(:)?/g, (_, value, colon) => `<span class="${colon ? 'dev-code-key' : 'dev-code-value'}">${value}</span>${colon || ''}`);
  return {
    Vscode: `<div class="dev-demo"><div class="dev-demo-bar">VS Code <span>Trace Logos: Search</span></div><div class="dev-pick"><div class="dev-pick-query">${t('homeDevPickQuery')}<span aria-hidden="true">⌕</span></div>${rows}</div></div>`,
    Npm: `<div class="dev-demo"><div class="dev-demo-bar">${t('homeDevTerminal')} <span>trace-logos</span></div><div class="dev-terminal"><code><span class="dev-code-key" aria-hidden="true">$ </span>npx trace-logos search telegram</code><pre>${esc(output)}</pre></div></div>`,
    Api: `<div class="dev-demo"><div class="dev-demo-bar">logos.json <span>JSON</span></div><pre class="dev-json"><code>${highlighted}</code></pre></div>`,
    badges: `<div class="dev-badges">${['homeDevMit', 'homeDevZero', 'homeDevSearch'].map(k => t(k)).join('')}</div>`,
  };
}
module.exports = { demos, esc };
