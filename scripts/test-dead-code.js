#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// test-dead-code.js — read-only, ничего не пишет. Проверяет, что у каждого
// файла в js/, components/, css/, templates/partials/, scripts/, scripts/lib/
// есть хотя бы одна живая ссылка на него где-то в кодовой базе — иначе это
// мёртвый код, который никто не заметит, пока кто-то не наткнётся на него
// случайно (как было с templates/partials/site-header.html, найденным и
// удалённым вручную 2026-08-20 — этот тест сделан, чтобы больше не искать
// такое руками).
//
// Метод: не резолвит пути один-в-один (это делает test-links.js для готовых
// страниц) — ищет ИМЯ файла подстрокой по кураторскому корпусу «источников
// правды»: все templates/*.html + templates/partials/*.html, все js/*.js +
// components/*.js (исходники, не .min.js — минифицированный ESM-бандл может
// вообще не содержать имени зависимости текстом, esbuild инлайнит код, а не
// оставляет import-строку, см. scripts/build-js-bundles.js), все css/*.css,
// все scripts/*.js + scripts/lib/*.js, package.json и рукописные корневые
// HTML-страницы (index.html, 404.html, logos/emoji/icons/index.html,
// tools/**/*.html и т.п. — те, что не порождены шаблоном). Единый шаблон
// (templates/*.html) обслуживает тысячи сгенерённых страниц по одному
// правилу — сканировать все 5900 файлов сайта ради этого не нужно: если
// ссылки нет в шаблоне, её не будет и ни в одной из тысяч страниц по нему.
//
// Самоссылка исключается явно: у многих файлов в шапке-комментарии написано
// собственное имя («donate.js — fundraiser modal…») — без исключения own-file
// из корпуса каждая проверка тривиально проходила бы сама на себе.
//
// Категории и правило «файл считается использованным»:
//   • js/*.js, components/*.js  — подстрока «name.js» ИЛИ «name.min.js» в
//     любом другом файле корпуса (import-специфайкер в исходнике, <script
//     src> в шаблоне/странице, элемент CLASSIC_BUNDLES/discoverEntries).
//   • css/*.css                 — подстрока «name.css» в любом другом файле
//     (<link href>, @import, элемент BUNDLES в build-css-bundles.js).
//   • templates/partials/*.html — mustache-ссылка «{{> name» (без расширения)
//     ИЛИ подстрока «name.html» (литеральный путь в scripts/*.js, как
//     build-tools-headers.js грузит nav-header.html напрямую), ИЛИ
//     JS-конфиг виджета вида `partial: 'name'`.
//   • scripts/lib/*.js          — подстрока «lib/name» (require без
//     расширения — так этот проект всегда require()-ит lib/*).
//
// scripts/*.js верхнего уровня НЕ проверяется — CLAUDE.md документирует это
// как осознанный паттерн проекта: «Each script also still works completely
// standalone… build-all.js is a convenience wrapper, not a replacement».
// Реальный пример: scripts/publish-scheduled-posts.js — CRITICAL-скрипт
// эмбарго блога перед каждым деплоем, но нигде не упомянут ни в build-all.js,
// ни в package.json (он их сам оборачивает). Мёртвый скрипт и намеренно не
// подключённый standalone-инструмент неотличимы статическим сканом текста —
// первая попытка проверить эту категорию (2026-08-20) дала 12 «находок»,
// 11 из которых были живыми инструментами для одноразового обслуживания
// (add-brand-urls.js, dedupe-labels.js, optimize-svg.js и т.п.). Ложная
// тревога такого масштаба хуже отсутствия проверки — она приучает игнорировать
// красный тест. Не возвращать эту категорию без надёжного способа отличить
// «заброшено» от «инструмент для ручного запуска по требованию».
//
// SELF-CHECK: если корпус или список кандидатов пуст — exit 1, а не тихий
// успех (тот самый класс проблемы, что уже один раз усыпил test-css-parity.js
// и стал поводом для test-component-wiring.js).
//
// Известные, легитимные «мёртвые на вид» файлы не исключаются списком —
// исключение списком само гниёт молча. Если находка ложная, чини сам грамматику
// поиска (расширяй HAYSTACK_GLOBS/паттерн), а не вычёркивай конкретный файл.
//
// Запуск: node scripts/test-dead-code.js
//   --warn-only — отчёт без exit 1
// ─────────────────────────────────────────────────────────────────────────────
const fs   = require('fs');
const path = require('path');

const ROOT      = path.resolve(__dirname, '..');
const WARN_ONLY = process.argv.includes('--warn-only');

function readIfFile(abs) {
  try { return fs.readFileSync(abs, 'utf8'); } catch { return null; }
}

function listDir(dir, filterFn) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(filterFn).map(f => path.join(dir, f));
}

function walkAll(dir, extSet, prune, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (prune.has(entry.name)) continue;
      walkAll(abs, extSet, prune, out);
    } else if (extSet.has(path.extname(entry.name))) {
      out.push(abs);
    }
  }
  return out;
}

