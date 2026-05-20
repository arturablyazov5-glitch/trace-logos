import { normalizeHex, hexToHsv } from './color-math.js';
import { openPicker, closePicker, getPickerAnchor, isPickerOpen, syncPickerFromHex } from './picker.js';
import { svgUrl } from './utils.js';

const COLOR_HISTORY_MAX = 50;

export const svgRawCache = {};

// Shared mutable state — объект, чтобы live-binding работал при импорте
export const colorState = {
  colorMap: {},
  currentRawSvg: '',
  currentIsSquare: true,
  variantImgEls: [],
  colorHistory: [],
  colorHistoryIdx: -1,
  colorUndoRedo: false,
  colorHistoryNeedsInit: false,
  colorEditorSourceSvg: '',
};

export function cloneColorMap() {
  return JSON.parse(JSON.stringify(colorState.colorMap));
}

export function updateColorsResetBtn() {
  const resetBtn = document.getElementById('colors-reset-btn');
  const anyChanged = Object.entries(colorState.colorMap).some(([k, v]) => k !== v);
  resetBtn.classList.toggle('visible', anyChanged);
}

export function resetColorHistory() {
  colorState.colorHistory = [cloneColorMap()];
  colorState.colorHistoryIdx = 0;
}

export function pushColorHistory() {
  if (colorState.colorUndoRedo) return;
  const snap = cloneColorMap();
  if (colorState.colorHistoryIdx >= 0 && JSON.stringify(colorState.colorHistory[colorState.colorHistoryIdx]) === JSON.stringify(snap)) return;
  colorState.colorHistory = colorState.colorHistory.slice(0, colorState.colorHistoryIdx + 1);
  colorState.colorHistory.push(snap);
  while (colorState.colorHistory.length > COLOR_HISTORY_MAX) colorState.colorHistory.shift();
  colorState.colorHistoryIdx = colorState.colorHistory.length - 1;
}

export function undoColors() {
  if (colorState.colorHistoryIdx <= 0) return false;
  colorState.colorUndoRedo = true;
  colorState.colorHistoryIdx--;
  colorState.colorMap = JSON.parse(JSON.stringify(colorState.colorHistory[colorState.colorHistoryIdx]));
  if (colorState.colorEditorSourceSvg) buildColorEditor(colorState.colorEditorSourceSvg);
  if (colorState.currentRawSvg) updatePreview(colorState.currentRawSvg, colorState.currentIsSquare);
  updateVariantThumbnails();
  updateColorsResetBtn();
  colorState.colorUndoRedo = false;
  return true;
}

export async function loadRawSvg(file) {
  if (!svgRawCache[file]) svgRawCache[file] = await fetch(svgUrl(file)).then(r => r.text());
  return svgRawCache[file];
}

export function extractColors(svgText) {
  const set = new Set();
  const re = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
  let m;
  while ((m = re.exec(svgText)) !== null) {
    const n = normalizeHex(m[0]);
    if (n) set.add(n);
  }
  return [...set];
}

export function applyColorMap(svgText) {
  let s = svgText;
  for (const [from, to] of Object.entries(colorState.colorMap)) {
    if (from === to) continue;
    s = s.replace(new RegExp(from, 'gi'), to);
  }
  return s;
}

export function updateVariantThumbnails() {
  for (const { file, imgEl } of colorState.variantImgEls) {
    const raw = svgRawCache[file];
    if (!raw) continue;
    const styled = applyColorMap(raw);
    if (imgEl._blobUrl) URL.revokeObjectURL(imgEl._blobUrl);
    imgEl._blobUrl = URL.createObjectURL(new Blob([styled], { type: 'image/svg+xml' }));
    imgEl.src = imgEl._blobUrl;
  }
}

export function updatePreview(rawSvg, isSquare) {
  colorState.currentRawSvg = rawSvg;
  colorState.currentIsSquare = isSquare;
  const styled = applyColorMap(rawSvg);
  const detailImg = document.getElementById('detail-img');
  if (detailImg._previewBlobUrl) URL.revokeObjectURL(detailImg._previewBlobUrl);
  detailImg._previewBlobUrl = URL.createObjectURL(new Blob([styled], { type: 'image/svg+xml' }));
  detailImg.src = detailImg._previewBlobUrl;
  detailImg.classList.toggle('square', isSquare);
}

export function buildColorEditor(rawSvg) {
  colorState.colorEditorSourceSvg = rawSvg;
  const section  = document.getElementById('colors-section');
  const panel    = document.getElementById('colors-panel');
  const divider  = document.getElementById('colors-divider');
  const resetBtn = document.getElementById('colors-reset-btn');
  section.innerHTML = '';
  resetBtn.classList.remove('visible');

  const colors = extractColors(rawSvg);
  if (!colors.length) {
    panel.classList.add('colors-hidden');
    divider.classList.add('colors-hidden');
    return;
  }
  panel.classList.remove('colors-hidden');
  divider.classList.remove('colors-hidden');

  colors.forEach(c => { if (!(c in colorState.colorMap)) colorState.colorMap[c] = c; });

  colors.forEach(origColor => {
    const row = document.createElement('div');
    row.className = 'color-row';

    const swatchWrap = document.createElement('div');
    swatchWrap.className = 'color-swatch-wrap';
    const swatch = document.createElement('span');
    swatch.className = 'color-swatch';
    swatch.style.background = colorState.colorMap[origColor];
    swatchWrap.appendChild(swatch);

    const hexWrap = document.createElement('div');
    hexWrap.className = 'color-hex-wrap';
    const hexPrefix = document.createElement('span');
    hexPrefix.className = 'color-hex-prefix';
    hexPrefix.textContent = '#';
    const hexInput = document.createElement('input');
    hexInput.type = 'text';
    hexInput.className = 'color-hex';
    hexInput.value = colorState.colorMap[origColor].slice(1).toUpperCase();
    hexInput.maxLength = 6;
    hexInput.spellcheck = false;
    hexWrap.append(hexPrefix, hexInput);
    hexWrap.addEventListener('click', () => hexInput.focus());

    const applyNew = (newColor, fromPicker = false) => {
      if (colorState.colorMap[origColor] === newColor) return;
      if (!colorState.colorUndoRedo && !fromPicker) pushColorHistory();
      colorState.colorMap[origColor] = newColor;
      swatch.style.background = newColor;
      hexInput.value = newColor.slice(1).toUpperCase();
      if (!fromPicker && isPickerOpen() && getPickerAnchor() === swatchWrap) {
        syncPickerFromHex(newColor);
      }
      if (colorState.currentRawSvg) updatePreview(colorState.currentRawSvg, colorState.currentIsSquare);
      updateVariantThumbnails();
      updateColorsResetBtn();
    };

    swatchWrap.addEventListener('mousedown', e => {
      e.preventDefault();
      if (!colorState.colorUndoRedo) pushColorHistory();
      openPicker(swatchWrap, colorState.colorMap[origColor], hex => applyNew(hex, true));
    });
    hexInput.addEventListener('keydown', e => { if (e.key === 'Enter') hexInput.blur(); });
    hexInput.addEventListener('blur', () => {
      const n = normalizeHex('#' + hexInput.value);
      if (n) applyNew(n); else hexInput.value = colorState.colorMap[origColor].slice(1).toUpperCase();
    });

    row.append(swatchWrap, hexWrap);
    section.appendChild(row);
  });

  if (colorState.colorHistoryNeedsInit && !colorState.colorUndoRedo) {
    resetColorHistory();
    colorState.colorHistoryNeedsInit = false;
  }
}
