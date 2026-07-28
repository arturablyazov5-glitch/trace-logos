/**
 * threads-banner.js — dismiss behavior for the shared Threads banner
 * (templates/partials/threads-banner.html). Imported as a side-effect module
 * from any page that includes the partial (SEO logo pages, blog posts).
 */
const thBanner = document.getElementById('th-banner');
const thClose  = document.getElementById('th-banner-close');
if (thBanner && thClose) {
  thClose.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    thBanner.classList.add('hiding');
    thBanner.addEventListener('transitionend', () => thBanner.classList.add('hidden'), { once: true });
  });
}
