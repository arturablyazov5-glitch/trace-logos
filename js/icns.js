// ICNS export: modal with live preview + macOS .icns encoder.
// Self-contained feature module. main.js calls openIcnsModal(item).
//
// The renderer reproduces the *static* macOS 26 "Liquid Glass" icon look:
//   exact Apple squircle mask (figma-squircle math) + an opaque plate + a stack
//   of specular/rim/depth gradients + a soft contact shadow. The reference Dock
//   icons that flank the live preview are the ground truth we tune against.
import { loadRawSvg, applyColorMap } from './color.js';
import { showToast, svgUrl, formatFileSize } from './utils.js';
import { parseSvgViewBox } from './svg-utils.js';
import { LABELS, TOASTS } from './labels.js';

// ── ICNS container spec ──
// Each entry: 4-byte OSType + uint32 BE length (incl. 8-byte header) + PNG data.
// We deliberately OMIT the 16/32 PNG types `icp4`/`icp5`: macOS renders PNG
// payloads in those types scrambled in Finder list view (a long-standing bug).
// The OS interpolates 16/32 from the larger types, and ic11(32)/ic12(64) still
// cover the small sizes, so dropping them is pure win.
const ICNS_ENTRIES = [
  ['ic07', 128], ['ic08', 256], ['ic09', 512], ['ic10', 1024],
  ['ic11', 32], ['ic12', 64], ['ic13', 256], ['ic14', 512],
];
const ICNS_SIZES = [...new Set(ICNS_ENTRIES.map(([, s]) => s))];

const PREVIEW_SIZE = 256;       // px the live preview renders at

// The "rounding" slider maps onto the genuine Apple corner-smoothing model:
//   0%   → sharp square
//   60%  → the EXACT macOS squircle (r = 22.37% of side, smoothing = 0.6)
//   100% → a perfect circle
const MACOS_PCT = 60;
const APPLE_RADIUS = 0.2237;    // Apple icon-grid corner radius, fraction of side
const APPLE_SMOOTHING = 0.6;    // Apple corner-smoothing parameter

// Defaults. paddingPct is the transparent margin around the plate (per side, % of
// tile) — macOS sits at ~10%. glass = the Liquid Glass material. The plate colour
// is always taken automatically from the logo's own background layer ('auto').
const DEFAULTS = { radiusPct: MACOS_PCT, paddingPct: 10, shadow: true, glass: true, bg: 'auto' };

let sessionDefaults = DEFAULTS; // effective defaults for the open logo (reset target)

function defaultsFor(file) {
  // PNG variants are already prerendered assets. Keep their default ICNS mask
  // unrounded; SVGs still use the macOS squircle as their baseline.
  if (/\.png(\?|$)/i.test(file)) return { ...DEFAULTS, radiusPct: 0 };
  return DEFAULTS;
}

// ── Apple squircle geometry (figma-squircle port) ──────────────────────────
// Continuous-curvature rounded square: each corner is a cubic-smoothed arc so
// curvature eases in/out (G2) instead of jumping like a plain circular fillet —
// this is the exact model Figma/Apple use for icon corners.
const toRad = d => (d * Math.PI) / 180;

function cornerParams(cornerRadius, cornerSmoothing, budget) {
  let p = (1 + cornerSmoothing) * cornerRadius;
  const maxSmoothing = budget / cornerRadius - 1;
  cornerSmoothing = Math.min(cornerSmoothing, maxSmoothing);
  p = Math.min(p, budget);

  const arcMeasure = 90 * (1 - cornerSmoothing);
  const arc = Math.sin(toRad(arcMeasure / 2)) * cornerRadius * Math.SQRT2;
  const angleAlpha = (90 - arcMeasure) / 2;
  const p3ToP4 = cornerRadius * Math.tan(toRad(angleAlpha / 2));
  const angleBeta = 45 * cornerSmoothing;
  const c = p3ToP4 * Math.cos(toRad(angleBeta));
  const d = c * Math.tan(toRad(angleBeta));
  const b = (p - arc - c - d) / 3;
  const a = 2 * b;
  return { a, b, c, d, p, r: cornerRadius, arc };
}

