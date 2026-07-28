// SVG → vector scene parser, shared by the PDF/AI/EPS writers in format-export.js.
// Walks the SVG DOM, bakes every transform into absolute (pre-flip) viewBox-space
// coordinates, and resolves fill/stroke (solid or gradient) into a flat shape list.
// Text, embedded raster <image>, filters and CSS <style> blocks are not supported —
// none of the current logo assets use them (all colors arrive pre-normalized to hex
// by color.js, and no asset in assets/logos/svgs has a <style> block).

function matMul(a, b) {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}
const IDENTITY = [1, 0, 0, 1, 0, 0];
function applyMat(m, x, y) {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

function parseTransform(str) {
  if (!str) return IDENTITY;
  let m = IDENTITY;
  const re = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g;
  let match;
  while ((match = re.exec(str))) {
    const args = match[2].trim().split(/[\s,]+/).filter(Boolean).map(Number);
    let t = IDENTITY;
    switch (match[1]) {
      case 'matrix': if (args.length === 6) t = args; break;
      case 'translate': t = [1, 0, 0, 1, args[0] || 0, args[1] || 0]; break;
      case 'scale': { const sx = args[0] ?? 1; const sy = args.length > 1 ? args[1] : sx; t = [sx, 0, 0, sy, 0, 0]; break; }
      case 'rotate': {
        const rad = (args[0] || 0) * Math.PI / 180;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        const rot = [cos, sin, -sin, cos, 0, 0];
        if (args.length >= 3) {
          const [, , cx, cy] = args;
          t = matMul(matMul([1, 0, 0, 1, cx, cy], rot), [1, 0, 0, 1, -cx, -cy]);
        } else t = rot;
        break;
      }
      case 'skewX': t = [1, 0, Math.tan((args[0] || 0) * Math.PI / 180), 1, 0, 0]; break;
      case 'skewY': t = [1, Math.tan((args[0] || 0) * Math.PI / 180), 0, 1, 0, 0]; break;
    }
    m = matMul(m, t);
  }
  return m;
}

// ---- path 'd' parsing -------------------------------------------------

function tokenizePathNumbers(str) {
  const nums = [];
  const re = /[-+]?(?:\d+\.\d+|\.\d+|\d+)(?:[eE][-+]?\d+)?/g;
  let m;
  while ((m = re.exec(str))) nums.push(+m[0]);
  return nums;
}

// Arc (endpoint parameterization) -> up to 4 cubic beziers, relative to current point.
function arcToCubics(x0, y0, rx, ry, xAxisRotDeg, largeArc, sweep, x, y) {
  if (rx === 0 || ry === 0) return [{ x1: x0, y1: y0, x2: x, y2: y, x, y }];
  rx = Math.abs(rx); ry = Math.abs(ry);
  const phi = xAxisRotDeg * Math.PI / 180;
  const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);
  const dx2 = (x0 - x) / 2, dy2 = (y0 - y) / 2;
  const x1p = cosPhi * dx2 + sinPhi * dy2;
  const y1p = -sinPhi * dx2 + cosPhi * dy2;
  let rxSq = rx * rx, rySq = ry * ry;
  const x1pSq = x1p * x1p, y1pSq = y1p * y1p;
  const radiiCheck = x1pSq / rxSq + y1pSq / rySq;
  if (radiiCheck > 1) {
    const s = Math.sqrt(radiiCheck);
    rx *= s; ry *= s; rxSq = rx * rx; rySq = ry * ry;
  }
  const sign = largeArc !== sweep ? 1 : -1;
  let sq = (rxSq * rySq - rxSq * y1pSq - rySq * x1pSq) / (rxSq * y1pSq + rySq * x1pSq);
  sq = sq < 0 ? 0 : sq;
  const coef = sign * Math.sqrt(sq);
  const cxp = coef * (rx * y1p / ry);
  const cyp = coef * -(ry * x1p / rx);
  const cx = cosPhi * cxp - sinPhi * cyp + (x0 + x) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y0 + y) / 2;

  const angle = (ux, uy, vx, vy) => {
    const sgn = ux * vy - uy * vx < 0 ? -1 : 1;
    let dot = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy));
    dot = Math.min(1, Math.max(-1, dot));
    return sgn * Math.acos(dot);
  };
  const theta1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dTheta = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && dTheta > 0) dTheta -= 2 * Math.PI;
  if (sweep && dTheta < 0) dTheta += 2 * Math.PI;

  const segCount = Math.max(1, Math.ceil(Math.abs(dTheta) / (Math.PI / 2)));
  const delta = dTheta / segCount;
  const t = 4 / 3 * Math.tan(delta / 4);
  const segs = [];
  let theta = theta1;
  for (let i = 0; i < segCount; i++) {
    const thetaNext = theta + delta;
    const cosT = Math.cos(theta), sinT = Math.sin(theta);
    const cosTN = Math.cos(thetaNext), sinTN = Math.sin(thetaNext);
    const p1x = cx + rx * cosT * cosPhi - ry * sinT * sinPhi;
    const p1y = cy + rx * cosT * sinPhi + ry * sinT * cosPhi;
    const p2x = cx + rx * cosTN * cosPhi - ry * sinTN * sinPhi;
    const p2y = cy + rx * cosTN * sinPhi + ry * sinTN * cosPhi;
    const c1x = p1x - t * (rx * sinT * cosPhi + ry * cosT * sinPhi);
    const c1y = p1y - t * (rx * sinT * sinPhi - ry * cosT * cosPhi);
    const c2x = p2x + t * (rx * sinTN * cosPhi + ry * cosTN * sinPhi);
    const c2y = p2y + t * (rx * sinTN * sinPhi - ry * cosTN * cosPhi);
    segs.push({ x1: c1x, y1: c1y, x2: c2x, y2: c2y, x: p2x, y: p2y });
    theta = thetaNext;
  }
  return segs;
}

