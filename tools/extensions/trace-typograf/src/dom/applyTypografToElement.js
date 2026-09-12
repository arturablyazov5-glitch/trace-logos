// Верхнеуровневая функция кнопки: берёт сфокусированный элемент, находит
// его редактируемый корень, прогоняет текст через движок и точечно
// применяет только реально изменившиеся куски — остальной DOM/форматирование
// не трогается.
//
// async: на Taptop неразрывность пар слов применяется не вставкой символа,
// а серией кликов по их собственной кнопке "Прерывание" — см.
// platform/applyTaptopNoBreakRuns.js, там же — почему.
//
// Возвращает { changed: boolean, reason?: string }.
async function applyTypografToElement(focusedEl) {
  let root = getEditableRoot(focusedEl);
  if (!root) return { changed: false, reason: 'not-editable' };

  const platform = detectPlatform();

  // <br> внутри поля физически заменяем на обычный пробел ДО того, как
  // вообще что-либо считаем — попытка учитывать <br> отдельно прямо в
  // диффе (виртуальный "символ" в карте офсетов) не прижилась: Selection/
  // Range на его границе в Draft.js вели себя непредсказуемо и стирали
  // соседний текст (воспроизведено вживую 2026-08-10). После замены на
  // настоящий текстовый пробел остальной код ничего не знает про <br> и
  // работает как для обычного плоского текста. См. normalizeBrToSpace.js.
  if (root.tagName !== 'INPUT' && root.tagName !== 'TEXTAREA') {
    normalizeBrToSpace(root);
  }

  // Ручные Enter внутри абзаца ("Склеить переносы строк", тот же принцип,
  // что в Figma-плагине Trace Typograf). На Taptop это НЕ обычный DOM/
  // execCommand-хак (см. normalizeBrToSpace.js — там подробно, почему тот
  // путь тупиковый: их Draft.js хранит перенос как символ \n ВНУТРИ своей
  // immutable-модели контента и перерисовывает его обратно из модели на
  // следующем же ре-рендере, что бы мы ни поменяли в живом DOM). Вместо
  // этого — их же официальный API (draft-js EditorState/Modifier + их
  // собственный onChange), вызванный из MAIN-мира через
  // platformMain/taptopMainBridge.js. Подтверждено вживую 2026-08-21:
  // переживает полную перезагрузку страницы, то есть реально долетает до
  // их хранилища.
  let newlinesJoined = 0;
  if (platform === 'taptop' && root.tagName !== 'INPUT' && root.tagName !== 'TEXTAREA') {
    const joinResult = await callTaptopApi('join-newlines');
    console.info(
      '[Trace Typograf] join-newlines →', JSON.stringify(joinResult),
      '| текст поля ДО:', JSON.stringify(getElementText(root).slice(0, 60))
    );
    if (joinResult && joinResult.ok && joinResult.changed) {
      newlinesJoined = joinResult.count || 1;
      // ОБЯЗАТЕЛЬНО ждём, пока их React реально перерисует поле из
      // обновлённой модели. onChange только ПЛАНИРУЕТ ре-рендер — сразу
      // после него DOM ещё содержит СТАРЫЙ текст (с \n).
      //
      // Без этого ожидания ломалась вся остальная обработка (найдено
      // вживую 2026-08-21): oldText ниже читался из ещё не обновлённого
      // DOM, applyTaptopNoBreakRuns считал по нему офсеты, а перед самым
      // применением срабатывала защита "текст поля изменился во время
      // обработки — пропускаю остальные правки". Симптом для
      // пользователя: строки склеились, но "Прерывание" не проставилось
      // ни в одной паре слов — причём именно на тех полях, где склейка
      // сработала.
      await waitForDomQuiet(document.body, 200, 2000);
      // Их onChange мог спровоцировать ре-рендер, заменяющий сам DOM-узел
      // поля — тот же класс переприсоединения root, что и после клика по
      // "Прерывание" ниже.
      if (!document.contains(root) && isEditableElement(document.activeElement)) {
        root = getEditableRoot(document.activeElement) || root;
      }
    } else if (joinResult && !joinResult.ok) {
      console.warn('[Trace Typograf] join-newlines не сработал:', joinResult.reason, joinResult.message || '');
    }
  } else if (root.tagName !== 'INPUT' && root.tagName !== 'TEXTAREA') {
    // Другие платформы (Tilda) — их внутреннее устройство не исследовано,
    // оставляем прежний best-effort DOM-путь как было.
    normalizeNewlinesToSpace(root);
  }

  const oldText = getElementText(root);
  if (!oldText || !oldText.trim()) return { changed: false, reason: 'empty' };

  const rawNewText = typografizeProtected(oldText, {}, [URL_RE, RATIO_TIME_RE]);

  let noBreakApplied = 0;
  let noBreakAlready = 0;
  let noBreakFailed = 0;
  if (platform === 'taptop') {
    const noBreak = await applyTaptopNoBreakRuns(root, oldText, rawNewText);
    noBreakApplied = noBreak.applied;
    noBreakAlready = noBreak.already;
    noBreakFailed = noBreak.failed;
    // Клики по их кнопке "Прерывание" могли спровоцировать React
    // ре-рендер, заменяющий сам DOM-узел поля, не только его детей
    // (см. applyTaptopNoBreakRuns.js) — используем актуальный root дальше,
    // если старый уже отвалился от документа.
    if (!document.contains(root) && isEditableElement(document.activeElement)) {
      root = getEditableRoot(document.activeElement) || root;
    }
  }

  // Taptop не переживает литеральный НБСП при выходе из редактирования —
  // на этой платформе неразрывность уже применена выше, через их кнопку;
  // здесь просто не даём execCommand вставить символ, который всё равно
  // слетит. См. platform/taptopQuirks.js.
  const newText = platform === 'taptop' ? stripNbspForTaptop(rawNewText) : rawNewText;

  // Защита от потери текста (воспроизведено вживую 2026-08-10): hunks
  // ниже посчитаны по офсетам в oldText, а применяются к ТЕКУЩЕМУ DOM.
  // Если между расчётом и применением текст в поле уже поменялся не
  // нашими действиями (их клик по "Прерывание" на уже включённом стиле
  // — тумблер, снимает и мутирует DOM) — офсеты указывают не туда, и
  // execCommand подменяет/стирает случайный кусок текста рядом. Поэтому
  // сверяем текст ПРЯМО ПЕРЕД применением и, если он разошёлся с тем, по
  // которому считали hunks, обычные правки не трогаем вообще — лучше
  // недоправить, чем стереть слова.
  if (platform === 'taptop' && getElementText(root) !== oldText) {
    console.warn('[Trace Typograf] текст поля изменился во время обработки — пропускаю остальные правки, чтобы не задеть лишнее.');
    if (noBreakApplied > 0 || newlinesJoined > 0) await exitTaptopEditing(root);
    if (noBreakApplied > 0 || newlinesJoined > 0) return { changed: true };
    return { changed: false, reason: noBreakFailed > 0 ? 'nobreak-failed' : 'no-change' };
  }

  const hunks = newText === oldText ? [] : diffToHunks(myersDiff(oldText, newText));

  if (hunks.length) {
    // Ещё одна проверка на отвалившийся от документа узел — на этот раз
    // прямо перед самим применением, а не только после цикла "не
    // переносить" выше. Текст мог совпасть (проверка чуть выше это не
    // ловит), а узел всё равно успеть замениться React'ом между тем и
    // этим моментом — обнаружено вживую 2026-08-10 ("addRange(): range
    // isn't in document" прямо в applyHunksToContentEditable).
    if (!document.contains(root) && isEditableElement(document.activeElement)) {
      root = getEditableRoot(document.activeElement) || root;
    }
    if (!document.contains(root)) {
      console.warn('[Trace Typograf] поле отвалилось от документа прямо перед применением правок — пропускаю, чтобы не потерять текст.');
    } else {
      try {
        if (root.tagName === 'INPUT' || root.tagName === 'TEXTAREA') {
          applyHunksToInput(root, hunks);
        } else {
          applyHunksToContentEditable(root, hunks);
        }
      } catch (e) {
        // Тот же класс проблемы, если проявился уже В ПРОЦЕССЕ применения
        // (между hunks) — не даём ей вылететь наружу и оборвать выход из
        // редактирования ниже.
        console.warn('[Trace Typograf] правка прервалась (узел отвалился в процессе):', e && e.message);
      }
    }
  }

  const changed = hunks.length > 0 || noBreakApplied > 0 || newlinesJoined > 0;
  // Автовыход из редактирования на Taptop — уводим фокус ровно так же,
  // как если бы пользователь сам кликнул мимо поля.
  if (platform === 'taptop' && changed) await exitTaptopEditing(root);

  // 'nobreak-failed' ≠ 'no-change': текст ПРАВИТЬ БЫЛО ЧТО (движок нашёл
  // пары для неразрывного пробела), но нажать их кнопку "Прерывание" не
  // вышло ни разу. До 2026-08-19 оба случая отдавали 'no-change', и попап
  // писал "уже без замечаний" на молчаливом провале — самый неудобный
  // класс бага: расширение отчитывается об успехе, ничего не сделав.
  if (changed) return { changed: true };
  return {
    changed: false,
    reason: noBreakFailed > 0 ? 'nobreak-failed' : 'no-change',
    failed: noBreakFailed,
    already: noBreakAlready,
  };
}
