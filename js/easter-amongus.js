// Among Us escape easter egg — main.js calls playAmongUsEscape() when the
// "Amongus" variant is selected on the Among Us logo detail panel. The
// character jumps out of the right detail panel, runs left across the
// catalog grid, hops onto the sidebar, then runs off the left edge.
// After a pause it runs back the same way (mirrored) and jumps back onto
// the detail panel, chased by a second sprite (the seeker).
const SPRITE_SRC = '/assets/easter-egg/character-walk.webp';
const JUMP_SRC = '/assets/easter-egg/character-jump.webp';
const GHOST_SRC = '/assets/easter-egg/character-ghost.webp';
const SEEKER_SRC = '/assets/easter-egg/seeker-run.webp';
const SEEKER_JUMP_SRC = '/assets/easter-egg/seeker-jump.webp';
const FOOTSTEP_SRC = '/assets/easter-egg/footstep.ogg';
const KILL_SRC = '/assets/easter-egg/kill.ogg';
const GHOST_SOUND_SRC = '/assets/easter-egg/ghost-fly.ogg';
const CHAR_SPRITES = { normal: SPRITE_SRC, jump: JUMP_SRC };
const SPRITE_SIZE = 72;
const SEEKER_SIZE = 96;
const GHOST_DELAY = 2000;
const KILL_SOUND_DELAY = 1000;
// Native aspect ratios (height/width) of the source sprites, used to keep
// both characters' feet on the same ground line despite the seeker being
// wider/taller (character-walk.webp is 167x231, seeker-run.webp is 221x292).
const CHAR_HEIGHT = SPRITE_SIZE * (231 / 167);
const SEEKER_HEIGHT = SEEKER_SIZE * (292 / 221);
const SEEKER_Y_OFFSET = SEEKER_HEIGHT - CHAR_HEIGHT;
// The seeker's jump pose is the same source art as the runner's, so shrink
// it back to the runner's width for the jump and drop the seeker's normal
// height offset — its feet line up with the runner's ground line at that size.
const SEEKER_SPRITES = { normal: SEEKER_SRC, jump: SEEKER_JUMP_SRC, jumpWidth: SPRITE_SIZE, jumpGroundYOffset: SEEKER_Y_OFFSET };
const RETURN_DELAY = 2000;
const SEEKER_DELAY = 600;
const GHOST_SPEED_SCALE = 2.2;
const GHOST_FADE_IN = 500;
// Run legs scale with actual travel distance so wide screens (longer
// catalog crossing) take proportionally longer instead of covering more
// ground in the same fixed time.
const RUN_SPEED = 0.5; // px/ms (~500px/s)
const MIN_RUN_DURATION = 500;
const MAX_RUN_DURATION = 4000;

function runDuration(distancePx) {
  const d = Math.abs(distancePx) / RUN_SPEED;
  return Math.min(MAX_RUN_DURATION, Math.max(MIN_RUN_DURATION, d));
}

let running = false;

// Ghost sound is looped via Web Audio's AudioBufferSourceNode (not <audio loop>)
// so it repeats the raw decoded samples with no gap — looping a compressed
// Ogg/Opus file through <audio loop> leaves an audible click at the seam
// because the codec pads a few priming samples at the start/end of the file.
let ghostAudioCtx = null;
let ghostBufferPromise = null;

function loadGhostBuffer() {
  ghostAudioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
  ghostBufferPromise ??= fetch(GHOST_SOUND_SRC)
    .then(res => res.arrayBuffer())
    .then(data => ghostAudioCtx.decodeAudioData(data));
  return ghostBufferPromise;
}

async function startGhostLoop(volume) {
  const buffer = await loadGhostBuffer();
  if (ghostAudioCtx.state === 'suspended') await ghostAudioCtx.resume();
  const source = ghostAudioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const gain = ghostAudioCtx.createGain();
  gain.gain.value = volume;
  source.connect(gain).connect(ghostAudioCtx.destination);
  source.start();
  return source;
}

function arcKeyframes(fromX, fromY, toX, toY, arcHeight, flip, segmentEasing) {
  const midX = (fromX + toX) / 2;
  const midY = Math.min(fromY, toY) - arcHeight;
  const s = flip ? -1 : 1;
  return [
    { transform: `translate(${fromX}px, ${fromY}px) scaleX(${s})`, easing: segmentEasing?.[0] },
    { transform: `translate(${midX}px, ${midY}px) scaleX(${s})`, easing: segmentEasing?.[1] },
    { transform: `translate(${toX}px, ${toY}px) scaleX(${s})` },
  ];
}

const GHOST_WAVE_AMPLITUDE = 7;
const GHOST_WAVE_SPACING = 200; // px of travel per up/down cycle

// Sine-wave path: bobs up and down repeatedly as it drifts across, instead
// of running in a straight line.
function waveKeyframes(fromX, y, toX, flip) {
  const distance = Math.abs(toX - fromX);
  const waves = Math.max(2, Math.round(distance / GHOST_WAVE_SPACING));
  const steps = waves * 6;
  const s = flip ? -1 : 1;
  const frames = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = fromX + (toX - fromX) * t;
    const dy = Math.sin(t * Math.PI * 2 * waves) * GHOST_WAVE_AMPLITUDE;
    frames.push({ transform: `translate(${x}px, ${y + dy}px) scaleX(${s})` });
  }
  return frames;
}

