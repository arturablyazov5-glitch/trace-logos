import { svgRawCache, colorState, applyColorMap, loadRawSvg } from './color.js';
import { showToast, svgUrl } from './utils.js';

const EXPORT_FAVICON_SIZE = 32;
const EXPORT_WIDE_HEIGHT = 24;

export function parseSvgViewBox(svg) {
  const m = svg.match(/viewBox=["']([^"']+)["']/i);
  if (!m) return null;
  const p = m[1].trim().split(/[\s,]+/).map(Number);
  if (p.length !== 4 || p.some(n => !Number.isFinite(n))) return null;
  return { w: p[2], h: p[3] };
}

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

export function svgToPngBlob(svgText, { square = false, size = 512 } = {}) {
  const sizedSvg = svgForExport(svgText, square);
  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([sizedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const imgEl = new Image();
    imgEl.onload = () => {
      const canvas = document.createElement('canvas');
      if (square) {
        canvas.width = size;
        canvas.height = size;
      } else {
        canvas.width = Math.round(wideLogoWidthAtHeight(sizedSvg, EXPORT_WIDE_HEIGHT));
        canvas.height = EXPORT_WIDE_HEIGHT;
      }
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        if (blob) resolve(blob); else reject(new Error('PNG generation failed'));
      }, 'image/png');
    };
    imgEl.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG load failed')); };
    imgEl.src = url;
  });
}

export function svgForFigma(svg, item, isSquare = true) {
  return svgForExport(svg, isSquare).replace(/^<svg/, `<svg id="${item.figma}"`);
}

export async function downloadAllAsZip(item) {
  if (typeof JSZip === 'undefined') {
    showToast('Архиватор ещё загружается...');
    return;
  }

  const btn = document.getElementById('btn-download-all');
  const label = btn.querySelector('.btn-label');
  const progress = btn.querySelector('.btn-progress');
  const origLabel = label.textContent;

  const baseName = item.figma.split('/').pop().toLowerCase();
  const squareVariantKeys = new Set(['svg', 'favicon']);
  const variants = [{ key: '_original', file: item.file, square: true }];
  if (item.variants) {
    for (const [key, file] of Object.entries(item.variants)) {
      variants.push({ key, file, square: squareVariantKeys.has(key) });
    }
  }

  btn.disabled = true;
  progress.style.width = '0%';

  try {
    const zip = new JSZip();
    const total = variants.length * 2;
    let done = 0;
    const tick = () => {
      done++;
      progress.style.width = Math.round((done / total) * 100) + '%';
    };

    for (const v of variants) {
      const suffixKey = v.key === 'svg' ? 'icon' : v.key === '_original' ? '' : v.key.replace(/_/g, '-');
      const suffix = suffixKey ? '-' + suffixKey : '';

      if (v.file.endsWith('.png')) {
        const resp = await fetch(svgUrl(v.file));
        const buf = await resp.arrayBuffer();
        const blob = new Blob([buf], { type: 'image/png' });
        zip.file(`png/${baseName}${suffix}.png`, blob);
        tick();
        tick();
      } else {
        const rawSvg = await loadRawSvg(v.file);
        const svgText = svgForExport(applyColorMap(rawSvg), v.square);
        zip.file(`svg/${baseName}${suffix}.svg`, svgText);
        tick();

        const pngBlob = await svgToPngBlob(svgText, { square: v.square, size: 512 });
        zip.file(`png/${baseName}${suffix}.png`, pngBlob);
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
    showToast(`Скачано: ${baseName}.zip`);
  } catch (err) {
    console.error(err);
    showToast('Ошибка при создании архива');
  } finally {
    btn.disabled = false;
    label.textContent = origLabel;
    setTimeout(() => { progress.style.width = '0%'; }, 400);
  }
}
