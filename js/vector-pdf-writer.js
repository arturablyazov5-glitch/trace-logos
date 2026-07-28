// Turns a parseSvgToScene() scene (see svg-to-vector.js) into real vector PDF bytes —
// paths stay paths (m/l/c/h + f/f*/S/B), gradients become PDF axial/radial Shading
// Patterns, not a rasterized image. AI reuses this verbatim (Illustrator 9+ opens
// PDF-compatible files saved with a .ai extension).
//
// Everything is pre-baked into final page coordinates before any operator is written
// (see the `tx`/`ty` closures below), so the content stream never needs a `cm` — which
// in turn means Pattern space == page default space, so gradient Coords need no extra
// Matrix. Every shape's paint is wrapped in its own q/Q, so per-shape clip paths,
// pattern color spaces and alpha ExtGStates never leak into the next shape.

const enc = new TextEncoder();

function n(x) {
  if (!isFinite(x)) return '0';
  const r = Math.round(x * 1000) / 1000;
  return Object.is(r, -0) ? '0' : String(r);
}
const rgbFrac = c => [n(c.r / 255), n(c.g / 255), n(c.b / 255)].join(' ');

const CAP = { butt: 0, round: 1, square: 2 };
const JOIN = { miter: 0, round: 1, bevel: 2 };

