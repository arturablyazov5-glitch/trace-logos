// Заменяет каждый <br> внутри root на настоящий текстовый пробел — через
// Selection + execCommand('insertText', …), тем же путём, что и все
// остальные правки в этом расширении (см. applyHunksToContentEditable.js),
// а НЕ прямой мутацией DOM (node.replaceWith(...)).
//
// Почему это важно: Draft.js реконсилит свою внутреннюю модель по
// нативным input-событиям, которые рождает execCommand, но не видит
// произвольные DOM-мутации в обход них. Первая версия (2026-08-10) меняла
// <br> напрямую через replaceWith — модель Draft.js расходилась с DOM, и
// это привело к точно той же потере текста, что мы чинили раньше в этой же
// функции (см. applyTypografToElement.js). execCommand — тот путь, что уже
// многократно проверен вживую как совместимый с их реконсиляцией.
// Жёсткий потолок на число замен — защита от бесконечного цикла, если
// execCommand по какой-то причине не уберёт найденный <br> (кнопка молча
// зависала на "Применяю..." без этого лимита, воспроизведено вживую
// 2026-08-10 на поле без единого настоящего <br> в контенте — root.
// querySelector('br') находил что-то, execCommand не справлялся, и
// каждая следующая итерация находила ту же ноду заново).
const MAX_BR_REPLACEMENTS = 20;

function normalizeBrToSpace(root) {
  const sel = window.getSelection();
  let count = 0;
  let br = root.querySelector('br');
  while (br && count < MAX_BR_REPLACEMENTS) {
    const range = document.createRange();
    range.selectNode(br);
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand('insertText', false, ' ');
    count++;

    const next = root.querySelector('br');
    if (next === br) {
      // execCommand не убрал найденный <br> — дальше только зациклимся.
      console.warn('[Trace Typograf] normalizeBrToSpace: execCommand не убрал <br>, останавливаюсь.');
      break;
    }
    br = next;
  }
  return count;
}

// Заменяет каждый ЛИТЕРАЛЬНЫЙ символ переноса строки (\n) внутри текста
// поля на обычный пробел — тот же принцип, что у "Склеить переносы
// строк" в Figma-плагине Trace Typograf ("Enter внутри абзаца → пробел,
// дальше сам движок переносит по ширине"), только здесь это не тумблер
// на выбор пользователя, а обязательный шаг: расширение всегда должно
// иметь дело с ЧИСТЫМ текстом абзаца, без ручных Enter внутри него.
//
// ПОЧЕМУ ЭТО ОТДЕЛЬНО ОТ normalizeBrToSpace ВЫШЕ: та функция чистит
// РАЗМЕТКУ (<br> — реальный DOM-элемент, ищется querySelector'ом). Этот
// же \n — не элемент, а СИМВОЛ внутри nodeValue текстовой ноды: Taptop
// на некоторых полях хранит ручной перенос строки именно так, не через
// <br>. Обнаружено вживую 2026-08-21 при разборе потери текста в поле
// "После занятий родитель понимает, как ребёнок включается и что с ним
// происходит дальше" — TreeWalker по полю нашёл текстовую ноду со
// значением "После занятий родитель\nпонимает, " — литеральный \n прямо
// в середине строки. normalizeBrToSpace.js его не видит вообще
// (querySelector('br') ищет ЭЛЕМЕНТ, не символ) — значит ВСЯ остальная
// цепочка (typografizeProtected → myersDiff → applyTaptopNoBreakRuns →
// applyHunksToContentEditable) до сих пор работала с текстом, где был
// необработанный \n, а Draft.js при своей внутренней реконсиляции мог
// обращаться с этим символом как со своей собственной границей (мягкий
// перенос/абзац) — ровно там, где и терялся текст.
//
// ПОДТВЕРЖДЕНО ВЖИВУЮ (2026-08-21) через консоль: гипотеза про литеральный
// \n верна (найден прямо в textContent, поле держит белый-space:pre-wrap,
// который его и рендерит принудительным переносом) — НО первая версия
// этой функции всё равно не убирала перенос. Причина найдена тем же
// путём: Range, который выделяет ТОЛЬКО символ \n (и ничего больше),
// Chrome для execCommand('insertText', …) трактует как ПУСТОЕ выделение —
// insertText ВСТАВЛЯЕТ пробел, но не заменяет/не удаляет исходный \n
// (видно по факту: "спорт, \nтворчество" → "спорт,  \nтворчество", было
// 1 пробел перед \n, стало 2, сам \n остался на месте — вставка без
// замены). Тот же класс проблемы, что "выделение из одних пробелов
// Chrome схлопывает" — общеизвестный нюанс, разбирали похожую вещь на
// многословных Range в applyTaptopNoBreakRuns.js.
//
// ВТОРАЯ ПОПЫТКА ТОЖЕ НЕ СРАБОТАЛА (2026-08-21, живая проверка): выделение
// "\n + сосед" тоже не заменилось — insertText(' т') ДОБАВИЛ текст рядом,
// а исходные "\n" и "т" остались нетронутыми ("спорт,   т\nтворчество" —
// три пробела и задвоенная "т", вместо ожидаемой замены). Значит дело не
// в границах Range вообще — execCommand('insertText', …) в этом поле не
// заменяет ВЫДЕЛЕНИЕ, если оно затрагивает \n, при любой его ширине.
// Похоже, Draft.js обрабатывает "replace selection" (beforeinput
// insertText поверх непустого Range) иначе, чем ОДИНОЧНОЕ нажатие
// клавиши — а Delete/Backspace у них штатно отлажены (это база любого
// текстового редактора, keyCommandBackspace/keyCommandDelete в Draft.js).
//
// ТРЕТЬЯ ПОПЫТКА: не "выделить и напечатать поверх", а сымитировать
// ОДНО нажатие Delete курсором, коллапсированным ПРЯМО ПЕРЕД \n (start
// === end, никакого выделения вообще). Синхронно эта версия РЕАЛЬНО
// убирала \n (проверка сразу после execCommand это подтверждала) — но
// через тик Draft.js его ВОЗВРАЩАЛ ОБРАТНО. Разгадка (найдена вживую
// 2026-08-21 через React DevTools-подобный обход fiber): Draft.js хранит
// перенос как символ \n ВНУТРИ своей immutable ContentState-модели, и
// эта модель независима от того, что видно в живом DOM — на следующем
// ре-рендере блок перерисовывается ИЗ МОДЕЛИ, а не из DOM, и наша правка
// в DOM просто теряется. Никакая комбинация Selection/Range/execCommand
// не может это обойти в принципе — правится не то место, где перенос
// реально хранится.
//
// РАБОЧИЙ ФИКС ДЛЯ TAPTOP — не здесь, а через их же официальный API
// (draft-js EditorState/Modifier + их onChange, найденные через обход
// React fiber в MAIN-мире) — см. joinNewlinesViaDraftModel() в
// platformMain/taptopMainBridge.js, вызывается оттуда через
// callTaptopApi('join-newlines') в applyTypografToElement.js. Подтверждено
// вживую: переживает полную перезагрузку страницы.
//
// normalizeNewlinesToSpace ниже (DOM/execCommand-путь) оставлена только
// как best-effort фолбэк для ДРУГИХ платформ этого расширения (Tilda) —
// их внутреннее устройство пока не исследовано, и неизвестно, страдает
// ли Tilda тем же расхождением DOM/модели, что Taptop. На Taptop эта
// функция больше НЕ вызывается.
const MAX_NEWLINE_REPLACEMENTS = 40;

