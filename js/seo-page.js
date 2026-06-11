import { svgToPngBlob, triggerConfetti, parseSvgViewBox } from './svg-utils.js';
import { animateContainerHeight, showToast } from './utils.js';

// Page data injected by build script via window.__SEO_PAGE__
const PAGE = window.__SEO_PAGE__;

const BASE = PAGE.assetBase;
const btnRow       = document.getElementById('btn-row');
const previewCard  = document.getElementById('preview-card');
const previewMount = document.getElementById('preview-mount');
const previewImg   = document.getElementById('preview-img');
const btnCopy      = document.getElementById('btn-copy');
const btnCopyLbl   = document.getElementById('btn-copy-label');
const btnDlSvg     = document.getElementById('btn-dl-svg');
const btnDlPng     = document.getElementById('btn-dl-png');
const btnZip       = document.getElementById('btn-zip');
const btnZipLbl    = document.getElementById('btn-zip-label');
const btnZipProg   = document.getElementById('btn-zip-progress');
const lightbox     = document.getElementById('lightbox');
const lightboxInner = document.getElementById('lightbox-inner');
const lightboxImg  = document.getElementById('lightbox-img');

let currentSrc  = PAGE.defaultSrc;
let currentWide = PAGE.defaultWide;
let currentType = PAGE.defaultType;
let copyTimer   = null;

// ── Инициализация PNG-кнопки для дефолтного варианта ──
initPngBtn(currentSrc, currentWide, currentType, document.querySelector('[data-variant].active')?.dataset.png);

// ── Переключение вариантов ──
document.getElementById('variants-grid')?.addEventListener('click', e => {
  const card = e.target.closest('[data-variant]');
  if (!card) return;

  document.querySelectorAll('[data-variant]').forEach(el =>
    el.classList.toggle('active', el === card));

  currentSrc  = card.dataset.src;
  currentWide = card.dataset.wide === 'true';
  currentType = card.dataset.type;

  previewCard.classList.toggle('light-bg', currentWide);
  previewMount.className = currentWide ? 'preview-wide' : 'preview-icon';
  previewImg.src = currentSrc;
  previewImg.alt = card.querySelector('.variant-label').textContent;

  animateContainerHeight(btnRow, () => {
    if (currentType === 'svg') {
      btnCopy.style.display = '';
      btnDlSvg.style.display = '';
      btnDlSvg.href = currentSrc;
      btnDlSvg.download = currentSrc.split('/').pop();
    } else {
      btnCopy.style.display = 'none';
      btnDlSvg.style.display = 'none';
    }
    initPngBtn(currentSrc, currentWide, currentType, card.dataset.png);
  });
  resetCopy();
});

function initPngBtn(src, wide, type, pngSrc) {
  if (type === 'svg') {
    btnDlPng.style.display = '';
    btnDlPng.removeAttribute('href');
    btnDlPng.download = src.split('/').pop().replace('.svg', '.png');
    btnDlPng.onclick = e => { e.preventDefault(); downloadPngFromSvg(src, btnDlPng.download, !wide); };
  } else if (pngSrc || type === 'png') {
    const target = pngSrc || src;
    btnDlPng.style.display = '';
    btnDlPng.href = target;
    btnDlPng.download = target.split('/').pop();
    btnDlPng.onclick = null;
  } else {
    btnDlPng.style.display = 'none';
  }
}

function svgForFigma(svg) {
  let out = svg.trim();
  if (!currentWide) {
    out = out
      .replace(/^(<svg[^>]*?)\bwidth="[^"]*"/, '$1width="32"')
      .replace(/^(<svg[^>]*?)\bheight="[^"]*"/, '$1height="32"');
  } else {
    const vb = parseSvgViewBox(out);
    const w = (vb && vb.h > 0) ? Math.round((24 * vb.w / vb.h) * 100) / 100 : 24;
    out = out
      .replace(/^(<svg[^>]*?)\bwidth="[^"]*"/, `$1width="${w}"`)
      .replace(/^(<svg[^>]*?)\bheight="[^"]*"/, '$1height="24"');
  }
  if (PAGE.figma) out = out.replace(/^<svg/, `<svg id="${PAGE.figma}"`);
  return out;
}

// ── Копировать SVG ──
btnCopy.addEventListener('click', function() {
  fetch(currentSrc)
    .then(r => r.text())
    .then(svg => navigator.clipboard.writeText(svgForFigma(svg)))
    .then(() => {
      triggerConfetti(btnCopy);
      showToast('Скопировано SVG');
      btnCopyLbl.textContent = 'Скопировано!';
      btnCopy.disabled = true;
      if (copyTimer) clearTimeout(copyTimer);
      copyTimer = setTimeout(resetCopy, 2000);
    });
});

function resetCopy() {
  btnCopy.disabled = false;
  btnCopyLbl.textContent = 'Скопировать SVG';
}

// ── SVG → PNG ──
function downloadPngFromSvg(svgUrl, filename, square) {
  fetch(svgUrl)
    .then(r => r.text())
    .then(svg => svgToPngBlob(svg, { square, size: 1000 }))
    .then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    });
}

// ── Fullscreen / Lightbox ──
function openLightbox() {
  lightboxInner.className = 'lightbox-inner' + (currentWide ? ' wide' : '');
  lightboxImg.src = currentSrc;
  lightboxImg.alt = previewImg.alt;
  lightbox.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lightbox.classList.add('hidden');
  document.body.style.overflow = '';
}

