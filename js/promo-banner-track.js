import { trackBannerClick } from './utils.js';

document.querySelectorAll('.promo-banner-link[data-banner-id]').forEach(el => {
  el.addEventListener('click', () => trackBannerClick(el.dataset.bannerId));
});
