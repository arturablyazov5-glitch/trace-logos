// MAIN-world мост к внутреннему API Taptop.
//
// Почему отдельный файл/content-script, а не часть dist/content.js:
// chrome.runtime.* (в частности onMessage, которым живёт остальной наш код
// в content/contentEntry.js) недоступен в content-script'ах, подключённых с
// "world": "MAIN" — а window.rspackChunktaptop_design_editor, наоборот,
// недоступен из ISOLATED-мира, где эти content-script'ы обычно работают.
// Этот файл — единственная часть расширения, которая живёт в MAIN-мире, и
// умеет только одно: слушать запрос на document и дёргать их API. Общий
// канал между мирами — CustomEvent на document (единственное, что видно из
// обоих миров одновременно).
//
// Ту же самую технику доступа к чанку (rspackChunktaptop_design_editor →
// req(87621).A) использует соседнее рабочее расширение пользователя
// (~/Documents/Расширения/taptop-helper/content.js) для операций со слоями;
// A.setTextEditorMode найдена и проверена вживую 2026-08-10.
//
// Раньше здесь же был обход E.tree ("collect-text-tag-ids") для поиска
// текстовых виджетов под выделением — убран 2026-08-10: у повторяющихся
// списков/каруселей (List/Block List) дерево хранит только ОДНО
// определение шаблона повтора, без понятия о том, сколько раз он реально
// отрисован (Item 1, Item 2, ...) — обход по дереву находил только первое
// повторение. Замена — collectTaptopTextRows.js, обход РЕАЛЬНОГО DOM
// панели слоёв (там видно все повторения как есть), клик по найденной
// строке уже и выбирает её — отдельный "select по id" через этот мост
// тоже больше не нужен.
(function () {
  'use strict';

  // Тот же флаг, что у dist/content.js, но в MAIN-мире: попап может
  // впрыснуть этот файл повторно в уже живую вкладку (см. popup.js), а
  // два слушателя на 'trace-typograf:taptop-api' отвечали бы на один
  // запрос дважды.
  if (window.__traceTypografBridgeLoaded) return;
  window.__traceTypografBridgeLoaded = true;

  function getUiState() {
    try {
      let req = null;
      const chunk = window.rspackChunktaptop_design_editor;
      if (!chunk) return null;
      chunk.push([[`_tt_typograf_ext_${Date.now()}`], {}, (r) => { req = r; }]);
      if (!req) return null;
      return req(87621).A;
    } catch (e) {
      return null;
    }
  }

  function getRspackRequire() {
    try {
      let req = null;
      const chunk = window.rspackChunktaptop_design_editor;
      if (!chunk) return null;
      chunk.push([[`_tt_typograf_draft_${Date.now()}`], {}, (r) => { req = r; }]);
      return req;
    } catch (e) {
      return null;
    }
  }

  // "Склеить переносы строк" — устраняет ручной Enter внутри абзаца текстового
  // поля Taptop. НЕ через DOM/execCommand (см. src/dom/normalizeBrToSpace.js —
  // там подробная история, почему тот путь тупиковый): их Draft.js-редактор
  // хранит перенос как символ \n ВНУТРИ своей immutable-модели контента
  // (ContentState), независимо от того, что видно в живом DOM. execCommand
  // может СИНХРОННО убрать \n из рендера, но на следующем же ре-рендере
  // Draft.js перерисовывает блок ИЗ СВОЕЙ МОДЕЛИ, где символ остался
  // нетронутым — правка в DOM просто откатывается, что бы мы туда ни писали.
  //
  // Правильный путь — тот же, что использует их собственный код: их публичный
  // API draft-js (EditorState/Modifier), найденный как rspack-модуль (id
  // нестабилен между сборками — ищем по СИГНАТУРЕ методов, не по числу), и их
  // же onChange, снятый с фактического React-компонента <Editor> (через
  // fiber конкретного DOM-узла, не общий синглтон — у каждого текстового
  // поля свой). Найдено и проверено вживую 2026-08-21 через консоль: правка
  // через Modifier.removeRange + EditorState.push + onChange(...) переживает
  // полную перезагрузку страницы — то есть реально долетает до их
  // персистентного хранилища, а не только до транзиентного состояния
  // компонента (в отличие от DOM/execCommand попыток).
  //
  // Кэшируем id модулей (EditorState/Modifier) на window — поиск идёт полным
  // перебором до 60000 id и стоит заметного времени, а в рамках одной
  // загрузки страницы id модулей не меняются.
  function findDraftModuleIds(req) {
    if (window.__ttypDraftModuleIds) return window.__ttypDraftModuleIds;
    const found = {};
    for (let id = 0; id < 60000; id++) {
      try {
        const exp = req(id);
        if (!exp) continue;
        const cand = exp.A || exp.default || exp;
        if (cand && typeof cand.createEmpty === 'function' && typeof cand.createWithContent === 'function') {
          found.EditorState = id;
        }
        if (cand && typeof cand.replaceText === 'function' && typeof cand.removeRange === 'function') {
          found.Modifier = id;
        }
      } catch (e) {}
    }
    window.__ttypDraftModuleIds = found;
    return found;
  }

  // Тот же обход fiber, что подтверждён вживую в консоли: ищем ближайшего
  // предка DOM-узла, чьи React-пропсы — это буквально draft-js'овский
  // <Editor editorState={...} onChange={...} .../>, а не обёртку Taptop
  // (у неё тоже есть проп editorState, но НЕ их onChange для draft-js).
  function findEditorFiber(el) {
    if (!el) return null;
    const key = Object.keys(el).find((k) => k.indexOf('__reactFiber$') === 0 || k.indexOf('__reactInternalInstance$') === 0);
    if (!key) return null;
    let node = el[key];
    let i = 0;
    while (node && i < 40) {
      const props = node.memoizedProps;
      if (props && 'editorState' in props && 'onChange' in props && typeof props.onChange === 'function') {
        return node;
      }
      node = node.return;
      i++;
    }
    return null;
  }

  function joinNewlinesViaDraftModel() {
    const root = document.querySelector('[contenteditable="true"]');
    if (!root) return { ok: false, reason: 'no-contenteditable' };

    const req = getRspackRequire();
    if (!req) return { ok: false, reason: 'no-rspack-require' };

    const ids = findDraftModuleIds(req);
    if (!ids.EditorState || !ids.Modifier) return { ok: false, reason: 'no-draft-classes' };

    const fiber = findEditorFiber(root);
    if (!fiber) return { ok: false, reason: 'no-editor-fiber' };

    const es = fiber.memoizedProps.editorState;
    const onChange = fiber.memoizedProps.onChange;
    if (!es || typeof es.getCurrentContent !== 'function' || typeof onChange !== 'function') {
      return { ok: false, reason: 'no-editor-state' };
    }

    try {
      const EditorState = req(ids.EditorState).A || req(ids.EditorState).default || req(ids.EditorState);
      const Modifier = req(ids.Modifier).A || req(ids.Modifier).default || req(ids.Modifier);

      let content = es.getCurrentContent();
      const baseSelection = es.getSelection();
      let count = 0;
      const blockKeys = content.getBlockMap().keySeq().toArray();

      for (const blockKey of blockKeys) {
        let text = content.getBlockForKey(blockKey).getText();
        let idx;
        let guard = 0;
        // MAX 40 — тот же потолок, что был у DOM-варианта normalizeNewlinesToSpace,
        // страховка от зацикливания, если execCommand-подобная правка почему-то
        // не убирает найденный \n (здесь такого не наблюдалось, но потолок не лишний).
        while ((idx = text.indexOf('\n')) !== -1 && guard++ < 40) {
          const removeSel = baseSelection.merge({
            anchorKey: blockKey, anchorOffset: idx,
            focusKey: blockKey, focusOffset: idx + 1,
            isBackward: false,
          });
          content = Modifier.removeRange(content, removeSel, 'forward');
          text = content.getBlockForKey(blockKey).getText();

          // Соседние слова слиплись (не было пробела ни до, ни после \n) —
          // довставляем один, коллапсированной вставкой в точку стыка.
          const left = text[idx - 1];
          const right = text[idx];
          const needsSpace = left !== undefined && right !== undefined && !/\s/.test(left) && !/\s/.test(right);
          if (needsSpace) {
            const insertSel = baseSelection.merge({
              anchorKey: blockKey, anchorOffset: idx,
              focusKey: blockKey, focusOffset: idx,
              isBackward: false,
            });
            content = Modifier.insertText(content, insertSel, ' ');
            text = content.getBlockForKey(blockKey).getText();
          }
          count++;
        }
      }

      if (count === 0) return { ok: true, changed: false, count: 0 };

      const newEditorState = EditorState.push(es, content, 'insert-characters');
      onChange(newEditorState);
      return { ok: true, changed: true, count: count };
    } catch (err) {
      return { ok: false, reason: 'error', message: String(err && err.message || err) };
    }
  }

  document.addEventListener('trace-typograf:taptop-api', (e) => {
    const detail = e.detail || {};
    const requestId = detail.requestId;
    const action = detail.action;
    let result = { ok: false };
    try {
      if (action === 'join-newlines') {
        result = joinNewlinesViaDraftModel();
      } else {
        const A = getUiState();
        if (A) {
          if (action === 'enter-edit') { A.setTextEditorMode(true); result = { ok: true }; }
          else if (action === 'exit-edit') { A.setTextEditorMode(false); result = { ok: true }; }
        }
      }
    } catch (err) {
      result = { ok: false, reason: 'error', message: String(err && err.message || err) };
    }
    document.dispatchEvent(new CustomEvent('trace-typograf:taptop-api-result', {
      detail: Object.assign({ requestId: requestId }, result),
    }));
  });
})();
