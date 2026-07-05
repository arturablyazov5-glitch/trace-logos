#!/usr/bin/env node
/**
 * Optimize SVG files: remove redundant clipPaths, minify, clean IDs.
 *
 * Usage:
 *   node scripts/optimize-svg.js <file.svg>          — one file (overwrites)
 *   node scripts/optimize-svg.js --all               — all svgs in assets/logos/svgs/
 *   node scripts/optimize-svg.js --dry <file.svg>    — print result without saving
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { optimize } from '/opt/homebrew/lib/node_modules/svgo/lib/svgo.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '..');
const SVG_DIR = join(ROOT, 'assets/logos/svgs');

// Custom plugin: remove clipPath when it contains a single <rect>
// that matches the SVG's width/height (i.e. identical to the viewBox).
// Unwraps the <g clip-path="..."> that references it.
const removeRedundantViewboxClip = {
  name: 'removeRedundantViewboxClip',
  fn(root) {
    return {
      root: {
        enter(rootNode) {
          // Find <svg> element
          const svg = rootNode.children?.find(n => n.type === 'element' && n.name === 'svg');
          if (!svg) return;

          // Prefer viewBox dimensions (handles cases where width/height differ from viewBox)
          let svgW, svgH;
          const vb = svg.attributes.viewBox?.split(/\s+/);
          if (vb && vb.length === 4) {
            svgW = parseFloat(vb[2]);
            svgH = parseFloat(vb[3]);
          } else {
            svgW = parseFloat(svg.attributes.width);
            svgH = parseFloat(svg.attributes.height);
          }
          if (!svgW || !svgH) return;

          // Find <defs>
          const defs = svg.children?.find(n => n.type === 'element' && n.name === 'defs');
          if (!defs) return;

          // Find clipPath elements that contain a single rect matching SVG dimensions
          const redundantIds = new Set();
          defs.children = defs.children.filter(node => {
            if (node.type !== 'element' || node.name !== 'clipPath') return true;
            const rects = node.children.filter(c => c.type === 'element' && c.name === 'rect');
            if (rects.length !== 1 || node.children.filter(c => c.type === 'element').length !== 1) return true;
            const r = rects[0];
            const x = parseFloat(r.attributes.x ?? 0);
            const y = parseFloat(r.attributes.y ?? 0);
            const w = parseFloat(r.attributes.width);
            const h = parseFloat(r.attributes.height);
            if (x === 0 && y === 0 && w === svgW && h === svgH) {
              redundantIds.add(node.attributes.id);
              return false; // remove from defs
            }
            return true;
          });

          if (redundantIds.size === 0) return;

          // Unwrap <g clip-path="url(#id)"> → replace with group's children
          function unwrapGroups(children) {
            const result = [];
            for (const node of children) {
              if (
                node.type === 'element' &&
                node.name === 'g' &&
                node.attributes['clip-path']
              ) {
                const ref = node.attributes['clip-path'].match(/url\(#([^)]+)\)/)?.[1];
                if (ref && redundantIds.has(ref)) {
                  // Unwrap: push children instead of the group
                  const inner = unwrapGroups(node.children ?? []);
                  result.push(...inner);
                  continue;
                }
              }
              if (node.children) {
                node.children = unwrapGroups(node.children);
              }
              result.push(node);
            }
            return result;
          }

          svg.children = unwrapGroups(svg.children);
        }
      }
    };
  }
};

const SVGO_CONFIG = {
  plugins: [
    removeRedundantViewboxClip,
    'removeUselessDefs',
    'cleanupIds',
    'removeUnusedNS',
    'removeEmptyContainers',
  ]
};

function optimizeFile(filePath, dry = false) {
  const input = readFileSync(filePath, 'utf8');
  const result = optimize(input, { path: filePath, ...SVGO_CONFIG });
  if (dry) {
    console.log(result.data);
    return;
  }
  writeFileSync(filePath, result.data, 'utf8');
  const before = Buffer.byteLength(input);
  const after = Buffer.byteLength(result.data);
  const saved = ((1 - after / before) * 100).toFixed(1);
  console.log(`✓ ${filePath.replace(ROOT + '/', '')}  ${before}B → ${after}B  (-${saved}%)`);
}

// --- CLI ---
const args = process.argv.slice(2);

if (args.includes('--all')) {
  const files = readdirSync(SVG_DIR).filter(f => f.endsWith('.svg'));
  console.log(`Optimizing ${files.length} SVG files in assets/logos/svgs/\n`);
  for (const f of files) optimizeFile(join(SVG_DIR, f));
  console.log('\nDone.');
} else if (args[0] === '--dry') {
  const file = resolve(args[1]);
  optimizeFile(file, true);
} else if (args[0]) {
  const file = resolve(args[0]);
  optimizeFile(file);
} else {
  console.log('Usage:');
  console.log('  node scripts/optimize-svg.js <file.svg>       optimize one file');
  console.log('  node scripts/optimize-svg.js --dry <file.svg> preview without saving');
  console.log('  node scripts/optimize-svg.js --all            optimize all logos');
}
