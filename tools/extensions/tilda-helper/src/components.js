// Компоненты в Zero-блоке (в духе Figma): главный компонент + инстансы
// с наследованием параметров и отвязкой переопределённых полей.
//
// Как устроено:
//  • Маркеры живут в поле `classname` элемента/группы (оно персистится в JSON
//    артборда и путешествует с copy/paste через localStorage-буфер Тильды):
//      th-comp-<cid>   — корень главного компонента
//      th-inst-<cid>   — корень инстанса
//      th-rev-<n>      — последняя применённая к инстансу ревизия
//      th-node-<key>   — стабильный ключ потомка внутри компонента
//      th-ovr-<field>  — поле отвязано на этой ноде инстанса (override)
//  • Определения компонентов (поля всех нод + ревизия) — в head-коде проекта,
//    блок <!--TildaHelperComponents-->…, тем же API, что дизайн-токены
//    (getheadcode / editprojectheadcode). Поэтому синхронизация работает
//    между Zero-блоками и страницами всего проекта: инстанс подтягивает
//    изменения при открытии своего zero-редактора.
//  • Движок — идемпотентный тик:
//      1) вставленный дубль главного компонента → автоматически инстанс
//         (как в Figma: copy/paste main создаёт instance);
//      2) дифф main против определения → def обновляется, rev++,
//         локальные инстансы обновляются сразу, реестр пишется с debounce;
//      3) инстанс с отставшей ревизией → применяем все не-отвязанные поля;
//      4) инстанс с актуальной ревизией, но отличающимся полем → юзер правил
//         руками → поле помечается th-ovr-* (отвязка, как в Figma).
//  • Правки применяются ТОЛЬКО в открытом редакторе через родной
//    elem__setFieldValue (state Тильды в курсе); в базу мы сами НИЧЕГО не
//    сохраняем — блок сохраняет пользователь кнопкой SAVE.

// ---------------------------------------------------------------------------
// Константы
// ---------------------------------------------------------------------------

const BLOCK_START = '<!--TildaHelperComponents-->';
const BLOCK_END = '<!--/TildaHelperComponents-->';
const DATA_ID = 'th-components-data';
const STYLE_ID = 'th-components-style';
const BTN_ID = 'th-comp-btn';

const PURPLE = '#7c4dff';

// Поля, которые никогда не синхронизируются и не считаются переопределением.
const SKIP_ALWAYS = new Set(['classname', 'groupid', 'name']);
// Поля, свои у каждого инстанса ТОЛЬКО на корне (положение в родителе,
// порядок во флексе и т.п. — как в Figma позиция инстанса не наследуется).
const SKIP_ROOT = new Set([
  'top', 'left', 'topunits', 'leftunits', 'toptunits', 'zindex', 'lock',
  'container', 'axisx', 'axisy', 'flexorder', 'absolute', 'margin',
  'flexalignself', 'flexgrow', 'flexshrink', 'flexbasis', 'flexbasisvalue',
]);

const CID_RE = /(?:^|\s)th-comp-([a-z0-9]+)(?=\s|$)/;
const INST_RE = /(?:^|\s)th-inst-([a-z0-9]+)(?=\s|$)/;
const REV_RE = /(?:^|\s)th-rev-(\d+)(?=\s|$)/;
const NODE_RE = /(?:^|\s)th-node-([a-z0-9]+)(?=\s|$)/;

// ---------------------------------------------------------------------------
// Состояние
// ---------------------------------------------------------------------------

const state = {
  data: null,        // { v:1, comps: { cid: def } } — реестр из head-кода
  loaded: false,
  loadError: null,
  saveTimer: 0,
  saving: false,
  dirty: false,
};

// def = { name, rev, mainId, record, nodes: { 'root'|key: {
//   type, parent, fields: { fieldName|field-res-W: value }, text? } } }

function emptyData() {
  return { v: 1, comps: {} };
}

function uid() {
  return (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)).toLowerCase();
}

// ---------------------------------------------------------------------------
// API проекта (тот же путь, что у токенов: head-код Site Settings)
// ---------------------------------------------------------------------------

function getProjectId() {
  return new URLSearchParams(location.search).get('projectid') || String(window.projectid || '');
}

