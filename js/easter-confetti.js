import { ensureConfetti } from './vendor-loader.js';
import { showToast } from './utils.js';
import { TOASTS } from './labels.js';

const BOTTOM_MARGIN = 40;
let fired = false;

function burst(confetti) {
  const defaults = { origin: { y: 0.7 }, zIndex: 99999 };
  const fire = (ratio, opts) => confetti({ ...defaults, ...opts, particleCount: Math.floor(200 * ratio) });

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

// Fires once per page load when the visitor scrolls to the very bottom of
// the full (unfiltered) catalog — a search narrows the grid's height, so
// that doesn't count as "browsed everything".
export function checkCatalogEnd(searchActive) {
  if (fired || searchActive) return;
  const doc = document.documentElement;
  if (window.scrollY + window.innerHeight < doc.scrollHeight - BOTTOM_MARGIN) return;
  fired = true;
  showToast(TOASTS.catalogEnd);
  ensureConfetti().then(burst).catch(() => {});
}
