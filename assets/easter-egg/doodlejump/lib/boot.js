// Boot sequence — taken verbatim from doodlejump.org's own main.js.
var Doodle = Doodle || {};
Doodle.game = new Phaser.Game(635, 955, Phaser.AUTO);

// Replaces doodlejump.org's own PreloadState: same asset list (the actual
// game assets — atlas/audio/fonts/data), minus its branded Lima Sky /
// CloudGames splash animation and the 1.4s minimum delay built around it.
// Starts Menu the instant loading finishes.
Doodle.PreloadState = {
  preload: function () {
    this.game.load.atlas('atlas', 'assets/images/atlas.webp', 'assets/images/atlas.json');
    this.game.load.atlas('atlas2', 'assets/images/atlas2.webp', 'assets/images/atlas2.json');
    this.game.load.atlas('atlas3', 'assets/images/atlas3.webp', 'assets/images/atlas3.json');
    this.game.load.atlas('popupAtlas', 'assets/images/popupAtlas.webp', 'assets/images/popupAtlas.json');
    this.load.spritesheet('player0', 'assets/images/playerSheet.webp', 124, 120, 4);
    this.load.image('appstore', 'assets/images/appstore.webp');
    this.load.image('googleplay', 'assets/images/googleplay.webp');
    this.load.audio('white', ['assets/audio/white.mp3', 'assets/audio/white.ogg']);
    this.load.audio('ufo_warning', ['assets/audio/ufo_warning.mp3', 'assets/audio/ufo_warning.ogg']);
    this.load.audio('ufo_kill', ['assets/audio/ufo_kill.mp3', 'assets/audio/ufo_kill.ogg']);
    this.load.audio('ufo_abduct', ['assets/audio/ufo_abduct.mp3', 'assets/audio/ufo_abduct.ogg']);
    this.load.audio('spring', ['assets/audio/spring.mp3', 'assets/audio/spring.ogg']);
    this.load.audio('shoot2', ['assets/audio/shoot2.mp3', 'assets/audio/shoot2.ogg']);
    this.load.audio('shoot', ['assets/audio/shoot.mp3', 'assets/audio/shoot.ogg']);
    this.load.audio('propeller', ['assets/audio/propeller.mp3', 'assets/audio/propeller.ogg']);
    this.load.audio('monster_warning', ['assets/audio/monster_warning.mp3', 'assets/audio/monster_warning.ogg']);
    this.load.audio('monster_kill', ['assets/audio/monster_kill.mp3', 'assets/audio/monster_kill.ogg']);
    this.load.audio('monster_hit', ['assets/audio/monster_hit.mp3', 'assets/audio/monster_hit.ogg']);
    this.load.audio('jumponmonster', ['assets/audio/jumponmonster.mp3', 'assets/audio/jumponmonster.ogg']);
    this.load.audio('jump', ['assets/audio/jump.mp3', 'assets/audio/jump.ogg']);
    this.load.audio('jetpack', ['assets/audio/jetpack.mp3', 'assets/audio/jetpack.ogg']);
    this.load.audio('falling', ['assets/audio/falling.mp3', 'assets/audio/falling.ogg']);
    this.load.audio('black_hole', ['assets/audio/black_hole.mp3', 'assets/audio/black_hole.ogg']);
    this.load.audio('beake_platfrom', ['assets/audio/beake_platfrom.mp3', 'assets/audio/beake_platfrom.ogg']);
    this.load.bitmapFont('DoodleFont', 'assets/fonts/bitmapFont_0.webp', 'assets/fonts/bitmapFont.fnt');
    this.load.bitmapFont('DoodleFont2', 'assets/fonts/bitmapFont2_0.webp', 'assets/fonts/bitmapFont2.fnt');
    this.load.text('scenes0', 'assets/data/skin0Scenes.json');
    this.load.text('stats', 'assets/data/statachieve.json');
    this.load.onLoadComplete.addOnce(function () { this.state.start('Menu'); }, this);
  },
};

