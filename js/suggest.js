import { t } from './i18n.js';

const WORKER_URL = 'https://wezryybxxwicysnbmhkz.supabase.co/functions/v1/suggest';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILE_SIZE_LABEL = '5 MB';

let _reportMode = false;

export function openReportModal(iconName) {
  _reportMode = true;
  const overlay = document.getElementById('suggest-overlay');
  document.getElementById('suggest-modal-titles').style.display = '';
  document.getElementById('suggest-title').textContent = t('suggestReportTitle');
  document.querySelector('#suggest-modal-titles .suggest-modal-sub').textContent = t('suggestReportSub');
  document.getElementById('suggest-success').classList.remove('show');
  const form = document.getElementById('suggest-form');
  form.style.display = '';
  form.reset();
  document.getElementById('suggest-file-name').textContent = t('suggestFileBtn');
  document.getElementById('suggest-file-label').classList.remove('has-file');
  document.getElementById('suggest-result').className = 'suggest-result';
  document.getElementById('suggest-result').textContent = '';
  document.getElementById('suggest-submit').disabled = false;
  const nameInput = document.getElementById('suggest-name');
  nameInput.value = iconName;
  nameInput.readOnly = true;
  document.getElementById('suggest-comment').value = t('suggestReportComment');
  overlay.classList.add('open');
}

function init() {
  const overlay   = document.getElementById('suggest-overlay');
  const form      = document.getElementById('suggest-form');
  const result    = document.getElementById('suggest-result');
  const submitBtn = document.getElementById('suggest-submit');

  function openModal() {
    _reportMode = false;
    document.getElementById('suggest-title').textContent = t('suggestDefaultTitle');
    document.querySelector('#suggest-modal-titles .suggest-modal-sub').textContent = t('suggestDefaultSub');
    overlay.classList.add('open');
    document.getElementById('suggest-name').focus();
  }

  function closeModal() {
    _reportMode = false;
    overlay.classList.remove('open');
    form.reset();
    form.style.display = '';
    document.getElementById('suggest-modal-titles').style.display = '';
    document.getElementById('suggest-title').textContent = t('suggestDefaultTitle');
    document.querySelector('#suggest-modal-titles .suggest-modal-sub').textContent = t('suggestDefaultSub');
    document.getElementById('suggest-success').classList.remove('show');
    document.getElementById('suggest-file-name').textContent = t('suggestFileBtn');
    document.getElementById('suggest-file-label').classList.remove('has-file');
    document.getElementById('suggest-name').readOnly = false;
    result.className = 'suggest-result';
    result.textContent = '';
    submitBtn.disabled = false;
  }

  document.getElementById('suggest-file').addEventListener('change', function () {
    const label = document.getElementById('suggest-file-label');
    const name  = document.getElementById('suggest-file-name');
    label.classList.remove('file-error');
    result.className = 'suggest-result';
    result.textContent = '';
    if (this.files[0]) {
      name.textContent = this.files[0].name;
      label.classList.add('has-file');
    } else {
      name.textContent = t('suggestFileBtn');
      label.classList.remove('has-file');
    }
  });

  document.getElementById('suggest-name').addEventListener('input', function () {
    this.classList.remove('input-error');
    result.className = 'suggest-result';
    result.textContent = '';
  });
  document.getElementById('suggest-url').addEventListener('input', function () {
    this.classList.remove('input-error');
    document.getElementById('suggest-file-label').classList.remove('file-error');
    result.className = 'suggest-result';
    result.textContent = '';
  });

  document.getElementById('suggest-btn-desktop').addEventListener('click', openModal);
  document.getElementById('suggest-btn-mobile').addEventListener('click', openModal);
  document.getElementById('suggest-btn-sidebar')?.addEventListener('click', openModal);
  document.getElementById('suggest-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const brand   = document.getElementById('suggest-name').value.trim();
    const url     = document.getElementById('suggest-url').value.trim();
    const comment = document.getElementById('suggest-comment').value.trim();
    const file    = document.getElementById('suggest-file').files[0];

    if (!brand) {
      document.getElementById('suggest-name').classList.add('input-error');
      document.getElementById('suggest-name').focus();
      result.className = 'suggest-result error';
      result.textContent = t('suggestErrorRequired');
      result.style.display = 'block';
      return;
    }
    if (!_reportMode && !url && !file) {
      document.getElementById('suggest-url').classList.add('input-error');
      document.getElementById('suggest-file-label').classList.add('file-error');
      result.className = 'suggest-result error';
      result.textContent = t('suggestErrorNoFile');
      result.style.display = 'block';
      return;
    }
    if (url && !/^https?:\/\/.+\..+/.test(url)) {
      document.getElementById('suggest-url').classList.add('input-error');
      document.getElementById('suggest-url').focus();
      result.className = 'suggest-result error';
      result.textContent = t('suggestErrorBadUrl');
      result.style.display = 'block';
      return;
    }
    if (file && file.size > MAX_FILE_SIZE) {
      document.getElementById('suggest-file-label').classList.add('file-error');
      result.className = 'suggest-result error';
      result.textContent = t('suggestErrorFileSize')(MAX_FILE_SIZE_LABEL);
      result.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    result.className = 'suggest-result';
    result.textContent = '';

    try {
      const fd = new FormData();
      fd.append('brand', brand);
      if (url)     fd.append('url', url);
      if (comment) fd.append('comment', comment);
      if (file)    fd.append('file', file, file.name);

      const res  = await fetch(WORKER_URL, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('suggestErrorServer'));
      if (data.ok) {
        form.style.display = 'none';
        document.getElementById('suggest-modal-titles').style.display = 'none';
        const success = document.getElementById('suggest-success');
        success.classList.add('show');
        const bg    = success.querySelector('.t-form-success-popup__content-icon-background');
        const check = success.querySelector('.t-form-success-popup__content-icon-check');
        if (bg && check) {
          bg.style.animation = 'none'; check.style.animation = 'none';
          void bg.offsetWidth;
          bg.style.animation    = 'iconBackgroundOpacity .106s linear forwards, iconBackgroundTransform 1.103s cubic-bezier(.445,.05,.55,.95) forwards';
          check.style.animation = 'checkIconOpacity 51ms linear .437s forwards, checkIconDraw .666s cubic-bezier(.39,.575,.565,1) .437s forwards, checkIconScale .435s cubic-bezier(.445,.05,.55,.95) .437s forwards';
        }
      } else {
        throw new Error(data.description);
      }
    } catch (err) {
      result.className = 'suggest-result error';
      result.textContent = t('suggestErrorSend');
      submitBtn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
