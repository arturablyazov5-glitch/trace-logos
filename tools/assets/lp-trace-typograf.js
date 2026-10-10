/* Interactive fixed examples. No duplicate text engine and no external dependencies. */
(function () {
  'use strict';
  var EN = document.documentElement.lang === 'en';
  var T = EN
    ? {
        valuetext: '% of the original text',
        applied: '<mark>«</mark>Good design<mark>»</mark> <mark>—</mark><br><span class="tt-bond">is in the details</span><mark>…</mark>',
        raw: '"Good design" -<br>is in the details...',
        done: 'Done — typography applied.', restored: 'Original example restored',
        revert: 'Restore original example', run: 'Apply typography',
        quotes: '«Good design»',
        bonds: '<span class="tt-bond">in place</span><br><span class="tt-bond">500\u00a0₽</span>',
        signs: 'Design — in the details…'
      }
    : {
        valuetext: '% исходного текста',
        applied: '<mark>«</mark>Хороший дизайн<mark>» —</mark><br><span class="tt-bond">в\u00a0деталях</span><mark>…</mark>',
        raw: '"Хороший дизайн" -<br>в деталях...',
        done: 'Готово — типографика расставлена.', restored: 'Исходный пример восстановлен',
        revert: 'Вернуть исходный пример', run: 'Расставить типограф',
        quotes: '«Хороший дизайн»',
        bonds: '<span class="tt-bond">на\u00a0месте</span><br><span class="tt-bond">500\u00a0₽</span>',
        signs: 'Дизайн — в\u00a0деталях…'
      };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var slider = document.getElementById('tt-slider');
  var range = document.getElementById('tt-slider-range');
  if (slider && range) {
    range.addEventListener('input', function () {
      slider.style.setProperty('--tt-split', range.value + '%');
      range.setAttribute('aria-valuetext', range.value + T.valuetext);
    });
  }
  var apply = document.getElementById('tt-hero-apply');
  if (apply) {
    var applied = false;
    apply.addEventListener('click', function () {
      applied = !applied;
      document.getElementById('tt-hero-example').innerHTML = applied ? T.applied : T.raw;
      document.querySelector('.tt-hero-editor').classList.toggle('is-applied', applied);
      document.getElementById('tt-hero-status').textContent = applied ? T.done : T.restored;
      apply.textContent = applied ? T.revert : T.run;
    });
  }
  if ('IntersectionObserver' in window) {
    if (!reduced.matches) document.documentElement.classList.add('tt-motion');
    var reveals = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          reveals.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });
    document.querySelectorAll('.tt-reveal').forEach(function (section) { reveals.observe(section); });
    var scenes = document.querySelectorAll('.tt-scene');
    var glyph = document.getElementById('tt-scroll-glyph');
    var sample = document.getElementById('tt-scroll-sample');
    var lines = document.querySelectorAll('.tt-scroll-track i');
    var states = {
      quotes: { glyph: '« »', text: T.quotes, index: 0 },
      bonds: { glyph: '⌒', text: T.bonds, index: 1 },
      signs: { glyph: '— …', text: T.signs, index: 2 }
    };
    function show(scene) {
      var state = states[scene];
      if (!state || !glyph || !sample) return;
      glyph.textContent = state.glyph;
      sample.innerHTML = state.text;
      lines.forEach(function (line, index) { line.classList.toggle('is-active', index === state.index); });
    }
    show('quotes');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) show(entry.target.getAttribute('data-scene'));
      });
    }, { rootMargin: '-25% 0px -25% 0px', threshold: 0 });
    scenes.forEach(function (scene) { observer.observe(scene); });
  }
})();
