import { t } from './i18n.js';

const WORKER_URL = 'https://wezryybxxwicysnbmhkz.supabase.co/functions/v1/upload';
const MAX_FILES = 5;

let _openHelpModal = null;
export function openHelpModal(iconName) {
  if (_openHelpModal) _openHelpModal(iconName);
}

function init() {
  const overlay    = document.getElementById('help-overlay');
  const form       = document.getElementById('help-form');
  // Help-modal markup isn't present on every page that loads main.js
  // (e.g. generated category pages). Bail quietly instead of throwing.
  if (!overlay || !form) return;
  const closeBtn   = document.getElementById('help-close');
  const iconNameEl = document.getElementById('help-icon-name');
  const successEl  = document.getElementById('help-success');
  const titlesEl   = document.getElementById('help-modal-titles');
  const submitBtn  = form.querySelector('[type=submit]');
  const errorEl    = document.getElementById('help-error');
  const input      = document.getElementById('help-file-input');
  const labelEl    = document.getElementById('help-file-label');
  const chipsEl    = document.getElementById('help-file-chips');

  let selected = [];   // выбранные файлы (управляем сами — input.files read-only)

  function showError(msg) {
    errorEl.textContent = msg || '';
    errorEl.style.display = msg ? '' : 'none';
  }

  const fileKey = f => `${f.name}|${f.size}|${f.lastModified}`;

  function syncState() {
    const over = selected.length > MAX_FILES;
    labelEl.classList.toggle('has-file', selected.length > 0);
    labelEl.classList.toggle('file-error', over);
    showError(over ? t('helpTooManyFiles')(MAX_FILES) : '');
    submitBtn.disabled = selected.length === 0 || over;
  }

  function renderChips() {
    chipsEl.innerHTML = '';
    selected.forEach((f, i) => {
      const chip = document.createElement('span');
      chip.className = 'help-file-chip' + (i >= MAX_FILES ? ' over' : '');
      const name = document.createElement('span');
      name.className = 'help-file-chip-name';
      name.textContent = f.name;
      const x = document.createElement('button');
      x.type = 'button';
      x.className = 'help-file-chip-x';
      x.setAttribute('aria-label', `Удалить ${f.name}`);
      x.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
      x.addEventListener('click', () => { selected.splice(i, 1); renderChips(); syncState(); });
      chip.append(name, x);
      chipsEl.appendChild(chip);
    });
  }

  input.addEventListener('change', () => {
    const seen = new Set(selected.map(fileKey));
    for (const f of input.files) {
      if (!seen.has(fileKey(f))) { selected.push(f); seen.add(fileKey(f)); }
    }
    input.value = '';   // позволяет выбрать тот же файл снова после удаления
    renderChips();
    syncState();
  });

  let currentIconName = '';

  _openHelpModal = function (iconName) {
    currentIconName = iconName;
    iconNameEl.textContent = iconName;
    form.style.display = '';
    successEl.classList.remove('show');
    titlesEl.style.display = '';
    submitBtn.textContent = t('suggestSubmit');
    input.value = '';
    selected = [];
    renderChips();
    syncState();
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal(); });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (selected.length === 0 || selected.length > MAX_FILES) { syncState(); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправляем…';

    try {
      showError('');

      const fd = new FormData();
      fd.append('icon_name', currentIconName);
      selected.forEach(f => fd.append('file', f, f.name));

      const res  = await fetch(WORKER_URL, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сервера');

      form.style.display = 'none';
      titlesEl.style.display = 'none';
      successEl.classList.add('show');
      const bg = successEl.querySelector('.t-form-success-popup__content-icon-background');
      const check = successEl.querySelector('.t-form-success-popup__content-icon-check');
      bg.style.animation = 'none'; check.style.animation = 'none';
      void bg.offsetWidth;
      bg.style.animation = 'iconBackgroundOpacity .106s linear forwards, iconBackgroundTransform 1.103s cubic-bezier(.445,.05,.55,.95) forwards';
      check.style.animation = 'checkIconOpacity 51ms linear .437s forwards, checkIconDraw .666s cubic-bezier(.39,.575,.565,1) .437s forwards, checkIconScale .435s cubic-bezier(.445,.05,.55,.95) .437s forwards';

    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = t('suggestSubmit');
      errorEl.textContent = err.message || 'Ошибка отправки. Попробуйте ещё раз.';
      errorEl.style.display = '';
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
