// Trace Logo's — Clean Layers (Figma plugin)
//
// Единственный источник логики main thread — не build-артефакт (см. тот же
// подход в photo-editor/README.md: TS-тулчейн убран, отдельный code.ts не
// держим, он не был подключён ни к какой сборке и только создавал риск
// разъехаться с реальным поведением). Меняешь логику — правь этот файл
// напрямую, Figma подхватывает его как есть (manifest.json's "main").
//
// Два независимых инструмента, между ними нет порядка/зависимости:
// - Удалить скрытые слои — рекурсивно по всему дереву области действия,
//   узел любого типа (фрейм, группа, вектор, текст, инстанс — что угодно)
//   с visible === false удаляется целиком вместе с содержимым.
// - Удалить скрытые заливки/обводки/эффекты — у оставшихся узлов чистит
//   массивы fills/strokes/effects от записей с visible === false, сам узел
//   не трогает. Пример из ТЗ: узел с 3 fill-слоями, 2 выключены — оба
//   удаляются, включённый остаётся как есть.

figma.showUI(__html__, { width: 360, height: 200 });

// Область действия — ТОЛЬКО текущее выделение, рекурсивно по потомкам.
// Раньше при пустом выделении плагин чистил всю текущую страницу; убрано
// по прямой просьбе пользователя (2026-08-16) — слишком рискованно
// применять "удалить скрытое" без явного выделения конкретных узлов.
// Ничего не выделено ⇒ пустая область действия, инструменты недоступны
// (см. двухэкранный UI в ui.html, тот же принцип, что в photo-editor).
function getScopeRoots() {
  return figma.currentPage.selection.slice();
}

// Узел внутри инстанса компонента (не сам инстанс — именно его потомок)
// нельзя структурно удалить через Plugin API: node.remove() на нём кидает
// исключение, инстанс зеркалит структуру мастер-компонента и правится
// только через свойства/оверрайды, не .remove(). Сам инстанс как единый
// узел удалить можно — ограничение только на то, что у него ВНУТРИ.
// Проверяем предка, не сам node: node.type === 'INSTANCE' — это ситуация
// "мы и есть инстанс", а не "мы внутри него".
function isInsideInstance(node) {
  var p = node.parent;
  while (p && p.type !== 'PAGE') {
    if (p.type === 'INSTANCE') return true;
    p = p.parent;
  }
  return false;
}

// ─── Правила обоих инструментов (применяются внутри scanScope ниже) ───
//
// Инструмент 1 (скрытые слои): никаких исключений по типу узла —
// COMPONENT/COMPONENT_SET удаляются наравне со всем остальным, если
// скрыты (защита мастер-компонентов была, убрана по просьбе пользователя
// 2026-08-16). Locked нигде в плагине не защищает — ни от удаления
// скрытого узла, ни от чистки заливок (обе защиты тоже убраны по прямой
// просьбе, 2026-08-16). Скрытые узлы ВНУТРИ инстанса считаются отдельно
// и не удаляются — Plugin API это запрещает; раньше они молча
// проваливались на node.remove(), давая "64 найдено, 0 удалено".
//
// Инструмент 2 (скрытые заливки/обводки/эффекты): fills/strokes/effects —
// три массива Paint/Effect с одинаковым полем visible, поэтому одна и та
// же чистка применима ко всем трём без дублирования логики.
function stripHidden(list) {
  if (!Array.isArray(list)) return null; // figma.mixed — узел не трогаем
  var kept = [];
  var removed = 0;
  for (var i = 0; i < list.length; i++) {
    if (list[i].visible === false) removed++; else kept.push(list[i]);
  }
  return removed > 0 ? { kept: kept, removed: removed } : null;
}

