(() => {
  const KEY = '__ttBlockIds';
  if (window[KEY]) {
    window[KEY].destroy();
    delete window[KEY];
    return false;
  }

  // Блок Taptop — <section> с id вида i3bdp5ptg_0 (суффикс — номер экземпляра)
  const ID_RE = /^i[a-z0-9]{8}_\d+$/;
  const PAD = 12; // отступ плашки от края секции
  const GAP = 6; // зазор между плашками в ряду

  // Слой фиксирован на окне: координаты берутся из getBoundingClientRect на каждом кадре,
  // поэтому fixed/sticky-шапки, трансформации и скролл внутри контейнеров не сбивают раскладку.
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647;';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
    :host{all:initial}
    .line{position:absolute;left:0;top:0;height:0;border-top:1px dashed rgba(79,124,255,.7);will-change:transform}
    .hl{position:absolute;left:0;top:0;box-sizing:border-box;border:2px solid #4f7cff;border-radius:2px;
      background:rgba(79,124,255,.08);box-shadow:inset 0 0 0 1px rgba(255,255,255,.35);display:none}
    .b{position:absolute;left:0;top:0;display:flex;align-items:center;gap:7px;height:28px;padding:0 9px 0 5px;
      box-sizing:border-box;font:500 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#eef1ff;
      background:rgba(16,18,27,.94);border:1px solid rgba(255,255,255,.14);border-radius:14px;
      box-shadow:0 6px 18px rgba(0,0,0,.28),0 1px 2px rgba(0,0,0,.3);
      backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
      cursor:pointer;user-select:none;white-space:nowrap;pointer-events:auto;will-change:transform;
      transition:background .15s,border-color .15s}
    .b:hover{background:#4f7cff;border-color:rgba(255,255,255,.7)}
    .n{display:grid;place-items:center;min-width:18px;height:18px;padding:0 5px;box-sizing:border-box;
      border-radius:9px;background:#4f7cff;color:#fff;font:700 10px/1 system-ui,-apple-system,sans-serif}
    .b:hover .n{background:#fff;color:#4f7cff}
    .h{color:rgba(238,241,255,.45)}
    .b:hover .h{color:rgba(255,255,255,.75)}
    svg{width:13px;height:13px;flex:none;opacity:.55}
    .b:hover svg{opacity:1}
    .b.ok{background:#16a34a;border-color:rgba(255,255,255,.7)}
    .b.ok .n{background:#fff;color:#16a34a}
  </style><div id="l"></div>`;
  const layer = root.getElementById('l');
  const hl = document.createElement('div');
  hl.className = 'hl';
  layer.appendChild(hl);
  document.documentElement.appendChild(host);

  const COPY_SVG = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5v-2a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 3.5V9A1.5 1.5 0 0 0 4 10.5h1.5"/></svg>';
  const OK_SVG = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:1"><path d="M3 8.5l3.2 3.2L13 4.8"/></svg>';
  const label = (id) => `<span class="h">#</span>${id}`;

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
  };

  let items = []; // { el, badge, line, overlay }
  let hovered = null;

  function build() {
    for (const it of items) { it.badge.remove(); it.line.remove(); }
    items = [];
    let n = 0;
    for (const el of document.querySelectorAll('section[id]')) {
      if (!ID_RE.test(el.id)) continue;
      n++;
      const line = document.createElement('div');
      line.className = 'line';
      const badge = document.createElement('div');
      badge.className = 'b';
      badge.innerHTML = `<span class="n">${n}</span><span class="t">${label(el.id)}</span>${COPY_SVG}`;
      const it = { el, badge, line, overlay: false };

      badge.addEventListener('mouseenter', () => { hovered = it; frame(); });
      badge.addEventListener('mouseleave', () => { if (hovered === it) hovered = null; frame(); });
      badge.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await copy('#' + el.id);
        badge.classList.add('ok');
        badge.querySelector('.t').textContent = 'Скопировано';
        badge.querySelector('svg').outerHTML = OK_SVG;
        clearTimeout(it.okTimer);
        it.okTimer = setTimeout(() => {
          badge.classList.remove('ok');
          badge.querySelector('.t').innerHTML = label(el.id);
          badge.querySelector('svg').outerHTML = COPY_SVG;
        }, 1000);
      });

      layer.append(line, badge);
      items.push(it);
    }
    frame();
  }

  // Все fixed/sticky-элементы страницы: шапка Taptop часто закреплена не секцией, а контейнером внутри неё
  let pinned = [];
  function scanPinned() {
    pinned = [];
    for (const el of document.body.querySelectorAll('*')) {
      const p = getComputedStyle(el).position;
      if (p === 'fixed' || p === 'sticky') pinned.push(el);
    }
  }

  const shown = (el, r) => {
    if (r.width < 2 || r.height < 2) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05;
  };

  function frame() {
    const vh = window.innerHeight, vw = document.documentElement.clientWidth;

    // Шапка — закреплённый у верха окна широкий невысокий элемент; под неё плашки обычных секций не заезжают
    let safeTop = 0;
    const headerOf = new Map(); // секция → прямоугольник её закреплённой шапки
    for (const el of pinned) {
      if (!el.isConnected) continue;
      const r = el.getBoundingClientRect();
      if (r.top > 80 || r.bottom <= 0 || r.height > vh * 0.4 || r.width < vw * 0.5 || !shown(el, r)) continue;
      safeTop = Math.max(safeTop, r.bottom);
      const sec = el.closest('section[id]');
      if (sec && !headerOf.has(sec)) headerOf.set(sec, r);
    }

    const rects = items.map((it) => {
      let r = it.el.getBoundingClientRect();
      const pos = getComputedStyle(it.el).position;
      it.overlay = pos === 'fixed' || pos === 'sticky';
      // Секция уехала, а её закреплённая шапка на экране — плашка живёт на шапке
      const hr = headerOf.get(it.el);
      it.onHeader = !!hr && (r.bottom <= hr.top || r.top >= hr.bottom || it.overlay);
      if (it.onHeader) { r = hr; it.overlay = true; }
      it.visible = r.bottom > 0 && r.top < vh && shown(it.el, r);
      return r;
    });

    // Сначала fixed/sticky, чтобы обычные плашки выстраивались в ряд рядом с ними, а не наоборот
    const order = items.map((it, i) => i).sort((a, b) => items[b].overlay - items[a].overlay);
    const placed = [];
    for (const i of order) {
      const it = items[i], r = rects[i], b = it.badge;
      if (!it.visible) {
        b.style.display = 'none';
        it.line.style.display = 'none';
        continue;
      }
      b.style.display = '';
      const w = b.offsetWidth, h = b.offsetHeight;
      const top = it.overlay ? Math.max(r.top, 0) : Math.max(r.top, safeTop);

      // Плашка липнет к верху видимой части секции; низ секции её выталкивает вверх
      let y = Math.min(top + PAD, r.bottom - h - PAD);
      if (r.bottom - top < h + PAD * 2) y = top + (r.bottom - top - h) / 2;
      const hidden = !it.overlay && y < safeTop;

      // Плашка шапки не закрывает логотип: левее шапки, если там есть место, иначе первой в ряду под ней
      let x = Math.max(r.left, 0) + PAD;
      if (it.onHeader) {
        x = PAD;
        y = r.left >= w + PAD * 2 ? r.top + (r.height - h) / 2 : r.bottom + PAD;
      }
      for (let moved = true; moved && !hidden;) {
        moved = false;
        for (const p of placed) {
          if (y < p.y + p.h && y + h > p.y && x < p.x + p.w + GAP && x + w + GAP > p.x) {
            x = p.x + p.w + GAP;
            moved = true;
          }
        }
      }
      if (!hidden) placed.push({ x, y, w, h });

      b.style.visibility = hidden ? 'hidden' : '';
      b.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`;

      // Граница начала секции
      const lineVisible = r.top >= (it.overlay ? 0 : safeTop) && r.top < vh;
      it.line.style.display = lineVisible ? '' : 'none';
      if (lineVisible) {
        const lx = Math.max(r.left, 0);
        it.line.style.width = Math.min(r.right, vw) - lx + 'px';
        it.line.style.transform = `translate3d(${Math.round(lx)}px,${Math.round(r.top)}px,0)`;
      }
    }

    if (hovered && hovered.badge.style.display !== 'none') {
      const r = rects[items.indexOf(hovered)];
      hl.style.display = 'block';
      hl.style.left = r.left + 'px';
      hl.style.top = r.top + 'px';
      hl.style.width = r.width + 'px';
      hl.style.height = r.height + 'px';
    } else {
      hl.style.display = 'none';
    }
  }

  let raf = 0, t = 0;
  const tick = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; frame(); }); };
  const rebuild = () => { clearTimeout(t); t = setTimeout(() => { scanPinned(); build(); }, 150); };
  let ts = 0;
  const rescan = () => { clearTimeout(ts); ts = setTimeout(() => { scanPinned(); tick(); }, 200); };

  const ro = new ResizeObserver(tick);
  ro.observe(document.documentElement);
  const mo = new MutationObserver((muts) => {
    if (muts.some((m) => m.type === 'childList' && m.target !== host)) rebuild();
    else { tick(); rescan(); }
  });
  mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
  // capture: ловит скролл и окна, и любого внутреннего контейнера
  document.addEventListener('scroll', tick, { capture: true, passive: true });
  window.addEventListener('resize', tick);
  window.addEventListener('load', rebuild);
  const poll = setInterval(tick, 500); // анимации появления меняют геометрию без событий

  scanPinned();
  build();

  window[KEY] = {
    destroy() {
      clearTimeout(t);
      clearTimeout(ts);
      clearInterval(poll);
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      document.removeEventListener('scroll', tick, { capture: true });
      window.removeEventListener('resize', tick);
      window.removeEventListener('load', rebuild);
      host.remove();
    },
  };
  return true;
})();
