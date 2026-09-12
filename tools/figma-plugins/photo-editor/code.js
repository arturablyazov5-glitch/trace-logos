// Trace Logo's — Photo Editor (Figma plugin)
//
// Единственный источник логики main thread — не build-артефакт. В проекте
// нет TS-тулчейна (раньше был параллельный code.ts, который приходилось
// синхронизировать руками при каждой правке — источник постоянного риска
// разъехаться; удалён). Меняешь логику — правь этот файл напрямую,
// Figma подхватит его как есть.
//
// Четыре независимых инструмента над image-заливками выделенных узлов:
// обрезать по содержимому, восстановить исходный размер/пропорции/поворот
// узла, отразить по горизонтали/вертикали. Между ними нет порядка или
// зависимости — каждый применяется к текущему выделению сам по себе.

// 'resizable' — НЕ валидный ключ ShowUIOptions в текущем Figma Plugin API
// (проверено на практике: "Unrecognized key(s) in object: 'resizable'",
// showUI ломался целиком). Программно запретить пользователю ручку
// ресайза сейчас нельзя. "Окно не сжимается после ручного растягивания"
// чинить нужно другим путём (не через showUI options) — если вообще
// потребуется, эмпирически причина скорее была в способе измерения
// высоты на стороне ui.html (см. fitWindow() там), а не в этом.
figma.showUI(__html__, { width: 360, height: 198 });

// Правило для узлов с несколькими слоями заливки:
// - фото + цвет/градиент (не-IMAGE слои) — цвет/градиент это мусор поверх/под
//   фото, удаляем его всегда, независимо от видимости, и обрезаем фото;
// - несколько слоёв IMAGE, из них ровно один видимый — остальные (скрытые
//   фото, скрытые/видимые цвета) считаются мусором, удаляем, обрезаем видимый;
// - несколько ВИДИМЫХ слоёв IMAGE одновременно — неоднозначно, какой обрезать,
//   узел не трогаем вообще.
// Возвращает null, если узел не подходит под обрезку.
function analyzeNode(node) {
  if (!('fills' in node)) return null;
  var fills = node.fills;
  if (!Array.isArray(fills)) return null; // mixed fills — пропускаем
  if (fills.length === 0) return null;

  var imageIdx = [];
  for (var i = 0; i < fills.length; i++) {
    if (fills[i].type === 'IMAGE' && fills[i].imageHash) imageIdx.push(i);
  }
  if (imageIdx.length === 0) return null; // нечего обрезать

  var keepIdx;
  if (imageIdx.length === 1) {
    keepIdx = imageIdx[0];
  } else {
    var visibleImageIdx = imageIdx.filter(function (i) { return fills[i].visible !== false; });
    if (visibleImageIdx.length !== 1) return null; // 0 или >1 видимых фото — пропускаем
    keepIdx = visibleImageIdx[0];
  }

  return {
    visibleIndex: keepIdx,
    hasHiddenLayers: fills.length > 1, // есть что подчистить (другие фото и/или цвет/градиент)
    imageHash: fills[keepIdx].imageHash,
  };
}

// ─── Собственная история операций плагина ───
// Родной Cmd+Z в Figma отменяет ВСЮ историю документа, не только действия
// плагина — если пользователь между операциями подвигал что-то ещё,
// "Отменить" в панели откатило бы чужую правку. Поэтому свой стек: снимок
// состояния узла до/после каждой операции, минимум зависимости от
// остального документа.
function snapshotNode(node) {
  var snap = {
    fills: node.fills.map(function (f) { return Object.assign({}, f); }),
    width: node.width,
    height: node.height,
    x: node.x,
    y: node.y,
    rotation: 'rotation' in node ? node.rotation : 0,
  };
  // cornerRadius может быть числом или figma.mixed (разные уголки) — в
  // последнем случае восстанавливаем по отдельным углам, единого числа
  // для них нет.
  if ('cornerRadius' in node) {
    snap.cornerRadius = node.cornerRadius;
    if (node.cornerRadius === figma.mixed) {
      snap.topLeftRadius = node.topLeftRadius;
      snap.topRightRadius = node.topRightRadius;
      snap.bottomLeftRadius = node.bottomLeftRadius;
      snap.bottomRightRadius = node.bottomRightRadius;
    }
  }
  return snap;
}

