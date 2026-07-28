import { t, applyI18n } from './i18n.js';

// LABELS and TOASTS are mutable objects populated by refreshLabels().
// They are refreshed at load and on every 'langchange' event, so all
// callers that read LABELS/TOASTS get the current-language value.

export const LABELS = {
  copySvg: '', copyPng: '', copyEmoji: '', copyEmojiPage: '', copied: '',
  downloadSvg: '', downloadPng: '',
  dlMore: '', dlZipAll: '', dlIco: '', dlIcns: '', dlLiquidGlass: '',
  dlWebp: '', dlPdf: '', dlAi: '', dlEps: '',
  reportOutdated: '', editColors: '', resetColors: '', helpUpload: '',
};

export const TOASTS = {
  downloaded: null, copiedSvg: '', copiedPng: '',
  copiedEmoji: null, copiedColor: null,
  copyError: '', copyPngError: '', zipError: '', zipLoadError: '',
  fileNotLoaded: '', colorsUndone: '', copiedEmojiChar: '',
  icnsError: '', imageLoadError: '', catalogEnd: '',
};

export function refreshLabels() {
  LABELS.copySvg        = t('copySvg');
  LABELS.copyPng        = t('copyPng');
  LABELS.copyEmoji      = t('copyEmoji');
  LABELS.copyEmojiPage  = t('copyEmojiPage');
  LABELS.copied         = t('copied');
  LABELS.downloadSvg    = t('downloadSvg');
  LABELS.downloadPng    = t('downloadPng');
  LABELS.dlMore         = t('dlMore');
  LABELS.dlZipAll       = t('dlZipAll');
  LABELS.dlIco          = t('dlIco');
  LABELS.dlIcns         = t('dlIcns');
  LABELS.dlLiquidGlass  = t('dlLiquidGlass');
  LABELS.dlWebp         = t('dlWebp');
  LABELS.dlPdf          = t('dlPdf');
  LABELS.dlAi           = t('dlAi');
  LABELS.dlEps          = t('dlEps');
  LABELS.reportOutdated = t('reportOutdated');
  LABELS.editColors     = t('editColors');
  LABELS.resetColors    = t('resetColors');
  LABELS.helpUpload     = t('helpUpload');

  TOASTS.downloaded     = t('toast.downloaded');
  TOASTS.copiedSvg      = t('toast.copiedSvg');
  TOASTS.copiedPng      = t('toast.copiedPng');
  TOASTS.copiedEmoji    = t('toast.copiedEmoji');
  TOASTS.copiedColor    = t('toast.copiedColor');
  TOASTS.copyError      = t('toast.copyError');
  TOASTS.copyPngError   = t('toast.copyPngError');
  TOASTS.zipError       = t('toast.zipError');
  TOASTS.zipLoadError   = t('toast.zipLoadError');
  TOASTS.fileNotLoaded  = t('toast.fileNotLoaded');
  TOASTS.colorsUndone   = t('toast.colorsUndone');
  TOASTS.copiedEmojiChar= t('toast.copiedEmojiChar');
  TOASTS.icnsError      = t('toast.icnsError');
  TOASTS.imageLoadError = t('toast.imageLoadError');
  TOASTS.catalogEnd     = t('toast.catalogEnd');
}

// Populate on load
refreshLabels();

// Apply data-label texts to [data-label] elements + all data-i18n* attrs
export function applyLabels(root = document) {
  root.querySelectorAll('[data-label]').forEach(el => {
    const text = LABELS[el.dataset.label];
    if (text != null) el.textContent = text;
  });
  applyI18n(root);
}

// Refresh and re-apply whenever the language changes
document.addEventListener('langchange', () => {
  refreshLabels();
  applyLabels();
});