// SVG path string for a w×h box (all four corners identical here). Box-local
// coords starting at (0,0); position it via ctx.translate before fill/clip.
function squircleSvgPath(w, h, prm) {
  if (!prm.r) return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
  const { a, b, c, d, p, r, arc } = prm;
  const ab = a + b, abc = a + b + c, bc = b + c;
  const tr = `c ${a} 0 ${ab} 0 ${abc} ${d} a ${r} ${r} 0 0 1 ${arc} ${arc} c ${d} ${c} ${d} ${bc} ${d} ${abc}`;
  const br = `c 0 ${a} 0 ${ab} ${-d} ${abc} a ${r} ${r} 0 0 1 ${-arc} ${arc} c ${-c} ${d} ${-bc} ${d} ${-abc} ${d}`;
  const bl = `c ${-a} 0 ${-ab} 0 ${-abc} ${-d} a ${r} ${r} 0 0 1 ${-arc} ${-arc} c ${-d} ${-c} ${-d} ${-bc} ${-d} ${-abc}`;
  const tl = `c 0 ${-a} 0 ${-ab} ${d} ${-abc} a ${r} ${r} 0 0 1 ${arc} ${-arc} c ${c} ${-d} ${bc} ${-d} ${abc} ${-d}`;
  return `M ${w - p} 0 ${tr} L ${w} ${h - p} ${br} L ${p} ${h} ${bl} L 0 ${p} ${tl} Z`;
}

// Map the rounding slider → squircle path params for a plate of side `bw`.
// 0–60%: grow radius 0 → Apple radius at fixed Apple smoothing (square → squircle).
// 60–100%: grow radius to half-side while easing smoothing 0.6 → 0 (squircle → circle).
function shapeFor(pct, bw) {
  const p = Math.max(0, Math.min(100, pct));
  const budget = bw / 2;
  let radius, smoothing;
  if (p <= MACOS_PCT) {
    radius = (p / MACOS_PCT) * APPLE_RADIUS * bw;
    smoothing = APPLE_SMOOTHING;
  } else {
    const t = (p - MACOS_PCT) / (100 - MACOS_PCT);
    radius = (APPLE_RADIUS + t * (0.5 - APPLE_RADIUS)) * bw;
    smoothing = APPLE_SMOOTHING * (1 - t);
  }
  if (radius < bw * 0.002) return cornerParams(0, 0, budget); // square
  return cornerParams(radius, smoothing, budget);
}

// ── Liquid Glass material ───────────────────────────────────────────────────
// Modelled on Apple's IconRendering shaders (glass_background / glassHighlight):
// the glass is shaded off the shape's edge (SDF) and modulated by a single
// `lightDirection`. The highlight has three edge bands — FILL (broad), KEY (main
// specular) and RIM (thin edge) — each parameterised by inset / spread /
// brightness. Light runs along a diagonal, so the bright lobes land on the two
// opposite corners (top-left + bottom-right), with the unlit diagonal in shadow.

// A gradient along the lit diagonal (top-left → bottom-right): bright at both
// ends, dim in the middle — the two-lobe directional highlight Apple produces.
function diagonalLight(ctx, bw, edge, mid) {
  const g = ctx.createLinearGradient(0, 0, bw, bw);
  g.addColorStop(0, `rgba(255,255,255,${edge})`);
  g.addColorStop(0.5, `rgba(255,255,255,${mid})`);
  g.addColorStop(1, `rgba(255,255,255,${edge * 0.85})`);
  return g;
}

function drawGlass(ctx, bw, prm) {
  const path = new Path2D(squircleSvgPath(bw, bw, prm));
  ctx.lineJoin = ctx.lineCap = 'round';

  // FILL — broad body shading. Directional: lit corners brighten, opposite darken;
  // plus a faint vertical thickness gradient (darker bottom) for the glass depth.
  let g = ctx.createLinearGradient(0, 0, bw, bw);
  g.addColorStop(0, 'rgba(255,255,255,0.07)');
  g.addColorStop(0.5, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.09)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, bw, bw);
  g = ctx.createLinearGradient(0, bw * 0.5, 0, bw);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.06)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, bw, bw);

  // KEY — the main specular: a wide, soft edge band on the two lit corners.
  // A blur fakes the `spread`/`spreadPower` falloff of the shader's edge profile.
  ctx.save();
  ctx.filter = `blur(${Math.max(0.5, bw * 0.012)}px)`;
  ctx.strokeStyle = diagonalLight(ctx, bw, 0.28, 0.0);
  ctx.lineWidth = Math.max(1.5, bw * 0.05);
  ctx.stroke(path);
  ctx.restore();

  // RIM — thin crisp edge light, same diagonal direction, brighter.
  ctx.strokeStyle = diagonalLight(ctx, bw, 0.5, 0.06);
  ctx.lineWidth = Math.max(1, bw * 0.012);
  ctx.stroke(path);

  // SHADOW — soft inner edge on the UNLIT diagonal (top-right → bottom-left),
  // opposite the light, for contact/depth. Blurred so it reads as occlusion.
  ctx.save();
  ctx.filter = `blur(${Math.max(0.5, bw * 0.01)}px)`;
  const sh = ctx.createLinearGradient(bw, 0, 0, bw);
  sh.addColorStop(0, 'rgba(0,0,0,0.12)');
  sh.addColorStop(0.5, 'rgba(0,0,0,0)');
  sh.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.strokeStyle = sh;
  ctx.lineWidth = Math.max(1, bw * 0.022);
  ctx.stroke(path);
  ctx.restore();
}

