#!/usr/bin/env node
/**
 * Packages every tools/extensions/<slug>/ Chrome extension into a
 * downloadable .zip + version.json, and patches the landing page's
 * version/changelog markers. Real update_url auto-update is blocked by
 * Chrome for unsigned self-hosted extensions (2020+) — this is the
 * realistic substitute: users get a "new version available" banner
 * (popup.js version-check) linking back to this page, then update
 * manually via chrome://extensions → "Обновить" на распакованном
 * расширении.
 *
 * Per extension folder, source of truth is manifest.json's "version" —
 * bump it there, edit changelog.json, then run this (or `npm run build`).
 *
 * Usage:
 *   node scripts/build-extension-zip.js            # build all
 *   node scripts/build-extension-zip.js --dry-run  # report only
 */

const fs   = require('fs');
const path = require('path');
const JSZip = require('jszip');
const { pairFileFor } = require('./lib/en-landings');

const ROOT      = path.resolve(__dirname, '..');
const EXT_ROOT  = path.join(ROOT, 'tools', 'extensions');
const DIST_ROOT = path.join(ROOT, 'dist', 'products');
const DRY_RUN   = process.argv.includes('--dry-run');

// Files that live alongside the extension but aren't part of its payload.
// Dev-мусор (node_modules у Tilda Helper весил 30+ МБ), сборщики и заметки в архив
// пользователя не попадают: только то, что нужно расширению в браузере.
const EXCLUDE = new Set([
  'index.html', 'version.json', 'changelog.json', '.DS_Store',
  'node_modules', '.claude', 'build', 'tests', '.gitignore',
  'package.json', 'package-lock.json', 'IDEAS.md',
]);

function listExtensionDirs() {
  if (!fs.existsSync(EXT_ROOT)) return [];
  return fs.readdirSync(EXT_ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(slug => fs.existsSync(path.join(EXT_ROOT, slug, 'manifest.json')));
}

function addDirToZip(zip, dirPath, baseDir) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (EXCLUDE.has(entry.name) || entry.name.endsWith('.zip') || entry.name.endsWith('.bak')) continue;
    const full = path.join(dirPath, entry.name);
    const rel  = path.relative(baseDir, full);
    if (entry.isDirectory()) {
      addDirToZip(zip, full, baseDir);
    } else {
      zip.file(rel.split(path.sep).join('/'), fs.readFileSync(full));
    }
  }
}

function renderChangelogHtml(changelog) {
  return changelog.map(entry => `      <div class="ext-changelog-entry">
        <div class="ext-changelog-head"><span class="ext-changelog-version">v${entry.version}</span><span class="ext-changelog-date">${entry.date}</span></div>
        <ul>
${entry.items.map(item => `          <li>${item}</li>`).join('\n')}
        </ul>
      </div>`).join('\n');
}

// html → html с обновлёнными VERSION/CHANGELOG. changelog === null — блок
// CHANGELOG не трогать (у EN-пары нет перевода записей).
function patchMarkers(html, version, changelog) {
  if (/<!-- VERSION:START -->[\s\S]*?<!-- VERSION:END -->/.test(html)) {
    html = html.replace(
      /(<!-- VERSION:START -->)[\s\S]*?(<!-- VERSION:END -->)/,
      `$1${version}$2`
    );
  }

  if (changelog && /<!-- CHANGELOG:START -->[\s\S]*?<!-- CHANGELOG:END -->/.test(html)) {
    html = html.replace(
      /(<!-- CHANGELOG:START -->)[\s\S]*?(<!-- CHANGELOG:END -->)/,
      `$1\n${renderChangelogHtml(changelog)}\n      $2`
    );
  }
  return html;
}

function writeIfChanged(file, html) {
  if (html === fs.readFileSync(file, 'utf8')) return false;
  if (!DRY_RUN) fs.writeFileSync(file, html, 'utf8');
  return true;
}

function patchLandingPage(dirPath, slug, version, changelog) {
  const indexPath = path.join(dirPath, 'index.html');
  if (!fs.existsSync(indexPath)) return false;
  let changed = writeIfChanged(indexPath, patchMarkers(fs.readFileSync(indexPath, 'utf8'), version, changelog));

  // EN-пара лендинга (scripts/lib/en-landings.js): та же версия; чейнджлог —
  // из items_en записей changelog.json. Нет items_en хоть у одной записи —
  // блок пары не трогаем (иначе русские пункты затёрли бы перевод) и предупреждаем.
  const pairFile = pairFileFor(`tools/extensions/${slug}/index.html`);
  if (pairFile) {
    const pairHtml = fs.readFileSync(pairFile, 'utf8');
    let enLog = changelog.map(e => (Array.isArray(e.items_en) ? { ...e, items: e.items_en } : null));
    if (enLog.includes(null)) {
      if (/<!-- CHANGELOG:START -->/.test(pairHtml)) {
        console.warn(`  ⚠ ${slug}: в changelog.json нет items_en у части записей — CHANGELOG в EN-паре не обновлён`);
      }
      enLog = null;
    }
    if (writeIfChanged(pairFile, patchMarkers(pairHtml, version, enLog))) changed = true;
  }
  return changed;
}