// ── Цвета бренда: копирование hex по клику ──
document.querySelectorAll('.color-swatch').forEach(sw => {
  sw.addEventListener('click', async () => {
    const hex = sw.dataset.color;
    try {
      await navigator.clipboard.writeText(hex);
      triggerConfetti(sw);
      showToast(hex + ' скопирован');
    } catch { showToast('Не удалось скопировать'); }
  });
});

document.getElementById('btn-expand').addEventListener('click', e => { e.stopPropagation(); openLightbox(); });
document.getElementById('lightbox-close').addEventListener('click', e => { e.stopPropagation(); closeLightbox(); });
previewCard.addEventListener('click', openLightbox);
lightbox.addEventListener('click', closeLightbox);
lightboxInner.addEventListener('click', e => e.stopPropagation());
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// ── Скачать всё (.zip) ──
btnZip.addEventListener('click', async () => {
  if (typeof JSZip === 'undefined') return;
  btnZip.disabled = true;
  btnZipProg.style.width = '0%';
  btnZipLbl.textContent = 'Упаковываем...';
  try {
    const zip = new JSZip();
    for (let i = 0; i < PAGE.zipFiles.length; i++) {
      const { url, name } = PAGE.zipFiles[i];
      const blob = await fetch(url).then(r => r.blob());
      zip.file(name, blob);
      btnZipProg.style.width = Math.round((i + 1) / PAGE.zipFiles.length * 85) + '%';
    }
    const content = await zip.generateAsync({ type: 'blob' });
    btnZipProg.style.width = '100%';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = PAGE.zipName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  } catch (err) {
    console.error(err);
  } finally {
    setTimeout(() => {
      btnZip.disabled = false;
      btnZipLbl.textContent = 'Скачать всё (.zip)';
      btnZipProg.style.width = '0%';
    }, 1200);
  }
});

// ── Report outdated ──
const WORKER_URL = 'https://brand-icons-sanitizer.brand-icons.workers.dev/suggest';
const reportBtn = document.getElementById('btn-report-outdated');
const reportOverlay = document.getElementById('suggest-overlay');
if (reportBtn && reportOverlay) {
  const reportForm = document.getElementById('suggest-form');
  const reportResult = document.getElementById('suggest-result');
  const reportSubmit = document.getElementById('suggest-submit');

  document.getElementById('suggest-name').value = PAGE.name;

  document.getElementById('suggest-file').addEventListener('change', function () {
    const label = document.getElementById('suggest-file-label');
    const nameEl = document.getElementById('suggest-file-name');
    label.classList.toggle('has-file', !!this.files[0]);
    nameEl.textContent = this.files[0] ? this.files[0].name : 'Выбрать файл';
  });

  reportBtn.addEventListener('click', () => reportOverlay.classList.add('open'));
  document.getElementById('suggest-close').addEventListener('click', closeReportModal);
  reportOverlay.addEventListener('click', e => { if (e.target === reportOverlay) closeReportModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && reportOverlay.classList.contains('open')) closeReportModal(); });

  function closeReportModal() {
    reportOverlay.classList.remove('open');
    reportForm.reset();
    document.getElementById('suggest-name').value = PAGE.name;
    document.getElementById('suggest-comment').value = 'Логотип устарел, прошу обновить';
    document.getElementById('suggest-file-name').textContent = 'Выбрать файл';
    document.getElementById('suggest-file-label').classList.remove('has-file');
    reportResult.className = 'suggest-result';
    reportResult.textContent = '';
    reportSubmit.disabled = false;
  }

  reportForm.addEventListener('submit', async e => {
    e.preventDefault();
    const url = document.getElementById('suggest-url').value.trim();
    const comment = document.getElementById('suggest-comment').value.trim();
    const file = document.getElementById('suggest-file').files[0];

    if (url && !/^https?:\/\/.+\..+/.test(url)) {
      document.getElementById('suggest-url').classList.add('input-error');
      reportResult.className = 'suggest-result error';
      reportResult.textContent = 'Введите корректную ссылку (например, https://brand.com).';
      return;
    }
    if (file && file.size > 1 * 1024 * 1024) {
      document.getElementById('suggest-file-label').classList.add('file-error');
      reportResult.className = 'suggest-result error';
      reportResult.textContent = 'Файл слишком большой. Максимум — 1 МБ.';
      return;
    }

    reportSubmit.disabled = true;
    reportResult.className = 'suggest-result';
    reportResult.textContent = '';

    try {
      const fd = new FormData();
      fd.append('brand', PAGE.name);
      if (url) fd.append('url', url);
      if (comment) fd.append('comment', comment);
      if (file) fd.append('file', file, file.name);

      const res = await fetch(WORKER_URL, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
      if (data.ok) {
        reportForm.style.display = 'none';
        document.getElementById('suggest-modal-titles').style.display = 'none';
        const success = document.getElementById('suggest-success');
        success.classList.add('show');
        const bg = success.querySelector('.t-form-success-popup__content-icon-background');
        const check = success.querySelector('.t-form-success-popup__content-icon-check');
        bg.style.animation = 'none'; check.style.animation = 'none';
        void bg.offsetWidth;
        bg.style.animation = 'iconBackgroundOpacity .106s linear forwards, iconBackgroundTransform 1.103s cubic-bezier(.445,.05,.55,.95) forwards';
        check.style.animation = 'checkIconOpacity 51ms linear .437s forwards, checkIconDraw .666s cubic-bezier(.39,.575,.565,1) .437s forwards, checkIconScale .435s cubic-bezier(.445,.05,.55,.95) .437s forwards';
      } else {
        throw new Error(data.description);
      }
    } catch (err) {
      reportResult.className = 'suggest-result error';
      reportResult.textContent = 'Ошибка отправки. Попробуйте ещё раз.';
      reportSubmit.disabled = false;
    }
  });
}
