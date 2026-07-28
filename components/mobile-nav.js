// Mobile burger menu for the shared site-header partial (templates/partials/site-header.html).
// Opens a right-side drawer with the current page's section anchors (if any — e.g. a
// blog post's auto-generated .blog-sidebar-nav) on top and the site's main pages below.
(() => {
  const burger   = document.getElementById('mobile-nav-burger');
  const drawer   = document.getElementById('mobile-nav-drawer');
  const backdrop = document.getElementById('mobile-nav-backdrop');
  const closeBtn = document.getElementById('mobile-nav-close');
  if (!burger || !drawer || !backdrop) return;

  const tocSection = document.getElementById('mobile-nav-toc');
  const tocList    = document.getElementById('mobile-nav-toc-list');
  const pageToc     = document.querySelector('.blog-sidebar-nav');
  if (pageToc && tocList) {
    tocList.append(...Array.from(pageToc.querySelectorAll('a')).map(a => a.cloneNode(true)));
    tocSection.hidden = false;
  }

  function open() {
    drawer.hidden = false;
    backdrop.hidden = false;
    requestAnimationFrame(() => {
      drawer.classList.add('open');
      backdrop.classList.add('open');
    });
    burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('mobile-nav-open');
  }

  function close() {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('mobile-nav-open');
    setTimeout(() => { drawer.hidden = true; backdrop.hidden = true; }, 250);
  }

  burger.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  drawer.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) close(); });
})();
