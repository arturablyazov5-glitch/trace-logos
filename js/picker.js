import { hsvToRgb, rgbToHex, hexToHsv, normalizeHex } from './color-math.js';

let cpEl = null, cpSvEl, cpHueEl, cpAlphaEl, cpAlphaTrack, cpSvThumb, cpHueThumb, cpAlphaThumb, cpHexVal, cpOpacityVal;
let cpH = 0, cpS = 1, cpV = 1, cpA = 100, cpOnChange = null, cpAnchor = null;

function cpCurrentHex() {
  const [r, g, b] = hsvToRgb(cpH, cpS, cpV);
  return rgbToHex(r, g, b);
}

function cpThumbLeft(frac) {
  return `calc(8px + ${frac * 100}% - ${frac * 16}px)`;
}

function cpRender() {
  cpSvEl.style.backgroundColor = `hsl(${cpH},100%,50%)`;
  cpSvThumb.style.left = (cpS * 100) + '%';
  cpSvThumb.style.top = ((1 - cpV) * 100) + '%';
  cpHueThumb.style.left = cpThumbLeft(cpH / 360);
  cpAlphaThumb.style.left = cpThumbLeft(cpA / 100);
  const hex = cpCurrentHex();
  cpAlphaTrack.style.background = `linear-gradient(to right,transparent,${hex})`;
  cpHexVal.value = hex.slice(1).toUpperCase();
  cpOpacityVal.value = cpA;
}

function initPicker() {
  cpEl = document.createElement('div');
  cpEl.className = 'cp';
  cpEl.innerHTML =
    '<div class="cp-sv" id="cp-sv">' +
      '<div class="cp-sv-white"></div><div class="cp-sv-black"></div>' +
      '<div class="cp-sv-thumb" id="cp-sv-thumb"></div>' +
    '</div>' +
    '<div class="cp-sliders-row">' +
      '<button class="cp-eyedropper-btn' + (window.EyeDropper ? '' : ' no-support') + '" id="cp-drop" title="Пипетка">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8-2.1 2.1-1.4-1.4Z"/></svg>' +
      '</button>' +
      '<div class="cp-tracks">' +
        '<div class="cp-slider-wrap" id="cp-hue"><div class="cp-hue-track"></div><div class="cp-hue-thumb" id="cp-hue-thumb"></div></div>' +
        '<div class="cp-slider-wrap" id="cp-alpha"><div class="cp-alpha-bg"></div><div class="cp-alpha-track" id="cp-alpha-track"></div><div class="cp-alpha-thumb" id="cp-alpha-thumb"></div></div>' +
      '</div>' +
    '</div>' +
    '<div class="cp-inputs">' +
      '<span class="cp-format-label">Hex</span>' +
      '<input class="cp-hex-val" id="cp-hex-val" maxlength="6" spellcheck="false">' +
      '<input class="cp-opacity-val" id="cp-opacity-val" maxlength="3">' +
      '<span class="cp-pct-label">%</span>' +
    '</div>';
  document.body.appendChild(cpEl);

  cpSvEl = cpEl.querySelector('#cp-sv');
  cpHueEl = cpEl.querySelector('#cp-hue');
  cpAlphaEl = cpEl.querySelector('#cp-alpha');
  cpAlphaTrack = cpEl.querySelector('#cp-alpha-track');
  cpSvThumb = cpEl.querySelector('#cp-sv-thumb');
  cpHueThumb = cpEl.querySelector('#cp-hue-thumb');
  cpAlphaThumb = cpEl.querySelector('#cp-alpha-thumb');
  cpHexVal = cpEl.querySelector('#cp-hex-val');
  cpOpacityVal = cpEl.querySelector('#cp-opacity-val');

  let svDown = false, hueDown = false, alphaDown = false;
  function moveSv(e) {
    const r = cpSvEl.getBoundingClientRect();
    cpS = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    cpV = Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height));
    cpRender(); cpOnChange?.(cpCurrentHex());
  }
  function moveHue(e) {
    const r = cpHueEl.getBoundingClientRect();
    cpH = Math.max(0, Math.min(359, ((e.clientX - r.left - 8) / (r.width - 16)) * 360));
    cpRender(); cpOnChange?.(cpCurrentHex());
  }
  function moveAlpha(e) {
    const r = cpAlphaEl.getBoundingClientRect();
    cpA = Math.round(Math.max(0, Math.min(1, (e.clientX - r.left - 8) / (r.width - 16))) * 100);
    cpRender();
  }

  cpSvEl.addEventListener('mousedown', e => { e.preventDefault(); svDown = true; moveSv(e); });
  cpHueEl.addEventListener('mousedown', e => { e.preventDefault(); hueDown = true; moveHue(e); });
  cpAlphaEl.addEventListener('mousedown', e => { e.preventDefault(); alphaDown = true; moveAlpha(e); });
  window.addEventListener('mousemove', e => { if (svDown) moveSv(e); if (hueDown) moveHue(e); if (alphaDown) moveAlpha(e); });
  window.addEventListener('mouseup', () => { svDown = false; hueDown = false; alphaDown = false; });

  cpHexVal.addEventListener('keydown', e => { if (e.key === 'Enter') cpHexVal.blur(); });
  cpHexVal.addEventListener('blur', () => {
    const n = normalizeHex('#' + cpHexVal.value);
    if (n) { const { h, s, v } = hexToHsv(n); cpH = h; cpS = s; cpV = v; cpRender(); cpOnChange?.(n); }
    else cpHexVal.value = cpCurrentHex().slice(1).toUpperCase();
  });

  cpEl.querySelector('#cp-drop').addEventListener('click', async () => {
    if (!window.EyeDropper) return;
    try {
      const res = await new EyeDropper().open();
      const n = normalizeHex(res.sRGBHex);
      if (n) { const { h, s, v } = hexToHsv(n); cpH = h; cpS = s; cpV = v; cpRender(); cpOnChange?.(n); }
    } catch (e) {}
  });

  document.addEventListener('mousedown', e => {
    if (!cpEl.classList.contains('open')) return;
    if (cpEl.contains(e.target) || cpAnchor?.contains(e.target)) return;
    closePicker();
  });
}

