import { svgRawCache, colorState, applyColorMap, loadRawSvg } from './color.js';
import { showToast, svgUrl } from './utils.js';
import { TOASTS } from './labels.js';
import { parseSvgViewBox, svgToPngBlob } from './svg-utils.js';
import { buildIcnsForFile } from './icns.js';

const ICO_SIZES = [256, 48, 32, 16];
const ICO_RADIUS_RATIO = 0.20;

// Renders a square PNG blob for one ICO frame. Source is either SVG text or an image URL.
// SVG sources get a 20% corner rounding (square-cornered icons → app-icon look);
// PNG sources are drawn as-is (their rounding is already baked into the bitmap).
function icoFrameBlob({ svgText, imgUrl }, size, rounded) {
  return new Promise((resolve, reject) => {
    const objUrl = svgText ? URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })) : null;
    const src = objUrl ?? imgUrl;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      if (rounded) {
        const r = size * ICO_RADIUS_RATIO;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(size - r, 0);
        ctx.arcTo(size, 0, size, r, r);
        ctx.lineTo(size, size - r);
        ctx.arcTo(size, size, size - r, size, r);
        ctx.lineTo(r, size);
        ctx.arcTo(0, size, 0, size - r, r);
        ctx.lineTo(0, r);
        ctx.arcTo(0, 0, r, 0, r);
        ctx.closePath();
        ctx.clip();
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, size, size);
      if (objUrl) URL.revokeObjectURL(objUrl);
      c.toBlob(b => b ? resolve(b) : reject(new Error('PNG generation failed')), 'image/png');
    };
    img.onerror = () => { if (objUrl) URL.revokeObjectURL(objUrl); reject(new Error('Image load failed')); };
    img.src = src;
  });
}

export { parseSvgViewBox, svgToPngBlob };

const EXPORT_FAVICON_SIZE = 32;
const EXPORT_WIDE_HEIGHT = 24;

export function wideLogoWidthAtHeight(svg, height = EXPORT_WIDE_HEIGHT) {
  const vb = parseSvgViewBox(svg);
  if (!vb || vb.h <= 0) return height;
  return Math.round((height * vb.w / vb.h) * 100) / 100;
}

export function svgForExport(svg, isSquare = true) {
  const trimmed = svg.trim();
  if (isSquare) {
    return trimmed
      .replace(/^(<svg[^>]*?)\bwidth="[^"]*"/, `$1width="${EXPORT_FAVICON_SIZE}"`)
      .replace(/^(<svg[^>]*?)\bheight="[^"]*"/, `$1height="${EXPORT_FAVICON_SIZE}"`);
  }
  const w = wideLogoWidthAtHeight(trimmed, EXPORT_WIDE_HEIGHT);
  return trimmed
    .replace(/^(<svg[^>]*?)\bwidth="[^"]*"/, `$1width="${w}"`)
    .replace(/^(<svg[^>]*?)\bheight="[^"]*"/, `$1height="${EXPORT_WIDE_HEIGHT}"`);
}

export function svgForFigma(svg, item, isSquare = true) {
  return svgForExport(svg, isSquare).replace(/^<svg/, `<svg id="${item.figma}"`);
}

function waitForJSZip(timeout = 10000) {
  if (typeof JSZip !== 'undefined') return Promise.resolve(JSZip);
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (typeof JSZip !== 'undefined') return resolve(JSZip);
      if (Date.now() - start > timeout) return reject(new Error('JSZip не загрузился'));
      setTimeout(check, 100);
    };
    check();
  });
}

// Builds ICO source descriptor + rounding flag for an item.
// PNG primaries draw as-is (rounding baked in); SVG primaries get app-icon rounding.
async function icoSourceForFile(file) {
  if (file.endsWith('.png')) {
    return { source: { imgUrl: svgUrl(file) }, rounded: false };
  }
  const rawSvg = await loadRawSvg(file);
  if (!rawSvg) return null;
  return { source: { svgText: applyColorMap(rawSvg) }, rounded: true };
}

// Assembles a multi-resolution .ico Blob (256/48/32/16, PNG-compressed frames). Returns null if source missing.
async function buildIcoBlobForFile(file) {
  const spec = await icoSourceForFile(file);
  if (!spec) return null;

  const pngBlobs = await Promise.all(
    ICO_SIZES.map(size => icoFrameBlob(spec.source, size, spec.rounded))
  );
  const pngBuffers = await Promise.all(pngBlobs.map(b => b.arrayBuffer()));

  const headerSize = 6;
  const dirEntrySize = 16;
  const dataStart = headerSize + dirEntrySize * ICO_SIZES.length;

  const offsets = [];
  let pos = dataStart;
  for (const buf of pngBuffers) { offsets.push(pos); pos += buf.byteLength; }

  const icoBuffer = new ArrayBuffer(pos);
  const dv = new DataView(icoBuffer);
  dv.setUint16(0, 0, true);
  dv.setUint16(2, 1, true);
  dv.setUint16(4, ICO_SIZES.length, true);

  for (let i = 0; i < ICO_SIZES.length; i++) {
    const base = headerSize + i * dirEntrySize;
    const sz = ICO_SIZES[i];
    dv.setUint8(base + 0, sz === 256 ? 0 : sz);
    dv.setUint8(base + 1, sz === 256 ? 0 : sz);
    dv.setUint8(base + 2, 0);
    dv.setUint8(base + 3, 0);
    dv.setUint16(base + 4, 1, true);
    dv.setUint16(base + 6, 32, true);
    dv.setUint32(base + 8, pngBuffers[i].byteLength, true);
    dv.setUint32(base + 12, offsets[i], true);
  }

  let dataPos = dataStart;
  const u8 = new Uint8Array(icoBuffer);
  for (const buf of pngBuffers) { u8.set(new Uint8Array(buf), dataPos); dataPos += buf.byteLength; }

  return new Blob([icoBuffer], { type: 'image/x-icon' });
}

