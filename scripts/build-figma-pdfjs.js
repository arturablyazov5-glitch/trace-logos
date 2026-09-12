#!/usr/bin/env node
/**
 * Запекает pdf.js в ui.html плагина «PDF → Figma».
 *
 *   Источник:  tools/figma-plugins/pdf-to-svg/vendor/pdf.min.js
 *              tools/figma-plugins/pdf-to-svg/vendor/pdf.worker.min.js
 *   Куда:      tools/figma-plugins/pdf-to-svg/ui.html, между
 *              <!-- PDFJS:START --> и <!-- PDFJS:END -->
 *
 * Почему запекание, а не <script src="vendor/pdf.min.js">: manifest
 * плагина объявляет networkAccess "none", а ui.html грузится единственным
 * документом — внешний src не подтянется ни из сети, ни с диска. Тот же
 * приём, что с JSZip в photo-editor и с правилами типографики в
 * build-figma-typograf.js.
 *
 * Оба файла, а не только pdf.min.js: UMD-обёртка воркера кладёт себя в
 * globalThis.pdfjsWorker, и pdf.js, найдя готовый WorkerMessageHandler на
 * главном потоке, сразу выбирает fake worker вместо new Worker(url) —
 * URL для настоящего воркера в песочнице плагина взять неоткуда.
 *
 * Маркеры ищутся строкой целиком (^<!-- PDFJS:END -->$), а не indexOf —
 * та же грабля, что в build-figma-typograf.js: слова из маркера
 * встречаются в комментарии рядом, и поиск подстрокой находил бы «конец»
 * блока раньше его начала.
 *
 * Флаги: --dry-run — сказать, изменится ли блок, ничего не записывая.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'tools/figma-plugins/pdf-to-svg');
const UI = path.join(DIR, 'ui.html');
// Порядок в массиве — порядок выполнения в ui.html (см. buildBlock: он
// разворачивает список, чтобы воркер выполнился ПЕРЕД pdf.min.js).
const SOURCES = [
  path.join(DIR, 'vendor/opentype.min.js'),
  path.join(DIR, 'vendor/pdf.min.js'),
  path.join(DIR, 'vendor/pdf.worker.min.js'),
];

const START = '<!-- PDFJS:START -->';
const END = '<!-- PDFJS:END -->';

const dryRun = process.argv.includes('--dry-run');

function fail(msg) {
  console.error('✗ ' + msg);
  process.exit(1);
}

// Порядок важен: pdf.worker должен выполниться ДО pdf.min.js, иначе
// PDFWorker._mainThreadWorkerMessageHandler на момент первого getDocument
// ещё пуст и pdf.js уйдёт в ветку с настоящим Worker'ом.
function buildBlock() {
  const parts = [START];
  for (const file of SOURCES.slice().reverse()) {
    const code = fs.readFileSync(file, 'utf8');
    if (code.includes('</script')) fail(`${path.basename(file)} содержит "</script" — инлайн сломает разметку`);
    parts.push(`<script data-vendor="${path.basename(file)}">`);
    parts.push(code.trim());
    parts.push('</script>');
  }
  parts.push(END);
  return parts.join('\n');
}

function main() {
  for (const file of SOURCES) {
    if (!fs.existsSync(file)) fail(`нет файла ${path.relative(ROOT, file)}`);
  }
  if (!fs.existsSync(UI)) fail(`нет файла ${path.relative(ROOT, UI)}`);

  const html = fs.readFileSync(UI, 'utf8');
  const lines = html.split('\n');
  const startAt = lines.findIndex((l) => l.trim() === START);
  const endAt = lines.findIndex((l) => l.trim() === END);
  if (startAt === -1 || endAt === -1 || endAt < startAt) {
    fail(`в ${path.relative(ROOT, UI)} не нашлись маркеры ${START} / ${END}`);
  }

  const block = buildBlock();
  const next = lines.slice(0, startAt).concat(block.split('\n'), lines.slice(endAt + 1)).join('\n');

  if (next === html) {
    console.log('✓ pdf.js в ui.html уже актуален');
    return;
  }
  if (dryRun) {
    console.log(`⧖ dry-run: блок pdf.js изменится (${(block.length / 1024 / 1024).toFixed(2)} МБ)`);
    return;
  }
  fs.writeFileSync(UI, next);
  console.log(`✓ pdf.js запечён в ${path.relative(ROOT, UI)} (${(block.length / 1024 / 1024).toFixed(2)} МБ)`);
}

main();
