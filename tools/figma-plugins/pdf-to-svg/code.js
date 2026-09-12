// Trace Logo's — PDF → Figma (Figma plugin)
//
// Единственный источник логики main thread — не build-артефакт (тот же
// подход, что в clean-layers/photo-editor: TS-дубликата не держим, он
// разъезжался бы с реальным поведением без какой-либо защиты). Меняешь
// логику — правь этот файл, Figma подхватывает его как есть.
//
// Разделение труда между потоками жёсткое и вынужденное:
//
//   ui.html (iframe)  — умеет всё, чего нет в main thread: читать File,
//                       парсить PDF (pdf.js), рисовать на canvas. Именно
//                       там PDF превращается либо в SVG-строку, либо в
//                       PNG-байты — по одной странице за раз.
//   code.js (этот)    — умеет всё, чего нет в iframe: создавать узлы на
//                       холсте. Получает готовую страницу и кладёт её
//                       фреймом рядом с предыдущей.
//
// Поток страниц потоковый, а не пачкой: UI шлёт 'page' сразу, как только
// сконвертировал очередную, и ждёт 'page-added' перед следующей. На PDF в
// сотню страниц это разница между «полтора гигабайта SVG-строк в памяти
// iframe» и «одна страница за раз».

var PANEL_WIDTH = 380;
var MIN_HEIGHT = 160;
var MAX_HEIGHT = 800;

// Зазор между фреймами страниц на холсте. 80px — как в родном «Paste here»
// Figma для нескольких кадров: страницы читаются как ряд, но не слипаются.
var PAGE_GAP = 80;

figma.showUI(__html__, { width: PANEL_WIDTH, height: 260 });

// Состояние одного импорта. null между импортами — «сессии нет».
// Держим здесь курсор раскладки, чтобы каждая следующая страница легла
// правее предыдущей, а не в одну точку.
var session = null;

function startSession(fileName) {
  var center = figma.viewport.center;
  session = {
    fileName: fileName || 'PDF',
    nodes: [],
    // Стартуем от центра вьюпорта — импорт появляется там, куда человек
    // смотрит, а не в координатах (0, 0) где-то за краем экрана.
    cursorX: Math.round(center.x),
    baseY: Math.round(center.y),
    failed: 0,
  };
}

function place(node, width, height) {
  node.x = session.cursorX;
  node.y = session.baseY;
  session.cursorX += Math.round(width) + PAGE_GAP;
  session.nodes.push(node);
  figma.currentPage.appendChild(node);
}

// Белая подложка страницы. В PDF «бумага» — это отсутствие краски, в
// SVG-выводе pdf.js её тоже нет: без заливки фрейм был бы прозрачным, и
// чёрный текст утонул бы в тёмном холсте.
var PAPER = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];

function addVectorPage(msg) {
  // createNodeFromSvg кидает, если Figma не смогла разобрать разметку —
  // одна сложная страница не должна ронять весь импорт, поэтому ловим и
  // считаем её пропущенной.
  var frame;
  try {
    frame = figma.createNodeFromSvg(msg.svg);
  } catch (e) {
    session.failed++;
    return { ok: false, error: String((e && e.message) || e) };
  }
  frame.name = msg.name;
  frame.fills = PAPER;
  frame.clipsContent = true;
  // Размеры берём из PDF, а не из того, что насчитала Figma по разметке:
  // viewport страницы — источник истины, разметка может дать дробное
  // расхождение в доли пикселя.
  if (msg.width > 0.01 && msg.height > 0.01) {
    frame.resizeWithoutConstraints(msg.width, msg.height);
  }
  place(frame, msg.width, msg.height);
  return { ok: true };
}

function addRasterPage(msg) {
  var image;
  try {
    image = figma.createImage(new Uint8Array(msg.bytes));
  } catch (e) {
    session.failed++;
    return { ok: false, error: String((e && e.message) || e) };
  }
  var frame = figma.createFrame();
  frame.name = msg.name;
  frame.resizeWithoutConstraints(msg.width, msg.height);
  frame.clipsContent = true;
  // FILL, а не FIT: фрейм создан ровно в пропорциях страницы, так что
  // обрезать нечего, зато FILL не оставит белых полей на дробных размерах.
  frame.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: image.hash }];
  place(frame, msg.width, msg.height);
  return { ok: true };
}

function finishSession(msg) {
  if (!session) return;
  var created = session.nodes.length;
  if (created > 0) {
    figma.currentPage.selection = session.nodes;
    figma.viewport.scrollAndZoomIntoView(session.nodes);
  }
  figma.ui.postMessage({
    type: 'convert-done',
    created: created,
    failed: session.failed,
  });
  if (created > 0) {
    figma.notify(
      'Импортировано страниц: ' + created +
      (session.failed ? ', пропущено: ' + session.failed : '')
    );
  } else if (msg && msg.cancelled) {
    figma.notify('Импорт отменён');
  } else {
    figma.notify('Не удалось импортировать ни одной страницы');
  }
  session = null;
}

figma.ui.onmessage = function (msg) {
  if (!msg) return;

  if (msg.type === 'resize') {
    var h = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, Math.ceil(msg.height || MIN_HEIGHT)));
    figma.ui.resize(PANEL_WIDTH, h);
    return;
  }

  if (msg.type === 'convert-start') {
    startSession(msg.fileName);
    figma.ui.postMessage({ type: 'ready-for-pages' });
    return;
  }

  if (msg.type === 'page') {
    if (!session) return; // сессию отменили, пока страница считалась
    var res = msg.mode === 'raster' ? addRasterPage(msg) : addVectorPage(msg);
    figma.ui.postMessage({
      type: 'page-added',
      index: msg.index,
      ok: res.ok,
      error: res.error,
    });
    return;
  }

  if (msg.type === 'convert-done') {
    finishSession(msg);
    return;
  }
};
