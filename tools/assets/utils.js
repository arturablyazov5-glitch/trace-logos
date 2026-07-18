// Общие функции, которые используются на нескольких страницах.

/** Проверяет, поддерживается ли формат файла (изображение). */
function isSupportedImage(file) {
  const t = (file.type || '').toLowerCase();
  if (t.startsWith('image/jpeg') || t.startsWith('image/png') || t.startsWith('image/webp') || t.startsWith('image/bmp') || t.startsWith('image/gif')) {
    return true;
  }
  if (t.startsWith('image/avif') || t.includes('avif')) {
    return true;
  }
  if (t === 'image/heic' || t === 'image/heif' || t.includes('heic') || t.includes('heif')) {
    return true;
  }
  const n = (file.name || '').toLowerCase();
  return /\.(jpe?g|png|webp|bmp|gif|heic|heif|avif)$/i.test(n);
}

/** Определяет, является ли файл снимком iPhone (HEIC/HEIF). */
function isHeicLike(file) {
  const t = (file.type || '').toLowerCase();
  if (t === 'image/heic' || t === 'image/heif' || t.includes('heic') || t.includes('heif')) return true;
  const n = (file.name || '').toLowerCase();
  return /\.(heic|heif)$/i.test(n);
}

/** Загружает библиотеку конвертации HEIC один раз, повторные вызовы ждут первого. */
let heic2anyLoadPromise = null;
function ensureHeic2anyLoaded() {
  if (typeof window.heic2any === 'function') return Promise.resolve();
  if (heic2anyLoadPromise) return heic2anyLoadPromise;
  heic2anyLoadPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = APP_CONFIG.HEIC2ANY_SRC;
    s.async = true;
    s.onload = () => {
      if (typeof window.heic2any === 'function') resolve();
      else {
        heic2anyLoadPromise = null;
        reject(new Error('heic2any'));
      }
    };
    s.onerror = () => {
      heic2anyLoadPromise = null;
      reject(new Error('heic2any network'));
    };
    document.head.appendChild(s);
  });
  return heic2anyLoadPromise;
}

/** Форматирует размер файла: байты → читаемый вид (B / KB / MB / GB / TB). */
function fmtSize(bytes) {
  if (!Number.isFinite(bytes)) return '—';
  const abs = Math.max(0, Number(bytes));
  if (abs < 1024) return `${Math.round(abs)} B`;

  const units = ['KB', 'MB', 'GB', 'TB', 'PB'];
  let val = abs / 1024;
  let unitIdx = 0;
  while (val >= 1024 && unitIdx < units.length - 1) {
    val /= 1024;
    unitIdx += 1;
  }

  const precision = unitIdx >= 2 ? 2 : 1; // GB+ показываем точнее
  return `${val.toFixed(precision)} ${units[unitIdx]}`;
}

/**
 * Подбирает контрастный цвет подписи для превью.
 * Светлый фон -> тёмный текст, тёмный фон -> светлый текст.
 */
const toLinear = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

function updateCanvasLabelContrast(canvasEl, labelEl) {
  if (!canvasEl || !labelEl || !canvasEl.width || !canvasEl.height) return;
  try {
    const sampleSide = 24;
    const fallbackTopSampleRatio = 0.33; // На случай если ROI под текстом посчитать не удалось.

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = sampleSide;
    sampleCanvas.height = sampleSide;
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!sampleCtx) return;

    // 1) Берём область, реально занимаемую подписью (в CSS-пикселях).
    // 2) Переводим её в координаты canvasEl (в пикселях изображения).
    // 3) Делаем downscale ROI в sampleSide x sampleSide и считаем среднюю luminance.
    const canvasRect = canvasEl.getBoundingClientRect();
    const labelRect = labelEl.getBoundingClientRect();

    const canvasW = canvasRect.width || 0;
    const canvasH = canvasRect.height || 0;
    const labelW = labelRect.width || 0;
    const labelH = labelRect.height || 0;

    let sx1 = 0, sy1 = 0, sw = canvasEl.width, sh = canvasEl.height;

    const canUseRoi = canvasW > 0 && canvasH > 0 && labelW > 0 && labelH > 0;
    if (canUseRoi) {
      const pad = Math.max(4, Math.round(Math.min(labelW, labelH) * 0.25));

      const roiLeftCss = (labelRect.left - canvasRect.left) - pad;
      const roiTopCss = (labelRect.top - canvasRect.top) - pad;
      const roiRightCss = (labelRect.right - canvasRect.left) + pad;
      const roiBottomCss = (labelRect.bottom - canvasRect.top) + pad;

      const ix1 = Math.max(0, roiLeftCss);
      const iy1 = Math.max(0, roiTopCss);
      const ix2 = Math.min(canvasW, roiRightCss);
      const iy2 = Math.min(canvasH, roiBottomCss);

      const roiW = ix2 - ix1;
      const roiH = iy2 - iy1;

      if (roiW >= 1 && roiH >= 1) {
        const scaleX = canvasEl.width / canvasW;
        const scaleY = canvasEl.height / canvasH;
        sx1 = Math.round(ix1 * scaleX);
        sy1 = Math.round(iy1 * scaleY);
        sw = Math.max(1, Math.round(roiW * scaleX));
        sh = Math.max(1, Math.round(roiH * scaleY));
      } else {
        // ROI вылез за границы или слишком мал — откатываемся к fallback.
        const srcHeight = Math.max(1, Math.round(canvasEl.height * fallbackTopSampleRatio));
        sx1 = 0;
        sy1 = 0;
        sw = canvasEl.width;
        sh = srcHeight;
      }
    } else {
      const srcHeight = Math.max(1, Math.round(canvasEl.height * fallbackTopSampleRatio));
      sx1 = 0;
      sy1 = 0;
      sw = canvasEl.width;
      sh = srcHeight;
    }

    sampleCtx.drawImage(canvasEl, sx1, sy1, sw, sh, 0, 0, sampleSide, sampleSide);
    const data = sampleCtx.getImageData(0, 0, sampleSide, sampleSide).data;
    const pixels = data.length / 4;
    let luminanceSum = 0;
    for (let i = 0; i < data.length; i += 4) {
      luminanceSum += 0.2126 * toLinear(data[i]) + 0.7152 * toLinear(data[i + 1]) + 0.0722 * toLinear(data[i + 2]);
    }
    const avgLuminance = pixels ? luminanceSum / pixels : 0;
    labelEl.style.color = avgLuminance > 0.179 ? '#111111' : '#ffffff';
  } catch (_) {
    labelEl.style.color = '#ffffff';
  }
}
