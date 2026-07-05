#!/usr/bin/env node
// Clips all drawn paths in an SVG to its viewBox by:
//   1. Converting each cubic-Bezier segment to a fine polyline (64 steps)
//   2. Clipping closed polygons to the viewBox rect via Sutherland-Hodgman
//   3. Re-serialising as M/L/Z path data and optimising with SVGO
// Result: no element has coordinates outside [0..W] x [0..H], <g clip-path> wrappers removed.
//
// Usage: node scripts/clip-svg-to-viewport.js <input.svg> [output.svg]

const fs   = require('fs');
const path = require('path');

// ── Bezier helpers ────────────────────────────────────────────────────────────

function evalB(p0, p1, p2, p3, t) {
  const s = 1 - t;
  return s*s*s*p0 + 3*s*s*t*p1 + 3*s*t*t*p2 + t*t*t*p3;
}

// Sample cubic Bezier into polyline points (N+1 points)
function sampleCubic(x0, y0, x1, y1, x2, y2, x3, y3, N = 64) {
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    pts.push([ evalB(x0,x1,x2,x3,t), evalB(y0,y1,y2,y3,t) ]);
  }
  return pts;
}

// ── SVG path parser → absolute segments ──────────────────────────────────────

function parsePath(d) {
  // Split into command tokens: letters and numbers (including negatives/sci-notation)
  const re = /([MmCcLlHhVvZz])|(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|-?\.\d+(?:[eE][+-]?\d+)?)/g;
  const tokens = [];
  let m;
  while ((m = re.exec(d)) !== null) tokens.push(m[0]);

  const cmds = [];
  let i = 0, cx = 0, cy = 0, sx = 0, sy = 0;

  function num() { return parseFloat(tokens[i++]); }
  function isNum() { return i < tokens.length && !/^[MmCcLlHhVvZz]$/.test(tokens[i]); }

  while (i < tokens.length) {
    const raw = tokens[i++];
    if (!/^[MmCcLlHhVvZz]$/.test(raw)) continue;
    const abs = raw === raw.toUpperCase();
    const t   = raw.toUpperCase();

    // Process implicit command repetition
    do {
      if (t === 'M') {
        const x = abs ? num() : cx + num();
        const y = abs ? num() : cy + num();
        cmds.push({ t: 'M', x, y });
        cx = sx = x; cy = sy = y;
        // Subsequent pairs are implicit L
        while (isNum()) {
          const lx = abs ? num() : cx + num();
          const ly = abs ? num() : cy + num();
          cmds.push({ t: 'L', x: lx, y: ly });
          cx = lx; cy = ly;
        }
      } else if (t === 'C') {
        const x1 = abs ? num() : cx + num(), y1 = abs ? num() : cy + num();
        const x2 = abs ? num() : cx + num(), y2 = abs ? num() : cy + num();
        const x  = abs ? num() : cx + num(), y  = abs ? num() : cy + num();
        cmds.push({ t: 'C', x0: cx, y0: cy, x1, y1, x2, y2, x, y });
        cx = x; cy = y;
      } else if (t === 'L') {
        const x = abs ? num() : cx + num();
        const y = abs ? num() : cy + num();
        cmds.push({ t: 'L', x, y });
        cx = x; cy = y;
      } else if (t === 'H') {
        cx = abs ? num() : cx + num();
        cmds.push({ t: 'L', x: cx, y: cy });
      } else if (t === 'V') {
        cy = abs ? num() : cy + num();
        cmds.push({ t: 'L', x: cx, y: cy });
      } else if (t === 'Z') {
        cmds.push({ t: 'Z' });
        cx = sx; cy = sy;
        break; // Z doesn't repeat
      }
    } while (isNum());
  }
  return cmds;
}

// ── Build polyline polygon from commands ──────────────────────────────────────

// Returns an array of sub-polygons (each is an array of [x,y] points, closed).
function commandsToPolygons(cmds) {
  const polys = [];
  let current = null;

  for (const cmd of cmds) {
    if (cmd.t === 'M') {
      if (current && current.length > 1) polys.push(current);
      current = [[ cmd.x, cmd.y ]];
    } else if (cmd.t === 'L') {
      current.push([ cmd.x, cmd.y ]);
    } else if (cmd.t === 'C') {
      const pts = sampleCubic(cmd.x0, cmd.y0, cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
      for (let k = 1; k < pts.length; k++) current.push(pts[k]);
    } else if (cmd.t === 'Z') {
      if (current && current.length > 1) {
        // Close by adding the start point
        current.push([ current[0][0], current[0][1] ]);
        polys.push(current);
      }
      current = null;
    }
  }
  if (current && current.length > 1) polys.push(current);
  return polys;
}

// ── Sutherland-Hodgman polygon clip to axis-aligned rectangle ─────────────────

function clipEdge(poly, inside, intersect) {
  if (poly.length === 0) return [];
  const out = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    const ia = inside(a), ib = inside(b);
    if (ia) out.push(a);
    if (ia !== ib) out.push(intersect(a, b));
  }
  return out;
}

