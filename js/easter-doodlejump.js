// Doodle Jump easter egg — a live preview of the game sits bottom-left while
// the Doodle Jump detail panel is open (self-playing "attract mode"), scales
// up slightly on hover, and opens a fullscreen playable lightbox on click.
const GAME_URL = '/assets/easter-egg/doodlejump/game.html';

let widgetEl = null;
let lightboxEl = null;

// The widget keeps running (and its attract-mode bot playing) behind the
// lightbox unless told to stop — pointless CPU/battery use once the player
// can no longer see it. boot.js listens for these on the widget's own window.
function pauseWidget() {
  widgetEl?.querySelector('iframe')?.contentWindow?.postMessage({ type: 'dj-pause' }, location.origin);
}
function resumeWidget() {
  widgetEl?.querySelector('iframe')?.contentWindow?.postMessage({ type: 'dj-resume' }, location.origin);
}

function closeLightbox() {
  if (!lightboxEl) return;
  lightboxEl.remove();
  lightboxEl = null;
  document.removeEventListener('keydown', onLightboxKeydown);
  resumeWidget();
}

function onLightboxKeydown(e) {
  if (e.key === 'Escape') closeLightbox();
}

function openLightbox() {
  if (lightboxEl) return;
  pauseWidget();
  lightboxEl = document.createElement('div');
  lightboxEl.className = 'dj-lightbox';
  lightboxEl.innerHTML = `
    <div class="dj-lightbox-box">
      <button type="button" class="dj-lightbox-close" aria-label="Закрыть">&times;</button>
      <iframe src="${GAME_URL}?mode=play" title="Doodle Jump" allow="autoplay"></iframe>
    </div>
  `;
  lightboxEl.addEventListener('click', (e) => {
    if (e.target === lightboxEl) closeLightbox();
  });
  lightboxEl.querySelector('.dj-lightbox-close').addEventListener('click', closeLightbox);
  document.addEventListener('keydown', onLightboxKeydown);
  document.body.appendChild(lightboxEl);
}

// The widget iframe itself boots invisibly (black frame → menu flash →
// attract mode) — showing it immediately meant the fly-in animation ran over
// that loading sequence instead of onto an already-playing game. Stay
// hidden (opacity 0, see .dj-widget in css) until boot.js's attract-mode
// loop confirms it has actually reached the Game state, then reveal + animate.
function onWindowMessage(e) {
  if (e.origin !== location.origin || !e.data || e.data.type !== 'dj-ready') return;
  widgetEl?.classList.add('dj-widget--visible');
}

export function showDoodleJumpWidget() {
  if (widgetEl) return;
  widgetEl = document.createElement('div');
  widgetEl.className = 'dj-widget';
  widgetEl.title = 'Doodle Jump — нажми, чтобы сыграть';
  widgetEl.innerHTML = `<iframe src="${GAME_URL}?mode=attract" title="Doodle Jump preview" tabindex="-1"></iframe>`;
  widgetEl.addEventListener('click', openLightbox);
  window.addEventListener('message', onWindowMessage);
  document.body.appendChild(widgetEl);
}

export function hideDoodleJumpWidget() {
  closeLightbox();
  if (!widgetEl) return;
  widgetEl.remove();
  widgetEl = null;
  window.removeEventListener('message', onWindowMessage);
}
