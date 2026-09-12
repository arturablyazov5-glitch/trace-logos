// Trace Logo's — Сканер внешних стилей (Figma plugin)
//
// Единственный источник логики main thread — не build-артефакт (тот же
// подход, что в clean-layers/photo-editor: TS-тулчейн убран, code.ts не
// держим отдельно, он ни к какой сборке не подключён и только создаёт риск
// разъехаться с реальным поведением). Меняешь логику — правь этот файл
// напрямую, Figma подхватывает его как есть (manifest.json's "main").
//
// Что делает: сканирует ТЕКУЩЕЕ ВЫДЕЛЕНИЕ (рекурсивно по потомкам, та же
// область действия, что в clean-layers — без явного выделения плагину
// нечего сканировать, сканировать всю страницу по умолчанию не начинаем)
// и находит узлы со стилем или переменной из внешней библиотеки — то есть
// с style.remote / variable.remote === true. Шесть проверяемых полей:
// fillStyleId, strokeStyleId, textStyleId, effectStyleId, gridStyleId и
// boundVariables (токены). "documentAccess": "dynamic-page" в манифесте —
// поэтому все обращения к стилям/переменным идут через async-варианты API
// (getStyleByIdAsync, getVariableByIdAsync, getNodeByIdAsync).

figma.showUI(__html__, { width: 360, height: 220 });

// ─── Категории и сопоставление типа стиля ───
//
// PAINT-стиль может отвечать и за fillStyleId, и за strokeStyleId — сам
// figma.getStyleByIdAsync() возвращает тип 'PAINT' в обоих случаях, разницы
// на уровне стиля нет. Поэтому обводку помечаем через overrideCategory
// явно при вызове checkStyleRemote, а не выводим категорию из типа стиля.
function categoryFromStyleType(type) {
  switch (type) {
    case 'PAINT': return 'fill';
    case 'TEXT': return 'text';
    case 'EFFECT': return 'effect';
    case 'GRID': return 'grid';
    default: return 'fill';
  }
}

// Хлебные крошки — до 3 уровней родителей, без страницы/документа. Больше
// не нужно: это подсказка "где искать глазами", а не полный путь узла —
// на него и так наводит клик по строке (сканирование + выделение слоя).
function getParentPath(node) {
  var parts = [];
  var current = node.parent;
  var depth = 0;
  while (current && current.type !== 'PAGE' && current.type !== 'DOCUMENT' && depth < 3) {
    parts.unshift(current.name);
    current = current.parent;
    depth++;
  }
  return parts.join(' / ');
}

// ─── Проверка стилей ───
// style.remote === true — стиль подключён из внешней библиотеки (не
// определён в текущем файле). figma.mixed приходит на узлах со смешанными
// стилями (например текст с двумя text-стилями внутри) — пропускаем, там
// нет одного styleId, который можно было бы проверить.
async function checkStyleRemote(styleId, overrideCategory) {
  if (!styleId || styleId === figma.mixed || styleId === '') return null;
  var style;
  try {
    style = await figma.getStyleByIdAsync(styleId);
  } catch (e) {
    return null; // стиль не резолвится (удалённая библиотека и т.п.) — не роняем скан
  }
  if (!style || !style.remote) return null;
  return {
    category: overrideCategory || categoryFromStyleType(style.type),
    styleName: style.name,
    field: style.type,
  };
}

// ─── Проверка переменных (токенов) ───
// node.boundVariables — объект вида {fills: [{id}], cornerRadius: {id}, ...}:
// у одиночных свойств (cornerRadius, itemSpacing) значение — один объект
// {id}, у списковых (fills, strokes) — массив таких объектов (по одному на
// элемент списка, который реально привязан к переменной). Ключи заранее не
// перечисляем — new binding-поля Figma добавляет со временем, а generic
// обход через Object.keys не потребует правки при каждом таком добавлении.
async function checkBoundVariables(node) {
  var results = [];
  if (!('boundVariables' in node) || !node.boundVariables) return results;
  var bv = node.boundVariables;
  var fields = Object.keys(bv);
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var binding = bv[field];
    if (!binding) continue;
    var bindings = Array.isArray(binding) ? binding : [binding];
    for (var j = 0; j < bindings.length; j++) {
      var b = bindings[j];
      if (!b || !b.id) continue;
      try {
        var variable = await figma.variables.getVariableByIdAsync(b.id);
        if (variable && variable.remote) {
          results.push({ category: 'token', styleName: variable.name, field: field });
        }
      } catch (e) {
        // библиотека переменной недоступна (отключена/удалена) — пропускаем
        // этот конкретный binding, остальные узлы всё равно должны досканироваться
      }
    }
  }
  return results;
}

function countNodes(node) {
  var count = 1;
  if ('children' in node) {
    var kids = node.children;
    for (var i = 0; i < kids.length; i++) count += countNodes(kids[i]);
  }
  return count;
}

