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

const ROOT      = path.resolve(__dirname, '..');
const EXT_ROOT  = path.join(ROOT, 'tools', 'extensions');
const DRY_RUN   = process.argv.includes('--dry-run');

// Files that live alongside the extension but aren't part of its payload.
const EXCLUDE = new Set(['index.html', 'version.json', 'changelog.json', '.DS_Store']);

function listExtensionDirs() {
  if (!fs.existsSync(EXT_ROOT)) return [];
  return fs.readdirSync(EXT_ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(slug => fs.existsSync(path.join(EXT_ROOT, slug, 'manifest.json')));
}

function addDirToZip(zip, dirPath, baseDir) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (EXCLUDE.has(entry.name) || entry.name.endsWith('.zip')) continue;
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

function patchLandingPage(dirPath, slug, version, changelog) {
  const indexPath = path.join(dirPath, 'index.html');
  if (!fs.existsSync(indexPath)) return false;
  let html = fs.readFileSync(indexPath, 'utf8');
  const before = html;

  if (/<!-- VERSION:START -->[\s\S]*?<!-- VERSION:END -->/.test(html)) {
    html = html.replace(
      /(<!-- VERSION:START -->)[\s\S]*?(<!-- VERSION:END -->)/,
      `$1${version}$2`
    );
  }

  if (/<!-- CHANGELOG:START -->[\s\S]*?<!-- CHANGELOG:END -->/.test(html)) {
    html = html.replace(
      /(<!-- CHANGELOG:START -->)[\s\S]*?(<!-- CHANGELOG:END -->)/,
      `$1\n${renderChangelogHtml(changelog)}\n      $2`
    );
  }

  if (html === before) return false;
  if (!DRY_RUN) fs.writeFileSync(indexPath, html, 'utf8');
  return true;
}

async function buildExtension(slug) {
  const dirPath = path.join(EXT_ROOT, slug);
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

  const zipPath = path.join(dirPath, `${slug}.zip`);
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
}

main().catch(err => { console.error(err); process.exit(1); });