// The 'A' flag digits (large-arc-flag, sweep-flag) are single 0/1 characters and may
// run together with no separator ("...0 01 5 5..."). tokenizePathNumbers's generic
// number regex would incorrectly merge "01" into one token, so 'A'/'a' segments are
// re-tokenized with a dedicated reader.
function reparseArcArgs(argStr) {
  const out = [];
  let i = 0; const s = argStr;
  const numRe = /[-+]?(?:\d+\.\d+|\.\d+|\d+)(?:[eE][-+]?\d+)?/y;
  const skipSep = () => { while (i < s.length && /[\s,]/.test(s[i])) i++; };
  const readNum = () => { skipSep(); numRe.lastIndex = i; const m = numRe.exec(s); if (!m) return null; i = numRe.lastIndex; return +m[0]; };
  const readFlag = () => { skipSep(); if (i >= s.length) return null; const c = s[i]; if (c !== '0' && c !== '1') return null; i++; return +c; };
  while (true) {
    const rx = readNum(); if (rx === null) break;
    const ry = readNum(); const rot = readNum();
    const laf = readFlag(); const swf = readFlag();
    const ex = readNum(); const ey = readNum();
    if ([ry, rot, laf, swf, ex, ey].some(v => v === null)) break;
    out.push(rx, ry, rot, laf, swf, ex, ey);
  }
  return out;
}