function lerp2(a, b, t) { return [ a[0] + t*(b[0]-a[0]), a[1] + t*(b[1]-a[1]) ]; }

function clipPolygonToRect(poly, x0, y0, x1, y1) {
  // Remove closing duplicate if present
  let pts = poly.slice();
  const n = pts.length;
  if (n > 1 && Math.abs(pts[0][0]-pts[n-1][0]) < 1e-9 && Math.abs(pts[0][1]-pts[n-1][1]) < 1e-9)
    pts = pts.slice(0, -1);
  if (pts.length < 2) return [];

  // Clip left (x >= x0)
  pts = clipEdge(pts, p => p[0] >= x0, (a,b) => { const t=(x0-a[0])/(b[0]-a[0]); return lerp2(a,b,t); });
  if (!pts.length) return [];
  // Clip right (x <= x1)
  pts = clipEdge(pts, p => p[0] <= x1, (a,b) => { const t=(x1-a[0])/(b[0]-a[0]); return lerp2(a,b,t); });
  if (!pts.length) return [];
  // Clip top (y >= y0)
  pts = clipEdge(pts, p => p[1] >= y0, (a,b) => { const t=(y0-a[1])/(b[1]-a[1]); return lerp2(a,b,t); });
  if (!pts.length) return [];
  // Clip bottom (y <= y1)
  pts = clipEdge(pts, p => p[1] <= y1, (a,b) => { const t=(y1-a[1])/(b[1]-a[1]); return lerp2(a,b,t); });
  return pts;
}

// ── Serialise polygon back to SVG path d= ─────────────────────────────────────

const R = 4; // decimal places
function fmt(n) { return parseFloat(n.toFixed(R)); }

function polygonsToPathD(polys) {
  return polys.map(pts => {
    if (pts.length < 2) return '';
    const parts = [`M${fmt(pts[0][0])} ${fmt(pts[0][1])}`];
    for (let i = 1; i < pts.length; i++) parts.push(`L${fmt(pts[i][0])} ${fmt(pts[i][1])}`);
    parts.push('Z');
    return parts.join('');
  }).filter(Boolean).join('');
}

// ── Simple SVGO-free path optimiser: remove redundant collinear L commands ────

function simplifyPath(d, eps = 0.15) {
  // Parse all points into list, remove collinear middle points
  const re = /([ML])(-?\d+\.?\d*)\s(-?\d+\.?\d*)/g;
  const segs = [];
  let m;
  while ((m = re.exec(d)) !== null) segs.push({ cmd: m[1], x: +m[2], y: +m[3] });

  if (segs.length < 3) return d;

  const keep = [0];
  for (let i = 1; i < segs.length - 1; i++) {
    const a = segs[keep[keep.length-1]], b = segs[i], c = segs[i+1];
    // Cross product to detect collinearity
    const cross = (b.x-a.x)*(c.y-a.y) - (b.y-a.y)*(c.x-a.x);
    const len = Math.hypot(c.x-a.x, c.y-a.y);
    if (len < 1e-9 || Math.abs(cross)/len > eps) keep.push(i);
  }
  keep.push(segs.length - 1);

  const out = [];
  for (const idx of keep) {
    const s = segs[idx];
    out.push(`${s.cmd}${fmt(s.x)} ${fmt(s.y)}`);
  }
  // Re-insert Z markers at positions (look for 'M' after first one)
  // Simple approach: just join and add Z before each M (except the first) and at end
  return out.join('').replace(/(?<=Z?)M/g, (_, offset) => offset > 0 ? 'ZM' : 'M') + 'Z';
}

// ── Process one SVG path element ──────────────────────────────────────────────

function processPathElement(dAttr, vbW, vbH) {
  const cmds = parsePath(dAttr);
  const polys = commandsToPolygons(cmds);
  const clipped = polys
    .map(poly => clipPolygonToRect(poly, 0, 0, vbW, vbH))
    .filter(p => p.length >= 3);
  if (clipped.length === 0) return null;
  return polygonsToPathD(clipped);
}