function applySnapshot(node, snap) {
  if ('fills' in node) node.fills = snap.fills.map(function (f) { return Object.assign({}, f); });
  if (typeof node.resize === 'function') node.resize(snap.width, snap.height);
  if ('x' in node) { node.x = snap.x; node.y = snap.y; }
  if ('rotation' in node) node.rotation = snap.rotation;
  if ('cornerRadius' in node && 'cornerRadius' in snap) {
    if (snap.cornerRadius === figma.mixed) {
      node.topLeftRadius = snap.topLeftRadius;
      node.topRightRadius = snap.topRightRadius;
      node.bottomLeftRadius = snap.bottomLeftRadius;
      node.bottomRightRadius = snap.bottomRightRadius;
    } else {
      node.cornerRadius = snap.cornerRadius;
    }
  }
}

var MAX_HISTORY = 50; // старые шаги вытесняются по кругу (FIFO), см. pushHistoryStep
var historyStack = [];
var historyIndex = -1; // указывает на последний применённый шаг; всё правее — редо

// Ключ узлов, к которым относится текущая история — отсортированные id
// выделения на момент последнего непустого выбора. Снятие выделения
// (eligible.length === 0) ключ не трогает — тогда undo/redo после
// "выбрал → отпустил" продолжает работать. А вот выбор ДРУГОГО узла —
// это переключение на другое фото, история старого узла больше не
// относится к делу, обнуляем.
var historySelectionKey = null;

function sendHistoryState() {
  figma.ui.postMessage({
    type: 'history-state',
    canUndo: historyIndex >= 0,
    canRedo: historyIndex < historyStack.length - 1,
  });
}

// Новое действие обрубает редо-хвост (стандартное поведение undo/redo —
// как только сделал что-то новое после отмены, "вперёд" уже некуда).
function pushHistoryStep(changes) {
  if (changes.length === 0) return;
  historyStack = historyStack.slice(0, historyIndex + 1);
  historyStack.push(changes);
  if (historyStack.length > MAX_HISTORY) historyStack.shift();
  historyIndex = historyStack.length - 1;
  sendHistoryState();
}

// Накопитель для пакетных операций (обрезка/отражение) — они асинхронные
// и идут через UI (canvas-обработка), результат по каждому узлу приходит
// отдельным сообщением; в один шаг истории собираем весь пакет целиком,
// иначе "отменить" откатывало бы только последнее фото из выделенных.
var pendingBeforeByNode = new Map();
var pendingBatchChanges = [];

// Читает текущее выделение, для каждого подходящего узла подчищает мусорные
// слои заливки (см. analyzeNode) и возвращает прямые ссылки на узлы —
// общий первый шаг и для обрезки, и для восстановления размера.
function collectEligibleImageNodes() {
  var nodes = figma.currentPage.selection;
  var out = [];
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    var info = analyzeNode(node);
    if (!info) continue;

    if (info.hasHiddenLayers) {
      var keepFill = Object.assign({}, node.fills[info.visibleIndex], { visible: true });
      node.fills = [keepFill];
    }

    out.push({ node: node, fillIndex: 0, imageHash: info.imageHash, name: node.name });
  }
  return out;
}

// Read-only вариант collectEligibleImageNodes() — для экспорта. Экспорт не
// должен трогать структуру узла (в отличие от обрезки/отражения, где
// подчистка мусорных слоёв — часть самой операции): узел не мутируется, но
// в отличие от старой версии здесь НЕ отдаются сырые байты исходного файла —
// см. comment у 'start-export-webp' про exportAsync().
function collectExportableImageNodes() {
  var nodes = figma.currentPage.selection;
  var out = [];
  for (var i = 0; i < nodes.length; i++) {
    var info = analyzeNode(nodes[i]);
    if (!info) continue;
    out.push({ node: nodes[i], name: nodes[i].name });
  }
  return out;
}

// Деталка для карточки слоя в UI: имя/размеры/поворот показываем только
// когда выделен ровно один подходящий узел — на нескольких это неоднозначно
// (у каждого свои размеры), там просто общий счётчик.
function sendSelectionInfo() {
  var nodes = figma.currentPage.selection;
  var eligible = [];
  for (var i = 0; i < nodes.length; i++) {
    if (analyzeNode(nodes[i])) eligible.push(nodes[i]);
  }

  // Переключение на другое фото обнуляет историю плагина — см. комментарий
  // у historySelectionKey. Снятие выделения (eligible.length === 0) сюда
  // не заходит вовсе, ключ остаётся прежним.
  if (eligible.length > 0) {
    var key = eligible.map(function (n) { return n.id; }).sort().join(',');
    if (historySelectionKey !== null && key !== historySelectionKey && historyStack.length > 0) {
      historyStack = [];
      historyIndex = -1;
      sendHistoryState();
    }
    historySelectionKey = key;
  }

  var detail = null;
  if (eligible.length === 1) {
    var node = eligible[0];
    detail = {
      name: node.name,
      width: Math.round(node.width),
      height: Math.round(node.height),
      rotation: 'rotation' in node ? Math.round(node.rotation) : 0,
    };
  }

  figma.ui.postMessage({
    type: 'selection-count',
    count: eligible.length,
    total: nodes.length, // всего выделено — чтобы UI мог честно сказать "подходят не все слои"
    detail: detail,
  });
}

