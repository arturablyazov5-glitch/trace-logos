// ─────────────────────────────────────────────────────────────────────────────
// credits-wall.js — раскладка стикеров на стене благодарностей (/credits/).
//
// Разметку стикеров печёт scripts/build-credits.js: в HTML они лежат обычным
// потоком и полностью читаются без JS. Этот модуль только развешивает их —
// считает координаты и включает анимацию появления.
//
// Алгоритм (десктоп): берём стикер, кидаем в случайную точку стены, считаем
// площадь пересечения с уже развешенными. Слишком сильно налез — пробуем другую
// точку; чуть-чуть налез — так и оставляем, бумажки и должны лежать внахлёст.
// Порядок = z-index: последний стикер физически лежит поверх остальных.
//
// Мобильный (< 700px): две колонки с небольшим перекрытием и уменьшенным
// наклоном. Пятнадцать бумажек в ширину 390px не раскидать — будет каша.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_OVERLAP   = 0.22;  // допустимая доля перекрытия (10–25% по ТЗ)
const STRIP_TOL     = 0.04;  // сколько «шапки» соседа позволено задеть
const HARD_OVERLAP  = 0.34;  // выше этого — стена мала, растим высоту и пересчитываем
const TRIES         = 400;   // попыток найти место одному стикеру
const GROW_PASSES   = 5;     // сколько раз можно увеличить высоту стены
const STAGGER_MS    = 80;    // задержка между появлением соседних стикеров
const STAGGER_CAP   = 1100;  // потолок: 40 стикеров не должны разворачиваться 3 секунды
const DROP_MS       = 620;   // длительность самой анимации (см. cw-drop в credits.css)
const PIN_MS        = 340;   // и cw-pin-in, стартует на 300 мс позже стикера
const BOTTOM_SLACK  = 18;    // запас под тень нижнего ряда

// Детерминированный PRNG: раскладка не должна прыгать при каждом ресайзе.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function overlapRatio(a, b) {
  const dx = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const dy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  if (dx <= 0 || dy <= 0) return 0;
  // Доля от МЕНЬШЕГО из двух: наполовину закрытый маленький стикер — это
  // «сильно перекрыт», даже если для большого соседа это пара процентов.
  return (dx * dy) / Math.min(a.w * a.h, b.w * b.h);
}

// Пересечение с «шапкой» уже висящего стикера — полосой от верхнего края до
// конца первой строки заслуги (бейдж, почта, «Предложил логотип Ozon»). Её
// высоту меряем по реальному DOM, а не константой: на мобильном вёрстка плотнее,
// и зашитые пиксели там защищали бы не то. Стикеры кладутся по возрастанию
// z-index, поэтому закрыть шапку может только тот, кто вешается позже.
//
// Одной доли площади мало: бумажка может пересечься на честные 15%, но именно
// теми 15%, где написано, кому сказать спасибо, — а нижний край не жалко.
function stripHit(box, placed) {
  const strip = { x: placed.x, y: placed.y, w: placed.w, h: Math.min(placed.h, placed.head) };
  const dx = Math.min(box.x + box.w, strip.x + strip.w) - Math.max(box.x, strip.x);
  const dy = Math.min(box.y + box.h, strip.y + strip.h) - Math.max(box.y, strip.y);
  if (dx <= 0 || dy <= 0) return 0;
  return (dx * dy) / (strip.w * strip.h);
}

// Хаотичная раскладка: случайная точка → проверка пересечений → повтор.
function scatter(sizes, wallW, rand) {
  const area = sizes.reduce((s, n) => s + n.w * n.h, 0);
  const tallest = sizes.reduce((m, n) => Math.max(m, n.h), 0);
  let wallH = Math.max(area / Math.max(wallW, 1) * 1.85, tallest + 80);

  for (let pass = 0; pass < GROW_PASSES; pass++) {
    const placed = [];
    let cramped = false;

    for (const size of sizes) {
      const maxX = Math.max(wallW - size.w, 0);
      const maxY = Math.max(wallH - size.h, 0);
      let best = null;
      let bestScore = Infinity;

      for (let t = 0; t < TRIES; t++) {
        const box = { x: rand() * maxX, y: rand() * maxY, w: size.w, h: size.h, head: size.head };
        let worst = 0, strip = 0;
        for (const p of placed) {
          const r = overlapRatio(box, p);
          if (r > worst) worst = r;
          const st = stripHit(box, p);
          if (st > strip) strip = st;
          if (worst + strip * 3 > bestScore) break;
        }
        const score = worst + strip * 3;    // закрыть чужую шапку втрое дороже
        if (score < bestScore) { bestScore = score; best = box; }
        if (worst <= MAX_OVERLAP && strip <= STRIP_TOL) break;   // место найдено
      }

      if (bestScore > HARD_OVERLAP) cramped = true;
      placed.push(best);
    }

    if (!cramped || pass === GROW_PASSES - 1) {
      // Высоту берём по факту разложенного, а не по оценке: при малом числе
      // стикеров прикидка почти всегда выше реального низа, и снизу зияла бы дыра.
      const bottom = placed.reduce((m, b) => Math.max(m, b.y + b.h), 0);
      return { boxes: placed, height: Math.min(wallH, bottom) + BOTTOM_SLACK };
    }
    wallH *= 1.18;   // тесно — стена выше, следующий проход свободнее
  }
  return null;
}