var ATTRACT_MODE = new URLSearchParams(location.search).get('mode') === 'attract';
var IS_TOUCH = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
var SCORES_URL = 'https://wezryybxxwicysnbmhkz.supabase.co/functions/v1/doodlejump-scores';

// "TAP TO CHANGE" (atlas frame "tapToChange", a baked-in English image, not
// text — can't localize it in place) → hide it and draw a Russian label of
// our own over the same spot. Patched onto the shared GameState object
// before state.add(), same object Phaser calls into either way.
var originalGameCreate = Doodle.GameState.create;
Doodle.GameState.create = function () {
  originalGameCreate.call(this);
  this.tapToChange.visible = false;
  var ruLabel = this.add.text(410, 545, 'нажми, чтобы\nизменить имя →', {
    font: '18px "Comic Sans MS", cursive, sans-serif',
    fill: '#a92822',
    align: 'center',
  });
  ruLabel.anchor.setTo(0.5);
  ruLabel.lineSpacing = -10;
  this.gameOverGroup.add(ruLabel);
};

// DoodleFont (the bitmap font "your name:"+this.name is drawn with) only has
// glyphs for ASCII 32-126 — a Cyrillic (or any non-Latin) name renders as
// nothing after the colon. Every frame the game-over screen is up, check
// this.name for non-ASCII and, if found, strip it back to the bare "your
// name:" label and draw the actual name with a regular Phaser.Text (any
// script) positioned right after it instead.
var originalGameUpdate = Doodle.GameState.update;
Doodle.GameState.update = function () {
  originalGameUpdate.call(this);
  if (!this.gameOverGroup || !this.gameOverGroup.visible) return;
  var name = this.name || '';
  if (/[^\x00-\x7F]/.test(name)) {
    this.gameOverStats.text = 'your name:';
    if (!this.nameFallback) {
      this.nameFallback = this.add.text(0, 0, '', { font: '32px sans-serif', fill: '#a92822' });
      this.nameFallback.anchor.setTo(0, 0.5);
      this.gameOverGroup.add(this.nameFallback);
    }
    this.nameFallback.visible = true;
    this.nameFallback.text = name;
    this.nameFallback.x = this.gameOverStats.x + this.gameOverStats.textWidth + 6;
    this.nameFallback.y = this.gameOverStats.y;
  } else if (this.nameFallback) {
    this.nameFallback.visible = false;
  }
};

// Every "Play again"/"Menu" tap off the game-over screen calls writeScore()
// once with the run's final name+score — the same point doodlejump.org uses
// to persist locally. Piggyback a submission to our own global leaderboard
// (never from the attract-mode bot — that's not a real player).
if (!ATTRACT_MODE) {
  var originalWriteScore = Doodle.GameState.writeScore;
  Doodle.GameState.writeScore = function () {
    originalWriteScore.call(this);
    var score = Math.round(this.score);
    if (score > 0) {
      fetch(SCORES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: this.name || 'unnamed', score: score }),
      }).catch(function () {});
    }
  };
}

// ScoresState already has a fully built "Global" tab (globalButton/setLoad)
// on the real site — it just reads from `this.dataTest`, which nothing here
// ever set. Prefetch our leaderboard once and feed it in, so clicking
// "Global" shows real data instead of an empty scroll panel.
var globalScoresPromise = ATTRACT_MODE ? null : fetch(SCORES_URL)
  .then(function (r) { return r.json(); })
  .then(function (data) {
    return (data.scores || []).map(function (s) { return [s.name, s.score]; });
  })
  .catch(function () { return []; });

if (!ATTRACT_MODE) {
  var originalScoresCreate = Doodle.ScoresState.create;
  Doodle.ScoresState.create = function () {
    originalScoresCreate.call(this);
    var self = this;
    globalScoresPromise.then(function (scores) {
      self.dataTest = scores;
      // Refresh the visible list if the player is already looking at the
      // Global tab when the fetch resolves (it's async, the tab isn't).
      if (self.scrollMenu2 && self.scrollMenu2.visible) self.setLoad('global');
    });
  };
}

