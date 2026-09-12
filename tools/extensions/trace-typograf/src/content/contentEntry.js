// Точка входа content-script'а: слушает сообщение от попапа и запускает
// правку на выбранном слое (Taptop) или на сфокусированном поле.
//
// content_scripts подключены с all_frames: true (редактор Taptop/Tilda
// может рисовать холст внутри iframe) — chrome.tabs.sendMessage без
// frameId рассылает сообщение ВСЕМ фреймам вкладки, а попап получает только
// ОДИН ответ (первый вызванный sendResponse). Поэтому фрейм, в котором нет
// подходящего поля, должен промолчать (не звать sendResponse и вернуть
// false) — иначе "пустой" фрейм может ответить раньше того, где реально
// есть фокус, и попап покажет ложное "нечего менять".
// Защита от повторной инжекции в одном кадре. Раньше здесь была ещё и
// сверка штампа сборки — попап умел сам впрыскивать свежий bundle в уже
// открытую вкладку, и без сверки в кадре оказалось бы два живых слушателя.
// Весь этот механизм (пинг + автовпрыскивание + штампы) убран 2026-08-22:
// он не чинил реальную проблему, а прятал её за автоматикой, которая сама
// стала источником непредсказуемых сбоев. Единственный рабочий фикс для
// «во вкладке висит код от предыдущей загрузки страницы» — обновить
// страницу (popup.js честно об этом просит), поэтому здесь достаточно
// простого «уже загружен — не регистрируй второй listener».
if (window.__traceTypografLoaded) return;
window.__traceTypografLoaded = true;

// Тексты итога для панели на странице. Дублируют REASON_TEXT попапа
// сознательно и коротко: попап теперь закрывается сразу после старта и
// свой статус показать не успевает, а тащить общий словарь в оба мира
// (страница + окно расширения) ради пяти строк — лишняя связность.
const OVERLAY_REASON_TEXT = {
  'no-change': 'Типограф уже расставлен',
  'empty': 'Поле пустое.',
  'not-editable': 'Не нашли текстовое поле.',
  'nobreak-failed': 'Нашли, где нужен неразрывный пробел, но не смогли нажать «Прерывание».',
  'no-text-rows': 'В выбранном слое нет текстовых слоёв. Выберите слой с текстом или контейнер с ним.',
  'enter-failed': 'Нашли текст, но не смогли открыть его в редактировании. Перезагрузите страницу редактора.',
};

