// @ts-types="npm:@xmldom/xmldom@^0.9"
import { DOMParser, XMLSerializer } from 'npm:@xmldom/xmldom@^0.9';

const ALLOWED_ELEMENTS = new Set([
  'svg',
  'g', 'defs', 'symbol', 'use', 'switch',
  'title', 'desc',
  'path', 'rect', 'circle', 'ellipse',
  'line', 'polyline', 'polygon',
  'text', 'tspan', 'textPath',
  'linearGradient', 'radialGradient', 'stop', 'pattern',
  'clipPath', 'mask', 'marker',
  'filter',
  'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite',
  'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap',
  'feDistantLight', 'feFlood',
  'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR',
  'feGaussianBlur', 'feImage',
  'feMerge', 'feMergeNode', 'feMorphology',
  'feOffset', 'fePointLight',
  'feSpecularLighting', 'feSpotLight',
  'feTile', 'feTurbulence',
  'image', 'a',
  'animate', 'animateTransform', 'animateMotion', 'set', 'mpath',
  'view',
]);

const BLOCKED_ELEMENTS = new Set([
  'script', 'foreignObject', 'iframe', 'object', 'embed',
  'style', 'link', 'meta', 'base',
  'form', 'input', 'button', 'textarea', 'select', 'option',
  'html', 'head', 'body',
  'frame', 'frameset',
  'applet', 'param', 'source', 'track',
  'math', 'annotation-xml',
]);

const ALLOWED_ATTRS = new Set([
  'id', 'class', 'lang', 'xml:lang', 'xml:space',
  'x', 'y', 'x1', 'y1', 'x2', 'y2',
  'cx', 'cy', 'r', 'rx', 'ry',
  'width', 'height',
  'viewBox', 'preserveAspectRatio',
  'd', 'points', 'pathLength',
  'dx', 'dy', 'rotate',
  'transform', 'patternTransform', 'gradientTransform',
  'fill', 'fill-opacity', 'fill-rule',
  'stroke', 'stroke-width', 'stroke-opacity',
  'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit',
  'stroke-dasharray', 'stroke-dashoffset',
  'opacity', 'display', 'visibility',
  'color', 'color-interpolation', 'color-interpolation-filters', 'color-rendering',
  'font-family', 'font-size', 'font-size-adjust', 'font-weight',
  'font-style', 'font-variant', 'font-stretch',
  'text-anchor', 'text-decoration', 'text-rendering',
  'dominant-baseline', 'alignment-baseline', 'baseline-shift',
  'letter-spacing', 'word-spacing',
  'writing-mode', 'glyph-orientation-horizontal', 'glyph-orientation-vertical',
  'direction', 'unicode-bidi',
  'shape-rendering', 'image-rendering', 'paint-order',
  'vector-effect', 'overflow',
  'clip-path', 'clip-rule', 'mask', 'filter',
  'marker-start', 'marker-mid', 'marker-end',
  'markerWidth', 'markerHeight', 'markerUnits', 'orient',
  'refX', 'refY',
  'gradientUnits', 'spreadMethod',
  'stop-color', 'stop-opacity', 'offset',
  'patternUnits', 'patternContentUnits',
  'clipPathUnits',
  'maskUnits', 'maskContentUnits',
  'filterUnits', 'primitiveUnits',
  'in', 'in2', 'result',
  'mode', 'values', 'type',
  'slope', 'intercept', 'amplitude', 'exponent', 'tableValues',
  'operator', 'k1', 'k2', 'k3', 'k4',
  'order', 'kernelMatrix', 'divisor', 'bias',
  'targetX', 'targetY', 'edgeMode', 'kernelUnitLength', 'preserveAlpha',
  'scale', 'xChannelSelector', 'yChannelSelector',
  'azimuth', 'elevation',
  'surfaceScale', 'diffuseConstant', 'specularConstant', 'specularExponent',
  'z', 'pointsAtX', 'pointsAtY', 'pointsAtZ', 'limitingConeAngle',
  'stdDeviation', 'radius',
  'baseFrequency', 'numOctaves', 'seed', 'stitchTiles',
  'flood-color', 'flood-opacity', 'lighting-color',
  'startOffset', 'method', 'spacing',
  'href', 'target',
  'attributeName', 'attributeType',
  'begin', 'dur', 'end', 'min', 'max',
  'restart', 'repeatCount', 'repeatDur',
  'calcMode', 'keyTimes', 'keySplines',
  'from', 'to', 'by',
  'additive', 'accumulate',
  'path',
  'style',
]);

