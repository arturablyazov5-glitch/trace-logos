#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// build-js-minify.js — генерирует <file>.min.js рядом с каждым исходником в
// js/ и components/ (через terser). Источники (js/*.js, components/*.js)
// остаются каноническими и читаемыми — правь всегда их, не .min.js.
//
// Зачем: сайт статический, бандлера нет — вкладка грузит те же файлы, что
// лежат в репозитории. Комментарии и форматирование, нужные для чтения
// исходника человеком, летят в браузер как есть. Lighthouse ловит это как
// "Уменьшите размер кода JavaScript" (например js/i18n-dict-ru.js — 10.2 КиБ,
// из них ~2.5 КиБ можно убрать без потери функциональности).
//
// Относительные и корне-абсолютные специфаеры импортов (import/export/
// dynamic import), указывающие на .js внутри js/ или components/, в
// минифицированном файле переписываются на .min.js — иначе main.min.js тянул
// бы НЕминифицированные модули по цепочке импортов и вся экономия пропала бы.
// CDN/bare-специфаеры (например 'lucide') и шаблонные пути с ${} не трогаем.
//
// HTML (шаблоны и статические страницы) должен ссылаться на .min.js в
// <script src>/type="module" src=/<link rel="modulepreload" href=. Правь
// вручную при добавлении новой точки входа — как и с modulepreload-хинтами
// для i18n (см. комментарий в js/i18n.js).
//
// .min.js коммитятся в репозиторий как любой другой build-артефакт (сравни
// с css/seo-page.bundle.css, assets/og/*.png) — деплой не запускает сборку.
//
// Usage:
//   node scripts/build-js-minify.js            # build
//   node scripts/build-js-minify.js --dry-run  # preview without writing
// ─────────────────────────────────────────────────────────────────────────────
const fs      = require('fs');
const path    = require('path');
const terser  = require('terser');

const ROOT     = path.resolve(__dirname, '..');
const SCAN_DIRS = ['js', 'components'];
const DRY_RUN  = process.argv.includes('--dry-run');

// import … from 'x' / export … from 'x' / import('x') / import 'x'
// \s* everywhere (not \s+) — terser drops the space in e.g. `import"x"` since
// it's syntactically valid without one; a \s+ requirement would silently skip
// side-effect imports in minified output.
const SPEC_RE = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)(['"])([^'"]+)\2/g;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(abs, out);
    else if (entry.name.endsWith('.js') && !entry.name.endsWith('.min.js')) out.push(abs);
  }
  return out;
}

// Перепечатывает локальные специфаеры (относительные или корне-абсолютные
// внутрь /js или /components) на .min.js. Bare-специфаеры, URL и
// шаблонные литералы с ${} не трогаем — их резолвит не диск.
function rewriteSpecifiers(code) {
  return code.replace(SPEC_RE, (full, kw, quote, spec) => {
    if (spec.includes('${')) return full;
    if (/^https?:/.test(spec)) return full;
    if (!spec.startsWith('.') && !spec.startsWith('/')) return full;
    if (!/\.js$/.test(spec) || spec.endsWith('.min.js')) return full;
    return `${kw}${quote}${spec.slice(0, -3)}.min.js${quote}`;
  });
}

async function minifyFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  const isModule = /^\s*(import|export)\b/m.test(src);
  const result = await terser.minify(src, {
    module: isModule,
    compress: true,
    mangle: true,
    format: { comments: false },
  });
  if (result.error) throw result.error;
  return rewriteSpecifiers(result.code);
}

async function main() {
  const files = SCAN_DIRS.flatMap(d => walk(path.join(ROOT, d)));
  let written = 0, unchanged = 0, totalIn = 0, totalOut = 0;

  for (const file of files) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    const outPath = file.replace(/\.js$/, '.min.js');
    let min;
    try {
      min = await minifyFile(file);
    } catch (e) {
      console.error(`✗ ${rel}: ${e.message || e}`);
      process.exitCode = 1;
      continue;
    }

    totalIn += fs.statSync(file).size;
    totalOut += Buffer.byteLength(min, 'utf8');

    if (DRY_RUN) {
      console.log(`${rel} → ${path.relative(ROOT, outPath).split(path.sep).join('/')}`);
      continue;
    }

    const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
    if (prev === min) { unchanged++; continue; }
    fs.writeFileSync(outPath, min, 'utf8');
    written++;
  }

  if (process.exitCode) return;
  const saved = totalIn ? Math.round((1 - totalOut / totalIn) * 100) : 0;
  if (!DRY_RUN) {
    console.log(`✓ build-js-minify.js: written=${written} unchanged=${unchanged} (${saved}% меньше суммарно)`);
  } else {
    console.log(`(dry-run) файлов: ${files.length}, ${saved}% меньше суммарно`);
  }
}

main();
