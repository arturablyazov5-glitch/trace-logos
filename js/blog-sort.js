/**
 * blog-sort.js — client-side sort for the blog index grid.
 * Cards already carry data-date / data-views from build-blog.js.
 */
(function() {
  const select = document.getElementById('blog-sort-select');
  const list = document.getElementById('blog-list');
  if (!select || !list) return;

  function sortCards(mode) {
    const cards = Array.from(list.querySelectorAll('.blog-card'));
    cards.sort((a, b) => {
      if (mode === 'popular') {
        return (Number(b.dataset.views) || 0) - (Number(a.dataset.views) || 0);
      }
      const da = a.dataset.date || '';
      const db = b.dataset.date || '';
      return mode === 'old' ? da.localeCompare(db) : db.localeCompare(da);
    });
    cards.forEach(c => list.appendChild(c));
  }

  select.addEventListener('change', () => sortCards(select.value));
})();
