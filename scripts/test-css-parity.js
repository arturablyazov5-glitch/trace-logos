#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// test-css-parity.js — read-only, ничего не пишет. Проверяет, что каждый HTML-
// источник, подключающий js/main.js как <script type="module">, тянет и CSS
// для эффектов, которые main.js создаёт в DOM безусловно (не по разметке
// страницы, а через JS — значит нужны ВСЕГДА, а не там, где кто-то не забыл
// скопировать <link>).
//
// Зачем: logos/index.html — рукописный, templates/category-page.html — шаблон
// для logos/<cat>/ и logos/ecosystem/<key>/, emoji/index.html и icons/index.html —
// тоже рукописные. Все четыре грузят один и тот же js/main.js, но список
// <link rel="stylesheet"> в каждом собирался отдельно и вручную — отсюда разъезд.
// Конкретный инцидент: templates/category-page.html не тянул easter-amongus.css/
// easter-google.css/easter-minicrewmate.css — js/easter-amongus.js как и раньше
// добавлял <img class="amongus-runner"> в document.body на любой странице
// категории, но без CSS (position: fixed, z-index) элемент вставлялся в обычный
// поток документа: невидим без скролла и раздувал ширину/высоту страницы.
// Пасхалка внешне «не работала» только там, где не хватало трёх строк <link>.
//
// Список REQUIRED ниже — CSS-файлы, которые стилизуют DOM, создаваемый JS
// безусловно (не гейтится наличием конкретной разметки на странице):
//   easter-amongus.css / easter-google.css — js/easter-amongus.js и
//     js/easter-google.js добавляют <img>/оверлеи в document.body при клике
//     по варианту логотипа; сам main.js вызывает их без проверки, есть ли
//     на странице подходящий логотип (Icon/Game/AmongUs, Icon/Search/Google).
//   easter-minicrewmate.css — main.js безусловно тоглит body.has-minicrewmate.
//   microanim.css — initSidebarIndicator (main.js) безусловно создаёт
//     .nav-indicator-pill в сайдбаре на любой странице с сайдбаром.
//   confetti.css — js/easter-confetti.js, тот же паттерн; исторически везде
//     подключён, оставлен в списке как регресс-щит.
//
// НЕ входят сюда: filters.css, category-seo.css, support-btn.css — они
// стилизуют разметку, которая физически может отсутствовать в HTML страницы
// (например, у emoji/icons нет блока формата файла), поэтому их отсутствие —
// не обязательно баг.
//
// Запуск: node scripts/test-css-parity.js
//   --warn-only — только отчёт, без exit 1
// ─────────────────────────────────────────────────────────────────────────────
const fs   = require('fs');
const path = require('path');

const ROOT      = path.resolve(__dirname, '..');
const WARN_ONLY = process.argv.includes('--warn-only');
const { BUNDLES: CSS_BUNDLES } = require('./build-css-bundles.js');

const REQUIRED = [
  'css/confetti.css',
  'css/easter-amongus.css',
  'css/easter-doodlejump.css',
  'css/easter-google.css',
  'css/easter-minicrewmate.css',
  'css/microanim.css',
];

// Рукописные страницы + шаблон — все места, где реально стоит
// <script type="module" src="…js/main.js">. Не выводится автоматически
// обходом всего репо: генерируемые logos/<cat>/<slug>/ и emoji/<cat>/<slug>/
// страницы не грузят main.js вообще (у них свой seo-page.js), сканировать
// все 5500 файлов ради этого незачем.
const SOURCES = [
  'logos/index.html',
  'emoji/index.html',
  'icons/index.html',
  'templates/category-page.html',
];

let errors = 0, warns = 0;
const fail = msg => { if (WARN_ONLY) { console.warn(`  ! ${msg}`); warns++; } else { console.error(`  ✗ ${msg}`); errors++; } };

for (const rel of SOURCES) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) { fail(`${rel}: файл не найден`); continue; }
  const html = fs.readFileSync(abs, 'utf8');
  // `.min` and `?v=…` are both applied to these tags after the fact, by
  // build-js-minify.js and build-cache-bust.js — matching the bare `js/main.js`
  // an author writes would silently match nothing on a built page, and a check
  // that matches nothing reports success.
  if (!/<script[^>]+type="module"[^>]+src="[^"]*js\/main(?:\.min)?\.js(?:\?[^"]*)?"/.test(html)) continue;

  const links = new Set(
    Array.from(html.matchAll(/href="[^"]*?(css\/[a-z0-9_.-]+\.css)(?:\?[^"]*)?"/gi), m => m[1])
  );
  // A page may satisfy a requirement either with its own <link> or by pulling in
  // a bundle that inlines the file (scripts/build-css-bundles.js). Ask that script
  // what each bundle contains rather than restating the list here — two copies of
  // it is exactly the drift this test exists to catch.
  const covered = new Set(links);
  for (const linked of links) {
    const sources = CSS_BUNDLES[path.basename(linked)];
    if (sources) sources.forEach(s => covered.add(`css/${s}`));
  }
  for (const req of REQUIRED) {
    if (!covered.has(req)) fail(`${rel}: грузит js/main.js, но не подключает ${req} (ни напрямую, ни через бандл)`);
  }
}

if (errors === 0 && warns === 0) console.log('✓ css-parity: все страницы с main.js подключают обязательный CSS');
else console.log(`css-parity: ошибок ${errors}, предупреждений ${warns}`);

if (errors > 0) process.exit(1);
