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
 *   node scripts/build-all.js            # весь пайплайн
 *   node scripts/build-all.js --dry-run  # preview every step, write nothing
 *
 * НЕТ опциональных шагов и нет флагов «а ещё запусти вот это». Раньше был
 * «slow tier» из четырёх Puppeteer-скриптов, включаемых флагами — и каждый раз
 * это кончалось одинаково: шаг забывали, артефакт уезжал в прод битым или
 * протухшим. Хронология: 125/176 постов блога уехали без OG-картинки
 * (build-blog-og-images.js был за флагом --og-blog); логотип Ozon Profit — без
 * OG (build-og-images.js был за --with-og); assets/og/home.png и
 * figma-plugin/assets/thumbnail.png провисели с июня с устаревшими счётчиками
 * логотипов, потому что их пересборка была за --og-home / --plugin-assets.
 *
 * Аргумент «эти шаги медленные» оказался неверным при замере: build-og-home 2.2s,
 * build-collection-og-images 1.6s, build-plugin-assets 3.6s — 7 секунд на фоне
 * ~70-секундной сборки. Все Puppeteer-шаги здесь сравнивают байты скриншота с
 * тем, что уже лежит на диске, и пишут только изменившееся: неизменная сборка
 * стоит времени, но не мусорит в git.
 *
 * Правило: если скрипт порождает артефакт, на который ссылается свёрстанная
 * страница, его место здесь. За пределами build-all.js остаются только
 * одноразовые миграции и ручные утилиты (см. CLAUDE.md).
 */

const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const DRY_RUN   = argv.includes('--dry-run');

// Order encodes real data dependencies (see CLAUDE.md "Build Scripts"):
//   api-json → collections (needs logos.json)
//   emoji-seo-pages → emoji-category-pages / emoji-json (need emoji/_url-map.json)
//   all HTML builders → en-pages (mirrors whatever HTML exists at the time it runs)
//   everything → sitemap.js (sole owner of sitemap.xml, must run last)
const STEPS = [
  { file: 'apply-typography.js',            label: 'Русская типографика (НБСП/тире/кавычки/эллипсис) в JSON-текстах и постах блога — до всех остальных шагов, читающих эти данные' },
  { file: 'test-data.js', args: ['--pre'],  label: 'Тесты данных: манифесты, ассеты, экосистемы — до сборки' },
  { file: 'test-i18n.js',                  label: 'Паритет словарей i18n (ru/en) + сверка ключей с вёрсткой — до запекания /en/' },
  { file: 'test-js.js',                    label: 'Синтаксис и граф импортов клиентского JS — до генерации страниц' },
  { file: 'test-css-parity.js',            label: 'CSS для пасхалок/микроанимаций main.js подключён на всех 4 страницах, что его грузят' },
  { file: 'build-download-stats.js',       label: 'Статистика скачиваний (для «Скачано: N раз» на SEO-страницах)' },
  { file: 'build-search-images.js',        label: 'PNG-рендеры SVG-логотипов для Яндекс.Картинок (инкрементально)' },
  { file: 'build-css-bundles.js',          label: 'CSS-бандл SEO-страниц (css/seo-page.bundle.css) — один <link> вместо семи' },
  { file: 'build-seo-pages.js',           label: 'SEO-страницы логотипов (logos/<cat>/<slug>/)' },
  { file: 'cleanup-orphaned-pages.js',     label: 'Удаление осиротевших страниц' },
  { file: 'build-api-json.js',             label: 'Публичный API (logos.json, logos/<cat>.json)' },
  { file: 'build-cdn.js',                  label: 'CDN-зеркало по коротким слагам (cdn-dist/)' },
  { file: 'build-collections.js',          label: 'Подборки (collections/<slug>/)' },
  { file: 'build-collection-og-images.js', label: 'OG-превью подборок (assets/og/collection-<slug>.png)' },
  { file: 'build-category-pages.js',       label: 'Страницы категорий + detail-панель в logos/index.html' },
  { file: 'build-ecosystem-pages.js',      label: 'Страницы экосистем (logos/ecosystem/<key>/)' },
  { file: 'build-webp-previews.js',        label: 'WebP-превью для PNG-логотипов (инкрементально)' },
  { file: 'test-data.js', args: ['--post'], label: 'Тесты артефактов: WebP-превью, OG-картинки' },
  { file: 'build-emoji-seo-pages.js',      label: 'SEO-страницы эмодзи (emoji/<cat>/<slug>/)' },
  { file: 'build-emoji-category-pages.js', label: 'Страницы категорий эмодзи' },
  { file: 'build-emoji-json.js',           label: 'emoji.json' },
  { file: 'build-og-images.js',            label: 'OG-превью логотипов (assets/og/<slug>.png)' },
  { file: 'build-og-home.js',              label: 'OG-превью главной (assets/og/home.png) — со счётчиками логотипов/эмодзи' },
  { file: 'build-plugin-assets.js',        label: 'Ассеты Figma-плагина (иконка, thumbnail) — тоже со счётчиками' },
  { file: 'build-blog.js',                 label: 'Страницы блога' },
  { file: 'build-blog-covers.js',          label: 'Кастомные обложки постов из assets/og-originals (PNG + WebP)' },
  { file: 'build-blog-og-images.js',       label: 'OG-превью постов блога (assets/og/blog/social/<slug>.png)' },
  { file: 'build-blog-rss.js',             label: 'blog/rss.xml' },
  { file: 'build-home-popular.js',         label: 'Блок «Популярные логотипы» на главной (по статистике)' },
  { file: 'build-home-collections.js',     label: 'Блок «Подборки» на главной и в футере (из collections.json)' },
  { file: 'build-home-tools.js',           label: 'Список «Инструменты» в футере (из tools.json)' },
  { file: 'build-home-sitemap.js',         label: 'Блок «Карта сайта» на главной' },
  { file: 'build-tools-headers.js',        label: 'Единый хедер на страницах tools/*' },
  { file: 'build-en-pages.js',             label: 'EN-зеркало (/en/) — обязательно после всех HTML-билдеров выше' },
  { file: 'test-html.js',                  label: 'Тесты разметки: плейсхолдеры, JSON-LD, title/description/canonical/h1, hreflang — после всех страниц' },
  { file: 'test-links.js',                 label: 'Тесты ссылок: битые href/src/content (страницы и ассеты) в готовом HTML — после всех страниц' },
  { file: 'build-sitemap.js',              label: 'sitemap.xml + sitemap-*.xml — ВСЕГДА последним' },
  { file: 'build-version.js',              label: 'js/version.js (ASSET_VERSION) — cache-buster, самый последний шаг' },
  { file: 'build-cache-bust.js',           label: 'Проштамповать ?v=ASSET_VERSION во все css/js/components ссылки во всех HTML — реально последний шаг' },
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
  const steps = STEPS;
  console.log(`\x1b[1mbuild-all${DRY_RUN ? ' (dry-run)' : ''}\x1b[0m — ${steps.length} шагов, все обязательные`);

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
