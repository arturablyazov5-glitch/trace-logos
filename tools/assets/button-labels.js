(() => {
  const PICK_FILES_LABEL = 'Выбрать файлы';
  const SKIP_PHOTO_LABEL = 'Пропустить фото';
  const RESET_LABEL = 'Начать заново';

  const BUTTON_LABELS = Object.freeze({
    'watermark.html': {
      uploadPickBtn: PICK_FILES_LABEL,
      skipBtn: SKIP_PHOTO_LABEL,
      resetBtn: RESET_LABEL,
      downloadBtn: 'Скачать',
    },
    'merge-pdf.html': {
      uploadPickBtn: 'Выбрать PDF',
      cancelMergeBtn: 'Отменить',
      cancelMergeBtnPending: 'Останавливаю…',
      sortNameAz: 'А→Я',
      sortNameZa: 'Я→А',
      sortSizeAsc: '↑ размер',
      sortSizeDesc: '↓ размер',
      downloadBtn: 'Объединить и скачать',
      addMoreBtn: 'Добавить PDF',
      resetBtn: RESET_LABEL,
    },
    'compress-webp.html': {
      uploadPickBtn: PICK_FILES_LABEL,
      skipBtn: SKIP_PHOTO_LABEL,
      resetBtn: RESET_LABEL,
      downloadBtn: 'Скачать WebP',
      downloadZipBtn: 'Скачать ZIP',
    },
  });

  function getCurrentPageKey() {
    const path = (window.location.pathname || '').split('/').pop();
    return path || 'index.html';
  }

  function getPageButtonLabels() {
    const pageKey = getCurrentPageKey();
    return BUTTON_LABELS[pageKey] || {};
  }

  function getButtonLabel(id, fallback = '') {
    const pageLabels = getPageButtonLabels();
    const value = pageLabels[id];
    return typeof value === 'string' && value ? value : fallback;
  }

  window.APP_BUTTON_LABELS = BUTTON_LABELS;
  window.getPageButtonLabels = getPageButtonLabels;
  window.getButtonLabel = getButtonLabel;
})();
