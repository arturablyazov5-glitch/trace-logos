// "Other formats" download modal encoders: WebP, PDF, AI, EPS.
// PDF and AI (Illustrator 9+ opens PDF-compatible files saved with a .ai extension) are real
// vector re-exports of the source SVG — geometry is parsed by svg-to-vector.js and emitted as
// genuine PDF path/paint operators (gradients become PDF axial/radial Shading Patterns) by
// vector-pdf-writer.js. EPS gets the same treatment via vector-eps-writer.js, with gradients
// flattened to a single stop-averaged flat color (documented in that file — PostScript shading
// has poor cross-viewer EPS support, unlike PDF's Shading Patterns).
// WebP stays raster — it's a raster format by definition. The vector path only applies when the
// source is an SVG; a PNG-only logo has no vector geometry to extract, so PDF/AI/EPS for those
// fall back to the same canvas-rasterize approach used for WebP.
import { applyColorMap, loadRawSvg } from './color.js';
import { showToast, svgUrl, trackExport } from './utils.js';
import { TOASTS } from './labels.js';
import { parseSvgViewBox } from './svg-utils.js';
import { parseSvgToScene } from './svg-to-vector.js';
import { sceneToPdfBytes } from './vector-pdf-writer.js';
import { sceneToEpsString } from './vector-eps-writer.js';

export function supportsWebp() {
  const c = document.createElement('canvas');
  c.width = c.height = 1;
  return c.toDataURL('image/webp').startsWith('data:image/webp');
}

// Same file-driven loading convention as icoSourceForFile in export.js: PNG resolves
// directly, SVG is re-fetched + re-colored fresh so live color-editor edits are respected.
export async function sourceForFile(file) {
  if (file.endsWith('.png')) return { imgUrl: svgUrl(file) };
  const rawSvg = await loadRawSvg(file);
  if (!rawSvg) return null;
  return { svgText: applyColorMap(rawSvg) };
}

// Width/height ratio of a logo's source file — used by the download modal to
// label wide/full size tabs with the actual rendered dimensions (e.g. 256×64)
// instead of a square guess. PNG loads an Image for its natural size; SVG reads
// the viewBox (same source used by renderToCanvas's non-square branch above).
export async function resolveAspectRatio(file) {
  if (file.endsWith('.png')) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1);
      img.onerror = () => resolve(1);
      img.src = svgUrl(file);
    });
  }
  const rawSvg = await loadRawSvg(file);
  if (!rawSvg) return 1;
  const vb = parseSvgViewBox(rawSvg);
  return vb && vb.h > 0 ? vb.w / vb.h : 1;
}

// radiusPct (0-50) rounds the square canvas's corners before drawing — 0 is a sharp
// square, 50 is a full circle. Only applies to square renders (a rounded corner on a
// wide `-full` lockup would clip the wordmark), matching the modal's radius slider
// being hidden for non-square variants.
export function renderToCanvas(source, isSquare, size, radiusPct = 0) {
  return new Promise((resolve, reject) => {
    const objUrl = source.svgText ? URL.createObjectURL(new Blob([source.svgText], { type: 'image/svg+xml;charset=utf-8' })) : null;
    const src = objUrl ?? source.imgUrl;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      if (isSquare) {
        c.width = c.height = size;
      } else {
        let ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
        if (source.svgText) {
          const vb = parseSvgViewBox(source.svgText);
          if (vb && vb.h > 0) ratio = vb.w / vb.h;
        }
        c.width = size;
        c.height = Math.max(1, Math.round(size / ratio));
      }
      const ctx = c.getContext('2d');
      if (isSquare && radiusPct > 0) {
        const r = Math.min(50, radiusPct) / 100 * c.width;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(c.width - r, 0);
        ctx.arcTo(c.width, 0, c.width, r, r);
        ctx.lineTo(c.width, c.height - r);
        ctx.arcTo(c.width, c.height, c.width - r, c.height, r);
        ctx.lineTo(r, c.height);
        ctx.arcTo(0, c.height, 0, c.height - r, r);
        ctx.lineTo(0, r);
        ctx.arcTo(0, 0, r, 0, r);
        ctx.closePath();
        ctx.clip();
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, c.width, c.height);
      if (objUrl) URL.revokeObjectURL(objUrl);
      resolve(c);
    };
    img.onerror = () => { if (objUrl) URL.revokeObjectURL(objUrl); reject(new Error('Image load failed')); };
    img.src = src;
  });
}

