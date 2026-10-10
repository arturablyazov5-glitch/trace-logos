(function () {
  'use strict';
  var layers = document.getElementById('cl-demo-layers');
  var paints = document.getElementById('cl-demo-paints');
  var count = document.getElementById('cl-demo-count');
  var result = document.getElementById('cl-demo-result');
  function update() {
    var parts = [];
    if (!layers.disabled) parts.push('1 скрытый слой');
    if (!paints.disabled) parts.push('2 скрытые записи оформления');
    count.textContent = parts.length ? parts.join(', ') : 'Скрытого не найдено';
  }
  layers.addEventListener('click', function () {
    document.querySelector('[data-demo-layer]').hidden = true;
    layers.disabled = true;
    result.textContent = 'Пример: скрытый черновик удалён. Видимые слои остались.';
    update();
  });
  paints.addEventListener('click', function () {
    document.querySelectorAll('[data-demo-paint]').forEach(function (el) { el.hidden = true; });
    paints.disabled = true;
    result.textContent = 'Пример: выключенные заливка и тень удалены. Карточка осталась.';
    update();
  });
  document.getElementById('cl-reset').addEventListener('click', function () {
    document.querySelectorAll('[data-demo-layer], [data-demo-paint]').forEach(function (el) { el.hidden = false; });
    layers.disabled = false;
    paints.disabled = false;
    result.textContent = 'Нажмите любую кнопку — порядок не важен.';
    update();
  });
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('cl-reveal');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.cl-main .section').forEach(function (el) { observer.observe(el); });
  }
})();
