// Если ничего не сфокусировано вручную, но на холсте что-то выбрано —
// применяет типограф ко всем текстовым виджетам под этим выделением: сам
// выбранный виджет (если он текстовый) и/или все вложенные текстовые
// виджеты, если выбран контейнер или повторяющийся список/карусель.
// Аналог рекурсивного обхода выделения в Figma-плагине (collectTextNodes в
// code.js) — там это children/findAll по дереву Figma-узлов, здесь —
// обход панели слоёв (collectTaptopTextRows.js), не их внутреннего дерева
// данных: см. комментарий там про то, почему дерево врёт про списки.
//
// Клик по найденной строке одновременно и находит, и ВЫБИРАЕТ её — с
// правильным id/суффиксом для этого конкретного повторения, отдельного
// шага "select по id" не нужно.
//
// Возвращает { changed, count, visited, failed }:
//   count   — сколько виджетов РЕАЛЬНО изменилось,
//   visited — сколько текстовых слоёв вообще нашлось под выделением,
//   failed  — сколько раз движок нашёл пары для неразрывного пробела, но
//             не смог нажать их кнопку "Прерывание".
// visited нужен вызывающему (contentEntry.js), чтобы отличить "текстовых
// слоёв тут нет, попробуй сфокусированное поле" от "слои были, править
// нечего" — иначе первый случай молча выглядел бы как второй.
// onProgress(index, total, label) — необязательный колбэк для панели
// прогресса на странице (ui/progressOverlay.js). Обход больших
// контейнеров идёт секундами на слой, и без него пользователь смотрит на
// статичное «Применяю…», не понимая, живо ли расширение.
async function applyTypografToTaptopSelection(onProgress) {
  const rootRow = document.querySelector('.tt-layers__item.is-selected');
  if (!rootRow) return { changed: false, count: 0, visited: 0, failed: 0 };

  const textRows = collectTaptopTextRows(rootRow);
  if (!textRows.length) return { changed: false, count: 0, visited: 0, failed: 0 };

  let changedCount = 0;
  let failedCount = 0;
  // Сколько слоёв реально удалось открыть в редактировании. Если слои
  // нашлись, а войти не вышло ни в один (их API сменился/недоступен) —
  // это провал, а не "править нечего": без разделения расширение снова
  // рапортовало бы об успехе, не тронув текст.
  let enteredCount = 0;
  let alreadyCount = 0;

  console.info('[Trace Typograf] текстовых слоёв под выделением: ' + textRows.length);

  const pause = (ms) => new Promise((r) => setTimeout(r, ms));

  // ГИГИЕНА СОСТОЯНИЯ (2026-08-19). Режим редактирования текста у Taptop —
  // глобальное состояние редактора, а не свойство нашего прогона. Пока он
  // открыт, клик по строке в панели слоёв не переключает выбранный слой.
  // Значит незакрытый редактор ломает не только текущий слой, а всё
  // после него — и переживает конец работы, отравляя СЛЕДУЮЩИЙ запуск:
  // он не находит слои, и помогает только перезагрузка страницы (ровно
  // тот симптом, с которого начался разбор). Поэтому:
  //   - закрываем редактор ПЕРЕД обходом, не полагаясь на чистый старт;
  //   - закрываем ПОСЛЕ каждого слоя безусловно, а не только когда были
  //     правки (exit идемпотентен, лишний вызов ничего не стоит);
  //   - закрываем в finally, чтобы исключение на середине не оставляло
  //     редактор открытым.
  await callTaptopApi('exit-edit');
  await pause(200);

  let index = 0;
  try {
    for (const row of textRows) {
      index++;
      console.info('[Trace Typograf] слой ' + index + '/' + textRows.length + ':', row.textContent.trim().slice(0, 40));
      if (onProgress) onProgress(index, textRows.length, row.textContent);
      row.click();
      // Даём их UI перерисоваться после выбора ДО попытки войти в
      // редактирование — та же причина, что и раньше: без паузы обрабатывался
      // только первый виджет за прогон.
      await pause(250);

      let target = await enterTaptopEditModeIfNeeded();
      if (!target) {
        // Одна повторная попытка через принудительный выход: самая частая
        // причина неудачного входа — редактор, оставшийся открытым на
        // предыдущем слое, из-за чего наш row.click() не сменил выбор.
        console.warn('[Trace Typograf] вход не удался, закрываю редактор и пробую ещё раз:', row.textContent.trim().slice(0, 40));
        await callTaptopApi('exit-edit');
        await pause(300);
        row.click();
        await pause(250);
        target = await enterTaptopEditModeIfNeeded();
      }
      if (!target) {
        console.warn('[Trace Typograf] не удалось войти в редактирование текстового слоя — пропускаю.');
        continue;
      }
      enteredCount++;

      const result = await applyTypografToElement(target);
      if (result.failed) failedCount += result.failed;
      if (result.already) alreadyCount += result.already;
      if (result.changed) changedCount++;

      // ТОЛЬКО когда applyTypografToElement сам НЕ выходил — а он выходит
      // сам (свой exitTaptopEditing внутри applyTypografToElement.js),
      // как раз когда result.changed. Раньше здесь стоял безусловный
      // повторный вызов "на всякий случай, exit идемпотентен, лишний
      // вызов ничего не стоит" — предположение оказалось неверным.
      // НАЙДЕНО ВЖИВУЮ 2026-08-21: пользователь наблюдал ровно такую
      // последовательность — выделение построено верно (сверено с
      // ручным в консоли DevTools, offsets идентичны), "Прерывание"
      // применяется корректно, а СРАЗУ ПОСЛЕ этого текст стирается. Два
      // exit-edit подряд — один изнутри applyTypografToElement сразу по
      // факту правки, второй тут же следом безусловно — и второй вызов
      // приходит, пока Taptop ещё коммитит/сериализует изменение от
      // первого. Двойной вызов не идемпотентен на практике, чем бы он ни
      // был в теории; когда правка УЖЕ применена и редактор УЖЕ закрыт
      // изнутри, второй раз сюда лезть незачем и опасно.
      // Оставшийся случай (result.changed === false — ни одной правки не
      // было) — applyTypografToElement НЕ вызывал exitTaptopEditing
      // вовсе, редактор остаётся открытым, и закрыть его обязана именно
      // эта строка — иначе следующий row.click() не сменит выбор
      // (комментарий в начале файла про "не переживает следующий запуск").
      if (!result.changed) await exitTaptopEditing(target);
      await pause(400);
    }
  } finally {
    await callTaptopApi('exit-edit');
  }

  return {
    changed: changedCount > 0,
    count: changedCount,
    visited: textRows.length,
    entered: enteredCount,
    already: alreadyCount,
    failed: failedCount,
  };
}
