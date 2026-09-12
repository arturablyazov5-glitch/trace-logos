// ─────────────────────────────────────────────────────────────────────────────
// pwyw.js — «плати сколько хочешь» перед скачиванием продукта (модель Gumroad).
//
// Разметка страницы объявляет только продукт:
//     <button data-pwyw="reviews-exporter">Скачать</button>
// Всё остальное — сумма, пресеты, email, обращение к бэкенду — здесь.
//
// Ноль — валидная сумма и главный сценарий: человек забирает файл бесплатно
// одним кликом, почту у него не спрашиваем. Email нужен только платящим,
// потому что его требует invoice в lava.top.
//
// Файла на странице нет и быть не может: продукт лежит в приватном бакете
// Supabase Storage, ссылку выдаёт функция checkout по токену заказа. Поэтому
// оба сценария заканчиваются одинаково — переходом на /thanks/?t=<token>,
// который и показывает кнопку скачивания.
//
// Стили и разметка создаются по требованию — как в js/donate.js, чтобы ничего
// не добавлять в статические лендинги.
// ─────────────────────────────────────────────────────────────────────────────
import { t, getLang } from './i18n.js';

const ENDPOINT = 'https://wezryybxxwicysnbmhkz.supabase.co/functions/v1/checkout';
const REGISTRY = '/products.json';
const THANKS   = '/thanks/';

const CURRENCY_SIGN = { RUB: '₽', USD: '$', EUR: '€' };

let overlay = null;
let lastFocused = null;
let registry = null;      // products.json, загружается один раз
let current = null;       // { id, title } — продукт открытой модалки

function currency() {
  return getLang() === 'ru' ? 'RUB' : 'USD';
}

function formatAmount(value) {
  const cur = currency();
  const sign = CURRENCY_SIGN[cur] || '';
  return cur === 'RUB' ? `${value} ${sign}` : `${sign}${value}`;
}

async function loadRegistry() {
  if (registry) return registry;
  const res = await fetch(REGISTRY, { cache: 'no-cache' });
  if (!res.ok) throw new Error('registry_unavailable');
  registry = await res.json();
  return registry;
}

function ensureStyles() {
  if (document.querySelector('link[data-pwyw-css]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('../css/pwyw.css', import.meta.url).href;
  link.dataset.pwywCss = '1';
  document.head.appendChild(link);
}

// ─── Разметка ───────────────────────────────────────────────────────────────
function buildDom() {
  overlay = document.createElement('div');
  overlay.className = 'pw-overlay';
  overlay.innerHTML = `
    <div class="pw-modal" role="dialog" aria-modal="true" aria-labelledby="pw-title" tabindex="-1">
      <button type="button" class="pw-close" aria-label="${t('pwywCloseAria')}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>

      <div class="pw-head">
        <div class="pw-eyebrow">${t('pwywEyebrow')}</div>
        <h2 class="pw-title" id="pw-title"></h2>
        <p class="pw-text">${t('pwywText')}</p>
      </div>

      <form class="pw-form" novalidate>
        <div class="pw-presets" role="group" aria-label="${t('pwywPresetsAria')}"></div>

        <label class="pw-field">
          <span class="pw-label">${t('pwywAmountLabel')}</span>
          <span class="pw-input-wrap">
            <span class="pw-currency"></span>
            <input class="pw-amount" type="text" inputmode="decimal" autocomplete="off" value="0">
          </span>
          <span class="pw-hint">${t('pwywZeroHint')}</span>
        </label>

        <label class="pw-field pw-field-email" hidden>
          <span class="pw-label">${t('pwywEmailLabel')}</span>
          <input class="pw-email" type="email" autocomplete="email" placeholder="you@example.com">
          <span class="pw-hint">${t('pwywEmailHint')}</span>
        </label>

        <p class="pw-error" role="alert" hidden></p>

        <button type="submit" class="pw-submit"></button>
      </form>
    </div>
  `;

  overlay.querySelector('.pw-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('.pw-form').addEventListener('submit', onSubmit);

  const amountInput = overlay.querySelector('.pw-amount');
  amountInput.addEventListener('input', () => { syncAmountUi(); });
  // Пустое поле читается как ноль — «стереть всё» это тоже «беру бесплатно»,
  // а не сломанная форма.
  amountInput.addEventListener('blur', () => {
    if (!amountInput.value.trim()) { amountInput.value = '0'; syncAmountUi(); }
  });

  document.body.appendChild(overlay);
}

function renderPresets() {
  const box = overlay.querySelector('.pw-presets');
  const list = (registry?.presets?.[currency()]) || [];
  box.innerHTML = list
    .map((v) => `<button type="button" class="pw-preset" data-amount="${v}">${formatAmount(v)}</button>`)
    .join('');
  box.querySelectorAll('.pw-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      overlay.querySelector('.pw-amount').value = btn.dataset.amount;
      syncAmountUi();
    });
  });
}