// ─── Асинхронный обход дерева ───
//
// Стек вместо рекурсии — та же причина, что в clean-layers: рекурсивный
// async-обход глубокого дерева рискует упереться в лимит стека вызовов,
// стек-массив этого лимита не знает. Каждый узел и так требует минимум
// одного await (getStyleByIdAsync/getVariableByIdAsync — сетевых запросов
// нет, networkAccess: none, но это всё равно микрозадачи), поэтому поток
// сам по себе не блокируется так, как в чисто синхронном обходе
// clean-layers — там понадобился явный yieldToEventLoop. Здесь progress
// message шлём каждые PROGRESS_STEP узлов просто чтобы не заваливать UI
// потоком сообщений на каждый отдельный узел.
var PROGRESS_STEP = 40;

function yieldToEventLoop() {
  return new Promise(function (resolve) { setTimeout(resolve, 0); });
}

async function scanRoots(roots, total, onProgress) {
  var issues = [];
  var summary = { total: 0, fill: 0, stroke: 0, text: 0, effect: 0, grid: 0, token: 0 };
  var stack = roots.slice();
  var scanned = 0;

  while (stack.length > 0) {
    var node = stack.pop();
    scanned++;

    var details = [];
    if ('fillStyleId' in node) {
      var fillRes = await checkStyleRemote(node.fillStyleId);
      if (fillRes) details.push(fillRes);
    }
    if ('strokeStyleId' in node) {
      var strokeRes = await checkStyleRemote(node.strokeStyleId, 'stroke');
      if (strokeRes) details.push(strokeRes);
    }
    if ('effectStyleId' in node) {
      var effectRes = await checkStyleRemote(node.effectStyleId);
      if (effectRes) details.push(effectRes);
    }
    if ('textStyleId' in node) {
      var textRes = await checkStyleRemote(node.textStyleId);
      if (textRes) details.push(textRes);
    }
    if ('gridStyleId' in node) {
      var gridRes = await checkStyleRemote(node.gridStyleId);
      if (gridRes) details.push(gridRes);
    }
    var varIssues = await checkBoundVariables(node);
    for (var v = 0; v < varIssues.length; v++) details.push(varIssues[v]);

    if (details.length > 0) {
      issues.push({
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        parentPath: getParentPath(node),
        details: details,
      });
      for (var d = 0; d < details.length; d++) {
        summary[details[d].category]++;
        summary.total++;
      }
    }

    if ('children' in node) {
      var kids = node.children;
      for (var c = 0; c < kids.length; c++) stack.push(kids[c]);
    }

    if (scanned % PROGRESS_STEP === 0) {
      onProgress(scanned, total);
      await yieldToEventLoop();
    }
  }

  onProgress(scanned, total);
  return { issues: issues, summary: summary, scannedCount: scanned };
}

// ─── Состояние выделения — реактивно, как в clean-layers ───
// Карточка "что выделено" обновляется сама по себе на каждую смену
// выделения, скан запускается только явным кликом (в отличие от
// clean-layers, где счётчики скрытого пересчитываются в фоне на каждый
// selectionchange — там это дёшево, полный обход с await на каждый узел
// здесь может быть заметно тяжелее на большом выделении).
function sendSelectionInfo() {
  var sel = figma.currentPage.selection;
  figma.ui.postMessage({
    type: 'selection-info',
    hasSelection: sel.length > 0,
    count: sel.length,
    name: sel.length > 0 ? sel[0].name : '',
  });
}

figma.on('selectionchange', sendSelectionInfo);
sendSelectionInfo();

async function runScan() {
  var roots = figma.currentPage.selection.slice();
  if (roots.length === 0) {
    figma.ui.postMessage({ type: 'error', message: 'Выдели хотя бы один слой' });
    return;
  }

  var total = 0;
  for (var i = 0; i < roots.length; i++) total += countNodes(roots[i]);

  figma.ui.postMessage({ type: 'scanning', total: total });

  var result = await scanRoots(roots, total, function (scanned, totalCount) {
    figma.ui.postMessage({
      type: 'progress',
      scanned: scanned,
      total: totalCount,
      percent: totalCount > 0 ? Math.round((scanned / totalCount) * 100) : 100,
    });
  });

  figma.ui.postMessage({
    type: 'results',
    issues: result.issues,
    summary: result.summary,
    scannedCount: result.scannedCount,
  });

  if (result.summary.total > 0) {
    figma.notify('Найдено внешних стилей и токенов: ' + result.summary.total);
  } else {
    figma.notify('Внешних стилей и токенов не найдено');
  }
}

figma.ui.onmessage = async function (msg) {
  if (msg.type === 'resize') {
    figma.ui.resize(360, Math.max(220, Math.min(700, msg.height)));
    return;
  }

  // Ссылки промо-блока (см. _shared/promo-banner.html): в iframe плагина
  // ни <a target="_blank">, ни window.open() наружу не ведут — открыть
  // ссылку может только сам плагин.
  if (msg.type === 'open-url') {
    figma.openExternal(msg.url);
    return;
  }

  if (msg.type === 'scan') {
    await runScan();
    return;
  }

  if (msg.type === 'focus' && msg.nodeId) {
    var node = await figma.getNodeByIdAsync(msg.nodeId);
    if (node && node.type !== 'DOCUMENT' && node.type !== 'PAGE') {
      figma.currentPage.selection = [node];
      figma.viewport.scrollAndZoomIntoView([node]);
    }
    return;
  }
};