function getCsrf() {
  if (typeof window.csrf === 'string' && window.csrf) return window.csrf;
  const m = document.getElementById('csrf');
  return (m && m.getAttribute('content')) || '';
}

function decodeEntities(s) {
  if (!s || s.indexOf('&') === -1) return s || '';
  const ta = document.createElement('textarea');
  ta.innerHTML = s;
  return ta.value;
}

async function apiPost(path, params) {
  const r = await fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: new URLSearchParams({ ...params, csrf: getCsrf() }),
  });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' (' + path + ')');
  return (await r.text()).replace(/^\s*(?:<!--[\s\S]*?-->\s*)+/, '');
}

async function readHeadCode() {
  const txt = await apiPost('/projects/get/getheadcode/', {
    comm: 'getheadcode',
    projectid: getProjectId(),
  });
  const j = JSON.parse(txt);
  if (!j || !j.project) throw new Error('getheadcode: неожиданный ответ ' + txt.slice(0, 120));
  return decodeEntities(j.project.headcode || '');
}

async function writeHeadCode(headcode) {
  const res = (await apiPost('/projects/submit/', {
    comm: 'editprojectheadcode',
    projectid: getProjectId(),
    headcode,
  })).trim();
  if (res !== 'OK') throw new Error('Tilda ответила: ' + res.slice(0, 200));
}

function extractBlock(headcode) {
  const s = headcode.indexOf(BLOCK_START);
  if (s === -1) return null;
  const e = headcode.indexOf(BLOCK_END, s);
  if (e === -1) return null;
  return { start: s, end: e + BLOCK_END.length, text: headcode.slice(s, e + BLOCK_END.length) };
}

function parseFromHead(headcode) {
  const block = extractBlock(headcode);
  if (!block) return null;
  const m = block.text.match(
    new RegExp('<script type="application/json" id="' + DATA_ID + '">([\\s\\S]*?)</script>')
  );
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch (e) {
    return null;
  }
}

function buildHeadBlock(data) {
  return (
    BLOCK_START + '\n' +
    '<script type="application/json" id="' + DATA_ID + '">' +
    JSON.stringify(data) +
    '</script>\n' +
    BLOCK_END
  );
}

function stripAllBlocks(headcode) {
  let out = headcode;
  let block;
  while ((block = extractBlock(out))) {
    out = out.slice(0, block.start) + out.slice(block.end);
  }
  return out;
}

function headWithData(headcode, data) {
  const isEmpty = !data || !Object.keys(data.comps).length;
  const block = extractBlock(headcode);
  if (isEmpty) {
    const out = stripAllBlocks(headcode);
    return out.trim() ? out.replace(/\n{3,}/g, '\n\n') : '';
  }
  const fresh = buildHeadBlock(data);
  if (!block) return headcode + (headcode.trim() ? '\n' : '') + fresh;
  const rest = stripAllBlocks(headcode);
  return rest.slice(0, block.start) + fresh + rest.slice(block.start);
}

// Debounce-запись реестра: во время drag main меняется каждый тик — пишем
// в head-код только после паузы. Перед записью перечитываем свежий head,
// чтобы не затереть параллельные правки (токены и т.п.).
function scheduleSave() {
  state.dirty = true;
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(flushSave, 2500);
}

async function flushSave() {
  if (state.saving || !state.dirty) return;
  state.saving = true;
  state.dirty = false;
  try {
    const head = await readHeadCode();
    await writeHeadCode(headWithData(head, state.data));
  } catch (e) {
    state.dirty = true; // не потеряли — попробуем в следующий раз
    console.warn('[Tilda Helper] компоненты: не удалось сохранить реестр:', e);
  } finally {
    state.saving = false;
    if (state.dirty) scheduleSave();
  }
}

// ---------------------------------------------------------------------------
// Чтение/запись полей нод (DOM zero-редактора)
// ---------------------------------------------------------------------------

function getClassname(el) {
  return el.getAttribute('data-field-classname-value') || '';
}

function setClassname(el, next) {
  const clean = next.replace(/\s+/g, ' ').trim();
  window.elem__setFieldValue(el, 'classname', clean, 'render');
}

function addClass(el, cls) {
  const cur = getClassname(el);
  if ((' ' + cur + ' ').includes(' ' + cls + ' ')) return;
  setClassname(el, cur + ' ' + cls);
}