// Parses an SVG path 'd' string into subpaths of {type:'L'|'C', ...} segments —
// PDF/PostScript both support cubic Beziers natively, so curves stay exact (no
// flattening); only elliptical arcs ('A') are converted to cubic approximations.
function parsePathD(d) {
  // Pre-split by command letters, re-tokenizing 'A'/'a' argument runs specially.
  const parts = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  let m;
  while ((m = re.exec(d))) parts.push([m[1], m[2]]);

  let x = 0, y = 0, startX = 0, startY = 0, lastCmd = '', lastCX, lastCY, lastQX, lastQY;
  const subpaths = [];
  let cur = null;
  const newSub = () => { cur = { closed: false, start: { x, y }, segs: [] }; subpaths.push(cur); };

  for (const [cmdChar, argStr] of parts) {
    let cmd = cmdChar;
    if (cmd === 'M' || cmd === 'm') {
      const nums = tokenizePathNumbers(argStr);
      for (let i = 0; i < nums.length; i += 2) {
        if (cmd === 'm') { x += nums[i]; y += nums[i + 1]; } else { x = nums[i]; y = nums[i + 1]; }
        if (i === 0) { newSub(); startX = x; startY = y; } else { cur.segs.push({ type: 'L', x, y }); }
      }
      lastCmd = cmdChar;
      continue;
    }
    if (cmd === 'Z' || cmd === 'z') {
      if (cur) { cur.closed = true; x = startX; y = startY; }
      lastCmd = cmd;
      continue;
    }
    if (!cur) newSub();
    const rel = cmd === cmd.toLowerCase();
    const upper = cmd.toUpperCase();
    if (upper === 'A') {
      const nums = reparseArcArgs(argStr);
      for (let i = 0; i + 7 <= nums.length; i += 7) {
        let [rx, ry, rot, laf, swf, ex, ey] = nums.slice(i, i + 7);
        ex = rel ? x + ex : ex; ey = rel ? y + ey : ey;
        for (const seg of arcToCubics(x, y, rx, ry, rot, !!laf, !!swf, ex, ey)) {
          cur.segs.push({ type: 'C', x1: seg.x1, y1: seg.y1, x2: seg.x2, y2: seg.y2, x: seg.x, y: seg.y });
        }
        x = ex; y = ey;
      }
      lastCmd = cmdChar;
      continue;
    }
    const nums = tokenizePathNumbers(argStr);
    const arity = { L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2 }[upper];
    for (let i = 0; i + arity <= nums.length; i += arity) {
      const a = nums.slice(i, i + arity);
      if (upper === 'L') {
        const nx = rel ? x + a[0] : a[0], ny = rel ? y + a[1] : a[1];
        cur.segs.push({ type: 'L', x: nx, y: ny }); x = nx; y = ny;
      } else if (upper === 'H') {
        const nx = rel ? x + a[0] : a[0];
        cur.segs.push({ type: 'L', x: nx, y }); x = nx;
      } else if (upper === 'V') {
        const ny = rel ? y + a[0] : a[0];
        cur.segs.push({ type: 'L', x, y: ny }); y = ny;
      } else if (upper === 'C') {
        const x1 = rel ? x + a[0] : a[0], y1 = rel ? y + a[1] : a[1];
        const x2 = rel ? x + a[2] : a[2], y2 = rel ? y + a[3] : a[3];
        const nx = rel ? x + a[4] : a[4], ny = rel ? y + a[5] : a[5];
        cur.segs.push({ type: 'C', x1, y1, x2, y2, x: nx, y: ny });
        lastCX = x2; lastCY = y2; x = nx; y = ny;
      } else if (upper === 'S') {
        const rx1 = (lastCmd && /[CcSs]/.test(lastCmd)) ? 2 * x - lastCX : x;
        const ry1 = (lastCmd && /[CcSs]/.test(lastCmd)) ? 2 * y - lastCY : y;
        const x2 = rel ? x + a[0] : a[0], y2 = rel ? y + a[1] : a[1];
        const nx = rel ? x + a[2] : a[2], ny = rel ? y + a[3] : a[3];
        cur.segs.push({ type: 'C', x1: rx1, y1: ry1, x2, y2, x: nx, y: ny });
        lastCX = x2; lastCY = y2; x = nx; y = ny;
      } else if (upper === 'Q') {
        const qx = rel ? x + a[0] : a[0], qy = rel ? y + a[1] : a[1];
        const nx = rel ? x + a[2] : a[2], ny = rel ? y + a[3] : a[3];
        const x1 = x + 2 / 3 * (qx - x), y1 = y + 2 / 3 * (qy - y);
        const x2 = nx + 2 / 3 * (qx - nx), y2 = ny + 2 / 3 * (qy - ny);
        cur.segs.push({ type: 'C', x1, y1, x2, y2, x: nx, y: ny });
        lastQX = qx; lastQY = qy; x = nx; y = ny;
      } else if (upper === 'T') {
        const qx = (lastCmd && /[QqTt]/.test(lastCmd)) ? 2 * x - lastQX : x;
        const qy = (lastCmd && /[QqTt]/.test(lastCmd)) ? 2 * y - lastQY : y;
        const nx = rel ? x + a[0] : a[0], ny = rel ? y + a[1] : a[1];
        const x1 = x + 2 / 3 * (qx - x), y1 = y + 2 / 3 * (qy - y);
        const x2 = nx + 2 / 3 * (qx - nx), y2 = ny + 2 / 3 * (qy - ny);
        cur.segs.push({ type: 'C', x1, y1, x2, y2, x: nx, y: ny });
        lastQX = qx; lastQY = qy; x = nx; y = ny;
      }
      lastCmd = cmdChar;
    }
  }
  return subpaths;
}

