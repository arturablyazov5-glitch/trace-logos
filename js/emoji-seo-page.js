import { showToast, animateContainerHeight } from './utils.js';
import { triggerConfetti } from './svg-utils.js';

const PAGE        = window.__EMOJI_PAGE__;
const previewImg  = document.getElementById('preview-img');
const btnCopyChar = document.getElementById('btn-copy-char');
const btnCopyLbl  = document.getElementById('btn-copy-lbl');
const btnDl       = document.getElementById('btn-dl');
const btnDlLbl    = document.getElementById('btn-dl-lbl');
const btnRow      = document.getElementById('btn-row');
const grid        = document.getElementById('evar-grid');
const btnZip      = document.getElementById('btn-zip');
const btnZipLbl   = document.getElementById('btn-zip-label');
const btnZipProg  = document.getElementById('btn-zip-progress');

let copyTimer = null;

function updateDlBtn(card) {
  if (!btnDl || !card) return;
  const src      = card.dataset.src;
  const ext      = card.dataset.ext;
  const size     = card.dataset.size;
  const filename = card.dataset.filename;
  const vendor   = card.dataset.vendor;
  btnDl.href     = src;
  btnDl.download = filename;
  if (btnDlLbl) btnDlLbl.textContent = `${ext} (${vendor})`;
  const sizeEl = btnDl.querySelector('.btn-size');
  if (sizeEl) sizeEl.textContent = size || '';
}

// Init from the active card on load
updateDlBtn(grid?.querySelector('.evar-card.active'));

// Switch vendor variant
if (grid) {
  grid.addEventListener('click', e => {
    const card = e.target.closest('.evar-card');
    if (!card) return;
    grid.querySelectorAll('.evar-card').forEach(el => el.classList.toggle('active', el === card));
    if (previewImg) {
      previewImg.src = card.dataset.src;
      previewImg.alt = card.dataset.vendor || previewImg.alt;
    }
    animateContainerHeight(btnRow, () => updateDlBtn(card));
  });
}

// Copy emoji character
if (btnCopyChar) {
  btnCopyChar.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btnCopyChar.dataset.char || '');
      triggerConfetti(btnCopyChar);
      showToast('Эмодзи скопирован');
      if (btnCopyLbl) btnCopyLbl.textContent = 'Скопировано!';
      btnCopyChar.disabled = true;
      if (copyTimer) clearTimeout(copyTimer);
      copyTimer = setTimeout(() => {
        btnCopyChar.disabled = false;
        if (btnCopyLbl) btnCopyLbl.textContent = 'Скопировать эмодзи';
      }, 2000);
    } catch {
      showToast('Не удалось скопировать');
    }
  });
}

// Download all (.zip)
if (btnZip && PAGE) {
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
}