function runKeyframes(fromX, y, toX, flip) {
  const midX = (fromX + toX) / 2;
  const s = flip ? -1 : 1;
  return [
    { transform: `translate(${fromX}px, ${y}px) scaleX(${s})` },
    { transform: `translate(${midX}px, ${y - 14}px) scaleX(${s})` },
    { transform: `translate(${toX}px, ${y}px) scaleX(${s})` },
  ];
}

function play(el, keyframes, duration, easing) {
  return el.animate(keyframes, { duration, easing, fill: 'forwards' }).finished;
}

// How often a run segment restarts the footstep clip — shorter than the
// clip's own length so steps land closer to the running cadence.
const FOOTSTEP_INTERVAL = 220;

function startFootsteps(audio) {
  if (!audio) return null;
  audio.currentTime = 0;
  audio.play().catch(() => {});
  return setInterval(() => {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, FOOTSTEP_INTERVAL);
}

function stopFootsteps(timer, audio) {
  if (timer) clearInterval(timer);
  if (audio) audio.pause();
}

// Run segments trigger footsteps on a repeating interval; jump segments
// (plain play()/playJump()) never get sound.
async function playRun(el, keyframes, duration, easing, audio) {
  const timer = startFootsteps(audio);
  try {
    await play(el, keyframes, duration, easing);
  } finally {
    stopFootsteps(timer, audio);
  }
}

// Jumps swap the runner to its dedicated jump-pose sprite for the duration
// of the arc, then switch back to the walk-cycle sprite for the next leg.
async function playJump(el, keyframes, duration, easing, sprites) {
  if (sprites) {
    el.src = sprites.jump;
    if (sprites.jumpWidth) el.style.width = `${sprites.jumpWidth}px`;
  }
  await play(el, keyframes, duration, easing);
  if (sprites) {
    el.src = sprites.normal;
    if (sprites.jumpWidth) el.style.width = '';
  }
}

function makeRunner(src, modifierClass) {
  const el = document.createElement('img');
  el.src = src;
  el.alt = '';
  el.className = modifierClass ? `amongus-runner ${modifierClass}` : 'amongus-runner';
  document.body.appendChild(el);
  return el;
}

// Waypoints shared by the outbound escape and the return trip.
function buildWaypoints(originEl) {
  const sidebar = document.getElementById('sidebar');
  const content = document.getElementById('content');
  const originRect = (originEl ?? document.getElementById('detail'))?.getBoundingClientRect();
  const contentRect = content?.getBoundingClientRect();
  const sidebarRect = sidebar?.getBoundingClientRect();
  const sidebarVisible = !!sidebarRect && sidebarRect.width > 0 && sidebar.offsetParent !== null;

  const originX = (originRect?.left ?? window.innerWidth) - SPRITE_SIZE / 2;
  const groundY = (originRect?.top ?? window.innerHeight / 2) - SPRITE_SIZE / 2;
  const catalogEnterX = (contentRect?.right ?? originX) - SPRITE_SIZE;
  const catalogExitX = sidebarVisible ? (sidebarRect.right - SPRITE_SIZE / 2) : -SPRITE_SIZE;
  const sidebarX = sidebarVisible ? (sidebarRect.left + sidebarRect.width / 2 - SPRITE_SIZE / 2) : null;

  return { originX, groundY, catalogEnterX, catalogExitX, sidebarX, sidebarVisible };
}

async function playEscape(el, wp, sprites, speedScale = 1, audio) {
  const { originX, groundY, catalogEnterX, catalogExitX, sidebarX, sidebarVisible } = wp;
  // When a jump shrinks the sprite back to the runner's width, its ground
  // line shifts too — jumpGroundYOffset corrects for that so feet stay planted.
  const jumpGroundY = groundY + (sprites?.jumpGroundYOffset ?? 0);

  // 1. Jump off the right panel into the catalog. No footstep sound during jumps.
  await playJump(el, arcKeyframes(originX, jumpGroundY, catalogEnterX, jumpGroundY, 90, true, ['ease-out', 'ease-in']), 320 * speedScale, 'linear', sprites);

  // 2. Run left across the catalog, over the logos.
  await playRun(el, runKeyframes(catalogEnterX, groundY, catalogExitX, true), runDuration(catalogEnterX - catalogExitX) * speedScale, 'linear', audio);

  if (sidebarVisible) {
    // 3. Jump onto the sidebar.
    await playJump(el, arcKeyframes(catalogExitX, jumpGroundY, sidebarX, jumpGroundY, 80, true), 300 * speedScale, 'cubic-bezier(.32,.1,.68,1)', sprites);

    // 4. Run off the left edge of the screen.
    await playRun(el, runKeyframes(sidebarX, groundY, -SPRITE_SIZE, true), runDuration(sidebarX + SPRITE_SIZE) * speedScale, 'linear', audio);
  }
}

// The ghost drifts out along the same route but doesn't jump — it runs
// straight off from the very first frame. (The old version split off a
// tiny origin->catalogEnterX leg first; clamped to MIN_RUN_DURATION, that
// segment barely moved and read as a stall before the "real" run started.)
async function playGhostFloat(el, wp, speedScale = 1) {
  const { originX, groundY, catalogExitX, sidebarVisible } = wp;

  await play(el, waveKeyframes(originX, groundY, catalogExitX, true), runDuration(originX - catalogExitX) * speedScale, 'linear');

  if (sidebarVisible) {
    await play(el, waveKeyframes(catalogExitX, groundY, -SPRITE_SIZE, true), runDuration(catalogExitX + SPRITE_SIZE) * speedScale, 'linear');
  }
}

async function playReturn(el, wp, sprites, audio) {
  const { originX, groundY, catalogEnterX, catalogExitX, sidebarX, sidebarVisible } = wp;
  const jumpGroundY = groundY + (sprites?.jumpGroundYOffset ?? 0);

  if (sidebarVisible) {
    // 1. Run in from off-screen onto the sidebar.
    await playRun(el, runKeyframes(-SPRITE_SIZE, groundY, sidebarX, false), runDuration(sidebarX + SPRITE_SIZE), 'linear', audio);

    // 2. Jump off the sidebar into the catalog. No footstep sound during jumps.
    await playJump(el, arcKeyframes(sidebarX, jumpGroundY, catalogExitX, jumpGroundY, 80, false), 300, 'cubic-bezier(.32,.1,.68,1)', sprites);

    // 3. Run right across the catalog, over the logos.
    await playRun(el, runKeyframes(catalogExitX, groundY, catalogEnterX, false), runDuration(catalogEnterX - catalogExitX), 'linear', audio);
  } else {
    // No sidebar (mobile): run straight in from the left edge.
    await playRun(el, runKeyframes(-SPRITE_SIZE, groundY, catalogEnterX, false), runDuration(catalogEnterX + SPRITE_SIZE), 'linear', audio);
  }

  // 4. Jump back onto the right panel.
  await playJump(el, arcKeyframes(catalogEnterX, jumpGroundY, originX, jumpGroundY, 90, false, ['ease-out', 'ease-in']), 320, 'linear', sprites);
}

export async function playAmongUsEscape(originEl) {
  if (running) return;
  running = true;

  const wp = buildWaypoints(originEl);
  const runner = makeRunner(SPRITE_SRC);

  // One footstep clip per character so both can sound simultaneously during
  // the chase-back — only started/stopped around run segments (see playRun).
  const runnerAudio = new Audio(FOOTSTEP_SRC);
  runnerAudio.volume = 0.5;
  const seekerAudio = new Audio(FOOTSTEP_SRC);
  seekerAudio.volume = 0.5;

  try {
    await playEscape(runner, wp, CHAR_SPRITES, 1, runnerAudio);

    await new Promise(r => setTimeout(r, RETURN_DELAY));

    const seekerWp = { ...wp, groundY: wp.groundY - SEEKER_Y_OFFSET };
    // Each sprite is removed the instant its own path finishes rather than
    // waiting for the other — otherwise the one that lands first sits
    // frozen on screen (fill:'forwards') until the other catches up.
    const runnerReturn = playReturn(runner, wp, CHAR_SPRITES, runnerAudio).then(() => runner.remove());
    const seekerReturn = (async () => {
      await new Promise(r => setTimeout(r, SEEKER_DELAY));
      // Create the seeker right before it starts moving — otherwise it sits
      // at its untransformed (0,0) position for SEEKER_DELAY and flashes at
      // the top-left of the screen before the animation places it.
      const seeker = makeRunner(SEEKER_SRC, 'amongus-runner--seeker');
      await playReturn(seeker, seekerWp, SEEKER_SPRITES, seekerAudio);
      seeker.remove();
    })();

    await Promise.all([runnerReturn, seekerReturn]);

    // Kill sound plays a beat after landing, during the wait before the ghost appears.
    await new Promise(r => setTimeout(r, KILL_SOUND_DELAY));
    const killSound = new Audio(KILL_SRC);
    killSound.volume = 0.1;
    killSound.play().catch(() => {});
    await new Promise(r => setTimeout(r, GHOST_DELAY - KILL_SOUND_DELAY));

    // The ghost flies out alone, retracing the same escape route.
    const ghost = makeRunner(GHOST_SRC, 'amongus-runner--ghost');
    ghost.style.opacity = '0';
    ghost.animate([{ opacity: 0 }, { opacity: 1 }], { duration: GHOST_FADE_IN, easing: 'ease-out', fill: 'forwards' });
    const ghostSource = await startGhostLoop(0.15);
    await playGhostFloat(ghost, wp, GHOST_SPEED_SCALE);
    ghostSource.stop();
    ghost.remove();
  } finally {
    runnerAudio.pause();
    seekerAudio.pause();
    running = false;
  }
}
