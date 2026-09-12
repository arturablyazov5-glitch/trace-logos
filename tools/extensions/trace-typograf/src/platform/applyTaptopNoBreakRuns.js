// Taptop хранит "неразрывность" не как символ НБСП, а как свой стиль
// "Прерывание" — применяется только их собственной кнопкой в панели
// редактирования текста, через их React-обработчик (иначе не переживает
// следующий ре-рендер Draft.js, см. taptopQuirks.js). Вместо вставки
// литерального НБСП эта функция выделяет ровно ту пару слов, где
// typografize поставил бы НБСП, и кликает по их кнопке "не переносить".
//
// Обнаружено вживую 2026-08-10: `.tt-editor-panel__white-space
// .tt-button-group` содержит две кнопки — [0] "переносить можно" (активна
// по умолчанию), [1] "не переносить". Панель появляется только при
// непустом выделении в Draft.js-редакторе. Сам клик по кнопке тоже может
// спровоцировать повторный рендер узла поля (не только его содержимого) —
// поэтому root ниже — не константа, а то, что вернул последний успешный
// waitForStableEditable (см. этот файл).

// Находит границы слова слева и справа от места, где typografize поставил
// бы НБСП (по офсетам в ИСХОДНОМ тексте — до всех правок).
function findWordBoundsAroundHunk(oldText, hunk) {
  const left = /\S+$/.exec(oldText.slice(0, hunk.oldStart));
  const right = /^\S+/.exec(oldText.slice(hunk.oldEnd));
  const start = hunk.oldStart - (left ? left[0].length : 0);
  const end = hunk.oldEnd + (right ? right[0].length : 0);
  return { start, end };
}

// Склеивает пересекающиеся/смежные словарные диапазоны в один прогон —
// на цепочку «и что с ним» (см. ниже) кликаем по «Прерывание» ОДИН раз
// на всё выделение, а не тремя отдельными пересекающимися кликами.
//
// fixShortWords.js глотает подряд идущие короткие предлоги/союзы («и»,
// «что», «с» — все в PREP_WORDS) и ставит НБСП ПОСЛЕ КАЖДОГО, то есть
// цепочка «и что с ним» рождает три nbsp-hunk'а подряд. findWordBounds-
// AroundHunk расширяет каждый до границ слов независимо и получает
// диапазоны «и что», «что с», «с ним» — они ПЕРЕСЕКАЮТСЯ по общему слову.
//
// ИСТОРИЯ ДВУХ ЛОЖНЫХ ДИАГНОЗОВ (2026-08-21, для памяти — не повторять):
// попытка №1 обрабатывала пересекающиеся диапазоны по отдельности, тремя
// кликами — второй клик резал общее слово («что» → «ч»). Попытка №2
// склеивала их в один прогон (то, что здесь и осталось) и один клик —
// но на ЭТОЙ версии Taptop иногда СТИРАЛ весь выделенный фрагмент.
// Ручная проверка пользователем (реальное мышиное выделение «и что с» +
// клик по их родной кнопке — сработало чисто) доказала: дело было не в
// их кнопке и не в том, что выделение многословное — а в том, КАК
// строился наш Range. rangeFromOffsets.js's locateOffset() на границе
// двух текстовых узлов (а она там есть — предыдущий клик уже обернул
// более раннее слово в свой <span>) брал КОНЕЦ предыдущего узла вместо
// НАЧАЛА следующего; их Draft.js-редактор резолвит эти два варианта в
// разные offset-key своей модели, и стиль применялся некорректно.
// Исправлено в самом rangeFromOffsets.js (локализовано у источника, а не
// компенсацией здесь) — после фикса склейка в один прогон снова корректна
// и это самый чистый вариант: один клик на весь смысловой фрагмент, а не
// N кликов, которые пытаются не задевать друг друга.
function mergeWordRuns(ranges) {
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged = [];
  for (const r of sorted) {
    const last = merged[merged.length - 1];
    if (last && r.start <= last.end) {
      last.end = Math.max(last.end, r.end);
    } else {
      merged.push({ start: r.start, end: r.end });
    }
  }
  return merged;
}

