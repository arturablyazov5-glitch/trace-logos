// ─────────────────────────────────────────────────────────────────────────────
// blog-toc.js — активный пункт секции + полоса прогресса чтения в сайдбаре
// статьи блога. Самоинициализируется по разметке .blog-sidebar-nav /
// .blog-progress-bar (templates/blog-post.html); на странице без сайдбара
// (индекс блога) просто ничего не делает.
// ─────────────────────────────────────────────────────────────────────────────

const article = document.querySelector('.blog-article');
// Прогресс считаем только по телу статьи (.blog-body) — если мерить по всему
// <article>, в него попадает и блок «Может быть еще интересно» после текста,
// и 100% наступает только после прокрутки чужих карточек, а не своей статьи.
const articleBody = document.querySelector('.blog-body');
const progressBar = document.querySelector('.blog-progress-bar');
const progressPct = document.querySelector('.blog-progress-pct');
const links = document.querySelectorAll('.blog-sidebar-nav a');

if (article && (progressBar || links.length)) {
  const sections = Array.from(links)
    .map(link => ({ link, el: document.getElementById(link.getAttribute('href').slice(1)) }))
    .filter(s => s.el);

  const onScroll = () => {
    if (progressBar && articleBody) {
      const total = articleBody.scrollHeight - window.innerHeight;
      const scrolled = -articleBody.getBoundingClientRect().top;
      const pct = total > 0 ? Math.min(100, Math.max(0, (scrolled / total) * 100)) : 0;
      progressBar.style.width = `${pct}%`;
      if (progressPct) progressPct.textContent = `${Math.round(pct)}%`;
    }
    if (sections.length) {
      const threshold = window.innerHeight * 0.35;
      let active = sections[0];
      for (const s of sections) {
        if (s.el.getBoundingClientRect().top <= threshold) active = s;
      }
      sections.forEach(s => s.link.classList.toggle('is-active', s === active));
    }
  };

  document.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // Smooth-scroll to a section on nav click (h2's scroll-margin-top keeps it
  // clear of the sticky header — see .blog-body h2 in css/blog.css).
  sections.forEach(({ link, el }) => {
    link.addEventListener('click', e => {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.pushState(null, '', link.getAttribute('href'));
    });
  });
}