// ─── Заливки, полностью перекрытые непрозрачным слоем сверху ───
//
// Правило от пользователя (2026-08-16), с точными граничными случаями:
// - чёрный 100% сверху, под ним белый 100% → белый удаляем (чёрный кроет
//   его целиком, снизу физически ничего не видно и не может стать видно).
// - чёрный 99% сверху, под ним белый 100% → НЕ трогаем (1% просвета —
//   белый частично участвует в результате).
// - градиент чёрный 100% → белый 13% сверху, под ним белый 100% → НЕ
//   трогаем (у градиента есть точка с alpha 13% — там нижний слой виден).
// - градиент чёрный 100% → белый 0% сверху, то же самое → НЕ трогаем.
// - градиент чёрный 100% → белый 100% сверху (оба стопа непрозрачны, цвет
//   просто разный) → под ним белый 100% удаляем: непрозрачно ВЕЗДЕ по
//   всей заливке, значит перекрывает целиком, невзирая на смену цвета.
//
// Общее правило: paint "гарантированно непрозрачен по всей площади", если
// paint.opacity == 1 И (для солида — этого достаточно, alpha у SolidPaint
// нет отдельно от opacity) И (для градиента — alpha КАЖДОГО стопа == 1).
// Как только истинная непрозрачность не гарантирована хоть где-то —
// правило не применяется вообще, ничего не удаляется (лучше не тронуть
// лишнее, чем случайно съесть то, что реально влияет на картинку).
var OPACITY_EPS = 1e-4;
function isOpaqueEverywhere(value) {
  return value == null || value >= 1 - OPACITY_EPS;
}
function isFullyOpaquePaint(paint) {
  // Не-NORMAL blend mode (Multiply/Screen/...) даёт результат, зависящий
  // от того, что под ним, — 100% opacity там НЕ значит "перекрывает
  // целиком". PASS_THROUGH на Paint не встречается (это groupBlendMode),
  // но на всякий случай трактуем как обычный normal.
  if (paint.blendMode && paint.blendMode !== 'NORMAL' && paint.blendMode !== 'PASS_THROUGH') return false;
  if (!isOpaqueEverywhere(paint.opacity)) return false;
  if (paint.type === 'SOLID') return true;
  if (paint.type === 'GRADIENT_LINEAR' || paint.type === 'GRADIENT_RADIAL' ||
      paint.type === 'GRADIENT_ANGULAR' || paint.type === 'GRADIENT_DIAMOND') {
    return paint.gradientStops.every(function (stop) { return isOpaqueEverywhere(stop.color.a); });
  }
  // IMAGE/VIDEO — реальная прозрачность зависит от пикселей (альфа-канал
  // PNG), которых мы не декодируем (это был бы отдельный тяжёлый шаг, как
  // в photo-editor через canvas в UI, и отдельный источник риска). Не
  // считаем изображения гарантированно непрозрачными НИКОГДА — та же
  // логика "лучше не тронуть", что и с остальными неоднозначными случаями.
  return false;
}

// В массиве fills индекс 0 — низ стопки, последний индекс — верх (то, что
// рисуется поверх остального). Ищем САМЫЙ ВЕРХНИЙ полностью непрозрачный
// paint — всё строго ПОД ним гарантированно невидимо и удаляется целиком,
// даже если там ещё несколько слоёв (не только непосредственный сосед).
function stripOccludedFills(list) {
  if (!Array.isArray(list)) return null; // figma.mixed — узел не трогаем
  var topmostOpaque = -1;
  for (var i = list.length - 1; i >= 0; i--) {
    if (isFullyOpaquePaint(list[i])) { topmostOpaque = i; break; }
  }
  if (topmostOpaque <= 0) return null; // ничего не найдено, либо оно и так снизу
  return { kept: list.slice(topmostOpaque), removed: topmostOpaque };
}

// Заливки чистятся в два прохода: сперва выключенные (visible === false —
// та же логика, что для strokes/effects), потом, отдельно, среди того, что
// осталось, — перекрытые непрозрачным слоем сверху. Порядок важен: сначала
// выкидываем то, что вообще не участвует в рендере, и только на оставшемся
// реальном стеке ищем непрозрачную "крышку".
function stripFills(list) {
  var afterHidden = stripHidden(list);
  var visible = afterHidden ? afterHidden.kept : list;
  if (!Array.isArray(visible)) return afterHidden; // figma.mixed
  var afterOccluded = stripOccludedFills(visible);
  if (!afterOccluded) return afterHidden;
  var hiddenRemoved = afterHidden ? afterHidden.removed : 0;
  return { kept: afterOccluded.kept, removed: hiddenRemoved + afterOccluded.removed };
}

function applyPaintChanges(changes) {
  for (var i = 0; i < changes.length; i++) {
    changes[i].node[changes[i].prop] = changes[i].kept;
  }
}

// ─── Фоновое сканирование ───
//
// ГЛАВНАЯ причина зависаний (найдена 2026-08-16 после двух неудачных
// попыток чинить не то): обход дерева был СИНХРОННЫМ и гонялся ТРИЖДЫ на
// каждую смену выделения — collectHiddenLayers, потом collectHiddenPaint-
// Changes, потом ещё countNodes. На тяжёлом файле выделенный фрейм это
// десятки тысяч узлов, то есть три полных обхода подряд в одном
// непрерывном блоке JS. Пока он крутится, поток не отдаётся никому: ни
// перерисовке UI плагина, ни обработке следующего клика. Отсюда оба
// репорта — фриз при открытии файла (стартовый вызов на уже выделенном
// узле) и фриз при переклике. Вес был вообще ни при чём: и дебаунс, и
// перенос веса "в фон" лечили симптом, а блокировал поток сам обход.
//
// Решение: ОДИН обход вместо трёх, и он асинхронный — каждые CHUNK_SIZE
// узлов отдаёт поток управления (await yieldToEventLoop) и продолжает
// на следующем тике. Между кусками успевают обработаться и клики, и
// перерисовка, поэтому интерфейс не замирает ни на каком размере файла.
var CHUNK_SIZE = 500;