// Centred fit of an image into a `bw`×`bw` box, edge-to-edge, aspect preserved.
function fitBox(aspect, bw) {
  let dw, dh;
  if (aspect >= 1) { dw = bw; dh = bw / aspect; } else { dh = bw; dw = bw * aspect; }
  return { dw, dh, dx: (bw - dw) / 2, dy: (bw - dh) / 2 };
}

// ── Exact glassHighlight, ported from IconRendering's metallib ───────────────
// The bright inner edge-light that gives each element volume. Apple computes it
// off the shape's signed-distance field (SDF) and surface normal:
//   t  = saturate((height - d)/aa + 0.5)              // inner end of the band
//   t2 = saturate(d/aa + 0.5)                         // the edge itself
//   edgeProfile = 1 - curvature·saturate(d/height)    // = mix(1, 1-d/h, curvature)
//   dirMask = saturate((dot(light_dir, n) - spread) / max(1 - spread, 0.25))
//   biasDenom = max((1 - dirMask)·bias + 1, 0.25)
//   intensity = edgeProfile · t2 · t · dirMask / biasDenom
// d = signed distance inside the edge (px), n = outward normal, aa ≈ 0.833 (the
// clamped fwidth term, ≈1px at render resolution).
const HL_REF = 512;                 // resolution the highlight is computed at, once
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

function ghIntensity(d, nx, ny, p) {
  const aa = 0.833;
  const t = clamp01((p.height - d) / aa + 0.5);
  const t2 = clamp01(d / aa + 0.5);
  const edgeProfile = 1 - p.curvature * clamp01(d / p.height);
  let dirMask;
  if (p.all) dirMask = 1;
  else {
    let ndl = p.lx * nx + p.ly * ny;
    if (p.bidir) ndl = Math.abs(ndl);      // light along an axis ⇒ both opposite edges
    dirMask = clamp01((ndl - p.spread) / Math.max(1 - p.spread, 0.25));
  }
  const biasDenom = Math.max((1 - dirMask) * p.bias + 1, 0.25);
  return edgeProfile * t2 * t * dirMask / biasDenom;
}

// Felzenszwalb 1-D squared Euclidean distance transform (one row/column).
function edt1d(f, n, d, v, z) {
  let k = 0; v[0] = 0; z[0] = -1e20; z[1] = 1e20;
  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
    k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
  }
  k = 0;
  for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
}

function edt2d(f, w, h) {
  const m = Math.max(w, h);
  const d = new Float64Array(m), v = new Int32Array(m), z = new Float64Array(m + 1), line = new Float64Array(m);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) line[y] = f[y * w + x];
    edt1d(line, h, d, v, z);
    for (let y = 0; y < h; y++) f[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) line[x] = f[y * w + x];
    edt1d(line, w, d, v, z);
    for (let x = 0; x < w; x++) f[y * w + x] = d[x];
  }
}

// Signed distance field (inside positive) from an alpha mask, in pixels.
function sdfFromAlpha(A, w, h) {
  const INF = 1e20, n = w * h;
  const fin = new Float64Array(n), fout = new Float64Array(n);
  for (let i = 0; i < n; i++) { const on = A[i] > 127; fin[i] = on ? INF : 0; fout[i] = on ? 0 : INF; }
  edt2d(fin, w, h); edt2d(fout, w, h);
  const sdf = new Float64Array(n);
  for (let i = 0; i < n; i++) sdf[i] = A[i] > 127 ? Math.sqrt(fin[i]) : -Math.sqrt(fout[i]);
  return sdf;
}

// The two highlight bands Apple layers on each element: a thin all-round RIM and
// a broad directional KEY (diagonal axis ⇒ the two opposite-corner lobes).
// Calibrated by measuring ictool's real render (gray-circle reference @1024):
// light is a single top-left source (brightest rim ≈225°), the rim FWHM ≈ 9px on
// a 1024 tile (peak ~7px in), and its peak adds ≈0.29 over the body on the lit
// side, ≈0.10 away. height/HL_REF ≈ rim-width as a fraction of the element.
const HL_PASSES = [
  { height: HL_REF * 0.009, curvature: 0.0, all: true, amp: 0.40 },                                          // faint all-round definition
  { height: HL_REF * 0.012, curvature: 0.40, spread: -0.15, bias: 0, lx: -0.7071, ly: -0.7071, amp: 0.68 },  // KEY (top-left)
];

