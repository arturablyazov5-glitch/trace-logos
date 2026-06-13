const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
const label = isMac ? '⌘K' : 'Ctrl K';

const input = document.getElementById('search')
           || document.getElementById('seo-search')
           || document.querySelector('.search-input');

if (input) {
  // Inject hint badge into the nearest .search-wrap / .seo-search-wrap
  const wrap = input.closest('.search-wrap, .seo-search-wrap');
  if (wrap) {
    const kbd = document.createElement('kbd');
    kbd.className = 'search-shortcut-kbd';
    kbd.textContent = label;
    wrap.appendChild(kbd);
    input.addEventListener('focus', () => kbd.style.display = 'none');
    input.addEventListener('blur',  () => kbd.style.display = '');
  }

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K' || e.key === 'f' || e.key === 'F')) {
      if (e.key === 'f' || e.key === 'F') e.preventDefault();
      input.focus();
      input.select();
    }
  });
}