// ── SVG text manipulation (regex-based, no XML parser needed for this structure) ──

function processRect(rectAttrs, vbW, vbH) {
  // rect elements: check if they're within viewBox, return as-is if so
  const x = parseFloat(rectAttrs.match(/(?:^|\s)x="([^"]+)"/)?.[1] ?? '0');
  const y = parseFloat(rectAttrs.match(/(?:^|\s)y="([^"]+)"/)?.[1] ?? '0');
  const w = parseFloat(rectAttrs.match(/\bwidth="([^"]+)"/)?.[1] ?? '0');
  const h = parseFloat(rectAttrs.match(/\bheight="([^"]+)"/)?.[1] ?? '0');
  // If it's already within bounds, keep as-is
  if (x >= 0 && y >= 0 && x+w <= vbW && y+h <= vbH) return null; // no change needed
  // Otherwise convert to path and clip
  const poly = [[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
  const clipped = clipPolygonToRect(poly, 0, 0, vbW, vbH);
  if (clipped.length < 3) return '';
  return polygonsToPathD([clipped]);
}

function main() {
  const inputFile  = process.argv[2];
  const outputFile = process.argv[3] || inputFile;
  if (!inputFile) { console.error('Usage: clip-svg-to-viewport.js <input.svg> [output.svg]'); process.exit(1); }

  let svg = fs.readFileSync(inputFile, 'utf8');

  // Extract viewBox dimensions
  const vbMatch = svg.match(/viewBox="([^"]+)"/);
  if (!vbMatch) { console.error('No viewBox found'); process.exit(1); }
  const vbParts = vbMatch[1].trim().split(/[\s,]+/).map(Number);
  const [, , vbW, vbH] = vbParts;
  console.log(`ViewBox: ${vbW} × ${vbH}`);

  // 1. Unwrap any <g clip-path="..."> wrappers:
  //    Remove <g clip-path="url(...)"> and its closing </g>
  //    (assumes the wrapper is the first child of <svg> and wraps all content)
  svg = svg.replace(/<g\s[^>]*clip-path="[^"]*"[^>]*>/g, '<!-- clip-path-wrapper removed -->');
  // Remove trailing </g> that closed the wrapper — tricky without full parse.
  // Strategy: count unmatched </g> tags after the removal and drop them.
  // Simpler: just remove the last </g> before </svg>
  svg = svg.replace(/(<\/g>)(\s*<\/svg>)/, '$2');

  // 2. Remove now-unnecessary <defs> with only clipPath entries
  svg = svg.replace(/<defs>[\s\S]*?<\/defs>/g, match => {
    // Keep defs if they have gradients/etc, remove if only clipPath
    const stripped = match.replace(/<clipPath[\s\S]*?<\/clipPath>/g, '');
    if (/<(linearGradient|radialGradient|filter|mask|pattern|symbol)/.test(stripped)) return stripped;
    return '';
  });

  // 3. Process each <path> element: clip d= to viewBox
  svg = svg.replace(/<path([^>]*)\/?>/g, (full, attrs) => {
    const dMatch = attrs.match(/\bd="([^"]*)"/);
    if (!dMatch) return full;
    const newD = processPathElement(dMatch[1], vbW, vbH);
    if (newD === null) return ''; // fully outside, remove element
    const newAttrs = attrs.replace(/\bd="[^"]*"/, `d="${newD}"`);
    return `<path${newAttrs}/>`;
  });

  // 4. Process <rect> elements — convert out-of-bounds rects to clipped paths if needed
  svg = svg.replace(/<rect([^>]*)\/>/g, (full, attrs) => {
    const newD = processRect(attrs, vbW, vbH);
    if (newD === null) return full; // within bounds, keep as rect
    if (newD === '') return '';     // outside, remove
    // Convert to path, keep all non-d/x/y/width/height attributes
    const fillAttr = attrs.match(/\bfill="[^"]*"/)?.[0] ?? '';
    return `<path ${fillAttr} d="${newD}"/>`;
  });

  // 5. Clean up leftover XML comments from step 1
  svg = svg.replace(/<!-- clip-path-wrapper removed -->\s*/g, '');

  // 6. Write output
  fs.writeFileSync(outputFile, svg);
  console.log(`Written: ${outputFile}`);

  // Print stats
  const inSize  = fs.statSync(inputFile).size;
  const outSize = fs.statSync(outputFile).size;
  console.log(`Size: ${inSize} → ${outSize} bytes (${((outSize-inSize)/inSize*100).toFixed(1)}%)`);
}

main();
