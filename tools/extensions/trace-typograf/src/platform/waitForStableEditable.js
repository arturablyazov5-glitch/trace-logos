// Общее "подожди, пока редактируемый элемент устаканится" — Draft.js может
// перерендерить сам узел поля (не только его содержимое) несколько раз
// подряд: при первом монтировании (enterTaptopEditModeIfNeeded.js) и,
// как выяснилось вживую 2026-08-10, ПОВТОРНО после клика по их кнопке
// "не переносить" (applyTaptopNoBreakRuns.js) — применение стиля меняет
// внутреннюю модель, что тоже триггерит ре-рендер. Фиксированная пауза
// один раз оказывалась то мала, то избыточна — вместо неё ждём, пока
// document.activeElement не перестанет меняться STABLE_TICKS проверок
// подряд. Возвращает стабильный элемент или null по таймауту.
function waitForStableEditable(timeout) {
  const STABLE_TICKS = 4;
  const TICK_MS = 80;
  const deadline = Date.now() + (timeout || 2500);

  let candidate = null;
  let stableCount = 0;

  return new Promise((resolve) => {
    (function check() {
      const el = isEditableElement(document.activeElement) ? document.activeElement : null;
      if (el && el === candidate) {
        stableCount++;
        if (stableCount >= STABLE_TICKS) { resolve(el); return; }
      } else {
        candidate = el;
        stableCount = el ? 1 : 0;
      }
      if (Date.now() > deadline) { resolve(null); return; }
      setTimeout(check, TICK_MS);
    })();
  });
}

// Ждёт, пока ВНУТРЕННОСТИ поля (листья Draft.js — узлы с data-offset-key,
// каждый свой <span>) перестанут мутировать, а не только то, что сам
// корневой contenteditable-узел остался тем же объектом.
//
// НАЙДЕНО ВЖИВУЮ 2026-08-21, через консоль DevTools вместе с пользователем
// (см. трек разбора в чате): при цепочке из нескольких "не переносить"
// подряд в одном прогоне (applyTaptopNoBreakRuns.js) текст терялся уже
// ПОСЛЕ того, как выяснилось, что сам Range строится идентично ручному
// выделению мышью (те же anchorNode/anchorOffset/focusNode/focusOffset —
// проверено printf'ом обоих в консоли). Раз координаты совпадают, а
// результат разный — разница была во ВРЕМЕНИ: waitForStableEditable выше
// смотрит только на document.activeElement (сам div поля), а Draft.js
// может держать ЭТОТ ЖЕ div на месте, пока перестраивает его ДЕТЕЙ
// (разбивку на <span data-offset-key> — "листья") в несколько шагов
// после клика по их кнопке "не переносить". activeElement стабилен уже
// на первом тике, waitForStableEditable — тоже, а реконсиляция листьев
// продолжается ещё какое-то время. Следующий клик в цепочке приходит на
// поле, у которого ВНУТРИ ещё идёт перестройка, — и Taptop на таком
// состоянии теряет текст.
//
// MutationObserver — прямой сигнал ровно того, что нас интересует
// (реальные мутации ВНУТРИ поля), а не косвенный (стабильность ссылки на
// корень). observeRoot — узел ВЫШЕ поля (само поле React иногда подменяет
// целиком, см. комментарий в начале файла), чтобы наблюдение не оборвалось
// при замене самого редактируемого div'а.
function waitForDomQuiet(observeRoot, quietMs, timeout) {
  const QUIET_MS = quietMs || 200;
  const TIMEOUT_MS = timeout || 2000;
  return new Promise((resolve) => {
    let settled = false;
    let quietTimer = null;
    const hardDeadline = setTimeout(finish, TIMEOUT_MS);

    function finish() {
      if (settled) return;
      settled = true;
      clearTimeout(quietTimer);
      clearTimeout(hardDeadline);
      observer.disconnect();
      resolve();
    }

    const observer = new MutationObserver(() => {
      clearTimeout(quietTimer);
      quietTimer = setTimeout(finish, QUIET_MS);
    });
    observer.observe(observeRoot, { childList: true, subtree: true, characterData: true });
    // Мутаций может не быть вовсе (клик ничего не поменял) — не ждать
    // тогда полный TIMEOUT_MS впустую.
    quietTimer = setTimeout(finish, QUIET_MS);
  });
}
