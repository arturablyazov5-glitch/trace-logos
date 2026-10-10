/* Product illustrations on fixed examples, verified against the shared engine.
   No copy of typography rules; no user-text processing or external requests. */
(function () {
  'use strict';
  var EN = document.documentElement.lang === 'en';
  var T = EN ? {
    run: 'Fix typography', hint: 'Try it on this example', busy: 'Processing the example', original: 'Show original', done: 'Changed 1 of 1 · example',
    range: function (v) { return v + '% original text; ' + (100 - Number(v)) + '% processed'; }
  } : {
    run: 'Расставить типографику', hint: 'Попробуйте на этом примере', busy: 'Обрабатывается пример', original: 'Показать исходник', done: 'Изменён 1 из 1 · пример',
    range: function (v) { return v + ' процентов исходного текста; ' + (100 - Number(v)) + ' процентов обработанного'; }
  };
  var root = document.querySelector('.ty-main');
  if (!root) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hero = document.querySelector('.ty-hero-stage');
  var run = document.getElementById('ty-hero-run');
  var status = document.getElementById('ty-hero-status');
  var timer;
  run.addEventListener('click', function () {
    clearTimeout(timer);
    var done = hero.classList.contains('is-done');
    if (done) {
      hero.classList.remove('is-done', 'is-running');
      run.textContent = T.run;
      status.textContent = T.hint;
      return;
    }
    hero.classList.add('is-running');
    run.disabled = true;
    status.textContent = T.busy;
    timer = setTimeout(function () {
      hero.classList.remove('is-running');
      hero.classList.add('is-done');
      run.disabled = false;
      run.textContent = T.original;
      status.textContent = T.done;
    }, reduced ? 0 : 700);
  });
  var range = document.getElementById('ty-compare-range');
  var comparison = document.querySelector('.ty-comparison');
  function updateRange() {
    comparison.style.setProperty('--split', range.value + '%');
    range.setAttribute('aria-valuetext', T.range(range.value));
  }
  range.addEventListener('input', updateRange);
  // Explicit touch tracking keeps the full-height handle usable on mobile.
  // Vertical gestures still scroll the page through touch-action: pan-y.
  var touchPointer = null;
  function touchPosition(event) {
    var box = range.getBoundingClientRect();
    range.value = String(Math.max(0, Math.min(100, Math.round((event.clientX - box.left) / box.width * 100))));
    updateRange();
  }
  range.addEventListener('pointerdown', function (event) {
    if (event.pointerType !== 'touch') return;
    event.preventDefault();
    touchPointer = event.pointerId;
    range.setPointerCapture(event.pointerId);
    touchPosition(event);
  });
  range.addEventListener('pointermove', function (event) {
    if (event.pointerId === touchPointer) touchPosition(event);
  });
  function releaseTouch(event) {
    if (event.pointerId === touchPointer) touchPointer = null;
  }
  range.addEventListener('pointerup', releaseTouch);
  range.addEventListener('pointercancel', releaseTouch);
  updateRange();
  var sticky = document.querySelector('.ty-story-sticky .ty-frame-scene');
  var beats = document.querySelectorAll('[data-beat]');
  function setBeat(index) {
    sticky.setAttribute('data-scene', String(index));
    beats.forEach(function (beat, i) { beat.classList.toggle('is-active', i === index); });
  }
  setBeat(0);
  if ('IntersectionObserver' in window) {
    var beatObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setBeat(Number(entry.target.getAttribute('data-beat')));
      });
    }, { rootMargin: '-35% 0px -35% 0px', threshold: 0 });
    beats.forEach(function (beat) { beatObserver.observe(beat); });
    if (!reduced) {
      root.classList.add('ty-motion');
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
        });
      }, { rootMargin: '0px 0px 60px 0px', threshold: 0.04 });
      document.querySelectorAll('.ty-reveal').forEach(function (element) { revealObserver.observe(element); });
    }
  } else beats.forEach(function (beat) { beat.classList.add('is-active'); });
})();