function readAmount() {
  const raw = overlay.querySelector('.pw-amount').value.replace(',', '.').trim();
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// Один переключатель на всё, что зависит от суммы: подпись кнопки, видимость
// поля почты, подсветка выбранного пресета.
function syncAmountUi() {
  const amount = readAmount();
  const paying = amount > 0;

  overlay.querySelector('.pw-field-email').hidden = !paying;
  overlay.querySelector('.pw-submit').textContent = paying
    ? `${t('pwywPayCta')} ${formatAmount(amount)}`
    : t('pwywFreeCta');

  const value = String(overlay.querySelector('.pw-amount').value).replace(',', '.').trim();
  overlay.querySelectorAll('.pw-preset').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.amount === value);
  });

  showError('');
}

function showError(msg) {
  const box = overlay.querySelector('.pw-error');
  box.textContent = msg;
  box.hidden = !msg;
}

// ─── Отправка ───────────────────────────────────────────────────────────────
async function onSubmit(e) {
  e.preventDefault();
  const submit = overlay.querySelector('.pw-submit');
  const amount = readAmount();
  const email = overlay.querySelector('.pw-email').value.trim();

  if (amount > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    showError(t('pwywErrorEmail'));
    overlay.querySelector('.pw-email').focus();
    return;
  }

  submit.disabled = true;
  const label = submit.textContent;
  submit.textContent = t('pwywSending');

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product: current.id,
        amount,
        currency: currency(),
        email: amount > 0 ? email : undefined,
        lang: getLang(),
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && data.paymentUrl) { location.href = data.paymentUrl; return; }
    if (res.ok && data.token)      { location.href = `${THANKS}?t=${encodeURIComponent(data.token)}`; return; }

    // Платёжка ещё не подключена — честно говорим об этом и оставляем рабочим
    // бесплатный путь, вместо того чтобы упереть человека в тупик.
    if (res.status === 503 && data.error === 'payments_disabled') {
      overlay.querySelector('.pw-amount').value = '0';
      syncAmountUi();               // сбрасывает ошибку — поэтому текст ставим после
      showError(t('pwywErrorPaymentsOff'));
      return;
    }

    showError(errorText(data.error));
  } catch (_) {
    showError(t('pwywErrorNetwork'));
  } finally {
    submit.disabled = false;
    submit.textContent = label;
  }
}

function errorText(code) {
  switch (code) {
    case 'amount_too_small': return t('pwywErrorTooSmall');
    case 'amount_too_large': return t('pwywErrorTooLarge');
    case 'email_required':   return t('pwywErrorEmail');
    case 'unknown_product':  return t('pwywErrorProduct');
    default:                 return t('pwywErrorGeneric');
  }
}

// ─── Открытие / закрытие ────────────────────────────────────────────────────
function onKeydown(e) { if (e.key === 'Escape') close(); }

export async function openPwyw(productId) {
  ensureStyles();

  let reg;
  try {
    reg = await loadRegistry();
  } catch (_) {
    return;   // реестр не отдался — молча ничего не делаем, кнопка не «залипает»
  }

  const product = (reg.products || []).find((p) => p.id === productId);
  if (!product) return;

  current = {
    id: product.id,
    title: getLang() === 'en' ? (product.title_en || product.title) : product.title,
  };

  if (!overlay) buildDom();

  overlay.querySelector('.pw-title').textContent = current.title;
  overlay.querySelector('.pw-currency').textContent = CURRENCY_SIGN[currency()] || '';
  overlay.querySelector('.pw-amount').value = '0';
  overlay.querySelector('.pw-email').value = '';
  renderPresets();
  syncAmountUi();

  lastFocused = document.activeElement;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', onKeydown);
  // preventScroll: без залоченного body фокус на модалке сам скроллил бы
  // фоновую страницу, пытаясь «показать» элемент — модалка и так на экране.
  overlay.querySelector('.pw-modal')?.focus({ preventScroll: true });
}

function close() {
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', onKeydown);
  if (lastFocused?.isConnected) lastFocused.focus();
  lastFocused = null;
}

// Делегирование: кнопка может появиться на странице позже (и на нескольких
// лендингах сразу), отдельная инициализация каждой не нужна.
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-pwyw]');
  if (!trigger) return;
  e.preventDefault();
  openPwyw(trigger.dataset.pwyw);
});
