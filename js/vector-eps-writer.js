// Turns a parseSvgToScene() scene (see svg-to-vector.js) into real vector EPS
// (PostScript) text — paths stay paths (moveto/lineto/curveto/closepath + fill/eofill/
// stroke), not a rasterized image.
//
// Two deliberate simplifications versus the PDF writer:
// - Classic PostScript/EPS shading (`shfill`, Separation patterns) is unreliably
//   supported by old EPS-consuming software, so a gradient paint is flattened to a
//   single stop-averaged flat color instead of a real gradient.
// - Base PostScript has no alpha-compositing operator, so opacity is approximated by
//   blending the color toward white — the same visual approximation the old raster EPS
//   writer already made via canvasToRgb()'s alpha-over-white compositing, just computed
//   once per shape instead of baked into a raster image.

function n(x) {
  if (!isFinite(x)) return '0';
  const r = Math.round(x * 1000) / 1000;
  return Object.is(r, -0) ? '0' : String(r);
}

const CAP = { butt: 0, round: 1, square: 2 };
const JOIN = { miter: 0, round: 1, bevel: 2 };

function blendWhite(c, a) {
  return { r: c.r * a + 255 * (1 - a), g: c.g * a + 255 * (1 - a), b: c.b * a + 255 * (1 - a) };
}

function flattenPaint(paint) {
  if (paint.type === 'solid') return blendWhite(paint, paint.a);
  const stops = paint.stops;
  const sum = stops.reduce((acc, s) => {
    const c = blendWhite(s, s.a);
    acc.r += c.r; acc.g += c.g; acc.b += c.b;
    return acc;
  }, { r: 0, g: 0, b: 0 });
  return { r: sum.r / stops.length, g: sum.g / stops.length, b: sum.b / stops.length };
}

const rgbFrac = c => `${n(c.r / 255)} ${n(c.g / 255)} ${n(c.b / 255)}`;

export function sceneToEpsString(scene, { targetSize = 500 } = {}) {
  const scale = targetSize / Math.max(scene.width, scene.height);
  const pageW = scene.width * scale;
  const pageH = scene.height * scale;
  const tx = x => x * scale;
  const ty = y => pageH - y * scale;

  function pathOps(subpaths) {
    let out = '';
    for (const sp of subpaths) {
      out += `${n(tx(sp.start.x))} ${n(ty(sp.start.y))} moveto\n`;
      for (const seg of sp.segs) {
        if (seg.type === 'L') out += `${n(tx(seg.x))} ${n(ty(seg.y))} lineto\n`;
        else out += `${n(tx(seg.x1))} ${n(ty(seg.y1))} ${n(tx(seg.x2))} ${n(ty(seg.y2))} ${n(tx(seg.x))} ${n(ty(seg.y))} curveto\n`;
      }
      if (sp.closed) out += 'closepath\n';
    }
    return out;
  }

  let content = '';
  for (const shape of scene.shapes) {
    const ops = ['gsave'];
    if (shape.clips && shape.clips.length) {
      for (const clipSubpaths of shape.clips) {
        ops.push('newpath');
        ops.push(pathOps(clipSubpaths).trim());
        ops.push('clip');
      }
    }
    if (shape.fillPaint) {
      ops.push('newpath');
      ops.push(pathOps(shape.subpaths).trim());
      ops.push(`${rgbFrac(flattenPaint(shape.fillPaint))} setrgbcolor`);
      ops.push(shape.fillRule === 'evenodd' ? 'eofill' : 'fill');
    }
    if (shape.strokePaint) {
      ops.push('newpath');
      ops.push(pathOps(shape.subpaths).trim());
      ops.push(`${rgbFrac(flattenPaint(shape.strokePaint))} setrgbcolor`);
      ops.push(`${n(Math.max(0.01, shape.strokeWidth * scale))} setlinewidth`);
      ops.push(`${CAP[shape.strokeLinecap] ?? 0} setlinecap`);
      ops.push(`${JOIN[shape.strokeLinejoin] ?? 0} setlinejoin`);
      ops.push('stroke');
    }
    ops.push('grestore');
    content += ops.join('\n') + '\n';
  }

  const bbW = Math.ceil(pageW);
  const bbH = Math.ceil(pageH);

  return `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 ${bbW} ${bbH}
%%HiResBoundingBox: 0 0 ${n(pageW)} ${n(pageH)}
%%Creator: Trace Logos (trace-logos.ru)
%%Pages: 1
%%EndComments
%%Page: 1 1
${content}%%EOF
`;
}
