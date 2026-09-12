#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// test-component-wiring.js — read-only, ничего не пишет. Проверяет ровно два
// класса поломки, оба реально произошли в этом репозитории и ни один не ловил
// ни один существующий тест:
//
//   1. Custom-element ТЕГ в разметке (<lang-switcher>, <search-box>, …), для
//      которого на странице НЕ подключён определяющий его скрипт — ни напрямую,
//      ни через один из JS-бандлов. Элемент рендерится как безвестный inline-тег,
//      никакой JS-ошибки нет, страница выглядит целой. Реальный инцидент:
//      icons/index.html держал <lang-switcher> в разметке, но lang-switcher.js
//      никогда не грузился — переключатель языка был мёртв (2026-08-20).
//
//   2. Один и тот же script/link (по нормализованному, без ?query, src/href)
//      подключён на одной странице ДВАЖДЫ. Не ошибка исполнения — второй
//      экземпляр браузер просто не перезапросит (кеш), но это лишний байт
//      разметки и явный сигнал, что кто-то скопипастил тег. Реальный инцидент:
//      cookie-consent.min.js дважды на emoji/index.html (2026-08-20).
//
// Плюс структурная защита от третьего класса, который тоже реально случился:
// тест, который ничего не нашёл, обязан упасть, а не молча зарапортовать
// успех (см. SELF-CHECK ниже) — test-css-parity.js однажды матчил ровно ноль
// страниц и печатал зелёную галочку вхолостую.
//
// Реестр «тег → файл, который его регистрирует» строится сканом
// components/*.js на customElements.define(...) — не хардкодится, чтобы
// новый компонент сам себя зарегистрировал в проверке.
//
// Резолв «какие файлы странице реально доступны» учитывает оба механизма
// бандлинга из scripts/build-js-bundles.js:
//   • CLASSIC_BUNDLES (site-chrome.min.js = cookie-consent+lang-switcher+
//     search-box+mobile-nav) — читается require()-ом оттуда же, тем же
//     приёмом, что test-css-parity.js читает BUNDLES из build-css-bundles.js
//     (генератор и тест физически не могут разойтись между собой).
//   • ESM-точки входа (main.min.js, seo-page.min.js, …) — файл, из графа
//     которого нужен тег, эквивалентен точке входа, если сама точка входа
//     И ЕСТЬ определяющий файл (donate-ticker.js сам себя регистрирует и сам
//     является точкой входа). Полный обход графа импортов не нужен: ни один
//     customElements.define в проекте не лежит глубже входа своего модуля.
//
// Запуск: node scripts/test-component-wiring.js
//   --warn-only — отчёт без exit 1
// ─────────────────────────────────────────────────────────────────────────────
const fs   = require('fs');
const path = require('path');

const ROOT      = path.resolve(__dirname, '..');
const WARN_ONLY = process.argv.includes('--warn-only');
const { CLASSIC_BUNDLES } = require('./build-js-bundles.js');

const PRUNE_DIRS = new Set([
  'node_modules', '.git', '.claude', 'cdn-dist', 'templates',
  'figma-plugins', 'supabase', 'sanitizer', 'upptime', 'trace-typograf',
]);

function walkHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (PRUNE_DIRS.has(entry.name)) continue;
      walkHtml(abs, out);
    } else if (entry.name.endsWith('.html')) {
      out.push(abs);
    }
  }
  return out;
}