// ── Корпус «источников правды» — не весь сайт, см. шапку файла ──
function buildCorpus() {
  const files = new Set();

  for (const f of listDir(path.join(ROOT, 'templates'), n => n.endsWith('.html'))) files.add(f);
  for (const f of listDir(path.join(ROOT, 'templates', 'partials'), n => n.endsWith('.html'))) files.add(f);
  for (const f of listDir(path.join(ROOT, 'js'), n => n.endsWith('.js') && !n.endsWith('.min.js'))) files.add(f);
  for (const f of listDir(path.join(ROOT, 'components'), n => n.endsWith('.js') && !n.endsWith('.min.js'))) files.add(f);
  for (const f of listDir(path.join(ROOT, 'css'), n => n.endsWith('.css'))) files.add(f);
  for (const f of listDir(path.join(ROOT, 'scripts'), n => n.endsWith('.js'))) files.add(f);
  for (const f of listDir(path.join(ROOT, 'scripts', 'lib'), n => n.endsWith('.js'))) files.add(f);
  files.add(path.join(ROOT, 'package.json'));

  // Рукописные корневые страницы — не порождены ни одним шаблоном, поэтому
  // шаблонный корпус их не покрывает.
  const HAND_AUTHORED = [
    'index.html', '404.html', 'logos/index.html', 'emoji/index.html',
    'icons/index.html', 'icons/prototype.html', 'terms/index.html',
    'consent/index.html', 'admin/index.html', 'kb/index.html',
  ];
  for (const rel of HAND_AUTHORED) {
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs)) files.add(abs);
  }
  for (const f of walkAll(path.join(ROOT, 'tools'), new Set(['.html']), new Set(['node_modules']))) files.add(f);

  const corpus = [];
  for (const abs of files) {
    const content = readIfFile(abs);
    if (content != null) corpus.push({ rel: path.relative(ROOT, abs), abs, content });
  }
  return corpus;
}

// haystack без файла-кандидата (self-exclusion) — считается по требованию,
// не предвычисляется целиком, чтобы не City-hallить N вариантов «весь минус один».
function referencedElsewhere(corpus, selfRel, predicate) {
  return corpus.some(f => f.rel !== selfRel && predicate(f.content));
}

function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function checkJsLike(corpus, candidates, label) {
  const errors = [];
  for (const abs of candidates) {
    const rel = path.relative(ROOT, abs);
    const name = path.basename(abs, '.js');
    const re = new RegExp(`${esc(name)}(?:\\.min)?\\.js`);
    if (!referencedElsewhere(corpus, rel, c => re.test(c))) {
      errors.push(`${rel}: ${label}, ни один файл в кодовой базе на него не ссылается`);
    }
  }
  return errors;
}

function main() {
  const corpus = buildCorpus();
  if (corpus.length === 0) {
    console.error('✗ test-dead-code: корпус пуст — buildCorpus() ничего не нашёл, проверка сломана');
    process.exit(1);
  }

  const jsCandidates = listDir(path.join(ROOT, 'js'), n => n.endsWith('.js') && !n.endsWith('.min.js'));
  const componentCandidates = listDir(path.join(ROOT, 'components'), n => n.endsWith('.js') && !n.endsWith('.min.js'));
  const cssCandidates = listDir(path.join(ROOT, 'css'), n => n.endsWith('.css'));
  const partialCandidates = listDir(path.join(ROOT, 'templates', 'partials'), n => n.endsWith('.html'));
  const libCandidates = listDir(path.join(ROOT, 'scripts', 'lib'), n => n.endsWith('.js'));

  const total = jsCandidates.length + componentCandidates.length + cssCandidates.length +
                partialCandidates.length + libCandidates.length;
  if (total === 0) {
    console.error('✗ test-dead-code: ни одного кандидата не найдено ни в одной категории — проверка сломана');
    process.exit(1);
  }

  let errors = [];

  errors.push(...checkJsLike(corpus, jsCandidates, 'js/*.js без ссылок'));
  errors.push(...checkJsLike(corpus, componentCandidates, 'components/*.js без ссылок'));

  for (const abs of cssCandidates) {
    const rel = path.relative(ROOT, abs);
    const name = path.basename(abs, '.css');
    const re = new RegExp(`${esc(name)}\\.css`);
    if (!referencedElsewhere(corpus, rel, c => re.test(c))) {
      errors.push(`${rel}: css/*.css без ссылок, ни один файл на него не ссылается`);
    }
  }

  for (const abs of partialCandidates) {
    const rel = path.relative(ROOT, abs);
    const name = path.basename(abs, '.html');
    const mustacheRe = new RegExp(`\\{\\{>\\s*${esc(name)}\\b`);
    const literalRe = new RegExp(`${esc(name)}\\.html`);
    const jsPartialRe = new RegExp(`\\bpartial\\s*:\\s*['"]${esc(name)}['"]`);
    if (!referencedElsewhere(corpus, rel, c => mustacheRe.test(c) || literalRe.test(c) || jsPartialRe.test(c))) {
      errors.push(`${rel}: templates/partials/*.html без ссылок ({{> ${name}}} нигде не встречается, путь не грузится напрямую, и partial-конфиг не найден)`);
    }
  }

  for (const abs of libCandidates) {
    const rel = path.relative(ROOT, abs);
    const name = path.basename(abs, '.js');
    const re = new RegExp(`lib/${esc(name)}\\b`);
    if (!referencedElsewhere(corpus, rel, c => re.test(c))) {
      errors.push(`${rel}: scripts/lib/*.js не require()-ится ни одним scripts/*.js`);
    }
  }

  if (errors.length === 0) {
    console.log(`✓ test-dead-code: проверено ${total} файлов (js/components/css/templates-partials/scripts-lib), мёртвого кода не найдено`);
    return;
  }

  const label = WARN_ONLY ? '!' : '✗';
  for (const e of errors) console[WARN_ONLY ? 'warn' : 'error'](`  ${label} ${e}`);
  console.log(`test-dead-code: найдено ${errors.length}`);
  if (!WARN_ONLY) process.exit(1);
}

main();