Doodle.game.state.add('Boot', Doodle.BootState);
Doodle.game.state.add('Preload', Doodle.PreloadState);
Doodle.game.state.add('Game', Doodle.GameState);
Doodle.game.state.add('Menu', Doodle.MenuState);
Doodle.game.state.add('Settings', Doodle.SettingsState);
Doodle.game.state.add('Calibrate', Doodle.CalibrateState);
Doodle.game.state.add('Scores', Doodle.ScoresState);
Doodle.game.state.start('Boot');

// Everything in this function touches game.sound/game.input, which stay null
// until Phaser finishes its own async boot (device detection etc.) — calling
// it synchronously right after `new Phaser.Game()` throws and silently kills
// the rest of the script. Run it once the state machine has actually moved,
// which only happens post-boot.
Doodle.game.state.onStateChange.addOnce(function () {
  // addKey() creates the Key object if it doesn't exist yet and returns the
  // existing one otherwise — safe to call anytime, unlike reaching into
  // input.keyboard._keys[code] directly, which is undefined until something
  // (normally GameState) has already registered that key.
  var leftKey = Doodle.game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
  var rightKey = Doodle.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);

  resetMoving = () => {
    rightKey.isDown = false;
    leftKey.isDown = false;
  };
  mobileMoving = (isRight) => {
    rightKey.isDown = isRight;
    leftKey.isDown = !isRight;
  };

  // Touch controls — taken from doodlejump.org's own scripts.js (mobileMoving/
  // resetMoving), stripped of the settings-panel/arrow-customization/notify-popup
  // code that only makes sense on their full site. Only shown on touch devices —
  // a keyboard is the natural control on desktop, no on-screen arrows needed.
  if (!ATTRACT_MODE && IS_TOUCH) {
    const rightBtn = document.getElementById('right-btn');
    const leftBtn = document.getElementById('left-btn');
    document.getElementById('virtual-key').style.display = 'block';

    rightBtn.addEventListener('touchstart', () => mobileMoving(true));
    rightBtn.addEventListener('touchend', () => resetMoving());
    leftBtn.addEventListener('touchstart', () => mobileMoving(false));
    leftBtn.addEventListener('touchend', () => resetMoving());
  }

  // WASD alongside the arrow keys — same mobileMoving()/resetMoving() hook.
  // Plain DOM listeners rather than Phaser Key signals: Phaser's own
  // Boot→Preload→Menu→Game state transitions call keyboard.reset(), which
  // wipes onDown/onUp bindings on every Key object — a Phaser-side listener
  // registered here would silently stop firing the moment Game state loads.
  if (!ATTRACT_MODE) {
    var aDown = false, dDown = false;
    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyA') { aDown = true; mobileMoving(false); }
      else if (e.code === 'KeyD') { dDown = true; mobileMoving(true); }
    });
    document.addEventListener('keyup', (e) => {
      if (e.code === 'KeyA') { aDown = false; if (dDown) mobileMoving(true); else resetMoving(); }
      else if (e.code === 'KeyD') { dDown = false; if (aDown) mobileMoving(false); else resetMoving(); }
    });
  }

  // Everything below has no equivalent on doodlejump.org — the real site has
  // no "demo mode", so this is necessarily new code, not lifted from
  // anywhere. It reuses the same mobileMoving()/resetMoving() input hook
  // above rather than inventing a second way to move the player.
  if (ATTRACT_MODE) {
    // Parent page (js/easter-doodlejump.js) sends this while its fullscreen
    // lightbox is open — no point animating/simulating input behind it.
    var djPaused = false;
    window.addEventListener('message', function (e) {
      if (e.origin !== location.origin || !e.data) return;
      if (e.data.type === 'dj-pause') { djPaused = true; Doodle.game.paused = true; }
      else if (e.data.type === 'dj-resume') { djPaused = false; Doodle.game.paused = false; }
    });

    Doodle.game.sound.mute = true;

    // Steers toward a platform in `platformPool` above the player (smaller y
    // — this engine's world scrolls with `camera.follow(player)`, so smaller
    // y = higher up) instead of a blind left/right coin-flip.
    //
    // Scoring is gap (vertical distance) plus a horizontal-distance penalty,
    // so it doesn't fixate on a platform almost directly above but too far
    // sideways while ignoring an easier one right next to it. Switching
    // targets needs hysteresis (a new candidate only replaces the current
    // target once it's clearly better, not marginally) — otherwise two
    // similarly-scored platforms on opposite sides flip the pick back and
    // forth every tick, reversing the applied force before it ever builds up
    // real velocity, and the bot visibly hovers in place.
    //
    // MIN_GAP excludes any platform within ~40px of the player's own
    // altitude — that's "the platform I'm already standing/bouncing on",
    // not a real next target. Without this filter, right after landing the
    // gap to that same platform reads as tiny-but-still-positive for a few
    // frames, which — being the smallest possible score — kept winning over
    // every genuinely higher platform. The bot would "pick" its own current
    // spot as the target, get dx≈0, call resetMoving(), and just sit there
    // bouncing on it forever after a couple of missed jumps: exactly the
    // "stops doing anything, just jumps in place" the bot got stuck in.
    var currentTarget = null;
    var MIN_GAP = 40;
    function steerTowardPlatform(gameState) {
      var player = gameState.player;
      if (!player || !player.alive) return;

      var best = null, bestScore = Infinity;
      gameState.platformPool.children.forEach(function (p) {
        if (!p.alive || !p.exists) return;
        var gap = player.y - p.y;
        if (gap <= MIN_GAP) return;
        var score = gap + Math.abs(p.x - player.x) * 0.6;
        if (score < bestScore) { bestScore = score; best = p; }
      });

      var targetGap = (currentTarget && currentTarget.alive && currentTarget.exists)
        ? player.y - currentTarget.y
        : -Infinity;
      if (targetGap <= MIN_GAP) {
        currentTarget = best;
      } else if (best) {
        var curScore = targetGap + Math.abs(currentTarget.x - player.x) * 0.6;
        if (bestScore < curScore * 0.7) currentTarget = best;
      }

      if (!currentTarget) { mobileMoving(Math.random() < 0.5); return; }
      var dx = currentTarget.x - player.x;
      if (Math.abs(dx) > 10) mobileMoving(dx > 0); else resetMoving();
    }

    // Death doesn't change game.state.current — the official code just shows
    // a "gameOverGroup" overlay while still in the Game state, and its own
    // Play Again button restarts via state.start("Game"). Poll that overlay
    // and drive the same restart call.
    //
    // Also re-asserts mute on every tick: Menu/Game read a stored
    // "DJ_soundToggle" preference on their own and reset game.sound.mute from
    // it, undoing a one-time mute call. The small catalog-page widget must
    // never be audible — only the fullscreen lightbox (mode=play) plays sound.
    //
    // 80ms (not the old 700ms) because steering needs to react before the
    // player drifts past its target — 700ms was fine for "is it dead yet"
    // but far too coarse to actually aim, which is why the bot used to cap
    // out around ~1000 points.
    var readySent = false;
    setInterval(function () {
      if (djPaused) return;
      Doodle.game.sound.mute = true;
      if (Doodle.game.state.current === 'Menu') {
        currentTarget = null;
        Doodle.game.state.start('Game');
        return;
      }
      var gameState = Doodle.game.state.states['Game'];
      if (gameState && gameState.gameOverGroup && gameState.gameOverGroup.visible) {
        currentTarget = null;
        Doodle.game.state.start('Game');
        return;
      }
      if (Doodle.game.state.current === 'Game' && gameState) {
        // Tell the parent page (js/easter-doodlejump.js) it's safe to reveal
        // the widget now — only once, the first time we're actually playing,
        // so the fly-in animation lands on live gameplay instead of the
        // black-frame-then-menu loading flash.
        if (!readySent) { readySent = true; window.parent.postMessage({ type: 'dj-ready' }, location.origin); }
        steerTowardPlatform(gameState);
      }
    }, 80);
  }
});
