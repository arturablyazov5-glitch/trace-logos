// Google doodle easter egg — main.js calls playGoogleAssemble() when the
// "full" (wordmark) variant is selected on the Google logo detail panel.
// Each letter of the wordmark flies apart across the screen, then flies
// back and reassembles into the logo, like Google's own doodle intros.
import { svgUrl } from './utils.js';

const FLY_OUT_DURATION = 550;
const HOLD_MIN = 150;
const HOLD_RANGE = 300;
const FLY_BACK_DURATION = 650;
const STAGGER = 35; // ms between each letter's start, so they don't move in lockstep
const SCATTER_MARGIN = 60;
const SCATTER_ROTATION = 70; // max degrees either direction

let running = false;

function parseLetters(svgText) {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const viewBox = doc.querySelector('svg')?.getAttribute('viewBox') || '0 0 140 44';
  const paths = [...doc.querySelectorAll('path')].map(p => ({
    d: p.getAttribute('d'),
    fill: p.getAttribute('fill') || '#000',
  }));
  return { viewBox, paths };
}

// One inline SVG per letter, stacked at the exact position/size of the
// thumbnail — since path coordinates are absolute within the shared
// viewBox, stacking every letter at (0,0) reproduces the original wordmark.
function makeLetterEl(viewBox, path, rect) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('width', rect.width);
  svg.setAttribute('height', rect.height);
  svg.classList.add('google-letter');
  svg.style.left = `${rect.left}px`;
  svg.style.top = `${rect.top}px`;
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', path.d);
  p.setAttribute('fill', path.fill);
  svg.appendChild(p);
  document.body.appendChild(svg);
  return svg;
}

function scatterOffset(originX, originY) {
  const x = SCATTER_MARGIN + Math.random() * (window.innerWidth - SCATTER_MARGIN * 2);
  const y = SCATTER_MARGIN + Math.random() * (window.innerHeight - SCATTER_MARGIN * 2);
  const rot = (Math.random() * 2 - 1) * SCATTER_ROTATION;
  return { dx: x - originX, dy: y - originY, rot };
}

async function flyLetter(el, originX, originY) {
  const { dx, dy, rot } = scatterOffset(originX, originY);

  await el.animate([
    { transform: 'translate(0px, 0px) rotate(0deg)' },
    { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)` },
  ], { duration: FLY_OUT_DURATION, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' }).finished;

  await new Promise(r => setTimeout(r, HOLD_MIN + Math.random() * HOLD_RANGE));

  await el.animate([
    { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)` },
    { transform: 'translate(0px, 0px) rotate(0deg)' },
  ], { duration: FLY_BACK_DURATION, easing: 'cubic-bezier(.32,.1,.4,1)', fill: 'forwards' }).finished;
}

export async function playGoogleAssemble(cardEl, file) {
  if (running) return;
  running = true;

  try {
    const img = cardEl?.querySelector('img');
    const rect = img?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return;

    const svgText = await fetch(svgUrl(file)).then(r => r.text());
    const { viewBox, paths } = parseLetters(svgText);
    if (paths.length < 2) return; // nothing to scatter

    img.style.opacity = '0';
    const letters = paths.map(p => makeLetterEl(viewBox, p, rect));

    await Promise.all(letters.map((el, i) =>
      new Promise(r => setTimeout(r, i * STAGGER)).then(() => flyLetter(el, rect.left, rect.top))
    ));

    letters.forEach(el => el.remove());
    img.style.opacity = '';
  } finally {
    running = false;
  }
}