// ── 1. Реестр «тег → определяющий файл», построен сканом источников ──
function buildElementRegistry() {
  const registry = {}; // tagName -> 'components/xxx.js' (repo-relative)
  const dir = path.join(ROOT, 'components');
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.js') || name.endsWith('.min.js')) continue;
    const rel = `components/${name}`;
    const src = fs.readFileSync(path.join(dir, name), 'utf8');
    for (const m of src.matchAll(/customElements\.define\(\s*['"]([a-z][a-z0-9-]*)['"]/g)) {
      registry[m[1]] = rel;
    }
  }
  return registry;
}

// ── 2. ESM-точки входа: та же логика обнаружения, что в build-js-bundles.js
// (сканом готового HTML на <script type="module" src="…/x.min.js">), нужна
// только чтобы знать: «main.min.js» на странице покрывает «components/donate-
// ticker.js» лишь когда donate-ticker сам является отдельной точкой входа
// (тогда прямое совпадение имени файла уже достаточно) — отдельного индекса
// строить не нужно, см. комментарий в шапке файла.
const ENTRY_RE = /<script[^>]+type="module"[^>]+src="[^"]*?((?:js|components)\/[a-z0-9-]+)\.min\.js(?:\?[^"]*)?"/gi;

// ── Нормализация одного src/href → repo-relative canonical .js-имя ──
function canonicalize(rawSrc, pageAbsDir) {
  let v = rawSrc.split('?')[0].split('#')[0];
  let abs;
  if (v.startsWith('/')) abs = path.join(ROOT, v);
  else abs = path.normalize(path.join(pageAbsDir, v));
  let rel = path.relative(ROOT, abs).replace(/\\/g, '/');
  return rel.replace(/\.min\.js$/, '.js');
}

// Строгий канонический (с .min, без query) — для матчинга ключей CLASSIC_BUNDLES,
// которые сами являются .min.js-путями вывода сборки, не исходниками.
function canonicalizeMin(rawSrc, pageAbsDir) {
  let v = rawSrc.split('?')[0].split('#')[0];
  let abs = v.startsWith('/') ? path.join(ROOT, v) : path.normalize(path.join(pageAbsDir, v));
  return path.relative(ROOT, abs).replace(/\\/g, '/');
}

function stripNoscript(html) {
  return html.replace(/<noscript>[\s\S]*?<\/noscript>/gi, '');
}

function checkPage(absPath, registry, knownTags) {
  const errors = [];
  const rawHtml = fs.readFileSync(absPath, 'utf8');
  const html = stripNoscript(rawHtml);
  const pageDir = path.dirname(absPath);
  const relPath = path.relative(ROOT, absPath);

  // ---- вход 1: какие файлы странице реально доступны ----
  const loaded = new Set();
  for (const m of html.matchAll(/<script[^>]+src="([^"]+\.js[^"]*)"/gi)) {
    const minCanon = canonicalizeMin(m[1], pageDir);
    const bundle = CLASSIC_BUNDLES[minCanon];
    if (bundle) { bundle.forEach(s => loaded.add(s)); continue; }
    loaded.add(canonicalize(m[1], pageDir));
  }

  // ---- проверка 1: каждый известный тег в разметке обязан быть покрыт ----
  const tagRe = new RegExp(`<(${knownTags.join('|')})(?=[\\s>/])`, 'g');
  const seenTags = new Set();
  for (const m of html.matchAll(tagRe)) seenTags.add(m[1]);
  for (const tag of seenTags) {
    const definer = registry[tag];
    if (!loaded.has(definer)) {
      errors.push(`${relPath}: разметка содержит <${tag}>, но ${definer} не подключён (ни напрямую, ни через бандл)`);
    }
  }

  // ---- проверка 2: дубли script/link src на одной странице ----
  const seenUrls = new Map(); // canonical -> count
  for (const m of html.matchAll(/<(?:script[^>]+src|link[^>]+rel="stylesheet"[^>]+href)="([^"]+)"/gi)) {
    const canon = canonicalizeMin(m[1], pageDir);
    if (/^https?:\/\//.test(m[1]) || m[1].startsWith('//')) continue; // внешние — не наша забота
    seenUrls.set(canon, (seenUrls.get(canon) || 0) + 1);
  }
  for (const [canon, count] of seenUrls) {
    if (count > 1) errors.push(`${relPath}: ${canon} подключён ${count} раза на одной странице`);
  }

  return errors;
}

// ── 0. Мина в scripts/lib/render.js: expandIncludes() делает наивный
// глобальный `str.replace(/\{\{>\s*name\s*\}\}/g, …)`, не различая, лежит ли
// совпадение в живой разметке или внутри HTML-комментария (<!-- {{> x}} -->).
// Написать «этот шаблон не тянет {{> nav-header}}» в комментарии — значит
// подставить туда ВЕСЬ партиал целиком, задвоив хедер на каждой странице.
// Реальный инцидент: templates/partials/metrika.html и templates/category-page.html
// оба словили это 2026-08-20 (собственные же комментарии автора этого теста).
// Правится в источнике — переформулировать без буквального `{{> name}}`, не
// экранированием, экранирования эта грамматика не знает.
function checkTemplateSources() {
  const errors = [];
  for (const dir of [path.join(ROOT, 'templates'), path.join(ROOT, 'templates', 'partials')]) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.html')) continue;
      const rel = path.relative(ROOT, path.join(dir, name));
      const src = fs.readFileSync(path.join(dir, name), 'utf8');
      for (const m of src.matchAll(/<!--[\s\S]*?-->/g)) {
        if (/\{\{>\s*[\w-]+/.test(m[0])) {
          errors.push(`${rel}: HTML-комментарий содержит буквальный «{{> ...}}» — expandIncludes() его тоже развернёт и задвоит партиал`);
        }
      }
    }
  }
  return errors;
}

function main() {
  const registry = buildElementRegistry();
  const knownTags = Object.keys(registry);

  // SELF-CHECK: реестр пуст = скан сломан, а не «компонентов нет». Тот самый
  // класс проблемы, ради которого весь этот файл написан — тест, который
  // ничего не нашёл, обязан упасть, а не молча пройти.
  if (knownTags.length === 0) {
    console.error('✗ test-component-wiring: реестр customElements.define пуст — components/*.js не сканируется?');
    process.exit(1);
  }

  const pages = walkHtml(ROOT);
  if (pages.length === 0) {
    console.error('✗ test-component-wiring: не найдено ни одной HTML-страницы для проверки');
    process.exit(1);
  }

  let errors = checkTemplateSources();
  for (const abs of pages) errors.push(...checkPage(abs, registry, knownTags));

  if (errors.length === 0) {
    console.log(`✓ test-component-wiring: ${pages.length} страниц, ${knownTags.length} known custom elements, дублей и непокрытых тегов не найдено`);
    return;
  }

  const label = WARN_ONLY ? '!' : '✗';
  for (const e of errors) console[WARN_ONLY ? 'warn' : 'error'](`  ${label} ${e}`);
  console.log(`test-component-wiring: найдено ${errors.length}`);
  if (!WARN_ONLY) process.exit(1);
}

main();