async function buildExtension(slug) {
  const dirPath = path.join(EXT_ROOT, slug);
  // Пересобрать content script из исходников до упаковки расширения.
  const builder = path.join(dirPath, 'build', 'build.js');
  if (fs.existsSync(builder)) {
    require('child_process').execFileSync(process.execPath, [builder, ...(DRY_RUN ? ['--dry-run'] : [])], { stdio: 'inherit' });
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(dirPath, 'manifest.json'), 'utf8'));
  const version = manifest.version;

  const changelogPath = path.join(dirPath, 'changelog.json');
  const changelog = fs.existsSync(changelogPath)
    ? JSON.parse(fs.readFileSync(changelogPath, 'utf8'))
    : [];

  if (changelog[0] && changelog[0].version !== version) {
    console.warn(`  ⚠ ${slug}: manifest.json version (${version}) не совпадает с последней записью changelog.json (${changelog[0].version})`);
  }

  const zip = new JSZip();
  addDirToZip(zip, dirPath, dirPath);
  const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });

  // Архив НЕ лежит в публичной директории сайта: он попадает к пользователю
  // только через checkout (приватный бакет Supabase Storage + подписанная
  // ссылка на /thanks/, см. scripts/sync-products.js). dist/ в .gitignore.
  const zipPath = path.join(DIST_ROOT, `${slug}.zip`);
  if (!DRY_RUN) fs.mkdirSync(DIST_ROOT, { recursive: true });
  const zipChanged = !fs.existsSync(zipPath) || !buf.equals(fs.readFileSync(zipPath));
  if (zipChanged && !DRY_RUN) fs.writeFileSync(zipPath, buf);

  const versionJsonPath = path.join(dirPath, 'version.json');
  const versionPayload = { version, updatedAt: new Date().toISOString().slice(0, 10) };
  const prevVersionJson = fs.existsSync(versionJsonPath)
    ? JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'))
    : null;
  const versionChanged = !prevVersionJson || prevVersionJson.version !== version;
  if (versionChanged && !DRY_RUN) {
    fs.writeFileSync(versionJsonPath, JSON.stringify(versionPayload, null, 2) + '\n');
  }

  const pageChanged = patchLandingPage(dirPath, slug, version, changelog);

  return { slug, version, zipChanged, versionChanged, pageChanged };
}

// Figma-плагины: в архив только то, что Figma читает из manifest.json
// (main, ui) — исходники, тесты и README остаются в репозитории. Список плагинов
// ведёт products.json (kind: "plugin", source: "tools/figma-plugins/<dir>").
const PLUGIN_FILES = ['manifest.json', 'code.js', 'ui.html', 'README.md'];

async function buildPlugin(product) {
  const dirPath = path.join(ROOT, product.source);
  const zip = new JSZip();
  for (const name of PLUGIN_FILES) {
    const file = path.join(dirPath, name);
    if (!fs.existsSync(file)) throw new Error(`${product.id}: нет ${product.source}/${name}`);
    zip.file(name, fs.readFileSync(file));
  }
  const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
  const zipPath = path.join(DIST_ROOT, `${product.id}.zip`);
  if (!DRY_RUN) fs.mkdirSync(DIST_ROOT, { recursive: true });
  const changed = !fs.existsSync(zipPath) || !buf.equals(fs.readFileSync(zipPath));
  if (changed && !DRY_RUN) fs.writeFileSync(zipPath, buf);
  return changed;
}

async function buildPlugins() {
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'products.json'), 'utf8'));
  const plugins = (registry.products || []).filter((p) => p.kind === 'plugin');
  for (const product of plugins) {
    const changed = await buildPlugin(product);
    console.log(`  ${changed ? (DRY_RUN ? '[dry-run] would update' : '✓') : '='} ${product.id} (плагин) [zip]`);
  }
  console.log(`✓ Figma-плагины собраны (${plugins.length})`);
}

async function main() {
  const slugs = listExtensionDirs();
  if (!slugs.length) {
    console.log('✓ tools/extensions — расширений не найдено, нечего собирать');
    return;
  }
  let changedCount = 0;
  for (const slug of slugs) {
    const res = await buildExtension(slug);
    const changed = res.zipChanged || res.versionChanged || res.pageChanged;
    if (changed) changedCount++;
    console.log(`  ${changed ? (DRY_RUN ? '[dry-run] would update' : '✓') : '='} ${slug} v${res.version}`
      + (res.zipChanged ? ' [zip]' : '')
      + (res.versionChanged ? ' [version.json]' : '')
      + (res.pageChanged ? ' [landing]' : ''));
  }
  console.log(`✓ tools/extensions — расширения собраны (${changedCount}/${slugs.length} изменено)`);
  await buildPlugins();
}

main().catch(err => { console.error(err); process.exit(1); });