function overlayStatsText(s) {
  if (!s) return '';
  // Прозой, а не цифрами в столбик — но visited/entered/count считают
  // СЛОИ, а already/failed считают неразрывные пробелы ВНУТРИ слоёв
  // (applyTypografToTaptopSelection.js суммирует их через += по каждому
  // слою) — то есть уже/failed может легко превышать число слоёв. Склеив
  // их в одну фразу без единиц ("Слоёв: 5 ... уже верно: 9"), получаешь
  // на вид 9 из 5 — бессмыслицу. Поэтому разные единицы — разные
  // предложения, каждое с явным существительным.
  let t = `Проверено слоёв с текстом: ${s.visited}.`;
  if (s.entered < s.visited) t += ` Открыто для правки: ${s.entered}.`;
  if (s.count) t += ` Изменено слоёв: ${s.count}.`;
  if (s.already) t += ` Неразрывных пробелов уже было на месте: ${s.already}.`;
  if (s.failed) t += ` Не удалось расставить пробелов: ${s.failed}.`;
  return t;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== 'APPLY_TYPOGRAF') return false;

  // Элемент годится только если он ЖИВ — есть в текущем документе и всё
  // ещё редактируемый.
  const isLiveTarget = (el) => isEditableElement(el) && document.contains(el);

  const active = document.activeElement;
  const lastFocused = getLastFocusedEditable();
  const focusedTarget = isLiveTarget(active) ? active : (isLiveTarget(lastFocused) ? lastFocused : null);

  // На Taptop ветка "войти в редактирование самому" — ОСНОВНАЯ, а не
  // запасная (переставлено 2026-08-19). Раньше она включалась только при
  // пустом focusedTarget, и любой живой contenteditable в документе
  // перехватывал управление раньше неё. Это и есть причина, по которой
  // расширение писало "уже без замечаний", ничего не сделав: узел
  // редактора Draft.js остаётся в DOM и остаётся contentEditable даже
  // после того, как Taptop вышел из режима редактирования текста (правая
  // панель переключилась на "Настройки"). Проверка "жив ли узел" такое не
  // ловит — узел жив, просто их панель "Прерывание" на нём уже никогда не
  // поднимется, и цикл неразрывных пробелов молча выходит в ноль.
  //
  // Надёжного признака "Taptop сейчас в режиме редактирования текста" в
  // DOM нет (.tt-editor-panel появляется только при НЕПУСТОМ выделении
  // внутри редактора, то есть уже после того, как мы туда вошли), поэтому
  // вместо угадывания состояния просто входим сами через их API — это
  // идемпотентно: setTextEditorMode(true) на уже открытом редакторе
  // ничего не ломает. Пользовательская модель та же: кликнул по любому
  // слою — расширение само нашло тексты внутри и само вошло в правку.
  const canTryTaptop = window === window.top && detectPlatform() === 'taptop'
    && !!document.querySelector('.tt-layers__item.is-selected');
  if (!focusedTarget && !canTryTaptop) return false;

  (async () => {
    try {
      if (canTryTaptop) {
        // Панель прогресса живёт на странице, а не в попапе — см.
        // ui/progressOverlay.js: попап отбирает у документа фокус окна,
        // и на несфокусированном Draft.js Taptop не поднимает панель
        // «Прерывание». Перед стартом ждём, пока фокус вернётся во
        // вкладку после закрытия попапа.
        showProgressOverlay('Жду фокус вкладки…');
        const focused = await waitForDocumentFocus(2000);
        if (!focused) {
          console.warn('[Trace Typograf] документ не получил фокус — выделение будет «серым», Taptop может не поднять панель «Прерывание».');
        }
        showProgressOverlay('Ищу текстовые слои…');
        const result = await applyTypografToTaptopSelection(setProgressOverlay);
        console.info('[Trace Typograf] итог обхода выделения:', result);
        // Числа уходят в попап ВСЕГДА, не только в консоль: пользователь
        // читает результат в окошке расширения, и "уже без замечаний" без
        // цифр неотличимо от молчаливого провала — на этом сгорело
        // несколько итераций отладки 2026-08-19.
        const stats = {
          visited: result.visited,
          entered: result.entered,
          count: result.count,
          already: result.already,
          failed: result.failed,
        };

        if (result.changed) {
          finishProgressOverlay('Готово — типографика расставлена.', overlayStatsText(stats), 'ok');
          sendResponse({ ok: true, changed: true, stats });
          return;
        }
        // Текстовые слои были — отвечаем по существу и НЕ падаем на
        // focusedTarget: он указывал бы на тот же самый текст, только в
        // обход входа в редактирование, то есть ровно в тот молчаливый
        // no-op, из-за которого эта ветка и стала основной.
        if (result.visited > 0) {
          let reason = 'no-change';
          if (result.entered === 0) reason = 'enter-failed';
          else if (result.failed > 0) reason = 'nobreak-failed';
          finishProgressOverlay(
            OVERLAY_REASON_TEXT[reason] || 'Менять нечего.',
            overlayStatsText(stats),
            reason === 'no-change' ? 'ok' : 'err'
          );
          sendResponse({ ok: true, changed: false, reason, stats });
          return;
        }
        // Под выделением текстовых слоёв не нашлось — так и говорим.
        // НЕ падаем на focusedTarget: там почти всегда лежит узел
        // редактора Draft.js от прошлой правки, живой и contentEditable,
        // но уже не в режиме редактирования — работа по нему и есть тот
        // самый молчаливый no-op, который отвечает "уже без замечаний".
        // Обмен честного отказа на ложный успех недопустим (2026-08-19).
        console.warn('[Trace Typograf] в выбранном слое не нашли ни одного текстового слоя — обход панели слоёв вернул 0 строк.');
        finishProgressOverlay(OVERLAY_REASON_TEXT['no-text-rows'], '', 'err');
        sendResponse({ ok: true, changed: false, reason: 'no-text-rows', stats });
        return;
      }

      if (focusedTarget) {
        // Та же панель на странице: попап закрывается сразу после
        // старта, показать итог ему больше негде.
        showProgressOverlay('Правлю сфокусированное поле…');
        const result = await applyTypografToElement(focusedTarget);
        if (result.changed) finishProgressOverlay('Готово — типографика расставлена.', 'Правил сфокусированное поле.', 'ok');
        else finishProgressOverlay(OVERLAY_REASON_TEXT[result.reason] || 'Менять нечего.', 'Правил сфокусированное поле.', 'ok');
        sendResponse({ ok: true, ...result, stats: { focused: true } });
        return;
      }

      sendResponse({ ok: true, changed: false, reason: 'not-editable' });
    } catch (err) {
      finishProgressOverlay('Ошибка при правке текста.', String(err && err.message || err), 'err');
      sendResponse({ ok: false, reason: 'error', message: String(err && err.message || err) });
    }
  })();

  return true;
});