function yieldToEventLoop() {
  return new Promise(function (resolve) { setTimeout(resolve, 0); });
}

// Один проход собирает СРАЗУ всё, что нужно карточке и обеим кнопкам:
// скрытые узлы (удалимые + внутри инстансов) и скрытые слои заливок.
// isCancelled() — колбэк проверки актуальности: перед каждым куском
// спрашиваем "этот скан ещё нужен?", и если выделение уже сменилось,
// бросаем работу на месте, а не досканиваем впустую то, что всё равно
// будет отброшено.
async function scanScope(roots, isCancelled) {
  var hiddenToRemove = [];
  var hiddenInsideInstance = 0;
  var paintChanges = [];
  var paintStats = { fills: 0, strokes: 0, effects: 0, nodes: 0 };

  var stack = roots.slice();
  var processed = 0;

  while (stack.length > 0) {
    if (processed > 0 && processed % CHUNK_SIZE === 0) {
      await yieldToEventLoop();
      if (isCancelled && isCancelled()) return null;
    }
    processed++;

    var node = stack.pop();

    if (node.visible === false) {
      if (isInsideInstance(node)) hiddenInsideInstance++;
      else hiddenToRemove.push(node);
      continue; // содержимое уйдёт вместе с узлом (если удалим) — не спускаемся
    }

    var touched = false;
    // fills — особый случай: помимо выключенных, чистим ещё и перекрытые
    // непрозрачным слоем сверху (см. stripFills выше). strokes/effects
    // такого понятия "перекрытия" не имеют — там только явный visible.
    // Обычные for-циклы, не forEach/массив с колбэком — это горячий путь
    // (см. комментарий про фоновое сканирование выше), лишние замыкания на
    // каждый узел ни к чему.
    if ('fills' in node) {
      var fillsRes = stripFills(node.fills);
      if (fillsRes) {
        paintChanges.push({ node: node, prop: 'fills', kept: fillsRes.kept });
        paintStats.fills += fillsRes.removed;
        touched = true;
      }
    }
    if ('strokes' in node) {
      var strokesRes = stripHidden(node.strokes);
      if (strokesRes) {
        paintChanges.push({ node: node, prop: 'strokes', kept: strokesRes.kept });
        paintStats.strokes += strokesRes.removed;
        touched = true;
      }
    }
    if ('effects' in node) {
      var effectsRes = stripHidden(node.effects);
      if (effectsRes) {
        paintChanges.push({ node: node, prop: 'effects', kept: effectsRes.kept });
        paintStats.effects += effectsRes.removed;
        touched = true;
      }
    }
    if (touched) paintStats.nodes++;

    if ('children' in node) {
      var kids = node.children;
      for (var i = 0; i < kids.length; i++) stack.push(kids[i]);
    }
  }

  return {
    hiddenToRemove: hiddenToRemove,
    hiddenInsideInstance: hiddenInsideInstance,
    paintChanges: paintChanges,
    paintStats: paintStats,
  };
}

// ─── Единый цикл обновления карточки ───
//
// scopeRequestId — и защита от гонки, и механизм отмены. Новый запрос
// увеличивает счётчик; любой ещё не доработавший скан видит на очередной
// проверке, что его id больше не последний, и молча прекращается. Именно
// это заменило дебаунс: он больше не нужен, потому что промежуточные
// сканы не копятся и не доедают поток — их обрывает следующий же клик, а
// до UI долетает только актуальный результат.
var scopeRequestId = 0;

async function sendScopeInfo() {
  var requestId = ++scopeRequestId;
  var isCancelled = function () { return requestId !== scopeRequestId; };

  var roots = getScopeRoots();
  if (roots.length === 0) {
    figma.ui.postMessage({ type: 'scope-info', selectionCount: 0, hiddenLayers: 0, hiddenPaints: 0 });
    return;
  }

  var scan = await scanScope(roots, isCancelled);
  if (!scan || isCancelled()) return;

  var hiddenPaints = scan.paintStats.fills + scan.paintStats.strokes + scan.paintStats.effects;
  figma.ui.postMessage({
    type: 'scope-info',
    selectionCount: roots.length,
    // ВСЕГО найдено скрытых слоёв — удалимые + внутри инстансов. UI сам
    // вычитает insideInstance, чтобы показать "удалимо: N" (см. countsText
    // в ui.html); если положить сюда уже вычтенное число, вычитание станет
    // двойным и уйдёт в минус (так и было: "28 (…64 внутри… удалимо: -36)").
    hiddenLayers: scan.hiddenToRemove.length + scan.hiddenInsideInstance,
    hiddenPaints: hiddenPaints,
    insideInstanceCount: scan.hiddenInsideInstance,
  });
}