// Мобильная раскладка: две колонки, лёгкий нахлёст по вертикали, малый джиттер.
function columns(sizes, wallW, rand, colCount) {
  const gap = 10;
  const colW = (wallW - gap * (colCount - 1)) / colCount;
  const bottoms = new Array(colCount).fill(0);
  const boxes = [];

  sizes.forEach((size) => {
    // Не «через одну», а в самую короткую колонку: при разной высоте стикеров
    // чередование оставляет внизу одной колонки дыру в пол-экрана.
    let col = 0;
    for (let c = 1; c < colCount; c++) if (bottoms[c] < bottoms[col]) col = c;
    const jitter = (rand() - 0.5) * 10;
    // Нахлёст небольшой и попадает только в нижний отступ соседа — дата и
    // загнутый уголок остаются видны.
    const overlap = 4 + rand() * 6;
    const y = bottoms[col] === 0 ? 6 : bottoms[col] - overlap;
    // Джиттер не имеет права вытолкнуть стикер за стену: у .cw-wall стоит
    // overflow:hidden, и уехавший край просто срежется.
    const x = Math.min(Math.max(col * (colW + gap) + jitter, 0), wallW - colW);
    boxes.push({ x, y, w: colW, h: size.h, head: size.head });
    bottoms[col] = y + size.h;
  });

  return { boxes, height: Math.max(...bottoms) + BOTTOM_SLACK };
}

function layout(notes, container) {
  const wallW = container.clientWidth;
  if (!wallW) return false;

  const mobile = wallW < 700;
  // Порог по ширине КОНТЕЙНЕРА, а не экрана: на 390 px внутри стены остаётся
  // ~342 px, и это ровно те две колонки, которые здесь и нужны. Одна колонка —
  // только для совсем узких экранов, где 2×160 px уже не читаются.
  const colCount = wallW < 300 ? 1 : 2;

  // Размеры меряем ДО абсолютного позиционирования: offsetWidth/Height дают
  // невращённый бокс, в отличие от getBoundingClientRect с учётом rotate().
  container.classList.remove('is-scattered');
  container.style.height = '';
  notes.forEach(n => { n.style.width = ''; });
  if (mobile) {
    const colW = (wallW - 10 * (colCount - 1)) / colCount;
    notes.forEach(n => { n.style.width = `${colW}px`; });
  }
  const sizes = notes.map(n => {
    const deed = n.querySelector('.cw-note-deed');
    // Бейдж + почта + первая строка заслуги. Именно это должно остаться видно.
    const head = deed ? deed.offsetTop + Math.min(deed.offsetHeight, 24) : 80;
    return { w: n.offsetWidth, h: n.offsetHeight, head: Math.min(head, n.offsetHeight) };
  });

  const rand = mulberry32(0x5EEDBEEF);
  const result = mobile
    ? columns(sizes, wallW, rand, colCount)
    : scatter(sizes, wallW, rand);
  if (!result) return false;

  container.classList.add('is-scattered');
  container.style.height = `${Math.ceil(result.height)}px`;

  notes.forEach((note, i) => {
    const box = result.boxes[i];
    note.style.left = `${Math.round(box.x)}px`;
    note.style.top = `${Math.round(box.y)}px`;
    note.style.zIndex = String(i + 1);          // последние лежат сверху
    note.style.setProperty('--delay', `${Math.min(i * STAGGER_MS, STAGGER_CAP)}ms`);
    // На мобильном хаоса меньше — наклон гасим до трети.
    if (note.dataset.tilt === undefined) {
      note.dataset.tilt = getComputedStyle(note).getPropertyValue('--tilt').trim() || '0deg';
    }
    const base = parseFloat(note.dataset.tilt) || 0;
    note.style.setProperty('--tilt', `${(mobile ? base * 0.5 : base).toFixed(2)}deg`);
  });
  return true;
}

function init() {
  const container = document.getElementById('cw-notes');
  if (!container) return;
  const notes = Array.from(container.querySelectorAll('.cw-note'));
  if (!notes.length) return;

  const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Анимация появления живёт на отдельном классе и вешается ровно один раз:
  // is-scattered снимается и возвращается на каждом пересчёте (нужен поток для
  // замера), и если бы кейфреймы висели на нём, стикеры переприлетали бы при
  // каждом ресайзе.
  //
  // Класс ещё и СНИМАЕТСЯ, когда всё отыграло: animation-fill-mode:forwards
  // держит transform стикера до конца жизни элемента и перебивает :hover —
  // без снятия бумажка отказывалась приподниматься под курсором.
  let landingTimer;
  const land = () => {
    if (calm) return;
    container.classList.add('is-landing');
    clearTimeout(landingTimer);
    const total = Math.min((notes.length - 1) * STAGGER_MS, STAGGER_CAP) + 300 + Math.max(DROP_MS, PIN_MS) + 60;
    landingTimer = setTimeout(() => container.classList.remove('is-landing'), total);
  };

  if (!layout(notes, container)) return;
  land();

  // Шрифты меняют высоту стикеров — пересчитываем после их загрузки, иначе
  // раскладка построится по метрикам фолбэк-шрифта и разъедется.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => layout(notes, container));
  }

  // Следим за шириной КОНТЕЙНЕРА, а не окна: на мобильных адресная строка
  // дёргает только высоту вьюпорта, и пересчитывать раскладку на это не нужно.
  let timer;
  let lastW = Math.round(container.clientWidth);
  const onResize = () => {
    const w = Math.round(container.clientWidth);
    if (w === lastW || !w) return;
    lastW = w;
    clearTimeout(timer);
    timer = setTimeout(() => layout(notes, container), 160);
  };

  if (window.ResizeObserver) {
    // Первый вызов приходит сразу при подписке — lastW уже проставлен, так что
    // он отсеется сам и лишнего пересчёта не будет.
    new ResizeObserver(onResize).observe(container);
  } else {
    window.addEventListener('resize', onResize);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