// Compute the additive white edge-light for a foreground image, once, at HL_REF.
function foregroundHighlight(fgImg, aspect) {
  const W = HL_REF;
  const m = document.createElement('canvas'); m.width = m.height = W;
  const mx = m.getContext('2d', { willReadFrequently: true });
  mx.imageSmoothingEnabled = true; mx.imageSmoothingQuality = 'high';
  const f = fitBox(aspect, W);
  mx.drawImage(fgImg, f.dx, f.dy, f.dw, f.dh);
  const px = mx.getImageData(0, 0, W, W).data;
  const A = new Uint8Array(W * W);
  for (let i = 0; i < W * W; i++) A[i] = px[i * 4 + 3];
  const sdf = sdfFromAlpha(A, W, W);

  const out = mx.createImageData(W, W), od = out.data;
  const maxH = Math.max(...HL_PASSES.map(p => p.height));
  for (let y = 1; y < W - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const d = sdf[i];
      if (A[i] < 8 || d > maxH + 1) continue;     // only inside, near an edge
      let nx = -(sdf[i + 1] - sdf[i - 1]), ny = -(sdf[i + W] - sdf[i - W]); // outward normal
      const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
      let acc = 0;
      for (const p of HL_PASSES) if (d <= p.height + 1) acc += p.amp * ghIntensity(d, nx, ny, p);
      const a = clamp01(acc) * (A[i] / 255);
      if (a <= 0) continue;
      od[i * 4] = od[i * 4 + 1] = od[i * 4 + 2] = 255;
      od[i * 4 + 3] = Math.round(a * 255);
    }
  }
  mx.putImageData(out, 0, 0);
  return m;
}

function parseHex(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// Representative plate colour (the background the element sits on).
function plateRGB(source) {
  if (source.bgColor && /^#?[0-9a-f]{3,6}$/i.test(source.bgColor)) return parseHex(source.bgColor);
  if (source.plate) {
    const c = document.createElement('canvas'); c.width = c.height = 8;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(source.plate, 0, 0, 8, 8);
    const d = x.getImageData(4, 4, 1, 1).data;
    return [d[0], d[1], d[2]];
  }
  return [200, 200, 200];
}

// Translucency shadow tint (multiply factor, 0–255 per channel) the glass takes
// at the element's bottom. Measured from ictool: luminance darkens to ~0.66 but
// the plate's hue is preserved — tint = 0.66 + 0.40·(plateNorm − min). Neutral
// plates ⇒ uniform darken; coloured plates ⇒ the shadow shifts toward their hue.
function shadowTint(plate) {
  const mx = Math.max(plate[0], plate[1], plate[2]) || 1;
  const pn = plate.map(v => v / mx);
  const mn = Math.min(pn[0], pn[1], pn[2]);
  return pn.map(v => Math.round(255 * Math.min(1, 0.66 + 0.40 * (v - mn))));
}

// Build the foreground layer: the glyph + glass body (translucent top-bright →
// tinted-dark bottom) + the bright edge-light. No dark drop shadow.
function buildFgLayer(source, bw) {
  if (!source._hl) source._hl = foregroundHighlight(source.fg, source.aspect);
  if (!source._tint) source._tint = shadowTint(plateRGB(source));
  const t = source._tint;
  const c = document.createElement('canvas');
  c.width = c.height = bw;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = 'high';
  const f = fitBox(source.aspect, bw);
  x.drawImage(source.fg, f.dx, f.dy, f.dw, f.dh);

  // Body translucency — multiply by white(top) → plate-tinted shadow(bottom).
  // 'multiply' bleeds outside the glyph, so re-clip with destination-in.
  x.globalCompositeOperation = 'multiply';
  const bg = x.createLinearGradient(0, f.dy, 0, f.dy + f.dh);
  bg.addColorStop(0, 'rgb(255,255,255)');
  bg.addColorStop(1, `rgb(${t[0]},${t[1]},${t[2]})`);
  x.fillStyle = bg;
  x.fillRect(0, 0, bw, bw);
  x.globalCompositeOperation = 'destination-in';
  x.drawImage(source.fg, f.dx, f.dy, f.dw, f.dh);

  // Faint top sheen (measured ≈ +6 at the very top).
  x.globalCompositeOperation = 'source-atop';
  const sh = x.createLinearGradient(0, f.dy, 0, f.dy + f.dh * 0.4);
  sh.addColorStop(0, 'rgba(255,255,255,0.05)');
  sh.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = sh;
  x.fillRect(0, 0, bw, bw);

  // Bright glass edge-light on top (additive).
  x.globalCompositeOperation = 'lighter';
  x.drawImage(source._hl, 0, 0, bw, bw);
  x.globalCompositeOperation = 'source-over';
  return c;
}

// Resolve the plate colour: 'auto' uses the logo's own background layer (handles
// gradients by drawing the layer), otherwise a solid hex.
function fillPlate(ctx, source, bw, opts) {
  if (opts.bg === 'auto' && source.plate) {
    ctx.drawImage(source.plate, 0, 0, bw, bw);
  } else {
    ctx.fillStyle = opts.bg === 'auto' ? (source.bgColor || '#ffffff') : opts.bg;
    ctx.fillRect(0, 0, bw, bw);
  }
}

// Render one square icon of `size` px. Returns a canvas.
//   glass off → the original logo, clipped to the squircle (+ optional shadow).
//   glass on  → plate (auto bg layer / solid colour) + foreground glyph with
//               depth (bevel + drop shadow) + the Liquid Glass coating on top.
function renderIcon(source, size, opts) {
  const padPx = (opts.paddingPct / 100) * size;
  const bx = padPx, by = padPx, bw = size - padPx * 2;
  const prm = shapeFor(opts.radiusPct, bw);
  const glass = opts.glass;

  const off = document.createElement('canvas');
  off.width = off.height = size;
  const o = off.getContext('2d');
  o.imageSmoothingEnabled = true;
  o.imageSmoothingQuality = 'high';
  o.save();
  o.translate(bx, by);
  o.clip(new Path2D(squircleSvgPath(bw, bw, prm)));

  if (glass) {
    fillPlate(o, source, bw, opts);
    // Foreground glyph (background layer already lives in the plate) with a soft
    // contact shadow below it — subtle, matching ictool's real render.
    o.save();
    o.shadowColor = 'rgba(0,0,0,0.22)';
    o.shadowBlur = bw * 0.022;
    o.shadowOffsetY = bw * 0.012;
    o.drawImage(buildFgLayer(source, bw), 0, 0);
    o.restore();
    drawGlass(o, bw, prm);
  } else {
    // Plain: the original logo edge-to-edge, its own background intact.
    const f = fitBox(source.aspect, bw);
    o.drawImage(source.full, f.dx, f.dy, f.dw, f.dh);
  }
  o.restore();

  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = size;
  const ctx = cvs.getContext('2d');
  if (opts.shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.30)';
    ctx.shadowBlur = size * 0.05;
    ctx.shadowOffsetY = size * 0.022;
  }
  ctx.drawImage(off, 0, 0);
  return cvs;
}

// ── Encoder ───────────────────────────────────────────────────────────────
function writeAscii(u8, off, s) {
  for (let i = 0; i < s.length; i++) u8[off + i] = s.charCodeAt(i);
}

function encodeIcns(bySize) {
  const entries = ICNS_ENTRIES.map(([type, size]) => ({ type, buf: bySize.get(size) }));
  let total = 8;
  for (const e of entries) total += 8 + e.buf.byteLength;
  const out = new ArrayBuffer(total);
  const dv = new DataView(out);
  const u8 = new Uint8Array(out);
  writeAscii(u8, 0, 'icns');
  dv.setUint32(4, total, false); // ICNS is big-endian (ICO is little-endian)
  let pos = 8;
  for (const e of entries) {
    writeAscii(u8, pos, e.type);
    dv.setUint32(pos + 4, 8 + e.buf.byteLength, false);
    u8.set(new Uint8Array(e.buf), pos + 8);
    pos += 8 + e.buf.byteLength;
  }
  return out;
}

function canvasToPngBuffer(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? b.arrayBuffer().then(resolve) : reject(new Error('PNG failed')), 'image/png');
  });
}

