(function () {
  'use strict';
  var EN = document.documentElement.lang === 'en';
  var T = EN ? {
    layer: '1 hidden layer', paint: '2 hidden style entries', none: 'Nothing hidden found',
    layersDone: 'Example: the hidden variant is gone. Visible layers stay.',
    paintsDone: 'Example: the disabled fill and shadow are gone. The layer itself stays.',
    hint: 'Try both buttons. In any order.',
    clean: function (v) { return 'Clean tree: ' + v + '% of the example width'; },
    states: ['Card selected', 'Disabled removed', 'Covered removed']
  } : {
    layer: '1 скрытый слой', paint: '2 скрытые записи оформления', none: 'Скрытого не найдено',
    layersDone: 'Пример: скрытый вариант удалён. Видимые слои остались.',
    paintsDone: 'Пример: выключенные заливка и тень удалены. Сам слой остался.',
    hint: 'Попробуйте обе кнопки. В любом порядке.',
    clean: function (v) { return 'Чистое дерево: ' + v + '% ширины примера'; },
    states: ['Выбрана карточка', 'Выключенное удалено', 'Перекрытое удалено']
  };
  var layers = document.getElementById('cl-demo-layers');
  var paints = document.getElementById('cl-demo-paints');
  var count = document.getElementById('cl-demo-count');
  var result = document.getElementById('cl-demo-result');
  function update() {
    var parts = [];
    if (!layers.disabled) parts.push(T.layer);
    if (!paints.disabled) parts.push(T.paint);
    count.textContent = parts.length ? parts.join(', ') : T.none;
  }
  layers.addEventListener('click', function () {
    document.querySelector('[data-demo-layer]').hidden = true;
    layers.disabled = true;
    result.textContent = T.layersDone;
    update();
  });
  paints.addEventListener('click', function () {
    document.querySelectorAll('[data-demo-paint]').forEach(function (el) { el.hidden = true; });
    paints.disabled = true;
    result.textContent = T.paintsDone;
    update();
  });
  document.getElementById('cl-reset').addEventListener('click', function () {
    document.querySelectorAll('[data-demo-layer], [data-demo-paint]').forEach(function (el) { el.hidden = false; });
    layers.disabled = false;
    paints.disabled = false;
    result.textContent = T.hint;
    update();
  });
  var range = document.getElementById('cl-range');
  function compare() {
    var value = Number(range.value);
    document.getElementById('cl-clean-tree').style.clipPath = 'inset(0 ' + (100 - value) + '% 0 0)';
    document.getElementById('cl-scrub-line').style.left = value + '%';
    range.setAttribute('aria-valuetext', T.clean(value));
  }
  range.addEventListener('input', compare);
  compare();
  var art = document.getElementById('cl-sticky-art');
  var state = document.getElementById('cl-stack-state');
  var states = T.states;
  document.querySelectorAll('.cl-scroll-step').forEach(function (step) {
    var copy = art.cloneNode(true);
    copy.removeAttribute('id');
    copy.classList.add('cl-mobile-stage');
    copy.setAttribute('data-stage', step.getAttribute('data-stage'));
    var label = copy.querySelector('#cl-stack-state');
    label.removeAttribute('id');
    label.removeAttribute('aria-live');
    label.textContent = states[Number(step.getAttribute('data-stage'))];
    step.appendChild(copy);
  });
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window) {
    var stageObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var stage = entry.target.getAttribute('data-stage');
          art.setAttribute('data-stage', stage);
          state.textContent = states[Number(stage)];
        }
      });
    }, { rootMargin: '-25% 0px -35% 0px', threshold: 0 });
    document.querySelectorAll('.cl-scroll-step').forEach(function (el) { stageObserver.observe(el); });
    if (!reduced) {
      var reveal = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('cl-reveal');
            reveal.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      document.querySelectorAll('.cl-ba-copy, .cl-scroll-heading, .cl-scroll-step, .cl-manifesto h2, .cl-install-copy, .cl-final h2').forEach(function (el) { reveal.observe(el); });
    }
  }
})();