async function buildWebpBlobForFile(file, isSquare, size = 1000, radiusPct = 0) {
  const source = await sourceForFile(file);
  if (!source) return null;
  const canvas = await renderToCanvas(source, isSquare, size, radiusPct);
  return new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/webp', 0.92));
}

const HEX_CHARS = '0123456789abcdef';
function bytesToHex(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += HEX_CHARS[bytes[i] >> 4] + HEX_CHARS[bytes[i] & 15];
  return out;
}
function wrapHex(hex, lineLen = 200) {
  let out = '';
  for (let i = 0; i < hex.length; i += lineLen) out += hex.slice(i, i + lineLen) + '\n';
  return out;
}

// Classic PostScript `colorimage` has no alpha channel — flatten transparency onto white first.
// Fallback only: used when a logo has no SVG source (PNG-only) to extract real vector paths from.
function canvasToRgb(canvas) {
  const ctx = canvas.getContext('2d');
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const rgb = new Uint8Array(canvas.width * canvas.height * 3);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    const a = data[i + 3] / 255;
    rgb[j] = Math.round(data[i] * a + 255 * (1 - a));
    rgb[j + 1] = Math.round(data[i + 1] * a + 255 * (1 - a));
    rgb[j + 2] = Math.round(data[i + 2] * a + 255 * (1 - a));
  }
  return rgb;
}

function buildRasterEpsString(w, h, rgb) {
  const hex = wrapHex(bytesToHex(rgb));
  return `%!PS-Adobe-3.0 EPSF-3.0
%%Creator: Trace Logos (trace-logos.ru)
%%BoundingBox: 0 0 ${w} ${h}
%%HiResBoundingBox: 0 0 ${w} ${h}
%%DocumentData: Clean7Bit
%%LanguageLevel: 2
%%Pages: 1
%%EndComments
%%Page: 1 1
gsave
${w} ${h} scale
/picstr ${w * 3} string def
${w} ${h} 8
[${w} 0 0 -${h} 0 ${h}]
{currentfile picstr readhexstring pop}
false 3
colorimage
${hex}
grestore
%%Trailer
%%EOF
`;
}

// PNG-only fallback (no SVG geometry to vectorize) — also used when radiusPct > 0,
// since the vector path has no way to corner-clip a path scene.
async function buildRasterEpsBlob(source, isSquare, size, radiusPct) {
  const canvas = await renderToCanvas(source, isSquare, size, radiusPct);
  const rgb = canvasToRgb(canvas);
  const ps = buildRasterEpsString(canvas.width, canvas.height, rgb);
  return new Blob([ps], { type: 'application/postscript' });
}

async function buildEpsBlobForFile(file, isSquare, size = 600, radiusPct = 0) {
  const source = await sourceForFile(file);
  if (!source) return null;
  if (source.svgText && !radiusPct) {
    const scene = parseSvgToScene(source.svgText);
    if (scene) return new Blob([sceneToEpsString(scene, { targetSize: size })], { type: 'application/postscript' });
  }
  return buildRasterEpsBlob(source, isSquare, size, radiusPct);
}

