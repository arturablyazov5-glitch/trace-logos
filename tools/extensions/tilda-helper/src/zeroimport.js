// HTML → Zero Block: компилятор произвольной HTML+CSS-вёрстки в настоящий
// редактируемый Zero-блок (T396) — С АВТОЛАЙАУТОМ.
//
// Вместо ручной сборки JSON артборда используется внутренний Figma-импортёр
// Zero-редактора (вскрыт, см. memory tilda-zero-format): он принимает дерево
// нод в формате Figma REST API и сам создаёт флекс-группы, hug/fill-размеры,
// паддинги и gap'ы. Мы синтезируем такое дерево из отрендеренной вёрстки:
//
//  1. Вёрстка рендерится в скрытом iframe шириной 1200px (грид Zero) —
//     браузер честно считает layout, шрифты и картинки.
//  2. Обход DOM строит синтетическое Figma-дерево: flex-контейнеры и
//     вертикальные/горизонтальные стопки → FRAME с layoutMode (автолайаут),
//     текст → TEXT, IMG → нода-image, ссылка/кнопка с фоном → FRAME 'button'.
//  3. В новом T396 открывается Zero-редактор (same-origin iframe) и дерево
//     прогоняется через родной конвейер: figma__buildConfig →
//     figma__convertFigmaNodes → figma__processRequests →
//     figma__finalizePipeline → ab__saveToDataBase. URL картинок подставляются
//     напрямую (минуя запросы к Figma API), ссылки кнопок — постпатчем.
//
// Результат — родной Zero-блок с автолайаутом: группы-фреймы, gap, padding,
// hug-размеры; элементы редактируются как свёрстанные вручную.

import { waitFor } from './dom.js';
import { T396_TPLID } from './constants.js';

const BTN_CLASS = 'th-zeroimport-btn';
const MODAL_ID = 'th-zi-modal';

// Ширина грида Zero: container:'grid' центрирует полосу 1200px.
const GRID_WIDTH = 1200;

// ---------------------------------------------------------------------------
// Кнопка в верхней панели редактора (паттерн — как у токенов)
// ---------------------------------------------------------------------------

export function injectZeroImportButton() {
  const navbar = document.querySelector('.tp-menu__navbar');
  if (!navbar || navbar.querySelector('.' + BTN_CLASS)) return;
  const li = document.createElement('li');
  li.className = 'tp-menu__navbar__item';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 't-button tp-menu__navbar__button ' + BTN_CLASS;
  btn.title = 'HTML → Zero Block';
  btn.setAttribute('aria-label', 'HTML → Zero Block');
  btn.innerHTML =
    '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M6 4.5L2 9l4 4.5M12 4.5L16 9l-4 4.5" stroke="black" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';
  btn.addEventListener('click', openImportModal);
  li.appendChild(btn);
  navbar.insertBefore(li, navbar.firstChild);
}

// ---------------------------------------------------------------------------
// Модалка
// ---------------------------------------------------------------------------

function openImportModal() {
  let modal = document.getElementById(MODAL_ID);
  if (modal) {
    modal.style.display = 'flex';
    return;
  }
  modal = document.createElement('div');
  modal.id = MODAL_ID;
  modal.innerHTML =
    '<div class="th-zi-dialog">' +
    '  <div class="th-zi-title">HTML → Zero Block' +
    '    <button type="button" class="th-zi-close" title="Закрыть">×</button></div>' +
    '  <div class="th-zi-hint">Вставьте вёрстку секции (HTML, можно со &lt;style&gt; внутри). ' +
    'Она отрендерится в полосе 1200px и станет новым Zero-блоком с автолайаутом: ' +
    'flex-контейнеры и стопки превратятся во флекс-группы с gap и padding.</div>' +
    '  <textarea class="th-zi-source" spellcheck="false" placeholder="<style>\n  .hero { display:flex; gap:24px; padding:60px; }\n</style>\n<div class=&quot;hero&quot;>\n  <h1>Заголовок</h1>\n</div>"></textarea>' +
    '  <div class="th-zi-footer">' +
    '    <span class="th-zi-status"></span>' +
    '    <button type="button" class="t-button th-zi-run">Создать Zero-блок</button>' +
    '  </div>' +
    '</div>';
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('.th-zi-close')) modal.style.display = 'none';
  });
  modal.querySelector('.th-zi-run').addEventListener('click', runImport);
  document.body.appendChild(modal);
}

function setStatus(text, isError) {
  const el = document.querySelector('#' + MODAL_ID + ' .th-zi-status');
  if (!el) return;
  el.textContent = text;
  el.classList.toggle('th-zi-status_error', !!isError);
}

async function runImport() {
  const modal = document.getElementById(MODAL_ID);
  const source = modal.querySelector('.th-zi-source').value.trim();
  if (!source) {
    setStatus('Вёрстка пустая', true);
    return;
  }
  const runBtn = modal.querySelector('.th-zi-run');
  runBtn.disabled = true;
  try {
    setStatus('Рендерю вёрстку…');
    const recid = await importHTMLAsZeroBlock(source, setStatus);
    setStatus('Готово: блок #rec' + recid + ' собран с автолайаутом');
  } catch (e) {
    setStatus('Ошибка: ' + (e && e.message ? e.message : e), true);
  } finally {
    runBtn.disabled = false;
  }
}

// Полный конвейер «вёрстка → новый Zero-блок» без UI: компиляция, создание
// T396, импорт, перерисовка. Возвращает recordid. Экспортирован как API —
// на нём же строятся будущие фичи (промпт → секция и т.п.).
export async function importHTMLAsZeroBlock(source, onStatus) {
  const status = typeof onStatus === 'function' ? onStatus : () => {};
  const built = await compileHTMLToFigmaTree(source);
  if (!built.root.children.length && built.root.type !== 'FRAME') {
    throw new Error('в вёрстке не нашлось ни одного видимого элемента');
  }
  status('Создаю Zero-блок…');
  const recid = await createZeroRecord();
  status('Собираю автолайаут в Zero-редакторе…');
  await importIntoZeroEditor(recid, built);
  if (window.tp__updateRecord) window.tp__updateRecord(recid);
  return recid;
}

