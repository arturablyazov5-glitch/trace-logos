#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// test-html.js — санитарная проверка СГЕНЕРЁННОГО HTML. Read-only, ничего не пишет.
//
// Зачем отдельно от test-links.js: тот проверяет ровно одно — что цель ссылки
// лежит на диске. Здесь проверяется всё остальное, что билд-скрипт может испортить
// молча, не поломав ни одной ссылки:
//
//   1. Незамещённые {{PLACEHOLDER}} — переменной не было в vars, шаблон уехал в
//      прод с «{{OG_TITLE}}» в тексте. build-seo-pages.js на неизвестный ключ
//      печатает warning и подставляет '', но остальные билдеры — нет.
//   2. JSON-LD парсится. Незакрытая кавычка в name логотипа = сломанный блок,
//      который Яндекс/Google просто отбрасывают. Внешне страница цела.
//   3. Ровно один непустой <title>.
//   4. <meta name="description"> есть и непустой.
//   5. canonical есть — либо стоит noindex. Страница без canonical и без noindex
//      уходит в индекс как дубль.
//   6. Ровно один <h1> на индексируемой странице. Ноль — потеря главного
//      SEO-сигнала (так 52 страницы экосистем уехали в индекс без заголовка),
//      два и больше — размытие.
//   7. canonical уникален. Два файла с одним canonical = один из них никогда
//      не попадёт в индекс.
//   8. hreflang взаимен: если RU-страница указывает на EN-альтернативу, та
//      обязана существовать и ссылаться обратно.
//   9. На каждой странице логотипа (/logos/{cat}/{slug}/, /en/ зеркало) в
//      JSON-LD @graph есть узел "@type": "Organization". Добавлено 2026-07-30
//      по тому же паттерну, что поймал 52 страницы экосистем без <h1>:
//      одна забытая правка в buildJsonLd() (scripts/build-seo-pages.js) —
//      и 500+ страниц молча теряют Organization/publisher одновременно,
//      без единого битого <title>/canonical/ссылки, которые ловят проверки
//      выше. Область — только страницы логотипов (logos/{cat}/{slug}/,
//      cat !== "ecosystem"): именно туда Organization добавлялась, у
//      страниц категорий/экосистем/эмодзи своя JSON-LD-схема без него.
//
// Запуск: node scripts/test-html.js   (входит в build-all.js перед test-links.js)
//   --warn-only  — только отчёт, без exit 1
// ─────────────────────────────────────────────────────────────────────────────
const fs   = require('fs');
const path = require('path');

const ROOT      = path.resolve(__dirname, '..');
const WARN_ONLY = process.argv.includes('--warn-only');
const BASE_URL  = 'https://trace-logos.ru';

// templates/ полон {{...}} by design; остальное — служебное и чужие зеркала.
const PRUNE_DIRS = new Set([
  'node_modules', '.git', '.claude', 'cdn-dist', 'templates',
  'figma-plugins', 'supabase', 'sanitizer', 'upptime', 'assets',
  'trace-typograf',
]);

// Единственное исключение: файлы-подтверждения владения доменом для сторонних
// вебмастеров (Яндекс.Вебмастер, Яндекс Дистрибуция, Google Search Console,
// Дзен для медиа). Их содержимое диктует сам сервис, это не страница сайта.
// Список общий с build-en-pages.js — см. scripts/lib/verification-stubs.js.
// Всё остальное, что «не совсем страница», закрывается noindex — тогда
// проверки 4/6 сами отступают, и причина видна прямо в файле, а не в тесте.
const { isVerificationStub } = require('./lib/verification-stubs');

let errors = 0, warns = 0;
const fail = msg => { if (WARN_ONLY) { console.warn(`  ! ${msg}`); warns++; } else { console.error(`  ✗ ${msg}`); errors++; } };

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

