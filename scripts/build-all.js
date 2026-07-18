#!/usr/bin/env node
/**
 * Runs the full build pipeline in the correct dependency order, so adding a
 * logo/emoji/collection/post never means remembering which of the ~15
 * scripts to run and in what sequence (see CLAUDE.md "Adding a new logo").
 *
 * Each step is a real `node scripts/x.js` child process — every script here
 * runs its own main() unconditionally at the top level (no exports, no
 * require.main guard), so requiring them in-process would double-run work
 * and let one script's process.exit() kill the whole pipeline.
 *
 * Usage:
 *   node scripts/build-all.js                # fast tier (default)
 *   node scripts/build-all.js --dry-run       # preview every step, write nothing
 *   node scripts/build-all.js --with-og       # + regenerate assets/og/<slug>.png (Puppeteer, ~582 renders, slow)
 *   node scripts/build-all.js --og-home       # + regenerate assets/og/home.png
 *   node scripts/build-all.js --plugin-assets # + regenerate figma-plugin/assets/*
 *   node scripts/build-all.js --full          # everything above
 *
 * The "fast tier" excludes the three Puppeteer/Chrome steps because they are
 * documented as run-rarely / run-when-a-new-logo-needs-an-OG-image, not as
 * part of every content edit — running them by default would turn a few
 * seconds of build into several minutes on every invocation.
 */

const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const DRY_RUN   = argv.includes('--dry-run');
const WITH_OG   = argv.includes('--with-og') || argv.includes('--full');
const OG_HOME   = argv.includes('--og-home') || argv.includes('--full');
const PLUGIN_ASSETS = argv.includes('--plugin-assets') || argv.includes('--full');

// Order encodes real data dependencies (see CLAUDE.md "Build Scripts"):
//   api-json → collections (needs logos.json)
//   emoji-seo-pages → emoji-category-pages / emoji-json (need emoji/_url-map.json)
//   all HTML builders → en-pages (mirrors whatever HTML exists at the time it runs)
//   everything → sitemap.js (sole owner of sitemap.xml, must run last)
const FAST_STEPS = [
  { file: 'test-data.js', args: ['--pre'],  label: 'Тесты данных: манифесты, ассеты, экосистемы — до сборки' },
  { file: 'build-download-stats.js',       label: 'Статистика скачиваний (для «Скачано: N раз» на SEO-страницах)' },
  { file: 'build-search-images.js',        label: 'PNG-рендеры SVG-логотипов для Яндекс.Картинок (инкрементально)' },
  { file: 'build-seo-pages.js',           label: 'SEO-страницы логотипов (logos/<cat>/<slug>/)' },
  { file: 'cleanup-orphaned-pages.js',     label: 'Удаление осиротевших страниц' },
  { file: 'build-api-json.js',             label: 'Публичный API (logos.json, logos/<cat>.json)' },
  { file: 'build-cdn.js',                  label: 'CDN-зеркало по коротким слагам (cdn-dist/)' },
  { file: 'build-collections.js',          label: 'Подборки (collections/<slug>/)' },
  { file: 'build-category-pages.js',       label: 'Страницы категорий + detail-панель в logos/index.html' },
  { file: 'build-ecosystem-pages.js',      label: 'Страницы экосистем (logos/ecosystem/<key>/)' },
  { file: 'build-webp-previews.js',        label: 'WebP-превью для PNG-логотипов (инкрементально)' },
  { file: 'test-data.js', args: ['--post'], label: 'Тесты артефактов: WebP-превью, OG-картинки' },
  { file: 'build-emoji-seo-pages.js',      label: 'SEO-страницы эмодзи (emoji/<cat>/<slug>/)' },
  { file: 'build-emoji-category-pages.js', label: 'Страницы категорий эмодзи' },
  { file: 'build-emoji-json.js',           label: 'emoji.json' },
  { file: 'build-blog.js',                 label: 'Страницы блога' },
  { file: 'build-blog-rss.js',             label: 'blog/rss.xml' },
  { file: 'build-home-popular.js',         label: 'Блок «Популярные логотипы» на главной (по статистике)' },
  { file: 'build-home-sitemap.js',         label: 'Блок «Карта сайта» на главной' },
  { file: 'build-en-pages.js',             label: 'EN-зеркало (/en/) — обязательно после всех HTML-билдеров выше' },
  { file: 'test-links.js',                 label: 'Тесты ссылок: битые навигационные href в готовом HTML — после всех страниц' },
  { file: 'build-sitemap.js',              label: 'sitemap.xml + sitemap-*.xml — ВСЕГДА последним' },
  { file: 'build-version.js',              label: 'js/version.js (ASSET_VERSION) — cache-buster, самый последний шаг' },
];

const OPTIONAL_STEPS = [
  { file: 'build-og-images.js',     label: 'OG-превью логотипов (assets/og/<slug>.png)', enabled: WITH_OG },
  { file: 'build-og-home.js',       label: 'OG-превью главной (assets/og/home.png)',     enabled: OG_HOME },
  { file: 'build-plugin-assets.js', label: 'Ассеты Figma-плагина (иконка, thumbnail)',   enabled: PLUGIN_ASSETS },
];

function runStep({ file, label, args: stepArgs = [] }) {
  const scriptPath = path.join(__dirname, file);
  const args = [...stepArgs, ...(DRY_RUN ? ['--dry-run'] : [])];
  process.stdout.write(`\n\x1b[36m▶ ${file}\x1b[0m — ${label}\n`);
  const start = process.hrtime.bigint();
  execFileSync('node', [scriptPath, ...args], { cwd: ROOT, stdio: 'inherit' });
  const ms = Number(process.hrtime.bigint() - start) / 1e6;
  return ms;
}

function main() {
  const steps = [...FAST_STEPS, ...OPTIONAL_STEPS.filter(s => s.enabled)];
  const skipped = OPTIONAL_STEPS.filter(s => !s.enabled);

  console.log(`\x1b[1mbuild-all${DRY_RUN ? ' (dry-run)' : ''}\x1b[0m — ${steps.length} шагов`);
  if (skipped.length) {
    console.log(`Пропущено (медленные Puppeteer-шаги, не входят в fast tier): ${skipped.map(s => s.file).join(', ')}`);
    console.log('Запустить их тоже: --with-og / --og-home / --plugin-assets / --full\n');
  }

  const timings = [];
  const overallStart = process.hrtime.bigint();

  for (const step of steps) {
    try {
      const ms = runStep(step);
      timings.push({ file: step.file, ms, ok: true });
    } catch (err) {
      timings.push({ file: step.file, ms: 0, ok: false });
      console.error(`\n\x1b[31m✗ Провалился шаг: ${step.file}\x1b[0m`);
      console.error('  Дальнейшие шаги остановлены — они могут зависеть от вывода этого скрипта.');
      printSummary(timings, overallStart);
      process.exit(1);
    }
  }

  printSummary(timings, overallStart);
}

function printSummary(timings, overallStart) {
  const totalMs = Number(process.hrtime.bigint() - overallStart) / 1e6;
  console.log('\n\x1b[1m── Итог ──\x1b[0m');
  for (const t of timings) {
    const mark = t.ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
    console.log(`  ${mark} ${t.file.padEnd(32)} ${t.ok ? (t.ms / 1000).toFixed(1) + 's' : '—'}`);
  }
  console.log(`\nВсего: ${(totalMs / 1000).toFixed(1)}s`);
}

main();
