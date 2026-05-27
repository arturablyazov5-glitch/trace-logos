// Standalone SVG utilities — no dependencies, used by both catalog modules and SEO pages.

export function parseSvgViewBox(svg) {
  const m = svg.match(/viewBox=["']([^"']+)["']/i);
  if (!m) return null;
  const p = m[1].trim().split(/[\s,]+/).map(Number);
  if (p.length !== 4 || p.some(n => !Number.isFinite(n))) return null;
  return { w: p[2], h: p[3] };
}

export function svgToPngBlob(svgText, { square = false, size = 1000 } = {}) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      if (square) {
        canvas.width = canvas.height = size;
      } else {
        const vb = parseSvgViewBox(svgText);
        canvas.height = size;
        canvas.width = vb && vb.h > 0 ? Math.round(size * vb.w / vb.h) : size;
      }
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('PNG generation failed')), 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG load failed')); };
    img.src = url;
  });
}

export function triggerConfetti(el, color) {
  const r = el.getBoundingClientRect();
  const ghost = document.createElement('div');
  ghost.className = 'confetti-ghost animate';
  ghost.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
  if (color) ghost.style.setProperty('--confetti-color', color);
  document.body.appendChild(ghost);
  setTimeout(() => ghost.remove(), 1100);
}