// Обновляется только по смене САМОГО ВЫДЕЛЕНИЯ. Переименование/ресайз слоя
// в родной панели Figma (не в плагине) карточку не обновляют, пока не
// переоткроешь плагин или не перевыделишь фото — так и было изначально.
// (Пробовали 'documentchange' — падает в рантайме без figma.loadAllPagesAsync()
// в текущем режиме documentAccess, а грузить все страницы ради этого не
// стоит; вариант отклонён, оставлено как есть.)
figma.on('selectionchange', sendSelectionInfo);
sendSelectionInfo();
sendHistoryState();

figma.ui.onmessage = function (msg) {
  return handleMessage(msg).catch(function (err) {
    figma.ui.postMessage({ type: 'error', message: (err && err.message) || String(err) });
  });
};

async function handleMessage(msg) {
  if (msg.type === 'cancel') {
    figma.closePlugin();
    return;
  }

  if (msg.type === 'resize') {
    figma.ui.resize(360, Math.max(80, Math.min(800, msg.height)));
    return;
  }

  // Ссылки промо-блока (см. _shared/promo-banner.html): в iframe плагина
  // ни <a target="_blank">, ни window.open() наружу не ведут — открыть
  // ссылку может только сам плагин.
  if (msg.type === 'open-url') {
    figma.openExternal(msg.url);
    return;
  }

  // Экспорт в .webp — read-only: узел не мутируется, поэтому нет ни
  // снапшота "до", ни шага в истории плагина (нечего отменять). Кодирование
  // в WebP делает ui.html (там есть canvas.toBlob, которого нет в main
  // thread) — здесь только отдаём байты.
  //
  // ВАЖНО: байты берутся через node.exportAsync({format: 'PNG'}), НЕ через
  // getImageByHash(...).getBytesAsync(). Второе отдаёт исходный файл
  // картинки как она лежит в документе Figma — без учёта того, как узел её
  // реально показывает (обрезка через imageTransform/scaleMode, resize,
  // rotation, скругление углов). Пользователь обрезал/повернул/подогнал
  // размер фото в Figma — экспорт должен отдать ИМЕННО ЭТО, а не сырой
  // оригинал. exportAsync() — тот же движок рендера, что у нативного
  // "Export" в Figma, он рендерит узел со всеми применёнными
  // трансформациями; дальше это просто перекодируется в webp тем же
  // encodeWebp(), которым и раньше обрабатывались PNG-байты кропа/отражения.
  if (msg.type === 'start-export-webp') {
    var exportEntries = collectExportableImageNodes();
    if (exportEntries.length === 0) {
      figma.ui.postMessage({ type: 'error', message: 'Выдели хотя бы одно изображение' });
      return;
    }
    pendingBatchChanges = []; // новый пакет — старый уже закрыт предыдущим 'all-done'
    for (var x = 0; x < exportEntries.length; x++) {
      var xe = exportEntries[x];
      if (typeof xe.node.exportAsync !== 'function') {
        figma.ui.postMessage({ type: 'node-skipped', nodeId: xe.node.id, name: xe.name });
        continue;
      }
      var xBytes;
      try {
        xBytes = await xe.node.exportAsync({ format: 'PNG' });
      } catch (e) {
        figma.ui.postMessage({ type: 'node-skipped', nodeId: xe.node.id, name: xe.name });
        continue;
      }
      figma.ui.postMessage({
        type: 'process-export-image',
        nodeId: xe.node.id,
        name: xe.name,
        bytes: xBytes,
      });
    }
    return;
  }

  if (msg.type === 'start-crop') {
    var entries = collectEligibleImageNodes();
    if (entries.length === 0) {
      figma.ui.postMessage({ type: 'error', message: 'Выдели хотя бы одно изображение' });
      return;
    }
    pendingBatchChanges = []; // новый пакет — старый уже закрыт предыдущим 'all-done'
    for (var j = 0; j < entries.length; j++) {
      var entry = entries[j];
      var image = figma.getImageByHash(entry.imageHash);
      if (!image) {
        figma.ui.postMessage({ type: 'node-skipped', nodeId: entry.node.id, name: entry.name });
        continue;
      }
      pendingBeforeByNode.set(entry.node.id, snapshotNode(entry.node));
      var bytes = await image.getBytesAsync();
      figma.ui.postMessage({
        type: 'process-image',
        nodeId: entry.node.id,
        fillIndex: entry.fillIndex,
        name: entry.name,
        bytes: bytes,
      });
    }
    return;
  }

  // Восстановить оригинальный размер + пропорции фото (по его исходным
  // пикселям, до любого сжатия/растяжения узла), поставить заливке
  // scaleMode: FILL и сбросить скругление углов узла в 0. Не требует
  // UI/canvas — считается целиком тут.
  if (msg.type === 'restore-size') {
    var restoreEntries = collectEligibleImageNodes();
    if (restoreEntries.length === 0) {
      figma.ui.postMessage({ type: 'error', message: 'Выдели хотя бы одно изображение' });
      return;
    }

    var restored = 0;
    var restoreSkipped = 0;
    var changes = [];

    for (var k = 0; k < restoreEntries.length; k++) {
      var re = restoreEntries[k];
      var img = figma.getImageByHash(re.imageHash);
      if (!img) { restoreSkipped++; continue; }

      var size;
      try {
        size = await img.getSizeAsync(); // натуральные пиксели исходника — {width, height}
      } catch (e) {
        restoreSkipped++;
        continue;
      }

      var rNode = re.node;
      if (typeof rNode.resize !== 'function') { restoreSkipped++; continue; }

      var rBefore = snapshotNode(rNode);

      var rFills = rNode.fills.map(function (f) { return Object.assign({}, f); });
      var rFill = rFills[re.fillIndex];
      if (rFill && rFill.type === 'IMAGE') {
        var cleanFill = Object.assign({}, rFill, { scaleMode: 'FILL' });
        delete cleanFill.imageTransform; // актуален только для scaleMode: CROP
        rFills[re.fillIndex] = cleanFill;
      }
      rNode.fills = rFills;

      rNode.resize(size.width, size.height);
      if ('rotation' in rNode && rNode.rotation !== 0) rNode.rotation = 0;
      // Присвоение числа всегда ставит УНИФОРМНЫЙ радиус на всех углах —
      // даже если до этого он был figma.mixed (разные уголки), так и
      // снимается mixed-состояние, отдельно по углам обнулять не нужно.
      if ('cornerRadius' in rNode) rNode.cornerRadius = 0;
      restored++;
      changes.push({ nodeId: rNode.id, before: rBefore, after: snapshotNode(rNode) });
    }

    pushHistoryStep(changes);
    figma.ui.postMessage({ type: 'restore-done', doneCount: restored, skipCount: restoreSkipped });
    figma.notify('Восстановлено: ' + restored + (restoreSkipped ? ', пропущено ' + restoreSkipped : ''));
    return;
  }

  // Полноценное отражение — не транспонирование через rotation/поворот на
  // 180°, а перерисовка пикселей исходника зеркально (canvas в ui.html) и
  // замена imageHash на новый файл. Размер/позиция/поворот узла не трогаем.
  if (msg.type === 'start-flip') {
    var axis = msg.axis === 'v' ? 'v' : 'h';
    var flipEntries = collectEligibleImageNodes();
    if (flipEntries.length === 0) {
      figma.ui.postMessage({ type: 'error', message: 'Выдели хотя бы одно изображение' });
      return;
    }
    pendingBatchChanges = []; // новый пакет — старый уже закрыт предыдущим 'all-done'
    for (var f = 0; f < flipEntries.length; f++) {
      var fe = flipEntries[f];
      var fImage = figma.getImageByHash(fe.imageHash);
      if (!fImage) {
        figma.ui.postMessage({ type: 'node-skipped', nodeId: fe.node.id, name: fe.name });
        continue;
      }
      pendingBeforeByNode.set(fe.node.id, snapshotNode(fe.node));
      var fBytes = await fImage.getBytesAsync();
      figma.ui.postMessage({
        type: 'process-flip',
        nodeId: fe.node.id,
        fillIndex: fe.fillIndex,
        name: fe.name,
        bytes: fBytes,
        axis: axis,
      });
    }
    return;
  }

  if (msg.type === 'flipped-result') {
    var flipNodeId = msg.nodeId, flipFillIndex = msg.fillIndex, flipBytes = msg.bytes, flipName = msg.name;
    var flipNode = await figma.getNodeByIdAsync(flipNodeId);
    if (!flipNode || !('fills' in flipNode)) {
      pendingBeforeByNode.delete(flipNodeId);
      figma.ui.postMessage({ type: 'node-skipped', nodeId: flipNodeId, name: flipName });
      return;
    }

    var flipBefore = pendingBeforeByNode.get(flipNodeId);
    pendingBeforeByNode.delete(flipNodeId);

    var flippedImage = figma.createImage(new Uint8Array(flipBytes));
    var flipFills = flipNode.fills.map(function (f) { return Object.assign({}, f); });
    if (flipFills[flipFillIndex] && flipFills[flipFillIndex].type === 'IMAGE') {
      // Пиксели уже отражены — только меняем imageHash, размер/позицию/
      // scaleMode узла не трогаем (в отличие от обрезки/восстановления).
      flipFills[flipFillIndex] = Object.assign({}, flipFills[flipFillIndex], { imageHash: flippedImage.hash });
    }
    flipNode.fills = flipFills;

    if (flipBefore) pendingBatchChanges.push({ nodeId: flipNodeId, before: flipBefore, after: snapshotNode(flipNode) });

    figma.ui.postMessage({ type: 'node-done', nodeId: flipNodeId, name: flipName });
    return;
  }

  if (msg.type === 'cropped-result') {
    var nodeId = msg.nodeId, fillIndex = msg.fillIndex, bytes2 = msg.bytes;
    var cropXFrac = msg.cropXFrac, cropYFrac = msg.cropYFrac, cropWFrac = msg.cropWFrac, cropHFrac = msg.cropHFrac;
    var name = msg.name;
    var node = await figma.getNodeByIdAsync(nodeId);
    if (!node || !('fills' in node) || typeof node.resize !== 'function') {
      pendingBeforeByNode.delete(nodeId);
      figma.ui.postMessage({ type: 'node-skipped', nodeId: nodeId, name: name });
      return;
    }

    // Ничего не изменилось (изображение непрозрачное целиком, обрезать нечего)
    if (cropWFrac >= 0.999 && cropHFrac >= 0.999) {
      pendingBeforeByNode.delete(nodeId);
      figma.ui.postMessage({ type: 'node-unchanged', nodeId: nodeId, name: name });
      return;
    }

    var cropBefore = pendingBeforeByNode.get(nodeId);
    pendingBeforeByNode.delete(nodeId);

    var newImage = figma.createImage(new Uint8Array(bytes2));
    var fills = node.fills.map(function (f) { return Object.assign({}, f); });
    if (fills[fillIndex] && fills[fillIndex].type === 'IMAGE') {
      fills[fillIndex] = Object.assign({}, fills[fillIndex], { imageHash: newImage.hash, scaleMode: 'FILL' });
    }
    node.fills = fills;

    var oldW = node.width;
    var oldH = node.height;
    var dx = oldW * cropXFrac;
    var dy = oldH * cropYFrac;
    var newW = Math.max(1, oldW * cropWFrac);
    var newH = Math.max(1, oldH * cropHFrac);

    node.resize(newW, newH);
    node.x += dx;
    node.y += dy;

    if (cropBefore) pendingBatchChanges.push({ nodeId: nodeId, before: cropBefore, after: snapshotNode(node) });

    figma.ui.postMessage({ type: 'node-done', nodeId: nodeId, name: name });
    return;
  }

  if (msg.type === 'all-done') {
    pushHistoryStep(pendingBatchChanges);
    pendingBatchChanges = [];
    figma.notify(msg.message || 'Готово');
    return;
  }

  if (msg.type === 'undo') {
    if (historyIndex < 0) return;
    var undoStep = historyStack[historyIndex];
    for (var u = 0; u < undoStep.length; u++) {
      var undoNode = await figma.getNodeByIdAsync(undoStep[u].nodeId);
      if (undoNode) applySnapshot(undoNode, undoStep[u].before);
    }
    historyIndex--;
    sendHistoryState();
    sendSelectionInfo(); // изменённый узел мог быть в текущем выделении
    figma.notify('Отменено');
    return;
  }

  if (msg.type === 'redo') {
    if (historyIndex >= historyStack.length - 1) return;
    historyIndex++;
    var redoStep = historyStack[historyIndex];
    for (var r = 0; r < redoStep.length; r++) {
      var redoNode = await figma.getNodeByIdAsync(redoStep[r].nodeId);
      if (redoNode) applySnapshot(redoNode, redoStep[r].after);
    }
    sendHistoryState();
    sendSelectionInfo();
    figma.notify('Повторено');
    return;
  }
}
