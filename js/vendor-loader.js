// Ленивая загрузка вендорных UMD-библиотек (js/vendor/*) по первому требованию.
// JSZip не подключается в <head>: он нужен только при экспорте ZIP, поэтому
// скрипт инжектится при первом клике. Абсолютный путь — страницы живут на
// разной глубине (/logos/, /en/logos/<cat>/<slug>/), рантайм-инжект от неё
// не зависит.

let jszipPromise = null;

export function ensureJSZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip);
  if (jszipPromise) return jszipPromise;
  jszipPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = '/js/vendor/jszip.min.js';
    s.onload = () => {
      if (window.JSZip) resolve(window.JSZip);
      else reject(new Error('JSZip не инициализировался'));
    };
    s.onerror = () => {
      // Сбрасываем промис, чтобы следующий клик повторил попытку
      // (например, после восстановления сети).
      jszipPromise = null;
      s.remove();
      reject(new Error('Не удалось загрузить JSZip'));
    };
    document.head.appendChild(s);
  });
  return jszipPromise;
}

let confettiPromise = null;

export function ensureConfetti() {
  if (window.confetti) return Promise.resolve(window.confetti);
  if (confettiPromise) return confettiPromise;
  confettiPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = '/js/vendor/confetti.min.js';
    s.onload = () => {
      if (window.confetti) resolve(window.confetti);
      else reject(new Error('confetti не инициализировался'));
    };
    s.onerror = () => {
      confettiPromise = null;
      s.remove();
      reject(new Error('Не удалось загрузить confetti'));
    };
    document.head.appendChild(s);
  });
  return confettiPromise;
}