// ---------------------------------------------------------------------------
// Создание записи T396 и импорт через родной Figma-конвейер Zero-редактора
// ---------------------------------------------------------------------------

function getWrapperIds() {
  return [...document.querySelectorAll('.t-records > div[recordid]')].map((d) =>
    d.getAttribute('recordid')
  );
}

async function createZeroRecord() {
  if (!window.tp__addRecord) throw new Error('tp__addRecord недоступен');
  const before = new Set(getWrapperIds());
  const last = getWrapperIds().pop() || '';
  window.tp__addRecord(T396_TPLID, last, '');
  const fresh = await waitFor(
    () => getWrapperIds().find((id) => !before.has(id)) || null,
    12000,
    200
  );
  if (!fresh) throw new Error('новый блок не появился на странице');
  return fresh;
}

// Открывает Zero-редактор нового блока и прогоняет синтетическое дерево через
// родной конвейер импорта. finalizePipeline затирает содержимое артборда —
// для свежесозданного T396 это как раз нужно (демо-элементы исчезают).
async function importIntoZeroEditor(recid, built) {
  window.tp__openZero(recid, true);
  // Функции появляются раньше, чем стейт артборда — единственный надёжный
  // признак готовности: allelems__getJsonData() отрабатывает без исключения
  // (иначе finalizePipeline падает на setArtboardValue).
  const fw = await waitFor(() => {
    const f = document.querySelector('.t396__iframe');
    const w = f && f.contentWindow;
    if (!w || !w.figma__buildConfig || !w.figma__convertFigmaNodes ||
        !w.figma__processRequests || !w.figma__finalizePipeline ||
        !w.ab__saveToDataBase || !w.allelems__getJsonData) return null;
    try {
      return w.allelems__getJsonData() ? w : null;
    } catch (e) {
      return null;
    }
  }, 25000, 300);
  if (!fw) throw new Error('Zero-редактор не загрузился (или в нём нет Figma-конвейера)');

  try {
    const config = fw.figma__buildConfig();
    const res = fw.figma__convertFigmaNodes([built.root], config);

    // Высота артборда. Конвертер жёстко проставляет фиксированную height из
    // размера корня (Fixed) — но правильнее «Hug»: артборд обнимает контент
    // и не ломается при правках. Hug работает только если артборд —
    // автолайаут-контейнер (flex:'auto', приходит от layoutMode корня). Тогда
    // ставим heightmode:'hug' и высоту доверяем core__updateAutoHeight ниже.
    // Иначе (корень не флекс) — оставляем фиксированную высоту как фолбэк.
    // Высоту артборда в hug конвертер сам не ставит, а правка res.elements
    // до finalize не долетает до стейта панели — переключаем hug ПОСЛЕ
    // finalize через state-сеттер (см. ниже). Здесь для не-флекс-корня
    // (артборд не автолайаут — hug невозможен) оставляем фиксированную высоту.
    const artboardIsFlex = !!built.root.layoutMode;
    if (res.elements.artboard && !artboardIsFlex) {
      res.elements.artboard.height = String(Math.round(built.root.absoluteBoundingBox.height));
    }

    // Картинки: конвертер оставляет img:'' и просит URL у Figma API — вместо
    // этого подставляем реальные URL из вёрстки и снимаем запросы.
    for (const [nodeId, req] of Object.entries(res.nodeImageRequests || {})) {
      const url = built.imageUrls.get(nodeId);
      if (url && res.elements[req.id]) {
        res.elements[req.id].img = url;
        if (built.imageOpacity && built.imageOpacity.has(nodeId)) {
          res.elements[req.id].opacity = String(built.imageOpacity.get(nodeId));
        }
        delete res.nodeImageRequests[nodeId];
      }
    }
    for (const [elId, req] of Object.entries(res.refImageRequests || {})) {
      const url = built.imageUrls.get(req.nodeId);
      if (url && res.elements[elId]) {
        res.elements[elId].img = url;
        if (built.imageOpacity && built.imageOpacity.has(req.nodeId)) {
          res.elements[elId].opacity = String(built.imageOpacity.get(req.nodeId));
        }
        delete res.refImageRequests[elId];
      }
    }
    // Ссылки кнопок: в Figma-нодах нет href, доносим постпатчем по имени слоя.
    for (const el of Object.values(res.elements)) {
      if (el && el.elem_type === 'button' && built.buttonLinks.has(el.layer)) {
        el.link = built.buttonLinks.get(el.layer);
      }
    }

    // Подчёркивание/жирный внутри текста: оверрайды конвертера умеют только
    // цвет (buildSpanStyle), поэтому текстам с <u>/<b>-форматированием
    // подставляем готовый HTML в поле text после конвертации (проверено:
    // рендерится и сохраняется). Матчим по плоскому тексту элемента.
    if (built.textHtml && built.textHtml.size) {
      for (const el of Object.values(res.elements)) {
        if (!el || el.elem_type !== 'text' || !el.text) continue;
        const plain = String(el.text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (built.textHtml.has(plain)) el.text = built.textHtml.get(plain);
      }
    }

    // Все НАШИ картинки уже подставлены выше (URL из вёрстки). Любые оставшиеся
    // запросы к Figma API — «ложные»: конвертер счёл картинкой пустой элемент
    // или требует вектор, которого у нас нет. Обнуляем их, иначе
    // processRequests пойдёт в Figma и упадёт на «API key is not set in
    // localStorage» — наш путь не должен зависеть от Figma-ключа вообще.
    res.nodeImageRequests = {};
    res.refImageRequests = {};
    res.vectorRequests = {};

    let processed = res;
    try {
      processed = fw.figma__processRequests(res, config);
      if (processed && typeof processed.then === 'function') processed = await processed;
    } catch (e) {
      // Figma-ключ не задан / сеть — не критично: картинки уже подставлены,
      // продолжаем с тем, что есть.
      processed = res;
    }
    fw.figma__finalizePipeline(processed, config.generateId);

    await new Promise((r) => setTimeout(r, 1500));

    // Переводим артборд в Hug (обнимает контент, не Fixed) — по просьбе, и
    // это правильное поведение: высота следует за содержимым. Работает только
    // для автолайаут-артборда (flex:'auto', приходит от layoutMode корня).
    // Последовательность вычислена вживую:
    //   1) state-сеттер heightmode:'hug' (правка res.elements сюда не долетает);
    //   2) ab__autolayout__init — как родной figma-импорт, включает автолайаут;
    //   3) core__updateAutoHeight — пересчитывает высоту по контенту;
    //   4) перерисовка поля панели, чтобы виджет показал «Auto (Hug)».
    if (artboardIsFlex) {
      try {
        const abEl = fw.document.querySelector('.tn-artboard');
        const stateApi = fw.tn && fw.tn.state;
        if (abEl && stateApi && stateApi.setArtboardValue &&
            fw.autolayout__check && fw.autolayout__check(abEl).isAutolayout) {
          stateApi.setArtboardValue('heightmode', 'hug');
          if (fw.ab__autolayout__init) fw.ab__autolayout__init({ usePredict: false });
          if (fw.core__updateAutoHeight) fw.core__updateAutoHeight(abEl);
          if (fw.ab__renderViewOneField) {
            fw.ab__renderViewOneField('heightmode');
            fw.ab__renderViewOneField('height');
          }
          await new Promise((r) => setTimeout(r, 600));
        }
      } catch (e) {
        /* если автолайаут недоступен — блок всё равно сохранится (Fixed) */
      }
    }

    // Даём редактору дорисовать состояние, затем сохраняем его же кнопкой.
    await fw.ab__saveToDataBase();
    await new Promise((r) => setTimeout(r, 800));
  } finally {
    if (window.tp__closeZero) window.tp__closeZero();
  }
}

// ---------------------------------------------------------------------------
// Компилятор: HTML+CSS → синтетическое Figma-дерево
// ---------------------------------------------------------------------------

export async function compileHTMLToFigmaTree(source) {
  const iframe = document.createElement('iframe');
  // За экраном, но БЕЗ visibility:hidden — innerText и layout должны считаться
  // как у видимого документа.
  iframe.style.cssText =
    'position:fixed;left:-20000px;top:0;width:' + GRID_WIDTH + 'px;height:3000px;border:0;pointer-events:none;';
  document.body.appendChild(iframe);
  try {
    const doc = iframe.contentDocument;
    doc.open();
    doc.write(
      '<!doctype html><html><head><meta charset="utf-8">' +
        '<style>html,body{margin:0;padding:0}</style></head><body>' +
        source +
        '</body></html>'
    );
    doc.close();
    await Promise.race([
      Promise.all([...doc.images].map((im) => im.decode().catch(() => {}))).then(() =>
        doc.fonts ? doc.fonts.ready : null
      ),
      new Promise((r) => setTimeout(r, 3500)),
    ]);
    return buildFigmaTree(iframe.contentWindow, doc);
  } finally {
    iframe.remove();
  }
}

function buildFigmaTree(win, doc) {
  const imageUrls = new Map(); // node.id → URL картинки
  const imageOpacity = new Map(); // node.id → прозрачность (конвертер opacity не мапит)
  const buttonLinks = new Map(); // имя слоя (lowercase) → href
  const textHtml = new Map(); // плоский текст → rich-HTML c <u>/<b> для пост-патча
  let seq = 0;
  let buttonSeq = 0;

  const body = doc.body;
  const bodyRect = body.getBoundingClientRect();

  // Единственный корневой элемент вёрстки становится артбордом сам (секция
  // на всю полосу получает свой фон и флекс на уровне артборда); иначе —
  // синтетическая обёртка.
  const topEls = visibleChildren(body);
  let root;
  if (topEls.length === 1) {
    root = convertContainer(topEls[0], win.getComputedStyle(topEls[0]));
  } else {
    root = frameNode('section', rectBox(bodyRect));
    const bodyCs = win.getComputedStyle(body);
    root.fills = backgroundFills(bodyCs);
    // Несколько секций подряд — сам артборд становится вертикальной стопкой.
    applyAutolayout(root, body, bodyCs, topEls);
    for (const el of topEls) {
      const node = convertEl(el);
      if (node) root.children.push(node);
    }
  }
  return { root, imageUrls, imageOpacity, buttonLinks, textHtml };

  // --- обход -----------------------------------------------------------------

  function visibleChildren(el) {
    return [...el.children].filter((c) => {
      if (c.tagName === 'STYLE' || c.tagName === 'SCRIPT') return false;
      const cs = win.getComputedStyle(c);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      const r = c.getBoundingClientRect();
      return r.width >= 1 && r.height >= 1;
    });
  }

  function convertEl(el) {
    const cs = win.getComputedStyle(el);
    if (el.tagName === 'IMG') return imageNode(el, cs);
    if (el.tagName.toUpperCase() === 'SVG') return svgNode(el, cs);
    if (isButtonLike(el, cs)) return buttonNode(el, cs);
    if (isTextLeaf(el, win)) {
      const text = textNode(el, cs);
      // Текст с собственным фоном/рамкой — оборачиваем во фрейм-подложку.
      if (isStyledBox(cs)) {
        const wrap = convertContainer(el, cs, true);
        wrap.children = [text];
        return wrap;
      }
      return text;
    }
    return convertContainer(el, cs);
  }

  function convertContainer(el, cs, skipChildren) {
    const node = frameNode(nodeName(el), elBox(el));
    node.fills = backgroundFills(cs);
    applyCorners(node, cs);
    applyStrokes(node, cs);
    applyOpacity(node, cs);
    node.effects = shadowEffects(cs);
    if (cs.overflow === 'hidden') node.clipsContent = true;
    if (cs.position === 'absolute') node.layoutPositioning = 'ABSOLUTE';
    node.paddingTop = num(cs.paddingTop);
    node.paddingRight = num(cs.paddingRight);
    node.paddingBottom = num(cs.paddingBottom);
    node.paddingLeft = num(cs.paddingLeft);

    const kids = skipChildren ? [] : visibleChildren(el);
    const childRects = [];

    if (!skipChildren) {
      // Обходим childNodes, а не только элементы: «свободный» текст в
      // контейнере с блочными детьми (<div>Текст <div>…</div></div>) иначе
      // теряется. Позицию куска текста даёт Range. Прямоугольники детей
      // (включая текстовые куски!) собираем для решения об автолайауте.
      for (const child of el.childNodes) {
        if (child.nodeType === 3) {
          const run = textRunNode(child, el, cs);
          if (run) {
            node.children.push(run.node);
            childRects.push(run.rect);
          }
          continue;
        }
        if (child.nodeType !== 1 || !kids.includes(child)) continue;
        const cn = convertEl(child);
        if (cn) {
          node.children.push(cn);
          childRects.push(child.getBoundingClientRect());
        }
      }
    }

    // Автолайаут решается ПОСЛЕ конвертации детей — по прямоугольникам всех
    // детей, включая текстовые куски: строка «текст-картинка-текст»
    // (заголовок с эмодзи) становится флекс-рядом, а не абсолютом.
    applyAutolayout(node, el, cs, childRects);

    // Пустой FRAME (без детей) конвертер Zero классифицирует как IMAGE и
    // просит картинку у Figma API → «API key is not set». Такие ноды — это
    // form-контролы (input, textarea, select) и декоративные пустые блоки:
    // отдаём их как RECTANGLE-shape (фон/рамка/скругление уже проставлены),
    // тогда конвертер делает обычный shape без запроса к Figma.
    if (!node.children.length) {
      node.type = 'RECTANGLE';
      delete node.layoutMode;
      delete node.layoutWrap;
      delete node.itemSpacing;
      delete node.primaryAxisAlignItems;
      delete node.counterAxisAlignItems;
      delete node.layoutSizingHorizontal;
      delete node.layoutSizingVertical;
    }
    return node;
  }

  // TEXT-нода из текстового DOM-узла (прямой текст контейнера).
  // Возвращает {node, rect} — прямоугольник нужен для решения об автолайауте.
  function textRunNode(textDomNode, parentEl, parentCs) {
    const content = (textDomNode.textContent || '').replace(/\s+/g, ' ').trim();
    if (!content) return null;
    const range = doc.createRange();
    range.selectNodeContents(textDomNode);
    const r = range.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    const box = rectBox(r);
    // Запас по ширине: метрики шрифта в Zero чуть отличаются от рендера в
    // iframe, без запаса однострочный текст иногда переносится.
    box.width += 4;
    const node = baseNode(content.slice(0, 24).replace(/image|button|svg/gi, '·') || 'text', 'TEXT', box);
    node.size = { x: box.width, y: box.height };
    const fontsize = parseFloat(parentCs.fontSize) || 16;
    const lh = parseFloat(parentCs.lineHeight);
    node.characters = content;
    node.style = {
      fontFamily: firstFont(parentCs.fontFamily),
      fontWeight: parseInt(parentCs.fontWeight, 10) || 400,
      fontSize: fontsize,
      lineHeightPx: lh || Math.round(fontsize * 1.3),
      textAlignHorizontal: mapTextAlign(parentCs.textAlign),
      textAutoResize: 'HEIGHT',
    };
    node.fills = solidFills(parentCs.color);
    return { node, rect: r };
  }

  // Автолайаут: честный flex из CSS, а для обычных block-контейнеров —
  // распознавание вертикальной стопки / горизонтального ряда по геометрии
  // прямоугольников ВСЕХ детей (элементы + текстовые куски).
  function applyAutolayout(node, el, cs, rects) {
    if (cs.display === 'flex' || cs.display === 'inline-flex') {
      const row = cs.flexDirection.startsWith('row');
      node.layoutMode = row ? 'HORIZONTAL' : 'VERTICAL';
      if (cs.flexWrap === 'wrap') node.layoutWrap = 'WRAP';
      const gap = num(row ? cs.columnGap : cs.rowGap);
      node.itemSpacing = gap || measuredGap(rects, row);
      node.primaryAxisAlignItems = mapJustify(cs.justifyContent);
      node.counterAxisAlignItems = mapAlign(cs.alignItems);
      node.layoutSizingHorizontal = 'FIXED';
      node.layoutSizingVertical = 'HUG';
      return;
    }
    // Один ребёнок — тривиальная вертикальная стопка: обёртки (.wrap и т.п.)
    // тоже становятся автолайаутом, и hug-высота артборда работает.
    if (rects.length >= 1) {
      const vertical = rects.every(
        (r, i) => i === 0 || r.top >= rects[i - 1].bottom - 2
      );
      // Горизонтальный ряд: слева направо с вертикальным ПЕРЕКРЫТИЕМ (не
      // равенством top — у текста и картинок в одной строке высоты разные).
      const horizontal =
        !vertical &&
        rects.every(
          (r, i) =>
            i === 0 ||
            (r.left >= rects[i - 1].right - 2 &&
              r.top < rects[i - 1].bottom - 2 &&
              r.bottom > rects[i - 1].top + 2)
        );
      if (vertical || horizontal) {
        node.layoutMode = vertical ? 'VERTICAL' : 'HORIZONTAL';
        node.itemSpacing = measuredGap(rects, horizontal);
        node.primaryAxisAlignItems = 'MIN';
        // Поперечное выравнивание. Вертикальная стопка — из геометрии: центр
        // задаётся margin:auto/text-align, MIN прижимал бы всё влево.
        // Горизонтальный ряд из текстового потока (заголовок с картинками) —
        // всегда CENTER: геометрия давала бы flex-end из-за
        // vertical-align:bottom, а по центру и вернее, и удобнее редактировать.
        node.counterAxisAlignItems = vertical
          ? stackCounterAlign(el, cs, rects, vertical)
          : 'CENTER';
        node.layoutSizingHorizontal = 'FIXED';
        node.layoutSizingVertical = 'HUG';
      }
    }
  }

  // Куда прижаты дети стопки по поперечной оси: у каждого сравниваем зазоры
  // до краёв контент-области родителя. Все по центру → CENTER, все к
  // дальнему краю → MAX, иначе MIN.
  function stackCounterAlign(el, cs, rects, vertical) {
    const r = el.getBoundingClientRect();
    const start = vertical ? r.left + num(cs.paddingLeft) : r.top + num(cs.paddingTop);
    const end = vertical ? r.right - num(cs.paddingRight) : r.bottom - num(cs.paddingBottom);
    let centered = true;
    let maxed = true;
    for (const cr of rects) {
      const a = (vertical ? cr.left : cr.top) - start;
      const b = end - (vertical ? cr.right : cr.bottom);
      if (Math.abs(a - b) > 3) centered = false;
      if (b > 3) maxed = false;
    }
    if (centered) return 'CENTER';
    if (maxed) return 'MAX';
    return 'MIN';
  }

  function measuredGap(rects, row) {
    const gaps = [];
    for (let i = 1; i < rects.length; i++) {
      const g = row
        ? rects[i].left - rects[i - 1].right
        : rects[i].top - rects[i - 1].bottom;
      if (g >= 0) gaps.push(g);
    }
    if (!gaps.length) return 0;
    gaps.sort((a, b) => a - b);
    return Math.round(gaps[Math.floor(gaps.length / 2)]);
  }

  // --- ноды -------------------------------------------------------------------

  function nid() {
    return 'th:' + seq++;
  }

  function nodeName(el) {
    const text = (el.innerText || '').trim().replace(/\s+/g, ' ');
    // 'image'/'button'/'svg' в имени управляют классификацией конвертера —
    // обычным контейнерам такие имена давать нельзя.
    const base = (text ? text.slice(0, 24) : el.tagName.toLowerCase())
      .replace(/image|button|svg/gi, '·');
    return base || 'box';
  }

  function baseNode(name, type, box) {
    return {
      id: nid(),
      name,
      type,
      visible: true,
      blendMode: 'PASS_THROUGH',
      absoluteBoundingBox: box,
      absoluteRenderBounds: box,
      // figma__field__size требует size:{x,y} наравне с bounding box — без
      // него все width/height остаются пустыми и вёрстка схлопывается.
      size: { x: box.width, y: box.height },
      children: [],
      fills: [],
      strokes: [],
      effects: [],
    };
  }

  function frameNode(name, box) {
    return baseNode(name, 'FRAME', box);
  }

  function textNode(el, cs) {
    const box = elBox(el);
    // Запас по ширине: метрики шрифта в Zero чуть отличаются от рендера в
    // iframe, без запаса однострочный текст иногда переносится.
    box.width += 4;
    const node = baseNode(nodeName(el), 'TEXT', box);
    applyOpacity(node, cs);
    const fontsize = parseFloat(cs.fontSize) || 16;
    const lh = parseFloat(cs.lineHeight);

    // Rich-text ОДНОЙ нодой: обход содержимого собирает сегменты {text,color}.
    // Цветные фрагменты (span.accent и т.п.) конвертер Zero превратит в
    // <span style="color:…"> внутри поля text — как родная панель
    // форматирования. Текст не разбивается на отдельные ноды.
    const baseColor = rgbToHex(cs.color) || '#000000';
    const segs = collectTextSegments(el, cs, baseColor);
    applyRichText(node, segs, baseColor);
    // Подчёркивание/жирный оверрайдами не передать — регистрируем готовый
    // HTML для пост-патча поля text (ключ — плоский текст элемента).
    if (segs.some((s) => s.u || s.b)) {
      const plain = (node.characters || '').replace(/\s+/g, ' ').trim();
      if (plain) textHtml.set(plain, segsToHtml(segs, baseColor));
    }

    node.style = {
      fontFamily: firstFont(cs.fontFamily),
      fontWeight: parseInt(cs.fontWeight, 10) || 400,
      fontSize: fontsize,
      lineHeightPx: lh || Math.round(fontsize * 1.3),
      textAlignHorizontal: mapTextAlign(cs.textAlign),
      textAutoResize: 'HEIGHT',
    };
    const ls = parseFloat(cs.letterSpacing);
    if (ls) node.style.letterSpacing = ls;
    node.fills = solidFills(cs.color);
    // Прозрачность текста (opacity на элементе) — в альфу цвета: поле opacity
    // конвертер не переносит, а альфу fills понимает.
    const textOp = parseFloat(cs.opacity);
    if (!isNaN(textOp) && textOp < 1 && node.fills[0]) {
      node.fills[0].opacity = (node.fills[0].opacity || 1) * textOp;
    }
    if (cs.position === 'absolute') node.layoutPositioning = 'ABSOLUTE';
    return node;
  }

  // Обход содержимого текстового элемента → массив сегментов
  // {text, color, u, b}. Block-level дети (display:block, напр. .accent) и
  // <br> дают перенос '\n'. Подчёркивание — по text-decoration (не наследуемое
  // computed-свойство, поэтому тащим флаг вниз по обходу), жирный — по
  // fontWeight заметно выше базового. Пробелы схлопываются упрощённо.
  function collectTextSegments(root, rootCs, baseColor) {
    const segs = [];
    const baseWeight = parseInt(rootCs.fontWeight, 10) || 400;
    const rootU = /underline/.test(rootCs.textDecorationLine || '');
    const push = (text, color, u, b) => {
      if (!text) return;
      const last = segs[segs.length - 1];
      if (last && last.color === color && last.u === u && last.b === b) last.text += text;
      else segs.push({ text, color, u, b });
    };
    const ensureNewline = () => {
      const last = segs[segs.length - 1];
      if (last && !last.text.endsWith('\n')) push('\n', baseColor, false, false);
    };
    walk(root, baseColor, rootU, false);
    // финальный trim пробелов по краям
    if (segs.length) {
      segs[0].text = segs[0].text.replace(/^\s+/, '');
      segs[segs.length - 1].text = segs[segs.length - 1].text.replace(/\s+$/, '');
    }
    return segs.filter((s) => s.text.length);

    function walk(node, color, u, b) {
      for (const child of node.childNodes) {
        if (child.nodeType === 3) {
          const t = (child.textContent || '').replace(/\s+/g, ' ');
          if (t) push(t, color, u, b);
        } else if (child.nodeType === 1) {
          if (child.tagName === 'BR') { push('\n', baseColor, false, false); continue; }
          if (child.tagName === 'IMG' || child.tagName.toUpperCase() === 'SVG') continue;
          const ccs = win.getComputedStyle(child);
          if (ccs.display === 'none') continue;
          const block = ccs.display && !/^inline/.test(ccs.display);
          if (block) ensureNewline();
          const childColor = rgbToHex(ccs.color) || color;
          const childU = u || /underline/.test(ccs.textDecorationLine || '');
          const childB = b || (parseInt(ccs.fontWeight, 10) || 400) >= baseWeight + 200;
          walk(child, childColor, childU, childB);
          if (block) ensureNewline();
        }
      }
    }
  }

  // Сегменты → готовый HTML поля text: цветные span, <u>, <b>, переносы <br>.
  // Используется пост-патчем после конвертации (оверрайды умеют только цвет).
  function segsToHtml(segs, baseColor) {
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return segs
      .map((seg) =>
        seg.text
          .split('\n')
          .map((part) => {
            let h = esc(part);
            if (!h) return '';
            if (seg.color && seg.color !== baseColor) h = '<span style="color: ' + seg.color + '">' + h + '</span>';
            if (seg.b) h = '<b>' + h + '</b>';
            if (seg.u) h = '<u>' + h + '</u>';
            return h;
          })
          .join('<br>')
      )
      .join('');
  }

  // Сегменты → node.characters + characterStyleOverrides + styleOverrideTable.
  // buildSegments конвертера читает fills из styleOverrideTable[styleId] и
  // делает <span style="color:…">. Базовый цвет остаётся без override.
  function applyRichText(node, segs, baseColor) {
    let characters = '';
    const overrides = [];
    const table = {};
    const colorToId = {};
    let nextId = 1;
    for (const seg of segs) {
      let styleId = 0;
      if (seg.color && seg.color !== baseColor) {
        if (!colorToId[seg.color]) {
          const id = nextId++;
          colorToId[seg.color] = id;
          const c = hexToFigma(seg.color);
          table[String(id)] = { fills: [{ type: 'SOLID', visible: true, blendMode: 'NORMAL', color: c, opacity: 1 }] };
        }
        styleId = colorToId[seg.color];
      }
      for (const ch of seg.text) {
        characters += ch;
        overrides.push(styleId);
      }
    }
    node.characters = characters;
    if (nextId > 1) {
      node.characterStyleOverrides = overrides;
      node.styleOverrideTable = table;
    }
  }

  function imageNode(el, cs) {
    const node = baseNode('image', 'RECTANGLE', elBox(el));
    node.fills = [
      {
        type: 'IMAGE',
        visible: true,
        blendMode: 'NORMAL',
        scaleMode: cs.objectFit === 'contain' ? 'FIT' : 'FILL',
      },
    ];
    applyCorners(node, cs);
    applyOpacity(node, cs);
    if (cs.position === 'absolute') node.layoutPositioning = 'ABSOLUTE';
    imageUrls.set(node.id, el.currentSrc || el.src);
    return node;
  }

  // Прозрачность элемента: конвертер figma-нодную opacity НЕ мапит (проверено
  // на живом импорте — сохранялась '1'). Для картинок/svg регистрируем в
  // imageOpacity и подставляем в поле opacity пост-патчем вместе с URL; для
  // текстов прозрачность вшивается в альфу цвета (см. textNode).
  function applyOpacity(node, cs) {
    const op = parseFloat(cs.opacity);
    if (!isNaN(op) && op < 1) {
      node.opacity = op;
      imageOpacity.set(node.id, op);
    }
  }

  // Инлайн-<svg> (иконки: лупа в поиске и т.п.): Zero-вектор без Figma API
  // не создать, поэтому сериализуем разметку в data:image/svg+xml — Zero
  // рендерит её обычной картинкой. currentColor заменяем на вычисленный цвет:
  // внутри data-URI CSS-наследования нет.
  function svgNode(el, cs) {
    const node = baseNode('image', 'RECTANGLE', elBox(el));
    node.fills = [{ type: 'IMAGE', visible: true, blendMode: 'NORMAL', scaleMode: 'FIT' }];
    applyOpacity(node, cs);
    if (cs.position === 'absolute') node.layoutPositioning = 'ABSOLUTE';
    let svg = el.outerHTML.replace(/currentColor/g, cs.color);
    if (!/xmlns=/.test(svg)) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    imageUrls.set(node.id, 'data:image/svg+xml;base64,' + win.btoa(unescape(encodeURIComponent(svg))));
    return node;
  }

  function buttonNode(el, cs) {
    buttonSeq += 1;
    const name = 'button ' + buttonSeq;
    const node = frameNode(name, elBox(el));
    node.fills = backgroundFills(cs);
    applyCorners(node, cs);
    applyStrokes(node, cs);
    node.effects = shadowEffects(cs);
    // Конвертер Zero собирает кнопку как «подпись + паддинги» и игнорирует
    // высоту рамки: CSS-кнопка с padding:0 и высотой от флекса (align-items:
    // stretch) схлопывалась до строки текста. Паддинги считаем геометрически —
    // от рамки кнопки и фактического прямоугольника подписи.
    const btnRect = el.getBoundingClientRect();
    const range = doc.createRange();
    range.selectNodeContents(el);
    const capRect = range.getBoundingClientRect();
    const padV = Math.max(0, Math.round((btnRect.height - capRect.height) / 2));
    const padH = Math.max(0, Math.round((btnRect.width - capRect.width) / 2));
    node.paddingTop = padV;
    node.paddingBottom = padV;
    node.paddingLeft = padH;
    node.paddingRight = padH;
    if (cs.position === 'absolute') node.layoutPositioning = 'ABSOLUTE';
    const caption = textNode(el, cs);
    // Подписи — её собственный прямоугольник (не вся кнопка): размер кнопки
    // конвертер выводит из размера текста и паддингов.
    if (capRect.width >= 1 && capRect.height >= 1) {
      const cb = rectBox(capRect);
      caption.absoluteBoundingBox = cb;
      caption.absoluteRenderBounds = cb;
      caption.size = { x: cb.width, y: cb.height };
    }
    node.children = [caption];
    const href = el.getAttribute && el.getAttribute('href');
    if (href && href !== '#') buttonLinks.set(name, href);
    return node;
  }

  // --- маппинги и утилиты ------------------------------------------------------

  function elBox(el) {
    return rectBox(el.getBoundingClientRect());
  }

  function rectBox(r) {
    return {
      x: r.left - bodyRect.left,
      y: r.top - bodyRect.top,
      width: Math.max(1, r.width),
      height: Math.max(1, r.height),
    };
  }

  function applyCorners(node, cs) {
    const tl = num(cs.borderTopLeftRadius);
    const tr = num(cs.borderTopRightRadius);
    const br = num(cs.borderBottomRightRadius);
    const bl = num(cs.borderBottomLeftRadius);
    if (tl || tr || br || bl) {
      if (tl === tr && tr === br && br === bl) node.cornerRadius = tl;
      else node.rectangleCornerRadii = [tl, tr, br, bl];
    }
  }

  function applyStrokes(node, cs) {
    const bw = parseFloat(cs.borderTopWidth);
    if (bw > 0 && cs.borderTopStyle !== 'none') {
      const c = cssColorToFigma(cs.borderTopColor);
      if (c) {
        node.strokes = [{ type: 'SOLID', visible: true, blendMode: 'NORMAL', color: c.color, opacity: c.opacity }];
        node.strokeWeight = bw;
        node.strokeAlign = 'INSIDE';
      }
    }
  }

  function solidFills(cssColor) {
    const c = cssColorToFigma(cssColor);
    return c
      ? [{ type: 'SOLID', visible: true, blendMode: 'NORMAL', color: c.color, opacity: c.opacity }]
      : [];
  }

  // Фон контейнера: linear-gradient из background-image приоритетнее
  // плоского цвета (конвертер Тильды понимает gradient-paint'ы).
  function backgroundFills(cs) {
    const grad = gradientFill(cs.backgroundImage);
    if (grad) return [grad];
    return solidFills(cs.backgroundColor);
  }

  // computed background-image: 'linear-gradient(135deg, rgb(15, 20, 32) 0%, …)'
  // → GRADIENT_LINEAR paint. Не-линейные/множественные фоны пропускаем.
  function gradientFill(backgroundImage) {
    const src = backgroundImage || '';
    const start = src.indexOf('linear-gradient(');
    if (start === -1) return null;
    let depth = 0;
    let inner = null;
    for (let i = start + 16; i < src.length; i++) {
      if (src[i] === '(') depth++;
      else if (src[i] === ')') {
        if (depth === 0) { inner = src.slice(start + 16, i); break; }
        depth--;
      }
    }
    if (!inner) return null;
    const parts = splitTopLevel(inner);
    if (!parts.length) return null;
    let angle = 180; // CSS-дефолт: to bottom
    if (/^-?[\d.]+deg$/.test(parts[0])) {
      angle = parseFloat(parts.shift());
    } else if (parts[0].startsWith('to ')) {
      const dirs = {
        'top': 0, 'right': 90, 'bottom': 180, 'left': 270,
        'top right': 45, 'right top': 45,
        'bottom right': 135, 'right bottom': 135,
        'bottom left': 225, 'left bottom': 225,
        'top left': 315, 'left top': 315,
      };
      const key = parts.shift().slice(3).trim().replace(/\s+/g, ' ');
      angle = key in dirs ? dirs[key] : 180;
    }
    const stops = [];
    for (const p of parts) {
      const cm = /rgba?\([^)]*\)/.exec(p);
      if (!cm) continue;
      const col = cssColorToFigma(cm[0]);
      if (!col) continue;
      const pos = /([\d.]+)%/.exec(p.slice(cm.index + cm[0].length));
      stops.push({ color: { ...col.color, a: col.opacity }, position: pos ? parseFloat(pos[1]) / 100 : null });
    }
    if (stops.length < 2) return null;
    stops.forEach((s, i) => {
      if (s.position === null) s.position = i / (stops.length - 1);
    });
    const rad = (angle * Math.PI) / 180;
    // Знак обратный CSS-конвенции: проверено против figma__field__color —
    // с {sin, -cos} конвертер выдаёт угол, зеркальный исходному (135°→315°).
    const d = { x: -Math.sin(rad), y: Math.cos(rad) };
    const p0 = { x: 0.5 - d.x / 2, y: 0.5 - d.y / 2 };
    const p1 = { x: 0.5 + d.x / 2, y: 0.5 + d.y / 2 };
    const p2 = { x: p0.x + d.y / 2, y: p0.y - d.x / 2 };
    return {
      type: 'GRADIENT_LINEAR',
      visible: true,
      blendMode: 'NORMAL',
      gradientHandlePositions: [p0, p1, p2],
      gradientStops: stops,
    };
  }

  // box-shadow (computed: 'rgba(0, 0, 0, 0.25) 0px 8px 24px 0px[, …]')
  // → DROP_SHADOW-эффекты; inset пропускаем.
  function shadowEffects(cs) {
    if (!cs.boxShadow || cs.boxShadow === 'none') return [];
    const out = [];
    for (const s of splitTopLevel(cs.boxShadow)) {
      if (s.includes('inset')) continue;
      const cm = /rgba?\([^)]*\)/.exec(s);
      if (!cm) continue;
      const col = cssColorToFigma(cm[0]);
      if (!col) continue;
      const nums = (s.slice(0, cm.index) + s.slice(cm.index + cm[0].length))
        .trim().split(/\s+/).map(parseFloat).filter((n) => !isNaN(n));
      out.push({
        type: 'DROP_SHADOW',
        visible: true,
        blendMode: 'NORMAL',
        color: { ...col.color, a: col.opacity },
        offset: { x: nums[0] || 0, y: nums[1] || 0 },
        radius: nums[2] || 0,
        spread: nums[3] || 0,
        showShadowBehindNode: true,
      });
    }
    return out;
  }

  // Разбить строку по запятым верхнего уровня (не внутри скобок).
  function splitTopLevel(s) {
    const out = [];
    let depth = 0;
    let cur = '';
    for (const ch of s) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  // rgb()/rgba() → figma-цвет {r,g,b,a: 0..1}; прозрачный → null.
  function cssColorToFigma(color) {
    const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\s*\)/.exec(color || '');
    if (!m) return null;
    const opacity = m[4] === undefined ? 1 : parseFloat(m[4]);
    if (opacity === 0) return null;
    return {
      color: { r: +m[1] / 255, g: +m[2] / 255, b: +m[3] / 255, a: 1 },
      opacity,
    };
  }

  // computed rgb(...) → '#rrggbb' (для сравнения цветов сегментов текста).
  function rgbToHex(color) {
    const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(color || '');
    if (!m) return null;
    return '#' + [m[1], m[2], m[3]].map((n) => (+n).toString(16).padStart(2, '0')).join('');
  }

  // '#rrggbb' → figma-цвет {r,g,b,a} 0..1.
  function hexToFigma(hex) {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
    if (!m) return { r: 0, g: 0, b: 0, a: 1 };
    return { r: parseInt(m[1], 16) / 255, g: parseInt(m[2], 16) / 255, b: parseInt(m[3], 16) / 255, a: 1 };
  }

  function mapJustify(v) {
    if (v === 'center') return 'CENTER';
    if (v === 'flex-end' || v === 'end') return 'MAX';
    if (v === 'space-between' || v === 'space-around' || v === 'space-evenly') return 'SPACE_BETWEEN';
    return 'MIN';
  }

  function mapAlign(v) {
    if (v === 'center') return 'CENTER';
    if (v === 'flex-end' || v === 'end') return 'MAX';
    return 'MIN';
  }

  function mapTextAlign(v) {
    if (v === 'center') return 'CENTER';
    if (v === 'right' || v === 'end') return 'RIGHT';
    if (v === 'justify') return 'JUSTIFIED';
    return 'LEFT';
  }

  function num(v) {
    return Math.round(parseFloat(v) || 0);
  }

  function firstFont(fontFamily) {
    return (fontFamily || '').split(',')[0].trim().replace(/^["']|["']$/g, '') || 'Arial';
  }
}

// --- классификация -----------------------------------------------------------

const INLINE_TAGS = new Set([
  'A', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'SPAN', 'BR', 'SMALL', 'SUB', 'SUP', 'CODE', 'MARK',
]);

// «Текстовый лист» — элемент, всё содержимое которого выразимо ОДНОЙ
// rich-text-нодой: заголовок с цветным подзаголовком, абзац с выделениями,
// строки через <br>/block-span. textNode собирает это в один text с
// форматированием (цвет сегментов, переносы), НЕ разбивая на ноды.
// НЕ лист, если внутри есть самостоятельные элементы: картинка, SVG,
// ссылка-кнопка (<a> с фоном/рамкой), блок с собственным фоном/рамкой —
// такие идут отдельными элементами (image/button/shape).
function isTextLeaf(el, win) {
  if (!el.innerText || !el.innerText.trim()) return false;
  // Flex/grid-контейнер — это раскладка (gap, выравнивание, колонки), а не
  // поток текста: «или» + ссылка в flex-column должны остаться отдельными
  // элементами, иначе слипаются в один текст и ссылка теряется.
  if (win && /flex|grid/.test(win.getComputedStyle(el).display)) return false;
  return [...el.querySelectorAll('*')].every((c) => {
    // tagName у SVG-элементов строчный ('svg'), сравниваем без регистра.
    if (c.tagName === 'IMG' || c.tagName.toUpperCase() === 'SVG') return false;
    if (!win) return true;
    const cs = win.getComputedStyle(c);
    if (c.tagName === 'A' && isButtonLike(c, cs)) return false;
    if (isStyledBox(cs)) return false;
    return true;
  });
}

function isButtonLike(el, cs) {
  if (el.tagName !== 'A' && el.tagName !== 'BUTTON') return false;
  if (!el.innerText || !el.innerText.trim()) return false;
  const hasBg = /rgba?\(/.test(cs.backgroundColor) && !/rgba?\([^)]*[,\s/]0\s*\)$/.test(cs.backgroundColor);
  const hasBorder = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none';
  return hasBg || hasBorder;
}

function isStyledBox(cs) {
  const hasBg = /rgba?\(/.test(cs.backgroundColor) && !/rgba?\([^)]*[,\s/]0\s*\)$/.test(cs.backgroundColor);
  const hasBorder = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none';
  const hasShadow = cs.boxShadow && cs.boxShadow !== 'none';
  return hasBg || hasBorder || hasShadow;
}
