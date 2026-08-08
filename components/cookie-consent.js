// Cookie consent banner — shown on every page until the user accepts it once.
const STORAGE_KEY = 'cookieConsentAccepted';

const LABELS = {
  ru: { text: 'Мы используем куки, чтобы делать сайт удобным для вас', btn: 'Хорошо', btnAccepted: 'Кайф!', more: 'Подробнее', moreHref: '/consent/' },
  en: { text: 'We use cookies to make this site convenient for you', btn: 'Got it', btnAccepted: 'Nice!', more: 'Learn more', moreHref: '/en/consent/' },
  es: { text: 'Usamos cookies para que el sitio sea cómodo para ti', btn: 'Entendido', btnAccepted: 'Listo', more: 'Más información', moreHref: '/es/consent/' },
};

function mount() {
  if (localStorage.getItem(STORAGE_KEY) === '1') return;

  const lang = (typeof window.__LANG__ === 'string' ? window.__LANG__ : null)
    || (['en', 'es'].includes(location.pathname.split('/').filter(Boolean)[0])
      ? location.pathname.split('/').filter(Boolean)[0]
      : 'ru')
    || 'ru';
  const { text, btn, btnAccepted, more, moreHref } = LABELS[lang] ?? LABELS.ru;

  if (!document.getElementById('cookie-consent-style')) {
    const style = document.createElement('style');
    style.id = 'cookie-consent-style';
    style.textContent = `
      @keyframes cookie-consent-in {
        0%   { opacity: 0; transform: translateY(60px); }
        60%  { opacity: 1; transform: translateY(-6px); }
        80%  { transform: translateY(2px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes cookie-consent-emoji-in {
        0%   { opacity: 0; transform: scale(.3) rotate(-35deg); }
        55%  { opacity: 1; transform: scale(1.25) rotate(12deg); }
        75%  { transform: scale(.92) rotate(-6deg); }
        100% { transform: scale(1) rotate(0); }
      }
      @keyframes cookie-consent-out {
        0%   { opacity: 1; transform: translateY(0) rotate(0); }
        30%  { transform: translateY(-6px) rotate(-1deg); }
        100% { opacity: 0; transform: translateY(50px) rotate(3deg); }
      }
      @keyframes cookie-consent-btn-pop {
        0%   { transform: scale(1); }
        35%  { transform: scale(.85); }
        65%  { transform: scale(1.18); }
        100% { transform: scale(1); }
      }
      @keyframes cookie-consent-text-out {
        0%   { opacity: 1; transform: translateY(0) scale(1); }
        100% { opacity: 0; transform: translateY(-14px) scale(.6); }
      }
      @keyframes cookie-consent-text-in {
        0%   { opacity: 0; transform: translateY(14px) scale(.5) rotate(-8deg); }
        60%  { opacity: 1; transform: translateY(-3px) scale(1.12) rotate(3deg); }
        100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); }
      }
      #cookie-consent {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 9999;
        max-width: 240px;
        padding: 32px 20px 20px;
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.14);
        font-family: inherit;
        transform-origin: bottom right;
        animation: cookie-consent-in .6s cubic-bezier(.22,1.4,.36,1);
      }
      #cookie-consent.cookie-consent-closing {
        animation: cookie-consent-out .35s cubic-bezier(.4,0,1,1) forwards;
        pointer-events: none;
      }
      @media (prefers-reduced-motion: reduce) {
        #cookie-consent, #cookie-consent .cookie-consent-emoji { animation: none; }
      }
      #cookie-consent .cookie-consent-emoji {
        position: absolute;
        top: -20px;
        left: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 4px 14px rgba(0,0,0,0.16);
        font-size: 24px;
        line-height: 1;
        animation: cookie-consent-emoji-in .55s .25s cubic-bezier(.34,1.56,.64,1) backwards;
      }
      #cookie-consent p {
        margin: 0 0 14px;
        font-size: 14px;
        line-height: 1.45;
        color: #1a1a1a;
      }
      #cookie-consent-accept {
        appearance: none;
        border: none;
        background: #f0f0f0;
        color: #1a1a1a;
        font-size: 14px;
        font-weight: 400;
        padding: 9px 18px;
        border-radius: 12px;
        cursor: pointer;
        overflow: hidden;
      }
      #cookie-consent-accept:hover { background: #e4e4e4; }
      #cookie-consent-accept.cookie-consent-accepted {
        background: #ece3fb;
        color: #5b21b6;
        cursor: default;
        animation: cookie-consent-btn-pop .5s cubic-bezier(.34,1.56,.64,1);
      }
      #cookie-consent-accept .cookie-consent-btn-text {
        display: inline-block;
      }
      #cookie-consent-accept .cookie-consent-btn-text.cookie-consent-text-swap-out {
        animation: cookie-consent-text-out .18s ease-in forwards;
      }
      #cookie-consent-accept .cookie-consent-btn-text.cookie-consent-text-swap-in {
        animation: cookie-consent-text-in .45s .18s cubic-bezier(.34,1.56,.64,1) backwards;
      }
      @media (prefers-reduced-motion: reduce) {
        #cookie-consent-accept.cookie-consent-accepted,
        #cookie-consent-accept .cookie-consent-btn-text { animation: none; }
      }
      #cookie-consent .cookie-consent-more {
        color: #888;
        text-decoration: underline;
      }
      #cookie-consent .cookie-consent-more:hover { color: #1a1a1a; }
      @media (max-width: 480px) {
        #cookie-consent { right: 10px; bottom: 10px; }
      }
    `;
    document.head.appendChild(style);
  }

  const el = document.createElement('div');
  el.id = 'cookie-consent';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-labelledby', 'cookie-consent-text');
  el.innerHTML = `
    <span class="cookie-consent-emoji" aria-hidden="true">🍪</span>
    <p id="cookie-consent-text">${text}. <a class="cookie-consent-more" href="${moreHref}" target="_blank" rel="noopener">${more}</a></p>
    <button type="button" id="cookie-consent-accept"><span class="cookie-consent-btn-text">${btn}</span></button>
  `;
  document.body.appendChild(el);

  el.querySelector('#cookie-consent-accept').addEventListener('click', (e) => {
    localStorage.setItem(STORAGE_KEY, '1');
    const btnEl = e.currentTarget;
    btnEl.disabled = true;
    btnEl.classList.add('cookie-consent-accepted');

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const label = btnEl.querySelector('.cookie-consent-btn-text');

    if (reduceMotion) {
      label.textContent = btnAccepted;
    } else {
      label.classList.add('cookie-consent-text-swap-out');
      let swapped = false;
      const swap = () => {
        if (swapped) return;
        swapped = true;
        label.textContent = btnAccepted;
        label.classList.remove('cookie-consent-text-swap-out');
        label.classList.add('cookie-consent-text-swap-in');
      };
      label.addEventListener('animationend', swap, { once: true });
      setTimeout(swap, 180); // fallback in case the animation can't run (e.g. backgrounded tab)
    }

    const close = () => {
      if (reduceMotion) {
        el.remove();
        return;
      }
      el.addEventListener('animationend', () => el.remove(), { once: true });
      el.classList.add('cookie-consent-closing');
    };
    setTimeout(close, 900);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