function waitFor(fn, timeout) {
  const deadline = Date.now() + (timeout || 1500);
  return new Promise((resolve) => {
    (function check() {
      const value = fn();
      if (value) return resolve(value);
      if (Date.now() > deadline) return resolve(null);
      setTimeout(check, 50);
    })();
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Строит Range на [start, end) в root и добавляет его в выделение. Если
// root успел отвалиться от документа (React заменил узел) — пере-цепляется
// на актуальный стабильный элемент через waitForStableEditable и пробует
// ещё раз один раз. Возвращает { sel, root } (root — актуальный, для
// следующей итерации вызывающего цикла) или null, если не удалось.
async function selectRangeResilient(root, sel, start, end) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    if (!document.contains(root)) {
      const fresh = await waitForStableEditable(1500);
      if (!fresh) return null;
      root = fresh;
    }
    try {
      const map = buildTextNodeOffsetMap(root);
      const range = rangeFromOffsets(root, map, start, end);
      sel.removeAllRanges();
      sel.addRange(range);
      return { root };
    } catch (e) {
      // "range isn't in document" и подобное — узел успел замениться между
      // проверкой document.contains и построением Range. Даём React ещё
      // один шанс устаканиться и повторяем один раз.
      if (attempt === 2) return null;
      await wait(150);
    }
  }
  return null;
}

// Возвращает { applied, failed } — сколько пар слов удалось сделать
// неразрывными и сколько НЕ удалось. failed важен отдельно: без него
// "движок не нашёл, что править" и "нашёл, но не смог нажать кнопку"
// сливались в один и тот же ответ 'no-change', и попап рапортовал
// "уже без замечаний", не сделав ничего (воспроизведено 2026-08-19).
// root/oldText/rawNewText — те же, что уже посчитаны в
// applyTypografToElement.js (rawNewText — ДО stripNbspForTaptop, ещё с
// литеральными НБСП, только по ним и находим, где нужна неразрывность).
async function applyTaptopNoBreakRuns(root, oldText, rawNewText) {
  const hunks = diffToHunks(myersDiff(oldText, rawNewText));
  const nbspHunks = hunks.filter(
    (h) => h.newText.length > 0 && Array.from(h.newText).every((ch) => ch === NBSP)
  );
  console.info(
    '[Trace Typograf] noBreakRuns: oldText =', JSON.stringify(oldText.slice(0, 80)),
    '| всего hunks:', hunks.length, '| из них НБСП:', nbspHunks.length
  );
  if (!nbspHunks.length) return { applied: 0, already: 0, failed: 0 };

  const rawRuns = nbspHunks
    .map((hunk) => findWordBoundsAroundHunk(oldText, hunk))
    .filter((r) => r.end > r.start);
  const runs = mergeWordRuns(rawRuns);
  if (!runs.length) return { applied: 0, already: 0, failed: nbspHunks.length };

  const sel = window.getSelection();
  let applied = 0;
  let already = 0;
  let failed = 0;

  for (const { start, end } of runs) {
    const expectedText = oldText.slice(start, end);

    // Полностью снимаем выделение и ждём тик ПЕРЕД тем, как поставить новое —
    // переход "пусто → есть выделение" надёжнее ловится их обработчиком,
    // чем "было одно выделение → стало другое" без промежуточного пустого
    // состояния (актуально начиная со 2-й пары слов за один прогон).
    sel.removeAllRanges();
    await wait(60);

    const selected = await selectRangeResilient(root, sel, start, end);
    if (!selected) {
      console.warn('[Trace Typograf] поле отвалилось от документа, пропускаю "не переносить":', JSON.stringify(expectedText));
      failed++;
      continue;
    }
    root = selected.root;
    document.dispatchEvent(new Event('selectionchange'));

    const group = await waitFor(
      () => document.querySelector('.tt-editor-panel__white-space .tt-button-group'),
      1500
    );
    if (!group) {
      console.warn('[Trace Typograf] панель "Прерывание" не появилась для:', JSON.stringify(expectedText));
      failed++;
      continue;
    }

    // Защита: жмём кнопку ТОЛЬКО если реально выделено ровно ожидаемое
    // слово-слово, а не что-то более широкое (случайное выделение
    // пользователя, оставшееся с прошлого раза, или Draft.js нормализовал
    // наш Range шире, чем мы просили). Сравнение регистронезависимое —
    // Selection.toString() в Chrome отдаёт текст КАК ОТРИСОВАН (с учётом
    // CSS text-transform: uppercase на кнопках и т.п.), а не как он лежит
    // в textContent/DOM; сам Range при этом честно указывает на нужные
    // символы — обнаружено вживую 2026-08-10 на кнопке "НАЧАТЬ СО
    // ЗНАКОМСТВА" (в DOM — обычным регистром "Начать со знакомства").
    const actualText = sel.toString();
    if (actualText.toLowerCase() !== expectedText.toLowerCase()) {
      console.warn(
        '[Trace Typograf] выделение не совпало, пропускаю "не переносить":',
        JSON.stringify(expectedText), 'вместо этого выделено', JSON.stringify(actualText)
      );
      failed++;
      continue;
    }

    const buttons = group.querySelectorAll('button');
    if (buttons.length < 2) { failed++; continue; }

    // Если "не переносить" уже активна для этого места (прошлый прогон
    // или это выставили руками) — НЕ жмём кнопку повторно. Это тумблер:
    // повторный клик снимает стиль и, судя по всему, мутирует DOM ровно
    // настолько, что офсеты последующих hunks в этом же тексте (тире,
    // кавычки) съезжают и execCommand стирает соседние слова — реальная
    // потеря текста, воспроизведено вживую 2026-08-10. Уже применённое
    // считаем success без клика.
    if (buttons[1].classList.contains('tt-button--state-active')) {
      // Уже неразрывно (прошлый прогон или выставлено руками) — считаем
      // ОТДЕЛЬНО от applied. Иначе повторный запуск на уже поправленном
      // тексте рапортовал "Готово — типографика расставлена", не тронув
      // ни одного символа: ложный успех, замаскированный под работу.
      already++;
      await wait(60);
      continue;
    }

    buttons[1].click();
    applied++;

    // ДВА разных сигнала "устаканилось", проверяют разное и оба нужны:
    //
    // 1) waitForDomQuiet — ждём, пока ВНУТРЕННОСТИ поля (листья Draft.js,
    //    <span data-offset-key>) реально перестанут мутировать. Это
    //    прямое наблюдение через MutationObserver, а не догадка по
    //    косвенному признаку. Обязателен ПЕРЕД следующей парой слов в
    //    этом же прогоне — иначе следующий клик может прийти на поле, у
    //    которого реконсиляция от ЭТОГО клика ещё не закончилась, и
    //    Taptop теряет текст (см. комментарий в waitForStableEditable.js,
    //    найдено вживую 2026-08-21 сверкой с ручным выделением в консоли:
    //    Range строился идентично ручному, разница была именно во
    //    времени клика). document.body — наблюдаем ВЫШЕ поля, потому что
    //    React может подменить сам div поля целиком (см. п.2), и тогда
    //    наблюдение за старым узлом просто перестало бы что-либо видеть.
    //
    // 2) waitForStableEditable — отдельно проверяет, что document.activeElement
    //    (сам узел поля) не гуляет между несколькими подряд идущими
    //    ре-рендерами — обнаружено вживую 2026-08-10, узел поля тоже может
    //    подменяться, не только его дети. root ниже нужно обновить на
    //    актуальный, если подмена случилась.
    await waitForDomQuiet(document.body, 200, 2000);
    const settled = await waitForStableEditable(1500);
    if (settled) root = settled;
  }

  sel.removeAllRanges();
  return { applied, already, failed };
}