const DANGEROUS_PROTO_RE = /^\s*(javascript|vbscript|livescript|data|moz-binding)\s*:/i;
const DANGEROUS_STYLE_RE = /expression\s*\(|url\s*\(\s*(javascript|vbscript|data|moz-binding)\s*:/i;

function isSafeUrl(value: string | null): boolean {
  if (value == null || value === '') return true;
  const v = String(value).trim();
  if (DANGEROUS_PROTO_RE.test(v)) return false;
  try {
    const decoded = decodeURIComponent(v);
    if (DANGEROUS_PROTO_RE.test(decoded)) return false;
  } catch (_) { return false; }
  return true;
}

function isSafeStyleValue(value: string | null): boolean {
  if (value == null || value === '') return true;
  const v = String(value);
  if (DANGEROUS_STYLE_RE.test(v)) return false;
  if (DANGEROUS_PROTO_RE.test(v)) return false;
  return true;
}

function sanitizeNode(node: Node): 'keep' | 'remove' {
  if (node.nodeType === 3 || node.nodeType === 4) return 'keep';
  if (node.nodeType === 8 || node.nodeType === 7) return 'remove';
  if (node.nodeType !== 1) return 'remove';

  const el = node as Element;
  const rawTag  = el.localName || el.nodeName;
  const tagLow  = rawTag.toLowerCase();

  if (BLOCKED_ELEMENTS.has(rawTag) || BLOCKED_ELEMENTS.has(tagLow)) return 'remove';
  if (!ALLOWED_ELEMENTS.has(rawTag) && !ALLOWED_ELEMENTS.has(tagLow)) return 'remove';

  const toRemove: string[] = [];
  for (let i = 0; i < el.attributes.length; i++) {
    const attr  = el.attributes[i];
    const name  = attr.name.toLowerCase();
    const value = attr.value;

    if (name.startsWith('on'))       { toRemove.push(attr.name); continue; }
    if (name.startsWith('xlink:'))   { toRemove.push(attr.name); continue; }
    if (name === 'xml:base')         { toRemove.push(attr.name); continue; }
    if (name.startsWith('xmlns:') && name !== 'xmlns:svg') { toRemove.push(attr.name); continue; }

    if (name === 'href') {
      if (!isSafeUrl(value)) { toRemove.push(attr.name); continue; }
      if (rawTag === 'image') {
        const v = value.trim();
        const isRelative = !v.includes(':') || v.startsWith('#');
        const isSafeData = /^data:image\/(png|jpg|jpeg|gif|webp|svg\+xml);base64,/.test(v);
        if (!isRelative && !isSafeData) { toRemove.push(attr.name); continue; }
      }
    }
    if (name === 'src'   && !isSafeUrl(value))        { toRemove.push(attr.name); continue; }
    if (name === 'style' && !isSafeStyleValue(value)) { toRemove.push(attr.name); continue; }
    if (DANGEROUS_PROTO_RE.test(value))               { toRemove.push(attr.name); continue; }

    const baseName = name.includes(':') ? name.split(':').pop()! : name;
    if (!ALLOWED_ATTRS.has(name) && !ALLOWED_ATTRS.has(baseName)) {
      toRemove.push(attr.name); continue;
    }
  }
  toRemove.forEach(n => el.removeAttribute(n));

  const children = Array.from(el.childNodes);
  for (const child of children) {
    if (sanitizeNode(child) === 'remove') el.removeChild(child);
  }
  return 'keep';
}

function finalCheck(svg: string): void {
  const lower = svg.toLowerCase();
  const forbidden = [
    '<script', 'javascript:', 'vbscript:', '<iframe',
    '<foreignobject', '<object', '<embed', 'onload=',
    'onerror=', 'onclick=', 'expression(',
  ];
  for (const p of forbidden) {
    if (lower.includes(p)) throw new Error(`Sanitization failed: "${p}" still present`);
  }
}

export function sanitizeSvg(input: string): string {
  if (typeof input !== 'string') throw new Error('Input must be a string');
  if (input.length > 5 * 1024 * 1024) throw new Error('SVG file too large (max 5 MB)');

  const trimmed = input.trim();
  if (!trimmed.startsWith('<')) throw new Error('Not a valid SVG: must start with <');
  if (!/\bsvg\b/i.test(trimmed)) throw new Error('Not a valid SVG: no <svg> element found');

  const parser = new DOMParser();
  const doc = parser.parseFromString(trimmed, 'image/svg+xml');

  const parseError = doc.getElementsByTagName('parsererror')[0];
  if (parseError) {
    throw new Error('Invalid SVG XML: ' + ((parseError as Element).textContent || '').trim().slice(0, 200));
  }

  const root = doc.documentElement;
  if (!root) throw new Error('Empty document after parsing');

  const rootTag = (root.localName || root.nodeName).toLowerCase();
  if (rootTag !== 'svg') throw new Error(`Root element must be <svg>, got <${rootTag}>`);

  if (sanitizeNode(root) === 'remove') throw new Error('SVG root was removed during sanitization');

  const serializer = new XMLSerializer();
  const result = serializer.serializeToString(doc);
  finalCheck(result);
  return result;
}

export function validateSvgBytes(buffer: Uint8Array | ArrayBuffer): { ok: boolean; reason?: string } {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;

  if (bytes[0] === 0x89 && bytes[1] === 0x50) return { ok: false, reason: 'File is a PNG, not SVG' };
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) return { ok: false, reason: 'File is a JPEG, not SVG' };
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return { ok: false, reason: 'File is a PDF, not SVG' };
  if (bytes[0] === 0x50 && bytes[1] === 0x4B) return { ok: false, reason: 'File is a ZIP archive, not SVG' };
  if (bytes[0] === 0x4D && bytes[1] === 0x5A) return { ok: false, reason: 'File is an executable, not SVG' };
  if (bytes[0] === 0x7F && bytes[1] === 0x45 && bytes[2] === 0x4C && bytes[3] === 0x46) return { ok: false, reason: 'File is an ELF binary, not SVG' };

  const decoder = new TextDecoder('utf-8', { fatal: true });
  let text: string;
  try {
    text = decoder.decode(bytes.slice(0, Math.min(bytes.length, 512)));
  } catch (_) {
    return { ok: false, reason: 'File is not valid UTF-8 text' };
  }

  const trimmed = text.trimStart();
  if (!trimmed.startsWith('<')) return { ok: false, reason: 'SVG must start with < character' };
  if (!/\bsvg\b/i.test(trimmed)) return { ok: false, reason: 'No <svg> found in file header' };

  return { ok: true };
}
