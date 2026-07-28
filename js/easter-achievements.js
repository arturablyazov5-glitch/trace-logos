import { t } from './i18n.js';

const UNLOCK_AT = 20;
const SHOW_MS = 4400;

const seen = new Set();
let unlocked = false;
let el = null;
let hideTimer = null;

function ensureStyles() {
  if (document.querySelector('link[data-achievement-css]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('../css/achievement.css', import.meta.url).href;
  link.dataset.achievementCss = '1';
  document.head.appendChild(link);
}

function ensureEl() {
  if (el) return el;
  ensureStyles();
  el = document.createElement('div');
  el.className = 'achievement-toast';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.innerHTML = `
    <div class="achievement-icon" aria-hidden="true">🏆</div>
    <div class="achievement-body">
      <div class="achievement-kicker"></div>
      <div class="achievement-title"></div>
      <div class="achievement-desc"></div>
    </div>
    <div class="achievement-progress"></div>
  `;
  document.body.appendChild(el);
  return el;
}

function showHunterAchievement() {
  const node = ensureEl();
  node.querySelector('.achievement-kicker').textContent = t('achievementKicker');
  node.querySelector('.achievement-title').textContent  = t('achievementHunterTitle');
  node.querySelector('.achievement-desc').textContent   = t('achievementHunterDesc');

  clearTimeout(hideTimer);
  node.classList.remove('show');
  // Force reflow so the enter transition replays if a previous toast is still fading.
  void node.offsetWidth;
  requestAnimationFrame(() => node.classList.add('show'));
  hideTimer = setTimeout(() => node.classList.remove('show'), SHOW_MS);
}

// Counts unique cards opened this session (in-memory — resets on reload,
// same lifetime as the rest of the in-page state like activeCard).
export function trackCardOpen(item) {
  if (unlocked) return;
  seen.add(item.figma);
  if (seen.size >= UNLOCK_AT) {
    unlocked = true;
    showHunterAchievement();
  }
}
