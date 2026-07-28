#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// test-js.js — синтаксис и граф импортов фронтендового JS. Read-only.
//
// Зачем: сборки нет, бандлера нет, тестов в браузере нет. Опечатка в js/*.js или
// переименованный модуль всплывают только когда пользователь открыл страницу и
// получил белый экран — ни один другой скрипт этого не ловит: test-links.js
// проверяет <script src="…"> (файл на месте), test-html.js — разметку, а что
// внутри файла, до сих пор не смотрел никто.
//
// Что проверяем:
//   1. Файл парсится (node --check). Модули ES, а в репозитории нет
//      "type": "module", поэтому проверяем копии с расширением .mjs во временной
//      папке — иначе node ругается на import в CommonJS-контексте.
//   2. Каждый относительный импорт резолвится в реальный файл. Один сломанный
//      специфаер роняет ВЕСЬ граф модулей: браузер не выполнит ни одного модуля
//      из связки, страница остаётся пустой.
//   3. Импорт не тянет расширение по умолчанию: './utils' в браузере — это 404,
//      только './utils.js' работает. Node такой импорт бы простил, браузер нет.
//
// Запуск: node scripts/test-js.js   (входит в build-all.js)
//   --warn-only  — только отчёт, без exit 1
// ─────────────────────────────────────────────────────────────────────────────
const fs   = require('fs');
const os   = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT      = path.resolve(__dirname, '..');
const WARN_ONLY = process.argv.includes('--warn-only');

// Клиентский JS: то, что реально грузится страницами.
const SCAN_DIRS = ['js', 'components'];

let errors = 0;
const fail = msg => { if (WARN_ONLY) { console.warn(`  ! ${msg}`); } else { console.error(`  ✗ ${msg}`); errors++; } };

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(abs, out);
    else if (entry.name.endsWith('.js')) out.push(abs);
  }
  return out;
}

// import … from 'x' / export … from 'x' / import('x') / import 'x'
const SPEC_RE = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])([^'"]+)\1/g;

function main() {
  const files = SCAN_DIRS.flatMap(d => walk(path.join(ROOT, d)));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tracelogos-js-'));

  let checked = 0, specs = 0;

  for (const file of files) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    const src = fs.readFileSync(file, 'utf8');

    // 1. Синтаксис.
    const probe = path.join(tmp, rel.replace(/\//g, '__').replace(/\.js$/, '.mjs'));
    fs.writeFileSync(probe, src, 'utf8');
    try {
      execFileSync(process.execPath, ['--check', probe], { stdio: 'pipe' });
      checked++;
    } catch (e) {
      const msg = String(e.stderr || e.message).split('\n').find(l => /SyntaxError/.test(l)) || 'SyntaxError';
      fail(`${rel}: ${msg.trim()}`);
    }

    // 2-3. Импорты.
    for (const m of src.matchAll(SPEC_RE)) {
      const spec = m[2];
      specs++;
      // Голые специфаеры ('lucide') и URL резолвит importmap/CDN, не диск.
      if (!spec.startsWith('.') && !spec.startsWith('/')) continue;
      if (/^https?:/.test(spec)) continue;
      if (spec.includes('${')) continue; // динамический путь, статикой не проверить

      const clean = spec.replace(/[?#].*$/, '');
      if (!/\.(js|mjs|json|css)$/.test(clean)) {
        fail(`${rel}: импорт '${spec}' без расширения — браузер такой путь не разрешит`);
        continue;
      }
      const target = clean.startsWith('/')
        ? path.join(ROOT, clean)
        : path.resolve(path.dirname(file), clean);
      if (!fs.existsSync(target)) {
        fail(`${rel}: импорт '${spec}' не резолвится (${path.relative(ROOT, target)})`);
      }
    }
  }

  fs.rmSync(tmp, { recursive: true, force: true });

  console.log(`\n[js] файлов: ${files.length}, разобрано: ${checked}, импортов: ${specs}`);
  if (errors) { console.error(`\n✗ js: ${errors} ошибок — сборка остановлена`); process.exit(1); }
  console.log('✓ js: синтаксис и импорты в порядке');
}

main();