export function openPicker(anchorEl, hex, onChange) {
  if (!cpEl) initPicker();
  const toggling = cpEl.classList.contains('open') && cpAnchor === anchorEl;
  closePicker();
  if (toggling) return;
  cpAnchor = anchorEl; cpOnChange = onChange;
  const { h, s, v } = hexToHsv(hex); cpH = h; cpS = s; cpV = v; cpA = 100;
  cpRender();
  cpEl.classList.add('open');
  const ar = anchorEl.getBoundingClientRect(), pw = cpEl.offsetWidth || 244, ph = cpEl.offsetHeight || 260;
  let left = ar.right + 10, top = ar.top;
  if (left + pw > window.innerWidth - 8) left = ar.left - pw - 10;
  if (top + ph > window.innerHeight - 8) top = window.innerHeight - ph - 8;
  if (top < 8) top = 8;
  cpEl.style.left = left + 'px'; cpEl.style.top = top + 'px';
}

export function closePicker() {
  cpEl?.classList.remove('open');
  cpAnchor = null;
  cpOnChange = null;
}

export function getPickerAnchor() {
  return cpAnchor;
}

export function isPickerOpen() {
  return !!cpEl?.classList.contains('open');
}

export function syncPickerFromHex(hex) {
  const { h, s, v } = hexToHsv(hex);
  Object.assign({ cpH: h, cpS: s, cpV: v }, { cpH: h, cpS: s, cpV: v });
  // Re-assign module vars via indirect approach since they're module-scoped
  cpH = h; cpS = s; cpV = v;
  cpRender();
}