// Build an <img> from the (color-mapped) SVG, sized to its viewBox so aspect is correct.
function svgToImage(svgText) {
  const vb = parseSvgViewBox(svgText);
  const w = vb && vb.w > 0 ? vb.w : 512;
  const h = vb && vb.h > 0 ? vb.h : 512;
  const sized = svgText.replace(/<svg\b([^>]*)>/i, (m, attrs) => {
    const a = attrs.replace(/\swidth="[^"]*"/i, '').replace(/\sheight="[^"]*"/i, '');
    return `<svg${a} width="${w}" height="${h}">`;
  });
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ img, aspect: w / h }); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG load failed')); };
    img.src = url;
  });
}

// Load a raster (PNG) logo straight as an <img> — PNG items can't be recoloured,
// so we skip the SVG colour pipeline entirely.
function pngToImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ img, aspect: (img.naturalWidth || 1) / (img.naturalHeight || 1) });
    img.onerror = () => reject(new Error('PNG load failed'));
    img.src = url;
  });
}

// ── Modal ─────────────────────────────────────────────────────────────────
let dom = null;          // built-once modal DOM
let source = null;       // { img, aspect, item }
const opts = { ...DEFAULTS };

// Real macOS Dock icons flank the preview as a fixed rounding reference — their
// squircle is baked into the PNG (genuine shape) and never follows the slider,
// so you can dial the centre tile until it matches the real neighbours.
const NEIGHBOR_SRCS = ['/assets/icns/dock-finder.png', '/assets/icns/dock-appstore.png'];
let neighborImgs = null;

