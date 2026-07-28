/**
 * blog-track.js — tracks blog post views
 */
(function() {
  const TRACK_URL = 'https://wezryybxxwicysnbmhkz.supabase.co/functions/v1/track';
  const slug = window.location.pathname.split('/').filter(Boolean).pop();
  
  if (!slug || window.location.pathname.indexOf('/blog/') === -1 || slug === 'blog') return;

  // Локальную разработку не считаем, чтобы не засорять боевую статистику.
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '') return;

  // Уважаем общий тумблер «Режим разработчика» (?notrack, см. utils.js) —
  // он может быть включён и не на localhost (напр. при ручном тестировании прода).
  try {
    if (localStorage.getItem('tl_notrack') === '1') return;
  } catch { /* localStorage недоступен — считаем как обычно */ }

  // Simple debounce using localStorage to avoid tracking multiple times in one session
  const storageKey = `viewed_${slug}`;
  const now = Date.now();
  const lastViewed = localStorage.getItem(storageKey);
  
  if (lastViewed && now - parseInt(lastViewed) < 1000 * 60 * 30) {
    // Already tracked in the last 30 minutes
    return;
  }

  fetch(TRACK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: slug })
  }).then(res => {
    if (res.ok) {
      localStorage.setItem(storageKey, now.toString());
    }
  }).catch(err => console.error('Tracking error:', err));
})();