function removeClassesBy(el, re) {
  const cur = getClassname(el);
  const next = cur
    .split(/\s+/)
    .filter((c) => c && !re.test(' ' + c))
    .join(' ');
  if (next !== cur) setClassname(el, next);
}

// Снимок всех полей ноды из data-field-*-value (включая -res-<w>- брейкпоинты).
// Для корня компонента позиционные поля (SKIP_ROOT) не входят в снимок —
// иначе каждое передвижение main по канвасу поднимало бы ревизию.
function snapshotFields(el, isRoot) {
  const out = {};
  for (const a of el.attributes) {
    const m = a.name.match(/^data-field-(.+)-value$/);
    if (!m) continue;
    const full = m[1]; // например 'bgcolor' или 'top-res-480'
    const base = baseField(full);
    if (SKIP_ALWAYS.has(base)) continue;
    if (isRoot && SKIP_ROOT.has(base)) continue;
    out[full] = a.value;
  }
  return out;
}

function baseField(full) {
  return full.replace(/-res-\d+$/, '');
}

function resOf(full) {
  const m = full.match(/-res-(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

// Текст живёт в .tn-atom (data-field-text-value у текстовых нод пустой).
function getText(el) {
  if (el.getAttribute('data-elem-type') !== 'text') return undefined;
  const atom = el.querySelector('.tn-atom');
  return atom ? atom.innerHTML : undefined;
}

function setText(el, html) {
  window.elem__setFieldValue(el, 'text', html, 'render');
  // Родной путь санитайзит HTML до plain+<br> — если разметка потерялась,
  // дописываем в атом напрямую (сериализатор читает .tn-atom).
  const atom = el.querySelector('.tn-atom');
  if (atom && atom.innerHTML !== html) atom.innerHTML = html;
}

// Применить поле ноде через родной сеттер (обновляет и DOM, и state Тильды).
// Сигнатура: elem__setFieldValue(el, field, value, render, updateui, breakpoint,
// topBreakpoint). Базовые поля пишем ЯВНО на верхнем брейкпоинте (1200) —
// без этого, будь редактор переключён на узкий экран, значение легло бы
// res-переопределением текущего брейкпоинта.
function applyField(el, full, value) {
  const base = baseField(full);
  const fieldsAttr = el.getAttribute('data-fields');
  if (fieldsAttr && !fieldsAttr.split(',').includes(base)) return;
  const top = (window.tn && window.tn.topResolution) || 1200;
  const res = resOf(full) || top;
  window.elem__setFieldValue(el, base, value, 'render', undefined, res, top);
}

// ---------------------------------------------------------------------------
// Обход дерева компонента
// ---------------------------------------------------------------------------

function descendants(rootEl) {
  return [...rootEl.querySelectorAll('.tn-elem, .tn-group')];
}

function nodeKeyOf(el) {
  const m = getClassname(el).match(NODE_RE);
  return m ? m[1] : null;
}

function findInstanceNode(instRoot, key) {
  for (const el of descendants(instRoot)) {
    if (nodeKeyOf(el) === key) return el;
  }
  return null;
}

// Снимок дерева main → структура нод определения.
function snapshotTree(rootEl, ensureKeys) {
  const nodes = {};
  nodes.root = {
    type: rootEl.getAttribute('data-elem-type') || 'group',
    parent: null,
    fields: snapshotFields(rootEl, true),
    text: getText(rootEl),
  };
  for (const el of descendants(rootEl)) {
    let key = nodeKeyOf(el);
    if (!key) {
      if (!ensureKeys) continue; // чужой элемент без ключа — подхватим позже
      key = uid();
      addClass(el, 'th-node-' + key);
    }
    const parentEl = el.parentElement && el.parentElement.closest('.tn-elem, .tn-group');
    const parentKey = parentEl && rootEl.contains(parentEl) && parentEl !== rootEl
      ? nodeKeyOf(parentEl)
      : 'root';
    nodes[key] = {
      type: el.getAttribute('data-elem-type') || 'group',
      parent: parentKey || 'root',
      fields: snapshotFields(el),
      text: getText(el),
    };
  }
  return nodes;
}

function fieldsEqual(a, b) {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (a[k] !== b[k]) return false;
  return true;
}

function nodesEqual(a, b) {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    const x = a[k];
    const y = b[k];
    if (!y || x.type !== y.type || x.parent !== y.parent || x.text !== y.text) return false;
    if (!fieldsEqual(x.fields, y.fields)) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Синхронизация
// ---------------------------------------------------------------------------

function currentRecordId() {
  return new URLSearchParams(location.search).get('recordid') || '';
}

function findRoots() {
  const mains = [];
  const insts = [];
  for (const el of document.querySelectorAll('.tn-elem, .tn-group')) {
    const cls = getClassname(el);
    let m = cls.match(CID_RE);
    if (m) mains.push({ el, cid: m[1] });
    m = cls.match(INST_RE);
    if (m) insts.push({ el, cid: m[1] });
  }
  return { mains, insts };
}

function instRev(el) {
  const m = getClassname(el).match(REV_RE);
  return m ? parseInt(m[1], 10) : -1;
}

function setInstRev(el, rev) {
  const cur = getClassname(el);
  let next;
  if (REV_RE.test(cur)) next = cur.replace(REV_RE, ' th-rev-' + rev);
  else next = cur + ' th-rev-' + rev;
  setClassname(el, next);
}

function overridesOf(el) {
  const out = new Set();
  const re = /(?:^|\s)th-ovr-([a-z0-9_-]+)(?=\s|$)/g;
  let m;
  const cls = getClassname(el);
  while ((m = re.exec(cls))) out.add(m[1]);
  return out;
}

// Превращает корень (со всеми маркерами main) в инстанс.
function convertToInstance(el, cid, rev) {
  const cur = getClassname(el)
    .replace(CID_RE, ' ')
    .replace(INST_RE, ' ')
    .replace(REV_RE, ' ');
  setClassname(el, cur + ' th-inst-' + cid + ' th-rev-' + rev);
}

// Полная отвязка поддерева от компонента (Figma: detach instance).
function detachSubtree(rootEl) {
  const strip = (el) => {
    const next = getClassname(el)
      .split(/\s+/)
      .filter((c) => c && !/^th-(comp|inst|rev|node|ovr)-/.test(c))
      .join(' ');
    if (next !== getClassname(el)) setClassname(el, next);
  };
  strip(rootEl);
  for (const el of descendants(rootEl)) strip(el);
}

// Применить определение к инстансу (все не-отвязанные поля всех нод).
function applyDefToInstance(def, instRoot) {
  const applyNode = (defNode, el, isRoot) => {
    const ovr = overridesOf(el);
    for (const [full, value] of Object.entries(defNode.fields)) {
      const base = baseField(full);
      if (SKIP_ALWAYS.has(base)) continue;
      if (isRoot && SKIP_ROOT.has(base)) continue;
      if (ovr.has(full) || ovr.has(base)) continue;
      const cur = el.getAttribute('data-field-' + full + '-value');
      if (cur === value) continue;
      applyField(el, full, value);
    }
    if (defNode.text !== undefined && !ovr.has('text')) {
      const cur = getText(el);
      if (cur !== undefined && cur !== defNode.text) setText(el, defNode.text);
    }
  };

  applyNode(def.nodes.root, instRoot, true);
  for (const [key, defNode] of Object.entries(def.nodes)) {
    if (key === 'root') continue;
    const el = findInstanceNode(instRoot, key);
    if (!el) continue; // структурные добавления — ограничение v1 (см. отчёт)
    applyNode(defNode, el, false);
  }
}

// Пометить отличающиеся от def поля инстанса как отвязанные (юзер их правил).
function detectOverrides(def, instRoot) {
  const checkNode = (defNode, el, isRoot) => {
    const ovr = overridesOf(el);
    const cur = snapshotFields(el, isRoot);
    for (const [full, value] of Object.entries(defNode.fields)) {
      const base = baseField(full);
      if (SKIP_ALWAYS.has(base)) continue;
      if (isRoot && SKIP_ROOT.has(base)) continue;
      if (ovr.has(full) || ovr.has(base)) continue;
      if (cur[full] !== undefined && cur[full] !== value) {
        addClass(el, 'th-ovr-' + full);
      }
    }
    if (defNode.text !== undefined && !ovr.has('text')) {
      const t = getText(el);
      if (t !== undefined && t !== defNode.text) addClass(el, 'th-ovr-text');
    }
  };
  checkNode(def.nodes.root, instRoot, true);
  for (const [key, defNode] of Object.entries(def.nodes)) {
    if (key === 'root') continue;
    const el = findInstanceNode(instRoot, key);
    if (el) checkNode(defNode, el, false);
  }
}

// ---------------------------------------------------------------------------
// Тик движка
// ---------------------------------------------------------------------------

export function updateZeroComponents() {
  if (!state.loaded || !window.elem__setFieldValue) return;
  const data = state.data;
  const record = currentRecordId();
  const { mains, insts } = findRoots();

  // 1. Дубли main (copy/paste) → инстансы; перенос main внутри того же блока
  //    (вырезать/вставить) → обновление mainId.
  for (const { el, cid } of mains) {
    const def = data.comps[cid];
    if (!def) continue; // определение потеряно — не трогаем (см. detach ниже)
    if (el.id === def.mainId) continue;
    const mainStillHere = mains.some((m) => m.cid === cid && m.el.id === def.mainId);
    if (!mainStillHere && def.record === record) {
      // настоящий main из этого же блока исчез — это перемещение, не копия
      def.mainId = el.id;
      scheduleSave();
    } else {
      convertToInstance(el, cid, def.rev);
      insts.push({ el, cid });
    }
  }

  // 2. Дифф main → обновление определения.
  for (const { el, cid } of mains) {
    const def = data.comps[cid];
    if (!def || el.id !== def.mainId) continue;
    const nodes = snapshotTree(el, true);
    if (!nodesEqual(nodes, def.nodes)) {
      def.nodes = nodes;
      def.rev += 1;
      def.record = record;
      def.name = el.getAttribute('data-field-name-value') || def.name;
      scheduleSave();
    }
  }

  // 3. Инстансы: подтянуть отставшие, зафиксировать ручные правки как отвязку.
  for (const { el, cid } of insts) {
    const def = data.comps[cid];
    if (!def) continue; // компонент расформирован — инстанс живёт как есть
    const rev = instRev(el);
    if (rev < def.rev) {
      applyDefToInstance(def, el);
      setInstRev(el, def.rev);
    } else {
      detectOverrides(def, el);
    }
  }

  updateToolbarButton();
}

// ---------------------------------------------------------------------------
// Создание / отвязка (кнопка)
// ---------------------------------------------------------------------------

function selectedRoot() {
  const sel = document.querySelectorAll(
    '.tn-elem__selected:not(.tn-group__selected .tn-elem__selected), .tn-group__selected'
  );
  // Внутри выделенной группы её дети тоже могут носить __selected — берём
  // самый внешний; ровно один корень выделения — иначе null.
  const roots = [...sel].filter((el) => {
    const p = el.parentElement && el.parentElement.closest('.tn-elem__selected, .tn-group__selected');
    return !p;
  });
  return roots.length === 1 ? roots[0] : null;
}

function notice(text) {
  if (typeof window.td__showBubbleNotice === 'function') window.td__showBubbleNotice(text);
  else console.log('[Tilda Helper] ' + text);
}

function createComponent(rootEl) {
  const cid = uid();
  const nodes = snapshotTree(rootEl, true);
  state.data.comps[cid] = {
    name: rootEl.getAttribute('data-field-name-value') || 'Компонент',
    rev: 0,
    mainId: rootEl.id,
    record: currentRecordId(),
    nodes,
  };
  addClass(rootEl, 'th-comp-' + cid);
  scheduleSave();
  notice('Создан компонент. Копии (Cmd/Ctrl+C → V) станут инстансами.');
}

function onButtonClick(e) {
  const rootEl = selectedRoot();
  if (!rootEl) {
    notice('Выделите один элемент или группу.');
    return;
  }
  const cls = getClassname(rootEl);
  const asMain = cls.match(CID_RE);
  const asInst = cls.match(INST_RE);

  if (asMain) {
    if (e.altKey) {
      // Alt+клик по main — расформировать компонент целиком.
      delete state.data.comps[asMain[1]];
      detachSubtree(rootEl);
      scheduleSave();
      notice('Компонент расформирован. Инстансы отвяжутся при открытии своих блоков.');
    } else {
      notice('Это главный компонент. Alt+клик — расформировать.');
    }
    return;
  }
  if (asInst) {
    detachSubtree(rootEl);
    notice('Инстанс отвязан от компонента.');
    return;
  }
  if (nodeKeyOf(rootEl)) {
    notice('Это часть компонента — выделите его корень.');
    return;
  }
  createComponent(rootEl);
}

// ---------------------------------------------------------------------------
// UI: кнопка в нижней панели + фиолетовое выделение
// ---------------------------------------------------------------------------

const DIAMOND_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">' +
  '<rect x="15" y="6.4" width="5.4" height="5.4" transform="rotate(45 15 6.4)" stroke="currentColor" stroke-width="1.3"/>' +
  '<rect x="10.2" y="11.2" width="5.4" height="5.4" transform="rotate(45 10.2 11.2)" stroke="currentColor" stroke-width="1.3"/>' +
  '<rect x="19.8" y="11.2" width="5.4" height="5.4" transform="rotate(45 19.8 11.2)" stroke="currentColor" stroke-width="1.3"/>' +
  '<rect x="15" y="16" width="5.4" height="5.4" transform="rotate(45 15 16)" stroke="currentColor" stroke-width="1.3"/>' +
  '</svg>';

function injectComponentStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* Фиолетовая рамка выделения у компонентов и инстансов (вместо синей). */
    .tn-elem__selected[data-field-classname-value*="th-comp-"],
    .tn-elem__selected[data-field-classname-value*="th-inst-"],
    .tn-elem__selected[data-field-classname-value*="th-node-"] {
      box-shadow: 0 0 0 var(--tn-outline-width, 1px) ${PURPLE} inset !important;
    }
    .tn-group__selected[data-field-classname-value*="th-comp-"]:not(.tn-group__on-resize)::after,
    .tn-group__selected[data-field-classname-value*="th-inst-"]:not(.tn-group__on-resize)::after,
    .tn-group__selected[data-field-classname-value*="th-node-"]:not(.tn-group__on-resize)::after {
      box-shadow: 0 0 0 var(--tn-outline-width, 1px) ${PURPLE} inset !important;
    }
    /* Кнопка в нижней панели. */
    #${BTN_ID} { color: inherit; }
    #${BTN_ID}.th-comp-btn_active { color: ${PURPLE}; }
    #${BTN_ID}.th-comp-btn_hidden { display: none; }
  `;
  document.head.appendChild(style);
}

function updateToolbarButton() {
  const bar = document.querySelector('.tn-toolbar__content-block');
  if (!bar) return;
  let btn = document.getElementById(BTN_ID);
  if (!btn) {
    btn = document.createElement('div');
    btn.id = BTN_ID;
    btn.className = 'tn-toolbar__content-icon-wrapper';
    btn.title = 'Компонент: создать / инстанс — отвязать (Alt+клик по main — расформировать)';
    btn.innerHTML = '<div class="tn-toolbar__content-icon">' + DIAMOND_SVG + '</div>';
    btn.addEventListener('click', onButtonClick);
    if (bar.lastElementChild) {
      bar.insertBefore(btn, bar.lastElementChild);
    } else {
      bar.appendChild(btn);
    }
  }
  const rootEl = selectedRoot();
  btn.classList.toggle('th-comp-btn_hidden', !rootEl);
  if (rootEl) {
    const cls = getClassname(rootEl);
    btn.classList.toggle(
      'th-comp-btn_active',
      CID_RE.test(cls) || INST_RE.test(cls)
    );
  }
}

// ---------------------------------------------------------------------------
// Инициализация
// ---------------------------------------------------------------------------

export function initZeroComponents() {
  injectComponentStyles();
  (async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const head = await readHeadCode();
        state.data = parseFromHead(head) || emptyData();
        if (!state.data.comps) state.data.comps = {};
        state.loaded = true;
        return;
      } catch (e) {
        state.loadError = e;
        await new Promise((res) => setTimeout(res, 1500 * (attempt + 1)));
      }
    }
    console.warn('[Tilda Helper] компоненты: реестр не загрузился, фича выключена:', state.loadError);
  })();
}
