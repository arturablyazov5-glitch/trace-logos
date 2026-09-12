// blog-ads.js — collapses a visible Yandex RTB ad wrapper
// (.blog-ad-slot / .blog-ad-card) if the slot never gets filled: no fill,
// ad blocker, blocked/failed script load. The timeout starts only after the
// wrapper enters the viewport, so below-the-fold ads don't disappear before
// the user reaches them.
const TIMEOUT_MS = 4000;

document.querySelectorAll('.blog-ad-slot, .blog-ad-card').forEach(wrap => {
  const slot = wrap.querySelector('[id^="yandex_rtb_"]');
  if (!slot) return;

  let filled = slot.childNodes.length > 0;
  let timerStarted = false;
  if (filled) return;

  const observer = new MutationObserver(() => {
    if (slot.childNodes.length) {
      filled = true;
      observer.disconnect();
    }
  });
  observer.observe(slot, { childList: true });

  const startTimer = () => {
    if (timerStarted || filled) return;
    timerStarted = true;
    setTimeout(() => {
      observer.disconnect();
      if (!filled) wrap.style.display = 'none';
    }, TIMEOUT_MS);
  };

  if (!('IntersectionObserver' in window)) {
    startTimer();
    return;
  }

  const viewObserver = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    viewObserver.disconnect();
    startTimer();
  }, { rootMargin: '0px', threshold: 0 });

  viewObserver.observe(wrap);

  if (wrap.getBoundingClientRect().top < window.innerHeight &&
      wrap.getBoundingClientRect().bottom > 0) {
    viewObserver.disconnect();
    startTimer();
  }
});