function loadNeighbors() {
  neighborImgs = NEIGHBOR_SRCS.map(src => {
    const im = new Image();
    im.onload = () => renderPreview();
    im.src = src;
    return im;
  });
}

// True while every setting still matches the defaults — used to hide the reset button.
function isPristine() {
  return opts.radiusPct === sessionDefaults.radiusPct
    && opts.paddingPct === sessionDefaults.paddingPct
    && opts.shadow === sessionDefaults.shadow
    && opts.glass === sessionDefaults.glass
    && opts.bg === sessionDefaults.bg;
}

function renderPreview() {
  if (!dom) return;
  dom.reset.classList.toggle('show', !isPristine());
  const T = PREVIEW_SIZE;                    // tile footprint — neighbours carry their own ~10% margin
  // Centre → neighbour distance. >T so even an edge-to-edge centre (padding 0,
  // no side margin) keeps a clear gap from the neighbours instead of touching.
  const dist = T * 1.05;
  const W = Math.ceil(2 * (dist + T / 2));
  const H = T;

  dom.preview.width = W;
  dom.preview.height = H;
  const ctx = dom.preview.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2, cy = H / 2;
  if (neighborImgs) {
    neighborImgs.forEach((im, i) => {
      if (!im.complete || !im.naturalWidth) return;
      const ncx = cx + (i === 0 ? -dist : dist);
      ctx.drawImage(im, ncx - T / 2, cy - T / 2, T, T);
    });
  }
  if (source) {
    const icon = renderIcon(source, T, opts);
    ctx.drawImage(icon, cx - T / 2, cy - T / 2);
  }
  scheduleSize();
}

function buildDom() {
  const overlay = document.createElement('div');
  overlay.className = 'icns-overlay';
  overlay.innerHTML = `
    <div class="icns-modal" role="dialog" aria-modal="true" aria-labelledby="icns-title">
      <button type="button" class="icns-close" aria-label="Закрыть">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div class="icns-header">
        <div class="icns-title" id="icns-title">Скачать ICNS</div>
        <div class="icns-sub">Иконка приложения для macOS</div>
      </div>
      <div class="icns-preview-box">
        <button type="button" class="icns-reset" aria-label="Сбросить настройки" title="Сбросить">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
        <canvas class="icns-preview" width="${PREVIEW_SIZE}" height="${PREVIEW_SIZE}"></canvas>
      </div>
      <div class="icns-controls">
        <label class="icns-toggle icns-glass-row">
          <span>Liquid Glass (macOS 26)</span>
          <input type="checkbox" class="icns-glass">
          <span class="icns-switch" aria-hidden="true"></span>
        </label>
        <div class="icns-row">
          <span class="icns-label">Скругление <b class="icns-val" data-for="radius"></b></span>
          <input type="range" class="icns-range" data-k="radiusPct" min="0" max="100" step="1" style="--tickx: calc(8px + ${MACOS_PCT / 100} * (100% - 16px))">
        </div>
        <div class="icns-row">
          <span class="icns-label">Отступ <b class="icns-val" data-for="padding"></b></span>
          <input type="range" class="icns-range" data-k="paddingPct" min="0" max="25" step="1" style="--tickx: calc(8px + ${DEFAULTS.paddingPct / 25} * (100% - 16px))">
        </div>
        <label class="icns-toggle">
          <span>Тень под иконкой</span>
          <input type="checkbox" class="icns-shadow">
          <span class="icns-switch" aria-hidden="true"></span>
        </label>
      </div>
      <button type="button" class="btn btn-primary icns-download">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span class="icns-dl-label">${LABELS.dlIcns}</span>
        <span class="btn-size icns-dl-size"></span>
      </button>
    </div>`;
  document.body.appendChild(overlay);

  dom = {
    overlay,
    modal: overlay.querySelector('.icns-modal'),
    preview: overlay.querySelector('.icns-preview'),
    radius: overlay.querySelector('[data-k="radiusPct"]'),
    padding: overlay.querySelector('[data-k="paddingPct"]'),
    shadow: overlay.querySelector('.icns-shadow'),
    glass: overlay.querySelector('.icns-glass'),
    glassRow: overlay.querySelector('.icns-glass-row'),
    radiusVal: overlay.querySelector('[data-for="radius"]'),
    paddingVal: overlay.querySelector('[data-for="padding"]'),
    reset: overlay.querySelector('.icns-reset'),
    download: overlay.querySelector('.icns-download'),
    dlLabel: overlay.querySelector('.icns-dl-label'),
    dlSize: overlay.querySelector('.icns-dl-size'),
  };

  // ── wiring ──
  overlay.querySelector('.icns-close').onclick = close;
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });

  for (const range of [dom.radius, dom.padding]) {
    range.oninput = () => {
      cancelAnimationFrame(resetRaf); // a manual drag interrupts a running reset
      opts[range.dataset.k] = +range.value;
      syncLabels();
      renderPreview();
    };
  }
  dom.shadow.onchange = () => { opts.shadow = dom.shadow.checked; renderPreview(); };
  dom.glass.onchange = () => { opts.glass = dom.glass.checked; renderPreview(); };
  dom.reset.onclick = animateReset;
  dom.download.onclick = doDownload;

  loadNeighbors();
}

