// The same storage key covers the catalog, blog and both language versions.
(() => {
  const storageKey = 'tl_ads_support_v1_id';
  let browserId;
  try {
    browserId = localStorage.getItem(storageKey);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(browserId)) {
      browserId = crypto.randomUUID();
      localStorage.setItem(storageKey, browserId);
    }
  } catch {
    // A browser that cannot retain its assignment keeps the regular ad experience.
    browserId = null;
  }

  // Experiment is off: every visitor gets ads. Flip to true to restore the 50/50 split.
  const ADS_EXPERIMENT_ENABLED = false;

  // Same UUID split as the generated with_ads column in Supabase.
  if (ADS_EXPERIMENT_ENABLED && browserId && !/^[0-7]/.test(browserId)) {
    const style = document.createElement('style');
    style.textContent = `
      .blog-ad-card, .blog-ad-slot, .seo-ad-block, .ad-sidebar-slot,
      [id^="yandex_rtb_"] { display: none !important; }
    `;
    document.head.appendChild(style);
  } else {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://yandex.ru/ads/system/context.js';
    document.head.appendChild(script);
  }

  if (!browserId || location.origin !== 'https://trace-logos.ru') return;

  const notrack = new URLSearchParams(location.search);
  if (notrack.has('notrack') ? notrack.get('notrack') !== 'off' : localStorage.getItem('tl_notrack') === '1') return;

  const assignedKey = storageKey + ':assigned';
  const clickKey = storageKey + ':click';
  const report = async (clicked) => {
    try {
      const res = await fetch('https://wezryybxxwicysnbmhkz.supabase.co/functions/v1/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adsSupport: { browserId, clicked } }),
        keepalive: true,
      });
      if (!res.ok) return;
      localStorage.setItem(assignedKey, browserId);
      if (clicked) localStorage.setItem(clickKey, 'sent:' + browserId);
    } catch { /* Retry on a later page load. */ }
  };

  if (localStorage.getItem(clickKey) === 'pending:' + browserId) report(true);
  else if (localStorage.getItem(assignedKey) !== browserId) report(false);

  function reportSupportClick(event) {
    if (!event.target.closest?.('a.btn-support, a.dn-ticker-cta')) return;
    if (localStorage.getItem(clickKey) === 'sent:' + browserId) return;
    localStorage.setItem(clickKey, 'pending:' + browserId);
    report(true);
  }
  document.addEventListener('click', reportSupportClick, true);
  document.addEventListener('auxclick', (event) => {
    if (event.button === 1) reportSupportClick(event);
  }, true);
})();