export async function estimateIcoSize(file) {
  try {
    const blob = await buildIcoBlobForFile(file);
    return blob ? blob.size : 0;
  } catch { return 0; }
}

export async function downloadAsIco(item, file = item.file) {
  const blob = await buildIcoBlobForFile(file);
  if (!blob) { showToast(TOASTS.fileNotLoaded); return; }

  // name after the actual file so variants don't all collapse to one filename
  const baseName = file.replace(/^.*\//, '').replace(/\.[^.]+$/, '').toLowerCase();
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: baseName + '.ico',
  });
  a.click();
  URL.revokeObjectURL(a.href);
  showToast(TOASTS.downloaded(baseName + '.ico'));
}

export async function downloadAllAsZip(item) {
  try {
    await waitForJSZip();
  } catch {
    showToast(TOASTS.zipLoadError);
    return;
  }

  const btn = document.getElementById('btn-download-zip');
  if (!btn) return;
  const label = btn.querySelector('.btn-label');
  const progress = btn.querySelector('.btn-progress');
  const origLabel = label.textContent;

  const baseName = item.figma.split('/').pop().toLowerCase();
  const isFullFile = file => /-full(\.[^.]+)?$/.test(file);
  const isSquareVariant = v => v.type === '_original' || v.type === 'svg'
    || (!v.type && !isFullFile(v.file));
  const variants = [{ type: '_original', file: item.file }];
  if (Array.isArray(item.variants)) {
    for (const v of item.variants) variants.push(v);
  }

  // ICO/ICNS are square app-icon formats: build one of each from EVERY square
  // variant (skip wide `-full` ones), logos section only. Names are uniquified so
  // an SVG icon and a PNG icon of the same logo don't collide (t-bank / t-bank-png).
  const isLogos = document.body.dataset.section === 'logos';
  const isFullVariant = v => v.type === 'full' || v.type === 'full_en' || isFullFile(v.file);
  const squareCount = isLogos ? variants.filter(v => !isFullVariant(v)).length : 0;

  // Uniquify a name within a folder so variants never overwrite each other: prefer
  // the requested name, then the source file's own basename, then a numeric suffix.
  // Shared across folders → png/ico/icns of one source line up (t-bank-png.*).
  const uniq = (set, desired, file) => {
    let name = desired;
    if (set.has(name)) {
      const stem = file.replace(/^.*\//, '').replace(/\.[^.]+$/, '');
      name = !set.has(stem) ? stem : `${desired}-${(file.match(/\.([^.]+)$/)?.[1] || 'x').toLowerCase()}`;
    }
    let n = name, i = 2;
    while (set.has(n)) n = `${name}-${i++}`;
    set.add(n);
    return n;
  };
  const usedSvg = new Set(), usedPng = new Set(), usedIcon = new Set();

  btn.disabled = true;
  progress.style.width = '0%';

  try {
    const zip = new JSZip();
    const total = variants.length * 2 + squareCount * 2;
    let done = 0;
    const tick = () => {
      done++;
      progress.style.width = Math.round((done / total) * 100) + '%';
    };

    for (const v of variants) {
      const suffixRaw = (v.type === '_original' || v.type === 'png') ? '' : (v.type === 'svg' ? 'icon' : (v.type ?? v.label ?? '')).replace(/[\s_]+/g, '-').toLowerCase();
      const suffix = suffixRaw ? '-' + suffixRaw : '';
      const square = isSquareVariant(v);

      if (v.file.endsWith('.png')) {
        const resp = await fetch(svgUrl(v.file));
        const buf = await resp.arrayBuffer();
        const blob = new Blob([buf], { type: 'image/png' });
        zip.file(`png/${uniq(usedPng, baseName + suffix, v.file)}.png`, blob);
        tick();
        tick();
      } else {
        const rawSvg = await loadRawSvg(v.file);
        const svgText = svgForExport(applyColorMap(rawSvg), square);
        zip.file(`svg/${uniq(usedSvg, baseName + suffix, v.file)}.svg`, svgText);
        tick();

        const pngBlob = await svgToPngBlob(svgText, { square, size: 512 });
        zip.file(`png/${uniq(usedPng, baseName + suffix, v.file)}.png`, pngBlob);
        tick();
      }

      if (isLogos && !isFullVariant(v)) {
        const iconName = uniq(usedIcon, baseName + suffix, v.file);
        try {
          const icoBlob = await buildIcoBlobForFile(v.file);
          if (icoBlob) zip.file(`ico/${iconName}.ico`, icoBlob);
        } catch { /* skip ICO */ }
        tick();
        try {
          const icnsBuf = await buildIcnsForFile(v.file);
          zip.file(`icns/${iconName}.icns`, icnsBuf);
        } catch { /* skip ICNS */ }
        tick();
      }
    }

    label.textContent = 'Упаковка...';
    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(zipBlob),
      download: baseName + '.zip'
    });
    a.click();
    URL.revokeObjectURL(a.href);
    showToast(TOASTS.downloaded(baseName + '.zip'));
  } catch (err) {
    console.error(err);
    showToast(TOASTS.zipError);
  } finally {
    btn.disabled = false;
    label.textContent = origLabel;
    setTimeout(() => { progress.style.width = '0%'; }, 400);
  }
}
