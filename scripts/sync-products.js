#!/usr/bin/env node
/**
 * Синхронизирует products.json и собранные архивы с Supabase:
 *   1. upsert в таблицу public.products — Edge Function checkout не читает файлы
 *      репозитория, ей нужна копия реестра в базе;
 *   2. заливка dist/products/<id>.zip в приватный бакет Storage (по умолчанию
 *      "products"), откуда checkout выдаёт подписанные ссылки.
 *
 * Standalone, НЕ входит в build-all.js: требует сервисный ключ и сеть, а
 * содержимое продукта меняется реже, чем страницы сайта (тот же принцип, что у
 * scripts/deploy-cdn.js и publish-scheduled-posts.js).
 *
 * Ключи берутся из окружения — в репозитории их нет и быть не должно:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Использование:
 *   node scripts/sync-products.js             # реестр + файлы
 *   node scripts/sync-products.js --dry-run   # показать, что уедет
 *   node scripts/sync-products.js --registry  # только реестр, без заливки файлов
 */

const fs   = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT      = path.resolve(__dirname, '..');
const REGISTRY  = path.join(ROOT, 'products.json');
const DIST      = path.join(ROOT, 'dist', 'products');
const DRY_RUN   = process.argv.includes('--dry-run');
const ONLY_REG  = process.argv.includes('--registry');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BUCKET       = process.env.PRODUCTS_BUCKET || 'products';

function die(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

async function upsertProducts(products) {
  const rows = products.map((p) => ({
    id: p.id,
    title: p.title,
    storage_object: p.storageObject,
    download_name: p.downloadName,
    // Пустая строка в products.json значит «оффер ещё не заведён» — в базе это
    // NULL, и checkout по нему отвечает payments_disabled.
    lava_offer_id: p.lavaOfferId || null,
    active: p.active !== false,
    updated_at: new Date().toISOString(),
  }));

  if (DRY_RUN) {
    rows.forEach((r) => console.log(`  [dry-run] upsert ${r.id} → ${r.storage_object}`
      + (r.lava_offer_id ? '' : ' (без оффера — платежи выключены)')));
    return;
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?on_conflict=id`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) die(`upsert products: ${res.status} ${await res.text()}`);
  rows.forEach((r) => console.log(`  ✓ ${r.id}`));
}

async function uploadFile(product) {
  const local = path.join(DIST, `${product.id}.zip`);
  if (!fs.existsSync(local)) {
    console.warn(`  ⚠ ${product.id}: нет ${path.relative(ROOT, local)} — сначала node scripts/build-extension-zip.js`);
    return;
  }
  const buf = fs.readFileSync(local);
  const size = (buf.length / 1048576).toFixed(2);

  if (DRY_RUN) {
    console.log(`  [dry-run] upload ${product.storageObject} (${size} МБ)`);
    return;
  }

  // upsert=true: путь в бакете стабильный, новая версия перезаписывает старую —
  // иначе ссылки в products.json пришлось бы менять при каждом релизе.
  //
  // curl вместо fetch: с большим бинарным телом Node'овский undici рвёт HTTP/2
  // сокет на полпути (SocketError: other side closed) — воспроизводится
  // стабильно на архивах от ~1 МБ. curl с явным --http1.1 проходит без сбоев;
  // маленький JSON-запрос выше (upsertProducts) fetch'ем не задет, там дело
  // именно в размере тела, а не в окружении в целом.
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${product.storageObject}`;
  const res = spawnSync('curl', [
    '-sS', '-m', '120', '--http1.1',
    '-X', 'POST', url,
    '-H', `apikey: ${SERVICE_KEY}`,
    '-H', `Authorization: Bearer ${SERVICE_KEY}`,
    '-H', 'Content-Type: application/zip',
    '-H', 'x-upsert: true',
    '--data-binary', `@${local}`,
    '-w', '\n%{http_code}',
  ], { encoding: 'utf8' });

  if (res.status !== 0) die(`upload ${product.id}: curl завершился с ошибкой (${res.status}): ${res.stderr}`);
  const out = res.stdout || '';
  const httpCode = out.trim().split('\n').pop();
  if (httpCode !== '200') die(`upload ${product.id}: HTTP ${httpCode} — ${out}`);
  console.log(`  ✓ ${product.storageObject} (${size} МБ)`);
}

async function main() {
  if (!fs.existsSync(REGISTRY)) die('нет products.json');
  const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
  const products = registry.products || [];
  if (!products.length) die('products.json: пустой список продуктов');

  if (!DRY_RUN && (!SUPABASE_URL || !SERVICE_KEY)) {
    die('нужны SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в окружении');
  }

  console.log(`Реестр (${products.length}):`);
  await upsertProducts(products);

  if (ONLY_REG) {
    console.log('✓ реестр синхронизирован (файлы пропущены: --registry)');
    return;
  }

  console.log('Файлы:');
  for (const p of products) await uploadFile(p);

  console.log(`\n✓ products синхронизированы${DRY_RUN ? ' [dry-run]' : ''}`);
}

main().catch((e) => die(e.message));
