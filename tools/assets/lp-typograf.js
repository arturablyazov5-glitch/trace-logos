/* Preset illustration only. Results verified with the shared product engine.
   No duplicated typography rules and no user-input processing on the landing. */
(function () {
  'use strict';
  var samples = [
    ['В "Север" - за новым...', 'В\u00a0«Север»\u00a0— за\u00a0новым…'],
    ['Доставка - 500руб. Вес - 10кг...', 'Доставка\u00a0— 500\u00a0₽ Вес\u00a0— 10\u00a0кг…'],
    ['Дизайн  - это "детали"...', 'Дизайн\u00a0— это\u00a0«детали»…']
  ];
  var text = document.getElementById('ty-demo-text');
  var state = document.getElementById('ty-demo-state');
  var note = document.getElementById('ty-demo-note');
  var stage = document.querySelector('.ty-demo-stage');
  var run = document.getElementById('ty-run');
  var index = 0;
  if (!text) return;
  function render(after) {
    text.textContent = '';
    var value = samples[index][after ? 1 : 0];
    if (after) {
      value.split('\u00a0').forEach(function (part, i) {
        if (i) {
          var dot = document.createElement('span');
          dot.className = 'ty-nbsp';
          dot.textContent = '·';
          dot.setAttribute('aria-label', 'неразрывный пробел');
          text.appendChild(dot);
        }
        text.appendChild(document.createTextNode(part));
      });
    } else text.textContent = value;
    stage.classList.toggle('is-after', after);
    state.textContent = after ? 'После обработки' : 'До обработки';
    note.textContent = after ? '· обозначает неразрывный пробел. В макете он невидимый.' : 'Нажмите кнопку, чтобы увидеть результат.';
  }
  document.querySelectorAll('[data-sample]').forEach(function (button) {
    button.addEventListener('click', function () {
      index = Number(button.getAttribute('data-sample'));
      document.querySelectorAll('[data-sample]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === button)); });
      render(false);
    });
  });
  run.addEventListener('click', function () { render(true); });
  document.getElementById('ty-reset').addEventListener('click', function () { render(false); });
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('ty-reveal'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.ty-section > .section-label').forEach(function (el) { observer.observe(el); });
  }
})();