// ---- basic shapes -> subpaths ------------------------------------------

function kappaArc(cx, cy, rx, ry) {
  const k = 0.5522847498;
  return [
    { closed: true, segs: [
      { type: 'C', x1: cx + rx, y1: cy - ry * k, x2: cx + rx * k, y2: cy - ry, x: cx, y: cy - ry },
      { type: 'C', x1: cx - rx * k, y1: cy - ry, x2: cx - rx, y2: cy - ry * k, x: cx - rx, y: cy },
      { type: 'C', x1: cx - rx, y1: cy + ry * k, x2: cx - rx * k, y2: cy + ry, x: cx, y: cy + ry },
      { type: 'C', x1: cx + rx * k, y1: cy + ry, x2: cx + rx, y2: cy + ry * k, x: cx + rx, y: cy },
    ], start: { x: cx + rx, y: cy } },
  ];
}

function rectSubpaths(x, y, w, h, rx, ry) {
  if (rx > 0 || ry > 0) {
    rx = Math.min(rx || ry, w / 2); ry = Math.min(ry || rx, h / 2);
    const k = 0.5522847498;
    return [{
      closed: true,
      start: { x: x + rx, y },
      segs: [
        { type: 'L', x: x + w - rx, y },
        { type: 'C', x1: x + w - rx + k * rx, y1: y, x2: x + w, y2: y + ry - k * ry, x: x + w, y: y + ry },
        { type: 'L', x: x + w, y: y + h - ry },
        { type: 'C', x1: x + w, y1: y + h - ry + k * ry, x2: x + w - rx + k * rx, y2: y + h, x: x + w - rx, y: y + h },
        { type: 'L', x: x + rx, y: y + h },
        { type: 'C', x1: x + rx - k * rx, y1: y + h, x2: x, y2: y + h - ry + k * ry, x, y: y + h - ry },
        { type: 'L', x, y: y + ry },
        { type: 'C', x1: x, y1: y + ry - k * ry, x2: x + rx - k * rx, y2: y, x: x + rx, y },
      ],
    }];
  }
  return [{
    closed: true,
    start: { x, y },
    segs: [
      { type: 'L', x: x + w, y },
      { type: 'L', x: x + w, y: y + h },
      { type: 'L', x, y: y + h },
      { type: 'L', x, y },
    ],
  }];
}

function pointsSubpath(str, closed) {
  const nums = tokenizePathNumbers(str);
  const segs = [];
  for (let i = 2; i + 1 < nums.length; i += 2) segs.push({ type: 'L', x: nums[i], y: nums[i + 1] });
  return [{ closed, start: { x: nums[0] || 0, y: nums[1] || 0 }, segs }];
}