function buildRasterPdfBytes(w, h, rgbaData) {
  const rgb = new Uint8Array(w * h * 3);
  const alpha = new Uint8Array(w * h);
  let hasAlpha = false;
  for (let i = 0, j = 0, k = 0; i < rgbaData.length; i += 4, j += 3, k++) {
    rgb[j] = rgbaData[i]; rgb[j + 1] = rgbaData[i + 1]; rgb[j + 2] = rgbaData[i + 2];
    alpha[k] = rgbaData[i + 3];
    if (rgbaData[i + 3] !== 255) hasAlpha = true;
  }

  const enc = new TextEncoder();
  const chunks = [];
  let pos = 0;
  const offsets = [];
  const push = bufOrStr => {
    const buf = typeof bufOrStr === 'string' ? enc.encode(bufOrStr) : bufOrStr;
    chunks.push(buf);
    pos += buf.length;
  };
  const beginObj = n => { offsets[n] = pos; push(`${n} 0 obj\n`); };
  const endObj = () => push('endobj\n');

  const smaskObjNum = hasAlpha ? 5 : null;
  const contentObjNum = hasAlpha ? 6 : 5;

  push('%PDF-1.4\n');
  push(new Uint8Array([0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A])); // binary marker line

  beginObj(1);
  push('<< /Type /Catalog /Pages 2 0 R >>\n');
  endObj();

  beginObj(2);
  push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n');
  endObj();

  beginObj(3);
  push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents ${contentObjNum} 0 R >>\n`);
  endObj();

  beginObj(4);
  const smaskEntry = smaskObjNum ? ` /SMask ${smaskObjNum} 0 R` : '';
  push(`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length ${rgb.length}${smaskEntry} >>\nstream\n`);
  push(rgb);
  push('\nendstream\n');
  endObj();

  if (smaskObjNum) {
    beginObj(smaskObjNum);
    push(`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceGray /BitsPerComponent 8 /Length ${alpha.length} >>\nstream\n`);
    push(alpha);
    push('\nendstream\n');
    endObj();
  }

  const content = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q\n`;
  beginObj(contentObjNum);
  push(`<< /Length ${content.length} >>\nstream\n${content}endstream\n`);
  endObj();

  const xrefStart = pos;
  const totalObjs = contentObjNum;
  push(`xref\n0 ${totalObjs + 1}\n`);
  push('0000000000 65535 f \n');
  for (let n = 1; n <= totalObjs; n++) {
    if (offsets[n] === undefined) { push('0000000000 00000 f \n'); continue; }
    push(String(offsets[n]).padStart(10, '0') + ' 00000 n \n');
  }
  push(`trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  const total = chunks.reduce((a, c) => a + c.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}

// PNG-only fallback (no SVG geometry to vectorize) — also used when radiusPct > 0,
// since the vector path has no way to corner-clip a path scene.
async function buildRasterPdfBlob(source, isSquare, size, radiusPct) {
  const canvas = await renderToCanvas(source, isSquare, size, radiusPct);
  const ctx = canvas.getContext('2d');
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const bytes = buildRasterPdfBytes(canvas.width, canvas.height, data);
  return new Blob([bytes], { type: 'application/pdf' });
}

async function buildPdfBlobForFile(file, isSquare, size = 800, radiusPct = 0) {
  const source = await sourceForFile(file);
  if (!source) return null;
  if (source.svgText && !radiusPct) {
    const scene = parseSvgToScene(source.svgText);
    if (scene) return new Blob([sceneToPdfBytes(scene, { targetSize: size })], { type: 'application/pdf' });
  }
  return buildRasterPdfBlob(source, isSquare, size, radiusPct);
}

// Illustrator (v9+) opens PDF-compatible files natively even when saved with a .ai extension —
// reusing the (now vector) PDF encoder verbatim avoids a second from-scratch binary format.
const buildAiBlobForFile = buildPdfBlobForFile;

export const FORMAT_BUILDERS = { webp: buildWebpBlobForFile, pdf: buildPdfBlobForFile, ai: buildAiBlobForFile, eps: buildEpsBlobForFile };

export async function estimateFormatSize(file, isSquare, format, size, radiusPct) {
  const builder = FORMAT_BUILDERS[format];
  if (!builder) return 0;
  try {
    const blob = await builder(file, isSquare, size, radiusPct);
    return blob ? blob.size : 0;
  } catch { return 0; }
}

export async function downloadFormat(item, file, isSquare, format, size, radiusPct) {
  const builder = FORMAT_BUILDERS[format];
  if (!builder) return;
  let blob = null;
  try {
    blob = await builder(file, isSquare, size, radiusPct);
  } catch (err) {
    console.error(err);
  }
  if (!blob) { showToast(TOASTS.fileNotLoaded); return; }

  const baseName = file.replace(/^.*\//, '').replace(/\.[^.]+$/, '').toLowerCase();
  const name = `${baseName}.${format}`;
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: name,
  });
  a.click();
  URL.revokeObjectURL(a.href);
  showToast(TOASTS.downloaded(name));
  trackExport(item.figma, format, file);
  return blob.size;
}