// Tween the sliders + preview back to the defaults instead of snapping.
let resetRaf = 0;
function animateReset() {
  cancelAnimationFrame(resetRaf);
  const from = { radiusPct: opts.radiusPct, paddingPct: opts.paddingPct };
  opts.shadow = sessionDefaults.shadow;        // toggles flip instantly
  opts.glass = sessionDefaults.glass;
  opts.bg = sessionDefaults.bg;
  dom.shadow.checked = sessionDefaults.shadow;
  dom.glass.checked = sessionDefaults.glass;
  const start = performance.now();
  const DUR = 280;
  const tick = now => {
    const k = Math.min(1, (now - start) / DUR);
    const e = 1 - Math.pow(1 - k, 3);   // easeOutCubic
    opts.radiusPct = from.radiusPct + (sessionDefaults.radiusPct - from.radiusPct) * e;
    opts.paddingPct = from.paddingPct + (sessionDefaults.paddingPct - from.paddingPct) * e;
    syncControls();
    renderPreview();
    if (k < 1) resetRaf = requestAnimationFrame(tick);
    else { Object.assign(opts, sessionDefaults); syncControls(); renderPreview(); }
  };
  resetRaf = requestAnimationFrame(tick);
}

function syncLabels() {
  dom.radiusVal.textContent = Math.round(opts.radiusPct) + '%';
  dom.paddingVal.textContent = Math.round(opts.paddingPct) + '%';
}

function syncControls() {
  dom.radius.value = Math.round(opts.radiusPct);
  dom.padding.value = Math.round(opts.paddingPct);
  dom.shadow.checked = opts.shadow;
  dom.glass.checked = opts.glass;
  syncLabels();
}

function close() {
  dom.overlay.classList.remove('open');
}

// ── SVG layer split ─────────────────────────────────────────────────────────
// Brand SVGs in this catalog follow a fixed shape: the first drawn <path> is a
// full-bleed background plate, the rest is the foreground mark. We detect that
// plate (by measuring its bbox against the viewBox), peel it off, and expose the
// foreground separately so the renderer can plate + raise it for depth.
const NON_DRAW = /^(defs|metadata|title|desc|style|symbol|clippath|mask|filter|pattern|lineargradient|radialgradient)$/i;
const drawables = svg => [...svg.children].filter(n => n.tagName && !NON_DRAW.test(n.tagName));