function shapeToSubpaths(el) {
  const tag = el.tagName.toLowerCase();
  const num = (name, def = 0) => { const v = el.getAttribute(name); return v === null ? def : parseFloat(v) || 0; };
  if (tag === 'path') {
    const d = el.getAttribute('d');
    return d ? parsePathD(d) : [];
  }
  if (tag === 'rect') {
    const w = num('width'), h = num('height');
    if (w <= 0 || h <= 0) return [];
    return rectSubpaths(num('x'), num('y'), w, h, num('rx', NaN) || 0, num('ry', NaN) || 0);
  }
  if (tag === 'circle') return kappaArc(num('cx'), num('cy'), num('r'), num('r'));
  if (tag === 'ellipse') return kappaArc(num('cx'), num('cy'), num('rx'), num('ry'));
  if (tag === 'line') return [{ closed: false, start: { x: num('x1'), y: num('y1') }, segs: [{ type: 'L', x: num('x2'), y: num('y2') }] }];
  if (tag === 'polyline') return pointsSubpath(el.getAttribute('points') || '', false);
  if (tag === 'polygon') return pointsSubpath(el.getAttribute('points') || '', true);
  return null;
}

// ---- style / color -------------------------------------------------------

function parseInlineStyle(str) {
  const out = {};
  if (!str) return out;
  for (const decl of str.split(';')) {
    const idx = decl.indexOf(':');
    if (idx < 0) continue;
    out[decl.slice(0, idx).trim()] = decl.slice(idx + 1).trim();
  }
  return out;
}

function readProp(el, inline, name) {
  if (inline[name] !== undefined) return inline[name];
  const attr = el.getAttribute(name);
  return attr === null ? undefined : attr;
}