// Абсолютный URL нашего домена → путь файла на диске.
function urlToFile(url) {
  if (!url.startsWith(BASE_URL)) return null;
  let p = url.slice(BASE_URL.length).replace(/[?#].*$/, '') || '/';
  const abs = path.join(ROOT, p);
  return p.endsWith('/') || p === '/' ? path.join(abs, 'index.html') : abs;
}

const attr = (html, re) => { const m = html.match(re); return m ? m[1].trim() : null; };

// /logos/{cat}/{slug}/index.html или /en/logos/{cat}/{slug}/index.html, но не
// логотип категории/экосистемы (logos/{slug}/index.html — один сегмент, или
// logos/ecosystem/{key}/index.html — своя JSON-LD-схема без Organization).
const LOGO_PAGE_RE = /^(?:en\/)?logos\/([^/]+)\/([^/]+)\/index\.html$/;
const isLogoPage = rel => {
  const m = rel.match(LOGO_PAGE_RE);
  return !!m && m[1] !== 'ecosystem';
};

function main() {
  const pages = walkHtml(ROOT);
  const canonicals = new Map(); // canonical → [rel-путь, …]
  const hreflangs  = new Map(); // rel-путь → { ru, en }

  for (const page of pages) {
    const rel  = path.relative(ROOT, page).split(path.sep).join('/');
    if (isVerificationStub(rel)) continue;
    const html = fs.readFileSync(page, 'utf8');
    const at   = msg => fail(`${rel}: ${msg}`);

    // Редирект-стаб (build-redirect-pages.js) — статический эквивалент 301 для
    // GitHub Pages, у которого нет vercel.json redirects. Meta refresh — точный,
    // невозможный по случайности маркер. У стаба нет собственного контента,
    // так что он освобождён от 4 (description), 6 (h1), 7 (уникальность
    // canonical — его canonical намеренно дублирует canonical destination,
    // в этом весь смысл редиректа, не баг) и 9 (Organization в JSON-LD).
    // Не noindex: смысл canonical здесь как раз в передаче сигнала на
    // destination, а noindex его по факту отменяет.
    const isRedirectStub = /<meta[^>]+http-equiv="refresh"/i.test(html);

    // 1. Незамещённые плейсхолдеры. Учитываем только UPPER_SNAKE — это формат
    //    билд-переменных; JS-шаблоны в <script> используют ${…}.
    const ph = [...new Set([...html.matchAll(/\{\{([A-Z][A-Z0-9_]*)\}\}/g)].map(m => m[1]))];
    if (ph.length) at(`незамещённые плейсхолдеры: ${ph.map(k => `{{${k}}}`).join(', ')}`);

    // 2. JSON-LD парсится.
    let hasOrganization = false;
    for (const m of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
      let parsed;
      try { parsed = JSON.parse(m[1]); }
      catch (e) { at(`битый JSON-LD: ${e.message}`); continue; }
      const graph = Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed];
      if (graph.some(node => node && node['@type'] === 'Organization')) hasOrganization = true;
    }

    // 9. Страница логотипа обязана нести Organization в @graph (E-E-A-T/publisher —
    //    см. комментарий в шапке файла). Не применяется к редирект-стабам — у
    //    них нет собственного контента, откуда взяться JSON-LD.
    if (isLogoPage(rel) && !hasOrganization && !isRedirectStub) at('нет "@type": "Organization" в JSON-LD @graph');

    // 3. Ровно один непустой <title>.
    const titles = [...html.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)];
    if (titles.length === 0)     at('нет <title>');
    else if (titles.length > 1)  at(`${titles.length} тегов <title>`);
    else if (!titles[0][1].trim()) at('пустой <title>');

    // 5. canonical или явный noindex.
    const canonical = attr(html, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i);
    const robots    = attr(html, /<meta[^>]+name="robots"[^>]+content="([^"]*)"/i) || '';
    const noindex   = /noindex/i.test(robots);
    if (!canonical && !noindex) at('нет canonical и нет noindex — страница уйдёт в индекс как дубль');

    // 4. meta description — только у индексируемых: у noindex-страницы (админка,
    //    прототип) сниппета в выдаче не будет, требовать описание бессмысленно.
    if (!noindex && !isRedirectStub) {
      const desc = attr(html, /<meta[^>]+name="description"[^>]+content="([^"]*)"/i)
                ?? attr(html, /<meta[^>]+content="([^"]*)"[^>]+name="description"/i);
      if (desc === null)  at('нет <meta name="description">');
      else if (!desc)     at('пустой <meta name="description">');
    }
    if (canonical && !isRedirectStub) {
      if (!canonicals.has(canonical)) canonicals.set(canonical, []);
      canonicals.get(canonical).push(rel);
    }

    // 6. Ровно один <h1> — только у индексируемых страниц.
    if (!noindex && !isRedirectStub) {
      const h1 = [...html.matchAll(/<h1[\s>]/gi)].length;
      if (h1 === 0)     at('нет <h1>');
      else if (h1 > 1)  at(`${h1} тегов <h1>`);
    }

    // 8a. Собираем hreflang для взаимной сверки ниже.
    const alts = {};
    for (const m of html.matchAll(/<link[^>]+rel="alternate"[^>]+hreflang="([^"]*)"[^>]+href="([^"]*)"/gi)) {
      alts[m[1].toLowerCase()] = m[2];
    }
    if (Object.keys(alts).length) hreflangs.set(rel, { alts, canonical });
  }

  // 7. Дубли canonical.
  for (const [url, files] of canonicals) {
    if (files.length > 1) fail(`canonical ${url} указан на ${files.length} страницах: ${files.join(', ')}`);
  }

  // 8b. Взаимность hreflang: цель существует и ссылается обратно на нас.
  for (const [rel, { alts, canonical }] of hreflangs) {
    for (const [lang, href] of Object.entries(alts)) {
      if (lang === 'x-default') continue;
      const target = urlToFile(href);
      if (!target) continue;                       // внешний домен — не наша забота
      if (!fs.existsSync(target)) { fail(`${rel}: hreflang="${lang}" ведёт на ${href}, файла нет`); continue; }
      const targetRel = path.relative(ROOT, target).split(path.sep).join('/');
      const back = hreflangs.get(targetRel);
      if (!back)                          fail(`${rel}: ${targetRel} не отдаёт hreflang в ответ`);
      else if (canonical && !Object.values(back.alts).includes(canonical))
        fail(`${rel}: hreflang не взаимен — ${targetRel} не ссылается обратно на ${canonical}`);
    }
  }

  console.log(`\n[html] страниц: ${pages.length}, canonical: ${canonicals.size}, hreflang-пар: ${hreflangs.size}`);
  if (warns)  console.warn(`${warns} предупреждений`);
  if (errors) { console.error(`\n✗ html: ${errors} ошибок — сборка остановлена`); process.exit(1); }
  console.log('✓ html: разметка в порядке');
}

main();