export function sceneToPdfBytes(scene, { targetSize = 500 } = {}) {
  const scale = targetSize / Math.max(scene.width, scene.height);
  const pageW = scene.width * scale;
  const pageH = scene.height * scale;
  const tx = x => x * scale;
  const ty = y => pageH - y * scale;

  let nextObj = 5; // 1 Catalog, 2 Pages, 3 Page, 4 Content
  const extraObjects = []; // { num, body: string|Uint8Array }
  const patternRefs = []; // PDF names used in page /Resources /Pattern
  const gsRefs = new Map(); // rounded alpha key -> { name, num }

  function pathOps(subpaths) {
    let out = '';
    for (const sp of subpaths) {
      out += `${n(tx(sp.start.x))} ${n(ty(sp.start.y))} m\n`;
      for (const seg of sp.segs) {
        if (seg.type === 'L') out += `${n(tx(seg.x))} ${n(ty(seg.y))} l\n`;
        else out += `${n(tx(seg.x1))} ${n(ty(seg.y1))} ${n(tx(seg.x2))} ${n(ty(seg.y2))} ${n(tx(seg.x))} ${n(ty(seg.y))} c\n`;
      }
      if (sp.closed) out += 'h\n';
    }
    return out;
  }

  function gsForAlpha(alpha, key) {
    const rounded = Math.round(alpha * 100) / 100;
    const mapKey = key + ':' + rounded;
    if (gsRefs.has(mapKey)) return gsRefs.get(mapKey).name;
    const num_ = nextObj++;
    const name = `/GS${num_}`;
    extraObjects.push({ num: num_, body: `<< /Type /ExtGState /${key} ${rounded} >>\n` });
    gsRefs.set(mapKey, { name, num: num_ });
    return name;
  }

  function stopsFunction(stops) {
    const funcNums = [];
    for (let i = 0; i < stops.length - 1; i++) {
      const c0 = rgbFrac(stops[i]), c1 = rgbFrac(stops[i + 1]);
      const num_ = nextObj++;
      extraObjects.push({ num: num_, body: `<< /FunctionType 2 /Domain [0 1] /C0 [${c0}] /C1 [${c1}] /N 1 >>\n` });
      funcNums.push(num_);
    }
    if (funcNums.length === 1) return funcNums[0];
    const bounds = stops.slice(1, -1).map(s => n(s.offset)).join(' ');
    const encode = funcNums.map(() => '0 1').join(' ');
    const fns = funcNums.map(f => `${f} 0 R`).join(' ');
    const num_ = nextObj++;
    extraObjects.push({ num: num_, body: `<< /FunctionType 3 /Domain [0 1] /Functions [${fns}] /Bounds [${bounds}] /Encode [${encode}] >>\n` });
    return num_;
  }

  function avgAlpha(stops) {
    return stops.reduce((a, s) => a + s.a, 0) / stops.length;
  }

  function patternForGradient(paint) {
    const fn = stopsFunction(paint.stops);
    const shadeNum = nextObj++;
    let coords;
    if (paint.type === 'linear') {
      coords = `${n(tx(paint.x1))} ${n(ty(paint.y1))} ${n(tx(paint.x2))} ${n(ty(paint.y2))}`;
      extraObjects.push({ num: shadeNum, body: `<< /ShadingType 2 /ColorSpace /DeviceRGB /Coords [${coords}] /Function ${fn} 0 R /Extend [true true] >>\n` });
    } else {
      const r = paint.r * scale;
      coords = `${n(tx(paint.fx))} ${n(ty(paint.fy))} 0 ${n(tx(paint.cx))} ${n(ty(paint.cy))} ${n(r)}`;
      extraObjects.push({ num: shadeNum, body: `<< /ShadingType 3 /ColorSpace /DeviceRGB /Coords [${coords}] /Function ${fn} 0 R /Extend [true true] >>\n` });
    }
    const patNum = nextObj++;
    extraObjects.push({ num: patNum, body: `<< /Type /Pattern /PatternType 2 /Shading ${shadeNum} 0 R >>\n` });
    const name = `/P${patNum}`;
    patternRefs.push({ name, num: patNum });
    return name;
  }

  function setPaintColor(ops, paint, isFill) {
    const csOp = isFill ? 'cs' : 'CS';
    const scnOp = isFill ? 'scn' : 'SCN';
    const colorOp = isFill ? 'rg' : 'RG';
    const gsKey = isFill ? 'ca' : 'CA';
    if (paint.type === 'solid') {
      ops.push(`${gsForAlpha(paint.a, gsKey)} gs`);
      ops.push(`${rgbFrac(paint)} ${colorOp}`);
    } else {
      const alpha = avgAlpha(paint.stops);
      ops.push(`${gsForAlpha(alpha, gsKey)} gs`);
      const name = patternForGradient(paint);
      ops.push(`/Pattern ${csOp}`);
      ops.push(`${name} ${scnOp}`);
    }
  }

  let content = '';
  for (const shape of scene.shapes) {
    const ops = ['q'];
    if (shape.clips && shape.clips.length) {
      for (const clipSubpaths of shape.clips) {
        ops.push(pathOps(clipSubpaths).trim());
        ops.push('W n');
      }
    }
    if (shape.fillPaint) setPaintColor(ops, shape.fillPaint, true);
    if (shape.strokePaint) {
      setPaintColor(ops, shape.strokePaint, false);
      ops.push(`${n(Math.max(0.01, shape.strokeWidth * scale))} w`);
      ops.push(`${CAP[shape.strokeLinecap] ?? 0} J`);
      ops.push(`${JOIN[shape.strokeLinejoin] ?? 0} j`);
    }
    ops.push(pathOps(shape.subpaths).trim());
    const op = shape.fillPaint && shape.strokePaint ? (shape.fillRule === 'evenodd' ? 'B*' : 'B')
      : shape.fillPaint ? (shape.fillRule === 'evenodd' ? 'f*' : 'f')
      : 'S';
    ops.push(op);
    ops.push('Q');
    content += ops.join('\n') + '\n';
  }

  const chunks = [];
  let pos = 0;
  const offsets = [];
  const push = bufOrStr => {
    const buf = typeof bufOrStr === 'string' ? enc.encode(bufOrStr) : bufOrStr;
    chunks.push(buf);
    pos += buf.length;
  };
  const beginObj = num_ => { offsets[num_] = pos; push(`${num_} 0 obj\n`); };
  const endObj = () => push('endobj\n');

  push('%PDF-1.4\n');
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  beginObj(1); push('<< /Type /Catalog /Pages 2 0 R >>\n'); endObj();
  beginObj(2); push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n'); endObj();

  const patDict = patternRefs.map(p => `${p.name} ${p.num} 0 R`).join(' ');
  const gsDict = Array.from(gsRefs.values()).map(g => `${g.name} ${g.num} 0 R`).join(' ');
  const resources = `<< /ProcSet [/PDF]${patDict ? ` /Pattern << ${patDict} >>` : ''}${gsDict ? ` /ExtGState << ${gsDict} >>` : ''} >>`;
  beginObj(3);
  push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(pageW)} ${n(pageH)}] /Resources ${resources} /Contents 4 0 R >>\n`);
  endObj();

  const contentBytes = enc.encode(content);
  beginObj(4);
  push(`<< /Length ${contentBytes.length} >>\nstream\n`);
  push(contentBytes);
  push('\nendstream\n');
  endObj();

  for (const { num: num_, body } of extraObjects) {
    beginObj(num_);
    push(body);
    endObj();
  }

  const totalObjs = nextObj - 1;
  const xrefStart = pos;
  push(`xref\n0 ${totalObjs + 1}\n`);
  push('0000000000 65535 f \n');
  for (let i = 1; i <= totalObjs; i++) {
    if (offsets[i] === undefined) { push('0000000000 00000 f \n'); continue; }
    push(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
  }
  push(`trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  const total = chunks.reduce((a, c) => a + c.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}