const HEX_RE = /^#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;
function parseHexColor(hex) {
  const m = HEX_RE.exec(hex);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

function parseColorLoose(str) {
  if (!str) return null;
  str = str.trim();
  if (str.startsWith('#')) return parseHexColor(str);
  const rgbM = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(str);
  if (rgbM) return { r: +rgbM[1], g: +rgbM[2], b: +rgbM[3], a: rgbM[4] !== undefined ? +rgbM[4] : 1 };
  if (str === 'black') return { r: 0, g: 0, b: 0, a: 1 };
  if (str === 'white') return { r: 255, g: 255, b: 255, a: 1 };
  return null;
}

function resolveGradientStops(gradEl, defsById, seen = new Set()) {
  if (!gradEl || seen.has(gradEl)) return [];
  seen.add(gradEl);
  const direct = Array.from(gradEl.children).filter(c => c.tagName.toLowerCase() === 'stop');
  if (direct.length) {
    let stops = direct.map(s => {
      const inline = parseInlineStyle(s.getAttribute('style'));
      const offRaw = readProp(s, inline, 'offset') ?? '0';
      let off = parseFloat(offRaw);
      if (offRaw.trim().endsWith('%')) off /= 100;
      const colorStr = readProp(s, inline, 'stop-color') ?? '#000000';
      const opRaw = readProp(s, inline, 'stop-opacity');
      const op = opRaw === undefined ? 1 : parseFloat(opRaw);
      const c = parseColorLoose(colorStr) ?? { r: 0, g: 0, b: 0, a: 1 };
      return { offset: Math.min(1, Math.max(0, off || 0)), r: c.r, g: c.g, b: c.b, a: (c.a ?? 1) * (isNaN(op) ? 1 : op) };
    });
    stops.sort((a, b) => a.offset - b.offset);
    // Nudge equal offsets apart so PDF stitching-function domains stay strictly increasing.
    for (let i = 1; i < stops.length; i++) if (stops[i].offset <= stops[i - 1].offset) stops[i].offset = Math.min(1, stops[i - 1].offset + 1e-4);
    return stops;
  }
  const href = gradEl.getAttribute('href') || gradEl.getAttribute('xlink:href');
  if (href && href.startsWith('#')) return resolveGradientStops(defsById[href.slice(1)], defsById, seen);
  return [];
}

function localBBox(subpaths) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const visit = (x, y) => { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; };
  for (const sp of subpaths) {
    visit(sp.start.x, sp.start.y);
    for (const seg of sp.segs) {
      if (seg.type === 'L') visit(seg.x, seg.y);
      else { visit(seg.x1, seg.y1); visit(seg.x2, seg.y2); visit(seg.x, seg.y); }
    }
  }
  if (!isFinite(minX)) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function resolvePaint(str, style, defsById, localSubpaths, matrix) {
  if (!str || str === 'none') return null;
  str = str.trim();
  if (str === 'currentColor') str = style.color || '#000000';
  const urlM = /^url\(\s*['"]?#([^'")\s]+)['"]?\s*\)/.exec(str);
  if (!urlM) {
    const c = parseColorLoose(str);
    return c ? { type: 'solid', r: c.r, g: c.g, b: c.b, a: c.a } : null;
  }
  const grad = defsById[urlM[1]];
  if (!grad) return null;
  const tag = grad.tagName.toLowerCase();
  if (tag !== 'lineargradient' && tag !== 'radialgradient') return null;
  const stops = resolveGradientStops(grad, defsById);
  if (!stops.length) return null;
  const units = grad.getAttribute('gradientUnits') || 'objectBoundingBox';
  const gradTransform = parseTransform(grad.getAttribute('gradientTransform'));
  const bbox = units === 'objectBoundingBox' ? localBBox(localSubpaths) : null;
  const toLocal = (xAttr, yAttr, defPct) => {
    let vx = grad.getAttribute(xAttr), vy = grad.getAttribute(yAttr);
    const parsePct = (v, def) => { if (v === null) return def; return v.trim().endsWith('%') ? parseFloat(v) / 100 : parseFloat(v); };
    if (units === 'objectBoundingBox') {
      const fx = parsePct(vx, defPct[0]), fy = parsePct(vy, defPct[1]);
      vx = bbox.x + fx * bbox.w; vy = bbox.y + fy * bbox.h;
    } else {
      vx = vx === null ? defPct[0] : parseFloat(vx);
      vy = vy === null ? defPct[1] : parseFloat(vy);
    }
    const [gx, gy] = applyMat(gradTransform, vx, vy);
    return applyMat(matrix, gx, gy);
  };
  if (tag === 'lineargradient') {
    const [x1, y1] = toLocal('x1', 'y1', [0, 0]);
    const [x2, y2] = toLocal('x2', 'y2', [1, 0]);
    return { type: 'linear', x1, y1, x2, y2, stops };
  }
  const parsePctR = (v, def) => { if (v === null) return def; return v.trim().endsWith('%') ? parseFloat(v) / 100 : parseFloat(v); };
  let cx = grad.getAttribute('cx'), cy = grad.getAttribute('cy'), r = grad.getAttribute('r');
  let fx = grad.getAttribute('fx'), fy = grad.getAttribute('fy');
  const cxF = parsePctR(cx, 0.5), cyF = parsePctR(cy, 0.5), rF = parsePctR(r, 0.5);
  const fxF = fx === null ? cxF : parsePctR(fx, cxF), fyF = fy === null ? cyF : parsePctR(fy, cyF);
  let ccx, ccy, ffx, ffy, rr;
  if (units === 'objectBoundingBox') {
    ccx = bbox.x + cxF * bbox.w; ccy = bbox.y + cyF * bbox.h;
    ffx = bbox.x + fxF * bbox.w; ffy = bbox.y + fyF * bbox.h;
    rr = rF * Math.max(bbox.w, bbox.h);
  } else {
    ccx = cxF; ccy = cyF; ffx = fxF; ffy = fyF; rr = rF;
  }
  const [gcx, gcy] = applyMat(gradTransform, ccx, ccy);
  const [gfx, gfy] = applyMat(gradTransform, ffx, ffy);
  const [pcx, pcy] = applyMat(matrix, gcx, gcy);
  const [pfx, pfy] = applyMat(matrix, gfx, gfy);
  const scale = Math.hypot(matrix[0], matrix[1]);
  return { type: 'radial', cx: pcx, cy: pcy, r: rr * scale, fx: pfx, fy: pfy, stops };
}

// ---- main walk -------------------------------------------------------

const SKIP_TAGS = new Set(['defs', 'symbol', 'title', 'desc', 'metadata', 'style', 'clippath', 'lineargradient', 'radialgradient', 'mask', 'filter']);
const CONTAINER_TAGS = new Set(['g', 'svg', 'a', 'switch']);
const SHAPE_TAGS = new Set(['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon']);

export function parseSvgToScene(svgText) {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const svgEl = doc.documentElement;
  if (!svgEl || svgEl.tagName.toLowerCase() !== 'svg' || svgEl.querySelector('parsererror')) return null;

  const vbAttr = svgEl.getAttribute('viewBox');
  let vb;
  if (vbAttr) {
    const p = vbAttr.trim().split(/[\s,]+/).map(Number);
    vb = { x: p[0] || 0, y: p[1] || 0, w: p[2], h: p[3] };
  } else {
    const w = parseFloat(svgEl.getAttribute('width')) || 100;
    const h = parseFloat(svgEl.getAttribute('height')) || 100;
    vb = { x: 0, y: 0, w, h };
  }
  if (!vb.w || !vb.h) return null;

  const defsById = {};
  doc.querySelectorAll('[id]').forEach(el => { defsById[el.id] = el; });

  const shapes = [];
  const rootMatrix = [1, 0, 0, 1, -vb.x, -vb.y];

  const DEFAULT_STYLE = {
    fill: '#000000', stroke: 'none', strokeWidth: '1', fillOpacity: '1', strokeOpacity: '1',
    opacity: '1', fillRule: 'nonzero', strokeLinecap: 'butt', strokeLinejoin: 'miter',
    strokeDasharray: 'none', color: null, visibility: 'visible', clipPath: 'none',
  };

  function inheritStyle(parent, el) {
    const inline = parseInlineStyle(el.getAttribute('style'));
    const get = (attr, key) => readProp(el, inline, attr) ?? parent[key];
    return {
      fill: get('fill', 'fill'),
      stroke: get('stroke', 'stroke'),
      strokeWidth: get('stroke-width', 'strokeWidth'),
      fillOpacity: get('fill-opacity', 'fillOpacity'),
      strokeOpacity: get('stroke-opacity', 'strokeOpacity'),
      opacity: readProp(el, inline, 'opacity') ?? '1',
      fillRule: get('fill-rule', 'fillRule'),
      strokeLinecap: get('stroke-linecap', 'strokeLinecap'),
      strokeLinejoin: get('stroke-linejoin', 'strokeLinejoin'),
      strokeDasharray: get('stroke-dasharray', 'strokeDasharray'),
      color: get('color', 'color'),
      visibility: get('visibility', 'visibility'),
      clipPath: readProp(el, inline, 'clip-path') ?? 'none',
      display: readProp(el, inline, 'display'),
    };
  }

  function resolveClip(clipPathVal, matrix) {
    const m = /^url\(\s*['"]?#([^'")\s]+)['"]?\s*\)/.exec(clipPathVal || '');
    if (!m) return null;
    const clipEl = defsById[m[1]];
    if (!clipEl) return null;
    const clipMatrix = matMul(matrix, parseTransform(clipEl.getAttribute('transform')));
    const subpaths = [];
    for (const child of Array.from(clipEl.children)) {
      const local = shapeToSubpaths(child);
      if (!local) continue;
      for (const sp of local) subpaths.push(transformSubpath(sp, clipMatrix));
    }
    return subpaths.length ? subpaths : null;
  }

  function transformSubpath(sp, matrix) {
    const [sx, sy] = applyMat(matrix, sp.start.x, sp.start.y);
    const segs = sp.segs.map(seg => {
      if (seg.type === 'L') { const [x, y] = applyMat(matrix, seg.x, seg.y); return { type: 'L', x, y }; }
      const [x1, y1] = applyMat(matrix, seg.x1, seg.y1);
      const [x2, y2] = applyMat(matrix, seg.x2, seg.y2);
      const [x, y] = applyMat(matrix, seg.x, seg.y);
      return { type: 'C', x1, y1, x2, y2, x, y };
    });
    return { closed: sp.closed, start: { x: sx, y: sy }, segs };
  }

  function walk(el, matrix, parentStyle, clips) {
    const tag = el.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) return;
    const style = inheritStyle(parentStyle, el);
    if (style.display === 'none') return;
    const ownMatrix = matMul(matrix, parseTransform(el.getAttribute('transform')));
    let activeClips = clips;
    if (style.clipPath && style.clipPath !== 'none') {
      const clipShape = resolveClip(style.clipPath, ownMatrix);
      if (clipShape) activeClips = clips ? clips.concat([clipShape]) : [clipShape];
    }

    if (tag === 'use') {
      const href = el.getAttribute('href') || el.getAttribute('xlink:href');
      if (!href || !href.startsWith('#')) return;
      const target = defsById[href.slice(1)];
      if (!target) return;
      const ux = parseFloat(el.getAttribute('x')) || 0, uy = parseFloat(el.getAttribute('y')) || 0;
      const useMatrix = matMul(ownMatrix, [1, 0, 0, 1, ux, uy]);
      walk(target, useMatrix, style, activeClips);
      return;
    }

    if (CONTAINER_TAGS.has(tag)) {
      for (const child of Array.from(el.children)) walk(child, ownMatrix, style, activeClips);
      return;
    }

    if (!SHAPE_TAGS.has(tag)) return;
    const localSubpaths = shapeToSubpaths(el);
    if (!localSubpaths || !localSubpaths.length) return;
    if (style.visibility === 'hidden') return;

    const opacity = parseFloat(style.opacity); const opac = isNaN(opacity) ? 1 : opacity;
    const fillOp = (isNaN(parseFloat(style.fillOpacity)) ? 1 : parseFloat(style.fillOpacity)) * opac;
    const strokeOp = (isNaN(parseFloat(style.strokeOpacity)) ? 1 : parseFloat(style.strokeOpacity)) * opac;

    let fillPaint = resolvePaint(style.fill, style, defsById, localSubpaths, ownMatrix);
    if (fillPaint) {
      if (fillPaint.type === 'solid') fillPaint.a *= fillOp;
      else fillPaint.stops = fillPaint.stops.map(s => ({ ...s, a: s.a * fillOp }));
    }
    let strokePaint = resolvePaint(style.stroke, style, defsById, localSubpaths, ownMatrix);
    if (strokePaint) {
      if (strokePaint.type === 'solid') strokePaint.a *= strokeOp;
      else strokePaint.stops = strokePaint.stops.map(s => ({ ...s, a: s.a * strokeOp }));
    }
    if (!fillPaint && !strokePaint) return;

    const scale = Math.hypot(ownMatrix[0], ownMatrix[1]);
    const strokeWidth = (parseFloat(style.strokeWidth) || 0) * scale;
    const subpaths = localSubpaths.map(sp => transformSubpath(sp, ownMatrix));

    shapes.push({
      subpaths,
      fillPaint, strokePaint,
      fillRule: style.fillRule === 'evenodd' ? 'evenodd' : 'nonzero',
      strokeWidth, strokeLinecap: style.strokeLinecap, strokeLinejoin: style.strokeLinejoin,
      clips: activeClips,
    });
  }

  for (const child of Array.from(svgEl.children)) walk(child, rootMatrix, DEFAULT_STYLE, null);

  return { width: vb.w, height: vb.h, shapes };
}