function normalizeNewlinesToSpace(root) {
  const sel = window.getSelection();
  let count = 0;

  for (let i = 0; i < MAX_NEWLINE_REPLACEMENTS; i++) {
    const text = getElementText(root);
    const idx = text.indexOf('\n');
    if (idx === -1) break;

    // Коллапсированный курсор ровно перед \n.
    const map = buildTextNodeOffsetMap(root);
    const range = rangeFromOffsets(root, map, idx, idx);
    sel.removeAllRanges();
    sel.addRange(range);

    const beforeDelete = getElementText(root);
    // Ожидаем РОВНО: тот же текст, но без символа на позиции idx (\n) —
    // и больше никаких изменений. Любое другое расхождение (ничего не
    // изменилось, изменилось не в той позиции, пропало больше/меньше
    // символов) — стоп, не продолжаем вслепую.
    const expectedAfter = beforeDelete.slice(0, idx) + beforeDelete.slice(idx + 1);

    document.execCommand('forwarddelete', false, null);
    const afterDelete = getElementText(root);

    if (afterDelete !== expectedAfter) {
      console.warn(
        '[Trace Typograf] normalizeNewlinesToSpace: forwarddelete дал не то, что ожидалось, останавливаюсь.',
        '\nBEFORE:  ', JSON.stringify(beforeDelete.slice(Math.max(0, idx - 15), idx + 15)),
        '\nAFTER:   ', JSON.stringify(afterDelete.slice(Math.max(0, idx - 15), idx + 15)),
        '\nEXPECTED:', JSON.stringify(expectedAfter.slice(Math.max(0, idx - 15), idx + 15))
      );
      break;
    }
    count++;

    // Соседние слова слиплись (не было пробела ни до, ни после \n) —
    // курсор сейчас коллапсирован ровно в точке стыка, довставляем один
    // пробел обычной вставкой (не заменой диапазона).
    const joinLeft = afterDelete[idx - 1];
    const joinRight = afterDelete[idx];
    const needsSpace = joinLeft !== undefined && joinRight !== undefined
      && !/\s/.test(joinLeft) && !/\s/.test(joinRight);
    if (needsSpace) {
      document.execCommand('insertText', false, ' ');
    }
  }

  return count;
}
