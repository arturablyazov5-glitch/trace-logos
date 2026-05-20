const WORKER_URL = 'https://brand-icons-sanitizer.brand-icons.workers.dev/upload';

const fields = [
  { id: 'help-favicon',  labelId: 'help-favicon-label',  nameId: 'help-favicon-name',  required: true,  key: 'Favicon',  formKey: 'favicon'  },
  { id: 'help-full',     labelId: 'help-full-label',     nameId: 'help-full-name',     required: false, key: 'Full',     formKey: 'full'     },
  { id: 'help-fullen',   labelId: 'help-fullen-label',   nameId: 'help-fullen-name',   required: false, key: 'Full EN',  formKey: 'full_en'  },
];

function init() {
  const overlay    = document.getElementById('help-overlay');
  const form       = document.getElementById('help-form');
  const closeBtn   = document.getElementById('help-close');
  const iconNameEl = document.getElementById('help-icon-name');
  const successEl  = document.getElementById('help-success');
  const titlesEl   = document.getElementById('help-modal-titles');
  const submitBtn  = form.querySelector('[type=submit]');
  const errorEl    = document.getElementById('help-error');

  fields.forEach(f => {
    const input = document.getElementById(f.id + '-input');
    const nameEl = document.getElementById(f.nameId);
    const labelEl = document.getElementById(f.labelId);
    input.addEventListener('change', () => {
      const file = input.files[0];
      labelEl.classList.toggle('has-file', !!file);
      labelEl.classList.remove('file-error');
      nameEl.textContent = file ? file.name : 'Выбрать SVG-файл';
    });
  });

  let currentIconName = '';

  window.openHelpModal = function (iconName) {
    currentIconName = iconName;
    iconNameEl.textContent = iconName;
    form.style.display = '';
    successEl.classList.remove('show');
    titlesEl.style.display = '';
    submitBtn.disabled = false;
    errorEl.style.display = 'none';
    errorEl.textContent = '';
    fields.forEach(f => {
      const input = document.getElementById(f.id + '-input');
      const nameEl = document.getElementById(f.nameId);
      const labelEl = document.getElementById(f.labelId);
      input.value = '';
      nameEl.textContent = 'Выбрать SVG-файл';
      labelEl.classList.remove('has-file', 'file-error');
    });
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const faviconInput = document.getElementById('help-favicon-input');
    const faviconLabel = document.getElementById('help-favicon-label');
    if (!faviconInput.files[0]) {
      faviconLabel.classList.add('file-error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправляем…';

    try {
      errorEl.style.display = 'none';
      errorEl.textContent = '';

      const fd = new FormData();
      fd.append('icon_name', currentIconName);
      fields.forEach(f => {
        const input = document.getElementById(f.id + '-input');
        if (input.files[0]) fd.append(f.formKey, input.files[0]);
      });

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
      submitBtn.textContent = 'Отправить';
      errorEl.textContent = err.message || 'Ошибка отправки. Попробуйте ещё раз.';
      errorEl.style.display = '';
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
