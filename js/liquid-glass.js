// Inline Liquid Glass panel for the detail view.
// Reuses the icns.js renderer to display the SVG as a macOS-style squircle icon
// in the main preview box. main.js calls show/hide and supplies an onToggle
// callback to swap the action buttons (SVG → PNG) when glass turns on.
// color.js calls refresh via the preview hook when colours change.
import { svgToImage, splitSvgLayers, renderIcon, MACOS_PCT } from './icns.js';

const FEATURE_ENABLED = false;

const DEFAULT_RADIUS = MACOS_PCT; // 60% = Apple squircle
const PREVIEW_SIZE = 400;         // px the main preview renders at (retina-crisp at 96px)

const state = {
  enabled: false,
  radiusPct: DEFAULT_RADIUS,
  source: null,
};

let dom = null;
let onToggle = null;

async function buildSource(svgText) {
  const s = splitSvgLayers(svgText);
  const full = await svgToImage(s.full);
  const fg = s.plate ? await svgToImage(s.fg) : full;
  const plate = s.plate ? (await svgToImage(s.plate)).img : null;
  return { full: full.img, fg: fg.img, plate, bgColor: s.bgColor, aspect: full.aspect };
}

function renderOpts() {
  return { radiusPct: state.radiusPct, paddingPct: 0, shadow: false, glass: true, bg: 'auto' };
}

// Paint the glass render into the main preview canvas (replacing detail-img).
function paint() {
  if (!dom) return;
  if (state.enabled && state.source) {
    const canvas = renderIcon(state.source, PREVIEW_SIZE, renderOpts());
    dom.glassCanvas.width = canvas.width;
    dom.glassCanvas.height = canvas.height;
    dom.glassCanvas.getContext('2d').drawImage(canvas, 0, 0);
    dom.glassCanvas.classList.remove('hidden');
    dom.detailImg.classList.add('detail-img-hidden');
  } else {
    dom.glassCanvas.classList.add('hidden');
    dom.detailImg.classList.remove('detail-img-hidden');
  }
}

export function isEnabled() { return state.enabled; }

export async function getBlob(size = 1024) {
  if (!state.source) return null;
  const canvas = renderIcon(state.source, size, renderOpts());
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('render failed')), 'image/png');
  });
}

// Colours changed (or a redraw is needed) — rebuild the source from new SVG and repaint.
export async function refresh(svgText) {
  if (!svgText) { state.source = null; paint(); return; }
  try { state.source = await buildSource(svgText); }
  catch { state.source = null; }
  paint();
}

// Reset the corner button + slider to the off state.
function resetToggleUI() {
  dom.fab.classList.remove('active');
  dom.fab.setAttribute('aria-pressed', 'false');
  dom.slider.classList.add('hidden');
  dom.radiusInput.value = DEFAULT_RADIUS;
  dom.radiusVal.textContent = DEFAULT_RADIUS + '%';
}

// Show the corner toggle for an SVG logo. svgText is the colour-mapped SVG. Starts off.
export async function show(svgText) {
  if (!dom) return;
  if (!FEATURE_ENABLED) { hide(); return; } // WIP — keep the pill hidden
  state.enabled = false;
  state.radiusPct = DEFAULT_RADIUS;
  state.source = null;
  resetToggleUI();
  dom.fab.classList.remove('hidden');
  paint();
  try { state.source = await buildSource(svgText); }
  catch { state.source = null; }
  if (state.enabled) paint(); // user may have flipped the toggle while loading
}

// Hide the toggle entirely (PNG variants, emoji, etc.). Returns whether glass was on.
export function hide() {
  if (!dom) return false;
  state.enabled = false;
  state.source = null;
  dom.fab.classList.add('hidden');
  resetToggleUI();
  paint();
  return false;
}

export function init(opts = {}) {
  onToggle = opts.onToggle || null;
  const fab         = document.getElementById('glass-fab');
  const slider      = document.getElementById('glass-controls');
  const radiusInput = document.getElementById('glass-radius');
  const radiusVal   = document.getElementById('glass-radius-val');
  const glassCanvas = document.getElementById('detail-glass-canvas');
  const detailImg   = document.getElementById('detail-img');

  if (!fab) return; // page without the detail panel

  dom = { fab, slider, radiusInput, radiusVal, glassCanvas, detailImg };

  fab.onclick = () => {
    state.enabled = !state.enabled;
    fab.classList.toggle('active', state.enabled);
    fab.setAttribute('aria-pressed', String(state.enabled));
    slider.classList.toggle('hidden', !state.enabled);
    paint();
    onToggle?.(state.enabled);
  };

  radiusInput.oninput = () => {
    state.radiusPct = +radiusInput.value;
    radiusVal.textContent = Math.round(state.radiusPct) + '%';
    paint();
  };
}