function resolveFill(el) {
  let f = el.getAttribute('fill') ?? (el.style && el.style.fill) ?? '';
  if (!f && el.querySelector) { const c = el.querySelector('[fill]'); if (c) f = c.getAttribute('fill'); }
  f = (f || '').trim();
  return (!f || f === 'none' || /^url\(/i.test(f)) ? null : f;
}

// Returns { full, fg, plate, bgColor } where fg/plate are SVG strings (plate is
// null when no full-bleed background layer is found).
function splitSvgLayers(svgText) {
  let host;
  try {
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const svg = doc.documentElement;
    if (!svg || svg.tagName.toLowerCase() !== 'svg') return { full: svgText, fg: svgText, plate: null, bgColor: null };
    host = document.createElement('div');
    host.style.cssText = 'position:absolute;left:-99999px;top:0;width:0;height:0;overflow:hidden';
    host.appendChild(svg);                 // attach so getBBox() works
    document.body.appendChild(host);
    const vb = parseSvgViewBox(svgText);
    const W = vb ? vb.w : svg.getBBox().width;
    const H = vb ? vb.h : svg.getBBox().height;
    const first = drawables(svg)[0];
    if (!first) return { full: svgText, fg: svgText, plate: null, bgColor: null };
    const bb = first.getBBox();
    const fullBleed = bb.width >= W * 0.9 && bb.height >= H * 0.9 && bb.x <= W * 0.06 && bb.y <= H * 0.06;
    if (!fullBleed) return { full: svgText, fg: svgText, plate: null, bgColor: null };

    const plateSvg = svg.cloneNode(true);
    const fgSvg = svg.cloneNode(true);
    drawables(plateSvg).forEach((n, i) => { if (i !== 0) n.remove(); }); // keep only bg
    const fgFirst = drawables(fgSvg)[0];
    if (fgFirst) fgFirst.remove();                                       // drop bg
    return { full: svgText, fg: fgSvg.outerHTML, plate: plateSvg.outerHTML, bgColor: resolveFill(first) };
  } catch {
    return { full: svgText, fg: svgText, plate: null, bgColor: null };
  } finally {
    if (host && host.parentNode) host.parentNode.removeChild(host);
  }
}

// Load a logo file into a render source: the full image plus, for layered SVGs,
// a separate foreground image + background plate image + detected plate colour.
async function prepareSource(file) {
  if (/\.png(\?|$)/i.test(file)) {
    const { img, aspect } = await pngToImage(svgUrl(file));
    return { full: img, fg: img, plate: null, bgColor: null, hasLayers: false, aspect };
  }
  const rawSvg = await loadRawSvg(file);
  if (!rawSvg) throw new Error('no svg');
  const s = splitSvgLayers(applyColorMap(rawSvg));
  const full = await svgToImage(s.full);
  const fg = s.plate ? await svgToImage(s.fg) : full;
  const plate = s.plate ? (await svgToImage(s.plate)).img : null;
  return { full: full.img, fg: fg.img, plate, bgColor: s.bgColor, hasLayers: !!s.plate, aspect: full.aspect };
}

// Encode the full .icns from a render source at the given settings.
async function encodeIcnsFrom(src, o) {
  const bySize = new Map();
  for (const size of ICNS_SIZES) {
    bySize.set(size, await canvasToPngBuffer(renderIcon(src, size, o)));
  }
  return encodeIcns(bySize);
}

// Current modal state → buffer. Shared by the download button and the live size readout.
function buildIcnsBuffer() {
  return encodeIcnsFrom(source, opts);
}

// Default-settings .icns for any file — used by the "Скачать все" ZIP bundle.
export async function buildIcnsForFile(file) {
  const src = await prepareSource(file);
  // PNG logos don't get the glass treatment (can't be split into layers).
  const o = { ...defaultsFor(file), glass: !/\.png(\?|$)/i.test(file) };
  return encodeIcnsFrom(src, o);
}

let sizeBusy = false;   // a buffer build is in flight
let sizeDirty = false;  // settings changed while a build was running
// Live size readout. No debounce: while one build runs, further changes just mark
// the result stale, and we immediately rebuild once it finishes — so the figure
// keeps up with the slider as fast as the machine can encode, without queuing up.
async function scheduleSize() {
  if (!source) { dom.dlSize.textContent = ''; return; }
  if (sizeBusy) { sizeDirty = true; return; }
  sizeBusy = true;
  do {
    sizeDirty = false;
    try {
      const buffer = await buildIcnsBuffer();
      dom.dlSize.textContent = formatFileSize(buffer.byteLength);
    } catch { /* leave the previous value */ }
  } while (sizeDirty && source);
  sizeBusy = false;
}

async function doDownload() {
  if (!source) return;
  dom.download.disabled = true;
  dom.dlLabel.textContent = 'Готовлю…';
  try {
    const buffer = await buildIcnsBuffer();
    // name after the actual file so variants don't all collapse to one filename
    const name = (source.file || source.item.file).replace(/^.*\//, '').replace(/\.[^.]+$/, '').toLowerCase();
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([buffer], { type: 'image/icns' })),
      download: name + '.icns',
    });
    a.click();
    URL.revokeObjectURL(a.href);
    showToast(TOASTS.downloaded(name + '.icns'));
    close();
  } catch (err) {
    showToast(TOASTS.icnsError);
  } finally {
    dom.download.disabled = false;
    dom.dlLabel.textContent = LABELS.dlIcns;
  }
}

export async function openIcnsModal(item, file = item.file) {
  if (!dom) buildDom();
  // PNG logos can't be split into glass layers — hide the toggle and force it off.
  const isPng = /\.png(\?|$)/i.test(file);
  dom.glassRow.classList.toggle('hidden', isPng);
  sessionDefaults = { ...defaultsFor(file), glass: isPng ? false : DEFAULTS.glass };
  Object.assign(opts, sessionDefaults);
  // move the "default" notch to this logo's default rounding
  dom.radius.style.setProperty('--tickx', `calc(8px + ${sessionDefaults.radiusPct / 100} * (100% - 16px))`);
  syncControls();
  source = null;            // drop the previous logo so a slow/failed load can't show it
  renderPreview();          // clear the canvas to just the neighbours
  dom.overlay.classList.add('open');

  try {
    source = { ...(await prepareSource(file)), item, file };
    // Liquid Glass is on by default; the plate colour comes automatically from the
    // logo's own background layer (or white when it has none).
    syncControls();
    renderPreview();
  } catch {
    showToast(TOASTS.imageLoadError);
    close();
  }
}
