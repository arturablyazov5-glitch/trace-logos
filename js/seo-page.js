import { svgToPngBlob, triggerConfetti } from './svg-utils.js';
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

// ── Копировать SVG ──
btnCopy.addEventListener('click', function() {
  fetch(currentSrc)
    .then(r => r.text())
    .then(svg => navigator.clipboard.writeText(svg))
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
