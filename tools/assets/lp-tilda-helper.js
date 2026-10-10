(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EN = document.documentElement.lang === 'en';
  var T = EN
    ? { code: 'T123 code copied', copied: 'Copied: ', manual: 'Copy manually: ' }
    : { code: 'Код T123 скопирован', copied: 'Скопировано: ', manual: 'Скопируйте вручную: ' };
  var status = document.getElementById('th-copy-status');
  var timer;
  document.querySelectorAll('[data-th-copy]').forEach(function (button) {
    button.addEventListener('click', async function () {
      var value = button.getAttribute('data-th-copy');
      try {
        await navigator.clipboard.writeText(value);
        status.textContent = value.length > 40 ? T.code : T.copied + value;
      } catch (error) { status.textContent = T.manual + value; }
      status.classList.add('is-visible');
      clearTimeout(timer);
      timer = setTimeout(function () { status.classList.remove('is-visible'); }, 2500);
    });
  });
  var range = document.getElementById('th-compare-range');
  var wipe = document.getElementById('th-wipe');
  function setSplit(value) {
    value = Math.max(0, Math.min(100, value));
    range.value = value;
    wipe.style.setProperty('--th-split', value + '%');
  }
  range.addEventListener('input', function () { setSplit(Number(range.value)); });
  var dragging = false;
  wipe.addEventListener('pointerdown', function (event) {
    if (event.target.closest('button')) return;
    dragging = true;
    wipe.setPointerCapture(event.pointerId);
    var rect = wipe.getBoundingClientRect();
    setSplit((event.clientX - rect.left) / rect.width * 100);
  });
  wipe.addEventListener('pointermove', function (event) {
    if (!dragging) return;
    var rect = wipe.getBoundingClientRect();
    setSplit((event.clientX - rect.left) / rect.width * 100);
  });
  wipe.addEventListener('pointerup', function () { dragging = false; });
  wipe.addEventListener('pointercancel', function () { dragging = false; });
  var field = document.getElementById('th-zindex');
  field.addEventListener('input', function () {
    if (field.value === '') return;
    var value = Math.max(0, Math.min(99, Math.round(Number(field.value))));
    if (!Number.isFinite(value)) return;
    document.getElementById('th-layer-front').style.zIndex = value;
    document.getElementById('th-demo-css').textContent = '#rec845210 { z-index: ' + value + '; }';
  });
  var screens = Array.from(document.querySelectorAll('.th-device-scroll'));
  var syncing = false;
  screens.forEach(function (screen) {
    screen.addEventListener('scroll', function () {
      if (syncing) return;
      syncing = true;
      var fraction = screen.scrollTop / (screen.scrollHeight - screen.clientHeight);
      screens.forEach(function (other) { if (other !== screen) other.scrollTop = fraction * (other.scrollHeight - other.clientHeight); });
      requestAnimationFrame(function () { syncing = false; });
    }, { passive: true });
  });
  if ('IntersectionObserver' in window && !reduced) {
    document.querySelector('.th-landing').classList.add('th-motion');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
    }, { threshold: 0.08 });
    document.querySelectorAll('.th-reveal').forEach(function (element) { observer.observe(element); });
  }
})();