// Дебаунса нет намеренно (был, убран по прямой просьбе пользователя
// 2026-08-16 — и он действительно не решал задачу): отмена по
// scopeRequestId делает то же самое честнее. Дебаунс ЗАДЕРЖИВАЛ реакцию
// на каждый клик на фиксированные 120мс, включая одиночный клик по
// статичному элементу, но не мешал уже запущенной тяжёлой работе доедать
// поток. Отмена, наоборот, стартует мгновенно и обрывает предыдущий скан
// на первом же чанке — при протаскивании/быстром переборе слоёв
// промежуточные выделения обрываются сами, до конца досчитывается только
// то, на котором пользователь остановился.
figma.on('selectionchange', sendScopeInfo);
sendScopeInfo();

figma.ui.onmessage = async function (msg) {
  if (msg.type === 'cancel') {
    figma.closePlugin();
    return;
  }

  if (msg.type === 'resize') {
    figma.ui.resize(360, Math.max(160, Math.min(800, msg.height)));
    return;
  }

  // Ссылки промо-блока (см. _shared/promo-banner.html): в iframe плагина
  // ни <a target="_blank">, ни window.open() наружу не ведут — открыть
  // ссылку может только сам плагин.
  if (msg.type === 'open-url') {
    figma.openExternal(msg.url);
    return;
  }

  if (msg.type === 'clean-hidden-layers') {
    var layersRoots = getScopeRoots();
    if (layersRoots.length === 0) {
      figma.ui.postMessage({ type: 'error', message: 'Выдели хотя бы один слой' });
      return;
    }
    // Тот же асинхронный скан, что и у карточки — не отменяемый (null в
    // isCancelled): операцию, которую пользователь явно запустил кнопкой,
    // обрывать на полпути нельзя, в отличие от фонового обновления
    // карточки. Поток он всё равно уступает каждые CHUNK_SIZE узлов.
    var scan = await scanScope(layersRoots, null);
    var removed = 0;
    var failed = 0;
    for (var i = 0; i < scan.hiddenToRemove.length; i++) {
      try {
        scan.hiddenToRemove[i].remove();
        removed++;
      } catch (e) {
        // Не глотаем молча — раньше ровно так 64 найденных превращались в
        // "Удалено: 0" без единого следа причины. Узлы внутри инстанса уже
        // отсечены в scanScope, так что сюда должны попадать только
        // по-настоящему неожиданные случаи — логируем в консоль плагина
        // (Figma → Plugins → Development → Open Console) и честно считаем
        // отдельно, а не приплюсовываем к "удалено".
        failed++;
        console.error('clean-hidden-layers: remove() failed for', scan.hiddenToRemove[i].id, scan.hiddenToRemove[i].name, e);
      }
    }

    figma.ui.postMessage({
      type: 'clean-layers-done',
      removed: removed,
      insideInstanceCount: scan.hiddenInsideInstance,
      failed: failed,
    });

    var parts = ['Удалено скрытых слоёв: ' + removed];
    if (scan.hiddenInsideInstance) parts.push('внутри инстансов (нельзя удалить): ' + scan.hiddenInsideInstance);
    if (failed) parts.push('ошибок: ' + failed);
    figma.notify(parts.join(', '));
    // Удаление узлов само по себе выкидывает их из figma.currentPage.selection
    // и поднимает 'selectionchange' — но карточка ждёт свежие счётчики именно
    // сейчас, а не следующим тиком, поэтому обновляем явно.
    sendScopeInfo();
    return;
  }

  if (msg.type === 'clean-hidden-paints') {
    var paintsRoots = getScopeRoots();
    if (paintsRoots.length === 0) {
      figma.ui.postMessage({ type: 'error', message: 'Выдели хотя бы один слой' });
      return;
    }
    var paintsScan = await scanScope(paintsRoots, null); // не отменяемый — явное действие пользователя
    applyPaintChanges(paintsScan.paintChanges);
    var stats = paintsScan.paintStats;
    figma.ui.postMessage({ type: 'clean-paints-done', stats: stats });

    var total = stats.fills + stats.strokes + stats.effects;
    figma.notify('Удалено скрытых слоёв заливки/обводки/эффекта: ' + total +
      ' (затронуто узлов: ' + stats.nodes + ')');
    // Правка fills/strokes/effects не меняет выделение — 'selectionchange'
    // не сработает сам, обновляем счётчики карточки вручную.
    sendScopeInfo();
    return;
  }
};
