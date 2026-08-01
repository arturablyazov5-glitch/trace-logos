// blog-ads.js — collapses a Yandex RTB ad wrapper (.blog-ad-slot / .blog-ad-card)
// if the slot never gets filled: no fill, ad blocker, blocked/failed script load.
// Without this the wrapper's own border/aspect-ratio stays on screen as an
// empty box. Detection is DOM-based (MutationObserver + timeout), not tied to
// Yandex's own callback shape, so it degrades the same way whether the ad
// script never loaded at all or loaded but returned no fill.
const TIMEOUT_MS = 4000;

document.querySelectorAll('.blog-ad-slot, .blog-ad-card').forEach(wrap => {
  const slot = wrap.querySelector('[id^="yandex_rtb_"]');
  if (!slot) return;

  let filled = slot.childNodes.length > 0;
  if (filled) return;

  const observer = new MutationObserver(() => {
    if (slot.childNodes.length) {
      filled = true;
      observer.disconnect();
    }
  });
  observer.observe(slot, { childList: true });

  setTimeout(() => {
    observer.disconnect();
    if (!filled) wrap.style.display = 'none';
  }, TIMEOUT_MS);
});
