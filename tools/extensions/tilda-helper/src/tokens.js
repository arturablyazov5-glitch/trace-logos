// Tilda Tokens Engine — «Figma Variables inside Tilda».
//
// Токены живут в Настройках сайта → «HTML-код для вставки внутрь head»
// одним управляемым блоком между маркерами <!--TildaTokens-->…<!--/TildaTokens-->:
//   1. <script type="application/json" id="tilda-tokens-data"> — данные токенов
//      (коллекции, значения по режимам, плюс заранее разрешённые алиасы);
//   2. <style id="tilda-tokens-css"> — сгенерированные CSS-переменные с
//      media-query (desktop-first) — работают на опубликованном сайте без JS;
//   3. <script> runtime — заменяет {{token}} в текстах/атрибутах style на
//      опубликованной странице (CSS-переменные и так в <style> выше).
//
// API Tilda (реверс со страницы /projects/editheadcode/):
//   чтение:  POST /projects/get/getheadcode/  {comm:'getheadcode', projectid, csrf}
//            → {project:{headcode}} — ВНИМАНИЕ: значение приходит
//            HTML-encoded (&lt; вместо <), декодируем сами;
//   запись:  POST /projects/submit/ {comm:'editprojectheadcode', projectid,
//            headcode, csrf} → 'OK'.
//   csrf — window.csrf (строка) либо <meta id="csrf" content>.
//   Лимит поля — TEXT (~65535 символов), обрезается МОЛЧА → держим бюджет
//   HEAD_BUDGET и не даём сохранить больше.
//
// Брейкпоинты — из фактического CSS tilda-blocks/tilda-grid (серия
// min-width 321/481/641/981/1201): границы 480 / 640 / 980 / 1200.
// Каскад desktop-first: база в :root, переопределения в @media (max-width:…).

const DATA_ID = 'tilda-tokens-data';
const CSS_ID = 'tilda-tokens-css';
const BLOCK_START = '<!--TildaTokens-->';
const BLOCK_END = '<!--/TildaTokens-->';
const HEAD_BUDGET = 60000;

export const MODES = [
  { key: 'desktop', label: 'Desktop', max: null },
  { key: 'laptop', label: '≤1200', max: 1200 },
  { key: 'tablet', label: '≤980', max: 980 },
  { key: 'mobile', label: '≤640', max: 640 },
  { key: 'mobiles', label: '≤480', max: 480 },
];

// Имя токена: сегменты из латиницы/цифр/дефисов, группы через «/»
// (Figma-стиль: button/bg — группа button). В CSS-переменной «/» → «-».
const NAME_RE = /^[a-zA-Z][\w-]*(?:\/[a-zA-Z][\w-]*)*$/;

export function cssVarName(name) {
  return '--' + name.replace(/\//g, '-');
}

// Hex-цвет с альфой: «#rrggbbaa» ↔ {hex:'#rrggbb', alpha:0–100}. Понимает
// #rgb/#rgba/голый hex; null — если это не hex (rgba(), алиас, пусто).
function splitHexAlpha(v) {
  let s = String(v || '').trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3,4}$/.test(s)) s = s.replace(/(.)/g, '$1$1');
  if (/^[0-9a-fA-F]{6}$/.test(s)) return { hex: '#' + s, alpha: 100 };
  if (/^[0-9a-fA-F]{8}$/.test(s)) {
    return { hex: '#' + s.slice(0, 6), alpha: Math.round((parseInt(s.slice(6), 16) / 255) * 100) };
  }
  return null;
}

function joinHexAlpha(hex, alpha) {
  const a = Math.min(100, Math.max(0, Math.round(alpha)));
  if (a >= 100) return hex;
  return hex + Math.round((a / 100) * 255).toString(16).padStart(2, '0');
}

// ---------------------------------------------------------------------------
// Привязки токенов к полям сайдбара (bindings)
// ---------------------------------------------------------------------------
// Поля цвета/размера Tilda санитизируются И на клиенте, И на сервере
// (проверено: '{{accent-color}}' в text__color превращается в '#aacccc',
// 'var(--accent-color)' сервер вырезает в пустоту) — токен в такое поле
// записать НЕЛЬЗЯ. Поэтому привязка хранится в нашем JSON
// (data.bindings = { recId: { tplField: tokenName } }), а движок генерирует
// override-CSS: #recX [field="text"]{ color: var(--token) !important } —
// работает и в редакторе (th-tokens-live), и на публикации (style в head).
//
// data-tpl-field вида "text__color": префикс = атрибут field элемента в
// канвасе (проверено: .t-text[field="text"]), суффикс = CSS-свойство.
const FIELD_PROP = {
  color: 'color',
  fontsize: 'font-size',
  lineheight: 'line-height',
  letterspacing: 'letter-spacing',
  opacity: 'opacity',
  margintop: 'margin-top',
  marginbottom: 'margin-bottom',
};

// Поля всего блока (data-tpl-field без «prefix__»): в канвасе нет элемента с
// атрибутом field — свойство вешается на сам контейнер #recX (туда же родная
// Тильда пишет inline-style фона записи).
const BLOCK_FIELD_PROP = {
  blockbackground: { suffix: 'color', prop: 'background-color' },
};

// "text__color" → {fieldKey:'text', suffix:'color', prop:'color'}.
// Адаптивные варианты (…_res_480) не поддерживаем — токены сами адаптивные.
function parseTplField(tplField) {
  const b = BLOCK_FIELD_PROP[tplField];
  if (b) return { fieldKey: null, suffix: b.suffix, prop: b.prop, self: true };
  const m = /^([a-z][a-z0-9]*)__([a-z]+)$/.exec(tplField || '');
  if (!m || !FIELD_PROP[m[2]]) return null;
  return { fieldKey: m[1], suffix: m[2], prop: FIELD_PROP[m[2]] };
}

// Какие токены предлагать полю: строго по типу — цветовым только color,
// размерным (включая насыщенность/прозрачность) только number. Без
// fallback'а «показать все»: цвет в поле размера — бессмыслица.
function typeForSuffix(suffix) {
  return suffix === 'color' ? 'color' : 'number';
}

// Токены для выпадашки привязки, сгруппированные по коллекциям (строго по
// типу): [{collection, tokens:[…]}], пустые коллекции опущены.
function tokensForType(data, want) {
  const out = [];
  for (const c of data.collections) {
    const tokens = c.tokens.filter((t) => t.type === want);
    if (tokens.length) out.push({ collection: c.name, tokens });
  }
  return out;
}

// Значение годится для opacity: безразмерное число (иначе браузер выбросит
// декларацию — opacity:40px невалиден).
function isUnitlessNumber(v) {
  return /^-?\d*\.?\d+$/.test(String(v).trim());
}

function tokensForSuffix(data, suffix) {
  const groups = tokensForType(data, typeForSuffix(suffix));
  // Прозрачность принимает только безразмерное число: px-токен дал бы
  // невалидный CSS — такие в выпадашку не пускаем. Фильтр по РАЗРЕШЁННОМУ
  // значению (не по t.unit): у алиаса единица приезжает от целевого токена.
  if (suffix !== 'opacity') return groups;
  return groups
    .map((g) => ({
      collection: g.collection,
      tokens: g.tokens.filter((t) => {
        const r = resolveToken(data, t.name, 0);
        return !r.error && isUnitlessNumber(r.value);
      }),
    }))
    .filter((g) => g.tokens.length);
}

function bindingCss(data) {
  const bindings = data.bindings || {};
  let css = '';
  for (const recId of Object.keys(bindings)) {
    for (const tplField of Object.keys(bindings[recId])) {
      const info = parseTplField(tplField);
      const name = bindings[recId][tplField];
      if (!info || !findToken(data, name)) continue; // токен удалили — правило не генерим
      // Страховка для старых/ручных привязок: px-токен на opacity — не эмитим.
      if (info.suffix === 'opacity') {
        const r = resolveToken(data, name, 0);
        if (r.error || !isUnitlessNumber(r.value)) continue;
      }
      const sel = info.self ? `#rec${recId}` : `#rec${recId} [field="${info.fieldKey}"]`;
      css += `${sel}{${info.prop}:var(${cssVarName(name)}) !important;}\n`;
    }
  }
  return css;
}

// --- Zero-блок: привязки полей элементов ------------------------------------
// data.zeroBindings = { recid: { elemid: { field: tokenName } } }.
// Поля панели Zero (input[name=…]) ↔ CSS-свойства. Элементы несут data-elem-id
// И в редакторе Zero (tilda.ru/zero/), И на опубликованной странице (проверено
// по рантайму tilda-zero-1.0.min.js — там .t396__elem с data-elem-id), поэтому
// селектор по атрибуту работает везде: на публикации внутри #recX, в редакторе
// Zero — внутри .tn-artboard (без обёртки #recX).
// atomOnly: bg/border живут на .tn-atom (у обёртки свой border-radius нет) —
// на обёртку не вешаем, чтобы фон не вылезал за скругления.
// Group's own Auto Layout (панель «Group settings» — группа как flex-контейнер
// своих детей, тот же набор полей, что и у артборда) — атрибуты gap/padding
// вешаются на сам .tn-group/.t396__group (data-elem-id), НЕ на .tn-atom
// (у группы его и нет) — atomOnly:false.
const ZERO_FIELD_PROP = {
  color: { prop: 'color', atomOnly: false, type: 'color' },
  bgcolor: { prop: 'background-color', atomOnly: true, type: 'color' },
  bordercolor: { prop: 'border-color', atomOnly: true, type: 'color' },
  fontsize: { prop: 'font-size', atomOnly: false, type: 'number' },
  lineheight: { prop: 'line-height', atomOnly: false, type: 'number' },
  letterspacing: { prop: 'letter-spacing', atomOnly: false, type: 'number' },
  flexgapx: { prop: 'column-gap', atomOnly: false, type: 'number' },
  flexgapy: { prop: 'row-gap', atomOnly: false, type: 'number' },
  paddinghorizontal: { props: ['padding-left', 'padding-right'], atomOnly: false, type: 'number' },
  paddingvertical: { props: ['padding-top', 'padding-bottom'], atomOnly: false, type: 'number' },
  paddingleft: { prop: 'padding-left', atomOnly: false, type: 'number' },
  paddingright: { prop: 'padding-right', atomOnly: false, type: 'number' },
  paddingtop: { prop: 'padding-top', atomOnly: false, type: 'number' },
  paddingbottom: { prop: 'padding-bottom', atomOnly: false, type: 'number' },
  // Margin панели «Other» (own margin любого элемента внутри flex-родителя,
  // проверено по HTML-разметке .sui-panel__section-other): свойство на сам
  // элемент, та же схема, что у padding (сдвоенные horizontal/vertical +
  // раздельные поля в режиме «Differ»).
  marginhorizontal: { props: ['margin-left', 'margin-right'], atomOnly: false, type: 'number' },
  marginvertical: { props: ['margin-top', 'margin-bottom'], atomOnly: false, type: 'number' },
  marginleft: { prop: 'margin-left', atomOnly: false, type: 'number' },
  marginright: { prop: 'margin-right', atomOnly: false, type: 'number' },
  margintop: { prop: 'margin-top', atomOnly: false, type: 'number' },
  marginbottom: { prop: 'margin-bottom', atomOnly: false, type: 'number' },
  // Border size/radius — тот же .tn-atom, что и bordercolor (border живёт на
  // атоме, не на обёртке — иначе фон/рамка вылезали бы за скругления).
  borderwidth: { prop: 'border-width', atomOnly: true, type: 'number' },
  borderradius: { prop: 'border-radius', atomOnly: true, type: 'number' },
  'borderradius-top-left': { prop: 'border-top-left-radius', atomOnly: true, type: 'number' },
  'borderradius-top-right': { prop: 'border-top-right-radius', atomOnly: true, type: 'number' },
  'borderradius-bottom-left': { prop: 'border-bottom-left-radius', atomOnly: true, type: 'number' },
  'borderradius-bottom-right': { prop: 'border-bottom-right-radius', atomOnly: true, type: 'number' },
};

// Панель настроек артборда (.tn-settings[data-for-artboard]) — псевдо-элемент
// 'artboard' в zeroBindings. Фон артборда: на публикации и в редакторе
// страницы — .t396__artboard внутри #recX; в самом zero-редакторе — голый
// .tn-artboard, который эмитим ТОЛЬКО в live preview zero-редактора этой же
// записи (zeroRecId()===rec), иначе правило красило бы чужие артборды.
const ZERO_ARTBOARD_ELEM = 'artboard';
// Auto Layout (gap/padding): флекс-стили Tilda запекает при публикации в CSS
// на сам артборд (класс t396__artboard-flex; в tilda-zero-1.1.min.js ни gap,
// ни padding JS-ом не выставляются — проверено grep'ом) — override по тому же
// селектору с !important их перебивает. paddinghorizontal/vertical —
// сдвоенные поля панели, разворачиваются в 2 свойства (props);
// поля режима «Differ» (left/right/top/bottom) — по одному.
const ZERO_ARTBOARD_FIELDS = {
  bgcolor: { prop: 'background-color', type: 'color' },
  flexgapx: { prop: 'column-gap', type: 'number' },
  flexgapy: { prop: 'row-gap', type: 'number' },
  paddinghorizontal: { props: ['padding-left', 'padding-right'], type: 'number' },
  paddingvertical: { props: ['padding-top', 'padding-bottom'], type: 'number' },
  paddingleft: { prop: 'padding-left', type: 'number' },
  paddingright: { prop: 'padding-right', type: 'number' },
  paddingtop: { prop: 'padding-top', type: 'number' },
  paddingbottom: { prop: 'padding-bottom', type: 'number' },
};

// info/чтение/запись поля зеро с учётом псевдо-элемента артборда.
function zeroFieldInfo(elemId, field) {
  return elemId === ZERO_ARTBOARD_ELEM ? ZERO_ARTBOARD_FIELDS[field] : ZERO_FIELD_PROP[field];
}

function zeroArtboardInput(field) {
  return document.querySelector(
    '.tn-settings[data-for-artboard] [data-control-field="' + field + '"] input');
}

function zeroBindingCss(data) {
  const zb = data.zeroBindings || {};
  let css = '';
  for (const rec of Object.keys(zb)) {
    for (const elem of Object.keys(zb[rec])) {
      for (const f of Object.keys(zb[rec][elem])) {
        const info = zeroFieldInfo(elem, f);
        const name = zb[rec][elem][f];
        if (!info || !findToken(data, name)) continue; // токен удалили — правило не генерим
        let sels;
        if (elem === ZERO_ARTBOARD_ELEM) {
          sels = [`#rec${rec} .t396__artboard`];
          if (zeroRecId() === rec) sels.push('.tn-artboard');
        } else {
          const el = `[data-elem-id="${elem}"]`;
          sels = [`#rec${rec} ${el} .tn-atom`, `.tn-artboard ${el} .tn-atom`];
          if (!info.atomOnly) sels.unshift(`#rec${rec} ${el}`, `.tn-artboard ${el}`);
        }
        const decls = (info.props || [info.prop])
          .map((p) => `${p}:var(${cssVarName(name)}) !important;`).join('');
        css += `${sels.join(',')}{${decls}}\n`;
      }
    }
  }
  return css;
}

// ---------------------------------------------------------------------------
// Окружение / API
// ---------------------------------------------------------------------------

function getProjectId() {
  return new URLSearchParams(location.search).get('projectid') || String(window.projectid || '');
}

function getCsrf() {
  if (typeof window.csrf === 'string' && window.csrf) return window.csrf;
  const m = document.getElementById('csrf');
  return (m && m.getAttribute('content')) || '';
}

// Ответ getheadcode приходит HTML-encoded (проверено: '<!-- x -->' читается
// как '&lt;!-- x --&gt;') — декодируем через textarea.
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
  const txt = await r.text();
  // На некоторых страницах (замечено на /zero/) Tilda приклеивает к ответу
  // HTML-комментарии вида <!--tlp--> перед полезной нагрузкой — срезаем.
  return txt.replace(/^\s*(?:<!--[\s\S]*?-->\s*)+/, '');
}

async function readHeadCode() {
  const txt = await apiPost('/projects/get/getheadcode/', {
    comm: 'getheadcode',
    projectid: getProjectId(),
  });
  const j = JSON.parse(txt);
  // Ответ без project (ошибка/нет прав/пустой projectid) — не путать
  // с легитимно пустым head-кодом: это провал загрузки, его надо ретраить.
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

// ---------------------------------------------------------------------------
// Модель данных
// ---------------------------------------------------------------------------
// data = { v:1, collections:[{ name, tokens:[
//   { name, type:'color'|'number'|'string', unit:'px'|'%'|'em'|'rem'|'',
//     modes:{ desktop, laptop, tablet, mobile, mobiles } } ] }] }

export function emptyData() {
  return { v: 1, collections: [{ name: 'Tokens', tokens: [] }] };
}

function allTokens(data) {
  const out = [];
  for (const c of data.collections) for (const t of c.tokens) out.push(t);
  return out;
}

function findToken(data, name) {
  for (const c of data.collections)
    for (const t of c.tokens) if (t.name === name) return t;
  return null;
}

// Переименование токена тянет за собой все ссылки на него: алиасы
// $старое-имя в значениях других токенов и привязки полей (bindings).
// Иначе после смены имени (в т.ч. группы: accent → dop/accent) алиасы
// остаются указывать на несуществующий токен и ломаются.
function renameTokenRefs(data, oldName, newName) {
  for (const t of allTokens(data)) {
    for (const k of Object.keys(t.modes)) {
      if (String(t.modes[k]).trim() === '$' + oldName) t.modes[k] = '$' + newName;
    }
  }
  const b = data.bindings || {};
  for (const rec of Object.keys(b))
    for (const f of Object.keys(b[rec]))
      if (b[rec][f] === oldName) b[rec][f] = newName;
  const zb = data.zeroBindings || {};
  for (const rec of Object.keys(zb))
    for (const elem of Object.keys(zb[rec]))
      for (const f of Object.keys(zb[rec][elem]))
        if (zb[rec][elem][f] === oldName) zb[rec][elem][f] = newName;
}

// Первое алиас-значение токена (любой режим) или null.
function firstAliasValue(token) {
  for (const k of Object.keys(token.modes)) {
    const v = String(token.modes[k]).trim();
    if (v[0] === '$') return v;
  }
  return null;
}

// Тип токена-алиаса наследуется от целевого токена (сам тип у алиаса не
// редактируется). Несколько проходов — чтобы тип протёк по цепочке $a→$b→$c.
function syncAliasTypes(data) {
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    for (const t of allTokens(data)) {
      const aliasVal = firstAliasValue(t);
      if (!aliasVal) continue;
      const target = findToken(data, aliasVal.slice(1));
      if (!target || target === t) continue;
      if (t.type !== target.type) { t.type = target.type; changed = true; }
    }
    if (!changed) break;
  }
}

// Сырое значение токена в режиме с каскадным fallback на более широкий режим
// (desktop-first: пустой laptop наследует desktop и т.д.).
function rawValueAt(token, modeIdx) {
  for (let i = modeIdx; i >= 0; i--) {
    const v = token.modes[MODES[i].key];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

// Разрешение алиасов ($имя) с защитой от циклов (Set посещённых имён).
// Возвращает { value, error } — error: null | 'cycle' | 'missing' | 'empty'.
export function resolveToken(data, name, modeIdx, visited) {
  visited = visited || new Set();
  if (visited.has(name)) return { value: '', error: 'cycle' };
  visited.add(name);
  const token = findToken(data, name);
  if (!token) return { value: '', error: 'missing' };
  const raw = rawValueAt(token, modeIdx);
  if (raw === '') return { value: '', error: 'empty' };
  if (raw[0] === '$') return resolveToken(data, raw.slice(1), modeIdx, visited);
  // Единица измерения — часть значения токена типа number (если её ещё нет).
  if (token.type === 'number' && token.unit && /^-?\d*\.?\d+$/.test(raw)) {
    return { value: raw + (token.unit === 'unitless' ? '' : token.unit), error: null };
  }
  // Голый hex у color-токена («1F2123» без #) — дописываем # сами, иначе
  // значение невалидно как CSS-цвет (свотч, var(), пикер).
  if (token.type === 'color' && /^[0-9a-fA-F]{3}(?:[0-9a-fA-F]{1}|[0-9a-fA-F]{3}|[0-9a-fA-F]{5})?$/.test(raw)) {
    return { value: '#' + raw, error: null };
  }
  return { value: raw, error: null };
}

// Карта разрешённых значений всех токенов по всем режимам:
// { desktop:{name:value}, laptop:{…}, … } — только валидные.
export function resolveAll(data) {
  const out = {};
  for (let i = 0; i < MODES.length; i++) {
    const m = {};
    for (const t of allTokens(data)) {
      const r = resolveToken(data, t.name, i);
      if (!r.error) m[t.name] = r.value;
    }
    out[MODES[i].key] = m;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Генерация CSS (desktop-first)
// ---------------------------------------------------------------------------

// Значение безопасно для вставки в CSS-декларацию. Несбалансированная
// скобка или «;»/«}» в значении (легко словить в string-токене) ломает
// CSS-парсер, и браузер выбрасывает ВСЁ от этого места до конца <style> —
// проверено вживую: «[хуй» в string-токене убил и медиа-блок ≤480, и все
// binding-правила после него. Такие значения в CSS не эмитим (текстовая
// замена {{…}} через runtime при этом работает — она идёт из JSON).
function cssSafeValue(v) {
  if (/[;{}!<>]/.test(v)) return false;
  let round = 0, square = 0, dq = 0, sq = 0;
  for (const ch of v) {
    if (ch === '(') round++;
    else if (ch === ')') round--;
    else if (ch === '[') square++;
    else if (ch === ']') square--;
    else if (ch === '"') dq++;
    else if (ch === "'") sq++;
    if (round < 0 || square < 0) return false;
  }
  // Непарная кавычка (bad-string) роняет CSS-парсер так же, как скобка.
  return round === 0 && square === 0 && dq % 2 === 0 && sq % 2 === 0;
}

export function generateCss(resolved, data) {
  let css = '';
  const base = resolved.desktop;
  const baseLines = Object.keys(base)
    .filter((n) => cssSafeValue(base[n]))
    .map((n) => `${cssVarName(n)}:${base[n]};`);
  if (baseLines.length) css += `:root{${baseLines.join('')}}\n`;
  let prev = base;
  for (let i = 1; i < MODES.length; i++) {
    const cur = resolved[MODES[i].key];
    const lines = [];
    for (const n of Object.keys(cur)) {
      if (cur[n] !== prev[n] && cssSafeValue(cur[n])) lines.push(`${cssVarName(n)}:${cur[n]};`);
    }
    if (lines.length) css += `@media (max-width:${MODES[i].max}px){:root{${lines.join('')}}}\n`;
    prev = { ...prev, ...cur };
  }
  if (data) css += bindingCss(data) + zeroBindingCss(data);
  return css;
}

// ---------------------------------------------------------------------------
// Сборка блока для head-кода
// ---------------------------------------------------------------------------

// Runtime опубликованной страницы: CSS-переменные уже в <style> (без FOUC),
// JS нужен только для текстовой замены {{token}} в DOM (тексты/ссылки) и
// подмены {{token}} в inline-style на var(). Пересчитывается при смене
// брейкпоинта и при динамической подгрузке блоков (MutationObserver).
const RUNTIME_SRC = `(function(){
var el=document.getElementById('${DATA_ID}');if(!el)return;
var data;try{data=JSON.parse(el.textContent)}catch(e){return}
var R=data.resolved||{};var RE=/\\{\\{([a-zA-Z][\\w-]*(?:\\/[a-zA-Z][\\w-]*)*)\\}\\}/g;
function mode(){var w=window.innerWidth;return w<=480?'mobiles':w<=640?'mobile':w<=980?'tablet':w<=1200?'laptop':'desktop'}
var texts=[];
function sub(s,map){return s.replace(RE,function(_,n){return map[n]!=null?map[n]:_})}
function walk(root){
  var map=R[mode()]||{};
  var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null);
  var n;while((n=w.nextNode())){
    if(n.__tt)continue;
    if(RE.test(n.nodeValue)){RE.lastIndex=0;n.__tt=1;texts.push({n:n,orig:n.nodeValue});n.nodeValue=sub(n.nodeValue,map)}
    RE.lastIndex=0;
  }
  var els=(root.querySelectorAll?root:document).querySelectorAll('[style*="{{"]');
  for(var i=0;i<els.length;i++){var st=els[i].getAttribute('style');
    els[i].setAttribute('style',st.replace(RE,function(_,x){return 'var(--'+x.replace(/\\//g,'-')+')'}))}
}
function refresh(){var map=R[mode()]||{};for(var i=0;i<texts.length;i++){var t=texts[i];
  if(t.n.isConnected===false)continue;t.n.nodeValue=sub(t.orig,map)}}
var lastMode=mode();
window.addEventListener('resize',function(){var m=mode();if(m!==lastMode){lastMode=m;refresh()}});
function start(){walk(document.body);
  new MutationObserver(function(ms){for(var i=0;i<ms.length;i++)for(var j=0;j<ms[i].addedNodes.length;j++){
    var nd=ms[i].addedNodes[j];if(nd.nodeType===1)walk(nd)}}).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();`;

// JSON внутрь <script> — экранируем ВСЕ '<'/'>' юникодом (</>):
// '</script>' в значении токена преждевременно закрыл бы тег, '<!--' увёл бы
// HTML-парсер в script-escaped-состояние, а '<!--/TildaTokens-->' в значении
// сломал бы extractBlock (маркер конца блока нашёлся бы ВНУТРИ данных).
// JSON.parse читает \u-эскейпы без потерь.
function safeJsonForScript(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

export function buildHeadBlock(data) {
  const resolved = resolveAll(data);
  const payload = { ...data, resolved };
  return (
    BLOCK_START +
    '\n<script type="application/json" id="' + DATA_ID + '">' +
    safeJsonForScript(payload) +
    '</scr' + 'ipt>\n' +
    '<style id="' + CSS_ID + '">\n' + generateCss(resolved, data) + '</style>\n' +
    '<scr' + 'ipt>' + RUNTIME_SRC + '</scr' + 'ipt>\n' +
    BLOCK_END
  );
}

function extractBlock(headcode) {
  const s = headcode.indexOf(BLOCK_START);
  if (s === -1) return null;
  const e = headcode.indexOf(BLOCK_END, s);
  if (e === -1) return null;
  return { start: s, end: e + BLOCK_END.length, text: headcode.slice(s, e + BLOCK_END.length) };
}

export function parseTokensFromHead(headcode) {
  const block = extractBlock(headcode);
  if (!block) return null;
  const m = block.text.match(
    new RegExp('<script type="application/json" id="' + DATA_ID + '">([\\s\\S]*?)</script>')
  );
  if (!m) return null;
  try {
    const parsed = JSON.parse(m[1]);
    delete parsed.resolved;
    return parsed;
  } catch (e) {
    return null;
  }
}

// Вырезать ВСЕ блоки TildaTokens (после сбоя/ручной правки их может оказаться
// несколько — «лишние» продолжали бы применять устаревший CSS вечно).
function stripAllBlocks(headcode) {
  let out = headcode;
  let block;
  while ((block = extractBlock(out))) {
    out = out.slice(0, block.start) + out.slice(block.end);
  }
  return out;
}

function replaceBlockInHead(headcode, newBlock) {
  const block = extractBlock(headcode);
  if (!block) return headcode + (headcode.trim() ? '\n' : '') + newBlock;
  const rest = stripAllBlocks(headcode);
  // Новый блок — на месте ПЕРВОГО старого (сохраняем позицию в head-коде).
  return rest.slice(0, block.start) + newBlock + rest.slice(block.start);
}

// Нет ни одного токена и ни одной привязки — блоку в head делать нечего.
function dataIsEmpty(data) {
  if (data.collections.some((c) => c.tokens.length)) return false;
  const hasEntries = (obj) => obj && Object.keys(obj).some((k) => Object.keys(obj[k]).length);
  return !hasEntries(data.bindings) && !hasEntries(data.zeroBindings);
}

// Единая точка сборки нового head: пустые данные → блок ВЫРЕЗАЕТСЯ целиком
// (не оставляем «скелет» из пустого JSON и рантайма), иначе — перезаписывается.
function headWithData(headcode, data) {
  if (dataIsEmpty(data)) {
    const out = stripAllBlocks(headcode);
    return out.trim() ? out.replace(/\n{3,}/g, '\n\n') : '';
  }
  return replaceBlockInHead(headcode, buildHeadBlock(data));
}

// ---------------------------------------------------------------------------
// Состояние
// ---------------------------------------------------------------------------

const state = {
  data: null,          // сохранённые токены (последнее известное серверное состояние)
  serverHead: null,    // headcode целиком на момент последней загрузки
  draft: null,         // рабочая копия в открытой модалке
  selectedCollection: 0,
  loaded: false,
  loadError: null,
  liveCssApplied: '',
};

// Загрузка токенов при старте. window.projectid Тильда выставляет СВОИМИ
// скриптами и может опоздать к нашему document_idle — без ожидания первый
// getheadcode уходил с пустым projectid, молча падал, и до открытия модалки
// (она перечитывает сервер сама) привязки «◆» и live preview были пустыми.
export async function initTokens() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let attempt = 0; attempt < 40; attempt++) {
    if (!getProjectId()) { await sleep(700); continue; }
    try {
      state.serverHead = await readHeadCode();
      state.data = parseTokensFromHead(state.serverHead) || emptyData();
      state.loaded = true;
      state.loadError = null;
      return;
    } catch (e) {
      state.loadError = e.message;
      await sleep(1500);
    }
  }
}

// ---------------------------------------------------------------------------
// Live preview в редакторе (вызывается из tick)
// ---------------------------------------------------------------------------

// Режим превью — по ширине КАНВАСА, а не окна браузера: в мобильном
// предпросмотре редактора узким становится только канвас, окно остаётся
// широким, и @media из generateCss не срабатывали («на мобилке цвет не
// поменялся»). Поэтому th-tokens-live кладёт ПЛОСКИЙ :root со значениями
// текущего режима канваса, без media-каскада (каскад остаётся только в head
// для публикации). Граница desktop — СТРОГО <1200: артборд Zero в
// desktop-режиме сам шириной 1200 и иначе засчитывался бы как laptop.
function editorCanvasMode() {
  const canvas = document.querySelector('.tn-artboard') || document.getElementById('allrecords');
  const w = (canvas && canvas.clientWidth) || window.innerWidth;
  return w <= 480 ? 'mobiles' : w <= 640 ? 'mobile' : w <= 980 ? 'tablet' : w < 1200 ? 'laptop' : 'desktop';
}

export function applyTokensLivePreview() {
  const data = state.draft || state.data;
  if (!data) return;
  const resolved = resolveAll(data);
  const vars = resolved[editorCanvasMode()] || {};
  // cssSafeValue обязателен и тут: небезопасное значение сломало бы весь
  // th-tokens-live (включая binding-правила ниже) точно так же, как в head.
  const lines = Object.keys(vars)
    .filter((n) => cssSafeValue(vars[n]))
    .map((n) => cssVarName(n) + ':' + vars[n] + ';');
  const css = (lines.length ? ':root{' + lines.join('') + '}\n' : '') +
    bindingCss(data) + zeroBindingCss(data);
  let styleEl = document.getElementById('th-tokens-live');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'th-tokens-live';
    (document.head || document.documentElement).appendChild(styleEl);
  }
  if (state.liveCssApplied !== css) {
    styleEl.textContent = css;
    state.liveCssApplied = css;
  }
  // Контент канваса в редакторе НЕ трогаем. Раньше здесь подменялись
  // {{token}} в текстовых узлах и inline-style — но Tilda сохраняет блок из
  // DOM, и подставленное значение при первом же сохранении блока НАВСЕГДА
  // затирало {{token}} в данных. Теперь {{token}} в редакторе виден как есть,
  // а подставляет его только runtime на опубликованном сайте.
}

// ---------------------------------------------------------------------------
// UI: чип привязки токена под полями сайдбара
// ---------------------------------------------------------------------------

// Сохранение привязки: свежий head с сервера → правка bindings в СВЕЖИХ
// данных (не затираем конкурентные правки токенов) → запись → обновление
// локального состояния и live preview.
async function saveBinding(recId, tplField, tokenName) {
  const fresh = await readHeadCode();
  const data = parseTokensFromHead(fresh) || state.data || emptyData();
  data.bindings = data.bindings || {};
  if (tokenName) {
    (data.bindings[recId] = data.bindings[recId] || {})[tplField] = tokenName;
  } else if (data.bindings[recId]) {
    delete data.bindings[recId][tplField];
    if (!Object.keys(data.bindings[recId]).length) delete data.bindings[recId];
  }
  const newHead = headWithData(fresh, data);
  if (newHead.length > HEAD_BUDGET) throw new Error('head-код превысит лимит Tilda');
  await writeHeadCode(newHead);
  state.serverHead = newHead;
  state.data = data;
  applyTokensLivePreview();
}

// --- работа с родным (скрытым) контролом привязанного поля -----------------
// Пока поле привязано, его родной инпут скрыт, но живёт в DOM и хранит
// значение из данных блока. Если человек БЕЗ расширения впишет туда своё —
// визуально оно перебивается binding-CSS, но остаётся в данных и «выстрелит»
// при отвязке. Поэтому: детектим расхождение (⚠ на чипе + разрешение в
// выпадашке), а при отвязке «запекаем» значение токена в родное поле.

function nativeFieldInput(group) {
  return group && group.querySelector('.pe-input__wrapper input, .pe-color input');
}

function readNativeValue(group) {
  const i = nativeFieldInput(group);
  return i ? i.value.trim() : null;
}

// Пишем как «руками»: нативный сеттер + input/change/blur, чтобы Tilda
// сохранила поле своим обычным путём.
function writeNativeInput(i, v) {
  if (!i) return false;
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(i, v);
  i.dispatchEvent(new Event('input', { bubbles: true }));
  i.dispatchEvent(new Event('change', { bubbles: true }));
  i.dispatchEvent(new Event('blur', { bubbles: true }));
  return true;
}

function writeNativeValue(group, v) {
  return writeNativeInput(nativeFieldInput(group), v);
}

// Значение токена в формате родного поля: цвет — hex как есть,
// числовое поле — голое число без единицы (родные поля хранят число).
function nativeFormat(tokenVal, suffix) {
  if (suffix === 'color') return tokenVal;
  const n = parseFloat(tokenVal);
  return isNaN(n) ? tokenVal : String(n);
}

// Совпадает ли ручное значение поля со значением токена (с точностью до
// формата: #fff==#ffffff, "12"=="12px").
function valuesMatch(nativeVal, tokenVal, suffix) {
  if (suffix === 'color') {
    const norm = (v) => {
      v = String(v).trim().toLowerCase().replace(/^#/, '');
      if (/^[0-9a-f]{3}$/.test(v)) v = v.replace(/(.)/g, '$1$1');
      return v;
    };
    return norm(nativeVal) === norm(tokenVal);
  }
  const a = parseFloat(nativeVal), b = parseFloat(tokenVal);
  if (!isNaN(a) && !isNaN(b)) return a === b;
  return String(nativeVal).trim() === String(tokenVal).trim();
}

// Ручное значение под привязкой, если оно расходится с токеном (иначе null).
function bindingDrift(group, boundName, suffix) {
  if (!state.data) return null;
  const nat = readNativeValue(group);
  if (!nat) return null;
  const r = resolveToken(state.data, boundName, 0);
  if (r.error) return null;
  return valuesMatch(nat, r.value, suffix) ? null : nat;
}

// «Принять ручное значение»: пишем его desktop-значением токена (в свежие
// серверные данные, тем же путём, что saveBinding).
async function saveTokenDesktopValue(name, value) {
  const fresh = await readHeadCode();
  const data = parseTokensFromHead(fresh) || state.data || emptyData();
  const t = findToken(data, name);
  if (!t) throw new Error('токен «' + name + '» не найден');
  t.modes.desktop = value;
  const newHead = headWithData(fresh, data);
  if (newHead.length > HEAD_BUDGET) throw new Error('head-код превысит лимит Tilda');
  await writeHeadCode(newHead);
  state.serverHead = newHead;
  state.data = data;
  applyTokensLivePreview();
}

// ---------------------------------------------------------------------------
// UI: чипы привязки в панели редактора Zero-блока (tilda.ru/zero/)
// ---------------------------------------------------------------------------
// Панель настроек выделенного элемента: .tn-settings[data-for-elem-id="…"] —
// атрибут сам говорит, чей она элемент. Контролы — input[name=<field>].
// Текущее значение поля надёжнее читать с самого элемента канваса:
// .tn-elem[data-elem-id] несёт data-field-<field>-value (проверено разведкой).

function zeroRecId() {
  return new URLSearchParams(location.search).get('recordid') || '';
}

// Группа (Object N в дереве слоёв, панель «Group settings» с собственным
// Auto Layout) в канвасе — .tn-group[data-elem-id], НЕ .tn-elem (проверено:
// в tilda-zero-1.1.min.js группа получает класс t396__group/tn-group,
// отдельный от t396__elem/tn-elem) — ищем в обоих.
function zeroCanvasEl(elemId) {
  return document.querySelector(
    '.tn-elem[data-elem-id="' + elemId + '"], .tn-group[data-elem-id="' + elemId + '"]');
}

function zeroElemFieldValue(elemId, field) {
  const el = zeroCanvasEl(elemId);
  const v = el && el.getAttribute('data-field-' + field + '-value');
  return v == null ? null : v.trim();
}

// Записать значение поля элемента Zero через внутренний сеттер редактора.
// Синтетические input/change/blur на инпуте панели зеро ИГНОРИРУЕТ (значение
// откатывается из его state) — единственный рабочий путь это
// elem__setFieldValue(elem, field, value, 'render', 'updateui'): обновляет
// данные, канвас и панель (им же пользуются родные контролы, проверено на
// elem__selected__lineheightChange). У группы, возможно, свой сеттер
// (group__setFieldValue) — пробуем оба, есть хотя бы один — не критично:
// override-CSS красит канвас независимо, это лишь «запекание» в родное поле.
function zeroWriteFieldValue(elemId, field, value) {
  const el = zeroCanvasEl(elemId);
  if (!el) return false;
  const setter = typeof window.elem__setFieldValue === 'function' ? window.elem__setFieldValue
    : typeof window.group__setFieldValue === 'function' ? window.group__setFieldValue
    : null;
  if (!setter) return false;
  setter(el, field, value, 'render', 'updateui');
  return true;
}

// Чтение/запись с учётом артборда: у него нет .tn-elem — значение живёт в
// инпуте панели (tcolors — обычный контрол, синтетические события понимает).
function zeroReadValue(elemId, field) {
  if (elemId === ZERO_ARTBOARD_ELEM) {
    const inp = zeroArtboardInput(field);
    return inp ? inp.value.trim() : null;
  }
  return zeroElemFieldValue(elemId, field);
}

function zeroWriteValue(elemId, field, value) {
  if (elemId === ZERO_ARTBOARD_ELEM) return writeNativeInput(zeroArtboardInput(field), value);
  return zeroWriteFieldValue(elemId, field, value);
}

function zeroDrift(elemId, field, boundName) {
  if (!state.data) return null;
  const nat = zeroReadValue(elemId, field);
  if (!nat) return null;
  const r = resolveToken(state.data, boundName, 0);
  if (r.error) return null;
  const suffix = zeroFieldInfo(elemId, field).type === 'color' ? 'color' : 'number';
  return valuesMatch(nat, r.value, suffix) ? null : nat;
}

async function saveZeroBinding(recId, elemId, field, tokenName) {
  const fresh = await readHeadCode();
  const data = parseTokensFromHead(fresh) || state.data || emptyData();
  const zb = (data.zeroBindings = data.zeroBindings || {});
  if (tokenName) {
    const rec = (zb[recId] = zb[recId] || {});
    (rec[elemId] = rec[elemId] || {})[field] = tokenName;
  } else if (zb[recId] && zb[recId][elemId]) {
    delete zb[recId][elemId][field];
    if (!Object.keys(zb[recId][elemId]).length) delete zb[recId][elemId];
    if (!Object.keys(zb[recId]).length) delete zb[recId];
  }
  const newHead = headWithData(fresh, data);
  if (newHead.length > HEAD_BUDGET) throw new Error('head-код превысит лимит Tilda');
  await writeHeadCode(newHead);
  state.serverHead = newHead;
  state.data = data;
  applyTokensLivePreview();
}

function openZeroBindDropdown(chip, recId, elemId, field) {
  closeBindDropdown();
  const data = state.data || emptyData();
  const info = zeroFieldInfo(elemId, field);
  const groups = tokensForType(data, info.type);
  const dd = h('div');
  dd.id = 'th-tk-bind-dd';
  dd._thChip = chip;

  if (!groups.length) {
    dd.appendChild(h('div', 'th-tk-dd-empty',
      'Нет токенов типа «' + info.type + '» — создайте их в Design Tokens в редакторе страницы'));
  }
  const resolved = resolveAll(data);
  const zb = data.zeroBindings || {};
  const cur = (zb[recId] && zb[recId][elemId] && zb[recId][elemId][field]) || null;
  const suffix = info.type === 'color' ? 'color' : 'number';

  // Конфликт: под привязкой лежит ручное значение (правка без расширения).
  const drift = cur ? zeroDrift(elemId, field, cur) : null;
  if (drift) {
    const box = h('div', 'th-tk-dd-conflict');
    box.appendChild(h('div', 'th-tk-dd-conflict-text',
      '⚠ В поле вручную вписано «' + drift + '» — сейчас оно скрыто токеном.'));
    const accept = h('div', 'th-tk-dd-item', '↳ Записать «' + drift + '» в токен (Desktop)');
    accept.addEventListener('click', async () => {
      closeBindDropdown();
      const v = suffix === 'color' && !drift.startsWith('#') ? '#' + drift : drift;
      try { await saveTokenDesktopValue(cur, v); }
      catch (e) { alert('Tilda Tokens: не удалось обновить токен — ' + e.message); }
    });
    const wipe = h('div', 'th-tk-dd-item', '✕ Затереть ручное значение (оставить токен)');
    wipe.addEventListener('click', () => {
      closeBindDropdown();
      const r = resolveToken(data, cur, 0);
      if (!r.error) zeroWriteValue(elemId, field, nativeFormat(r.value, suffix));
    });
    box.appendChild(accept);
    box.appendChild(wipe);
    dd.appendChild(box);
  }

  for (const grp of groups) {
    dd.appendChild(h('div', 'th-tk-dd-group', grp.collection));
    for (const t of grp.tokens) {
      const item = h('div', 'th-tk-dd-item' + (t.name === cur ? ' th-tk-dd-cur' : ''));
      const val = resolved.desktop[t.name] || '';
      if (t.type === 'color' && val) {
        const sw = h('span', 'th-tk-dd-swatch');
        sw.style.background = val;
        item.appendChild(sw);
      }
      item.appendChild(h('span', 'th-tk-dd-name', t.name));
      item.appendChild(h('span', 'th-tk-dd-val', val));
      item.addEventListener('click', async () => {
        closeBindDropdown();
        chip.classList.add('th-tk-chip-busy');
        try {
          await saveZeroBinding(recId, elemId, field, t.name);
          // Сразу затираем ручное значение значением токена — иначе каждый
          // раз вылезал бы конфликт «в поле вручную вписано …».
          const r = resolveToken(state.data || data, t.name, 0);
          if (!r.error) zeroWriteValue(elemId, field, nativeFormat(r.value, suffix));
        }
        catch (e) { alert('Tilda Tokens: не удалось сохранить привязку — ' + e.message); }
        chip.classList.remove('th-tk-chip-busy');
      });
      dd.appendChild(item);
    }
  }
  if (cur) {
    const rm = h('div', 'th-tk-dd-item th-tk-dd-remove', '× Отвязать токен');
    rm.addEventListener('click', async () => {
      closeBindDropdown();
      // «Запечь» значение токена в родное поле до снятия привязки.
      const r = resolveToken(data, cur, 0);
      if (!r.error) zeroWriteValue(elemId, field, nativeFormat(r.value, suffix));
      try { await saveZeroBinding(recId, elemId, field, null); }
      catch (e) { alert('Tilda Tokens: не удалось снять привязку — ' + e.message); }
    });
    dd.appendChild(rm);
  }
  document.body.appendChild(dd);
  positionBindDropdown(dd, chip);
  document.addEventListener('mousedown', onBindOutside, true);
  document.addEventListener('scroll', onBindScroll, true);
  window.addEventListener('resize', onBindScroll);
}

// ---------------------------------------------------------------------------
// Дубли и копипаст блоков: привязки хранятся по recId, копия получает новый
// recId — токены «слетали». Два пути переноса:
//  1. ТОЧНЫЙ — monkeypatch родных tp__dublicateRecord / tp__record__bufCopy /
//     tp__record__bufPaste. Страничный редактор — классические скрипты,
//     внутренние вызовы идут через глобальные биндинги (проверено живьём:
//     подмена window.tp__record__getRecordElement перехватывает вызов из
//     tp__dublicateRecord), поэтому патч на window ловит и клики родного UI.
//     Источник известен точно, переносятся И bindings, И zeroBindings.
//  2. ЗАПАСНОЙ (тик) — появился #rec…, которого не было; если внутри те же
//     data-elem-id, что у привязанных элементов другого блока (при дубле
//     Tilda сохраняет elem-id копии — проверено живьём), это копия zero-блока,
//     переносим zeroBindings. Ловит пути мимо хуков (мультиселект и т.п.).
// ---------------------------------------------------------------------------

// Перенос привязок блока srcId на его копию newId: свежий head → правка →
// запись. Идемпотентно: если у копии уже есть свои записи — не трогаем.
async function adoptRecBindings(srcId, newId) {
  const fresh = await readHeadCode();
  const data = parseTokensFromHead(fresh) || state.data || emptyData();
  const b = data.bindings || {};
  const zb = data.zeroBindings || {};
  let changed = false;
  if (b[srcId] && !b[newId]) {
    (data.bindings = b)[newId] = JSON.parse(JSON.stringify(b[srcId]));
    changed = true;
  }
  if (zb[srcId] && !zb[newId]) {
    (data.zeroBindings = zb)[newId] = JSON.parse(JSON.stringify(zb[srcId]));
    changed = true;
  }
  if (!changed) return;
  const newHead = headWithData(fresh, data);
  if (newHead.length > HEAD_BUDGET) throw new Error('head-код превысит лимит Tilda');
  await writeHeadCode(newHead);
  state.serverHead = newHead;
  state.data = data;
  applyTokensLivePreview();
}

// --- Путь 1: хуки на родные функции копирования ------------------------------

// Источник Ctrl+C переживает переход на другую страницу: привязки в head общие
// на весь проект, вставка скопированного блока на другой странице тоже должна
// унести токены. Поэтому localStorage, а не переменная.
const bufSrcKey = () => 'th-tk-bufsrc-' + getProjectId();

function currentRecIdSet() {
  const s = new Set();
  for (const el of document.querySelectorAll('.r.t-rec[id^="rec"]')) s.add(el.id.slice(3));
  return s;
}

// Tilda вставляет копию в DOM ПОЗЖЕ резолва своего промиса (вставка внутри
// then не await'ится) — копию ждём поллингом по диффу recId'ов.
function adoptWhenCopyAppears(srcId, before) {
  if (!srcId) return;
  let tries = 0;
  const iv = setInterval(() => {
    if (++tries > 40) { clearInterval(iv); return; }
    for (const id of currentRecIdSet()) {
      if (before.has(id)) continue;
      clearInterval(iv);
      knownRecIds && knownRecIds.add(id); // тику-фолбэку тут делать нечего
      adoptRecBindings(String(srcId), id).catch((e) =>
        console.warn('[Tilda Helper] токены: не удалось перенести привязки на копию блока', e));
      return;
    }
  }, 300);
}

export function ensureBlockCopyHooksPatched() {
  if (window.__thTokensCopyHooks) return;
  const dup = window.tp__dublicateRecord;
  const bufCopy = window.tp__record__bufCopy;
  const bufPaste = window.tp__record__bufPaste;
  // Скрипты Tilda могли ещё не доехать — ретрай на следующем тике.
  if (typeof dup !== 'function' || typeof bufCopy !== 'function' || typeof bufPaste !== 'function') return;
  window.__thTokensCopyHooks = true;

  window.tp__dublicateRecord = function (recid) {
    const before = currentRecIdSet();
    const r = dup.apply(this, arguments);
    Promise.resolve(r).then(() => adoptWhenCopyAppears(recid, before)).catch(() => {});
    return r;
  };
  window.tp__record__bufCopy = function (recid) {
    // Мультиселект-копию (несколько блоков) не сопоставить с одним источником —
    // источник сбрасываем, чтобы не перенести привязки на чужой блок.
    try {
      const multi = window.tp_multiselect && typeof window.tp_multiselect.copyRecords === 'function';
      if (recid && !multi) localStorage.setItem(bufSrcKey(), String(recid));
      else localStorage.removeItem(bufSrcKey());
    } catch (e) { /* приватный режим — просто без переноса при вставке */ }
    return bufCopy.apply(this, arguments);
  };
  window.tp__record__bufPaste = function () {
    const before = currentRecIdSet();
    const r = bufPaste.apply(this, arguments);
    let src = null;
    try { src = localStorage.getItem(bufSrcKey()); } catch (e) { /* ignore */ }
    if (src) Promise.resolve(r).then(() => adoptWhenCopyAppears(src, before)).catch(() => {});
    return r;
  };
}

// --- Путь 2: тик-фолбэк по elem-id (только zero-блоки) -----------------------

let knownRecIds = null; // null до первого тика с загруженными токенами

export function adoptDuplicatedZeroBindings() {
  if (!state.data) return;
  const cur = currentRecIdSet();
  // Первый тик — только снимок: всё, что уже на странице, не «новое».
  if (knownRecIds === null) { knownRecIds = cur; return; }
  for (const id of cur) {
    if (knownRecIds.has(id)) continue;
    knownRecIds.add(id);
    const src = findZeroBindingsSource(id);
    if (src) {
      adoptRecBindings(src, id).catch((e) => {
        // Ретрай на следующем тике: пусть блок снова считается «новым».
        knownRecIds && knownRecIds.delete(id);
        console.warn('[Tilda Helper] токены: не удалось перенести привязки на копию блока', e);
      });
    }
  }
}

function findZeroBindingsSource(newId) {
  const zb = state.data && state.data.zeroBindings;
  if (!zb || zb[newId]) return null;
  const rec = document.getElementById('rec' + newId);
  if (!rec) return null;
  const elemIds = new Set(
    Array.from(rec.querySelectorAll('[data-elem-id]'), (e) => e.getAttribute('data-elem-id')));
  if (!elemIds.size) return null;
  for (const r of Object.keys(zb)) {
    // Привязка только на артборд не даёт elem-id для опознания копии.
    const bound = Object.keys(zb[r]).filter((k) => k !== ZERO_ARTBOARD_ELEM);
    if (bound.length && bound.every((e) => elemIds.has(e))) return r;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Дубли элементов ВНУТРИ zero-редактора: elem__duplicate / elem__paste создают
// элементы с НОВЫМИ elem-id, старые лежат в localStorage-буфере
// tn_store_buffer__duplicate / tn_store_buffer__copy-paste (кладёт elem__copy).
// Зеро-редактор собран бандлом — внутренние вызовы НЕ идут через window
// (monkeypatch не перехватывает, проверено живьём), поэтому копии ловим на
// тике: новые data-elem-id сопоставляются с элементами буфера ПО ПОРЯДКУ
// (порядок вставки = порядок обхода дерева буфера, проверено живьём), с
// проверкой типа и значений полей на каждом индексе. Не совпало — молча
// пропускаем (хуже перенести привязку не на тот элемент, чем не перенести).
// ---------------------------------------------------------------------------

let knownElemIds = null;

function flattenBufferElems(nodes, out) {
  for (const n of nodes || []) {
    if (n.type === 'group') flattenBufferElems(n.children || [], out);
    else out.push(n);
  }
  return out;
}

// Сопоставление буфера с новыми элементами канваса по порядку: тип элемента
// и короткие поля (цвет/размеры) обязаны совпасть на каждом индексе.
// Несколько Cmd+V подряд попадают в ОДИН тик — тогда свежих элементов k×N
// (буфер вставлен k раз, батчи идут подряд), сверяем почанково.
function bufferMatchesFresh(buf, freshEls) {
  const nodes = flattenBufferElems(buf && buf.data, []);
  if (!nodes.length || freshEls.length % nodes.length !== 0) return null;
  const pairs = [];
  for (let i = 0; i < freshEls.length; i++) {
    const p = nodes[i % nodes.length].props || {};
    const el = freshEls[i];
    const domType = el.getAttribute('data-elem-type');
    if (p.elem_type && domType && String(p.elem_type) !== domType) return null;
    for (const f of ['color', 'fontsize', 'bgcolor', 'bordercolor', 'lineheight']) {
      const dom = el.getAttribute('data-field-' + f + '-value');
      if (p[f] != null && dom != null && String(p[f]).trim() !== dom.trim()) return null;
    }
    pairs.push({
      oldId: String(nodes[i % nodes.length].id),
      newId: el.getAttribute('data-elem-id'),
    });
  }
  return pairs;
}

// Привязки источника ищем по всем блокам: элемент могли скопировать в другом
// zero-блоке (буфер общий), а вставить сюда.
function findZeroElemFields(elemId) {
  const zb = (state.data && state.data.zeroBindings) || {};
  const rec = zeroRecId();
  if (rec && zb[rec] && zb[rec][elemId]) return zb[rec][elemId];
  for (const r of Object.keys(zb)) if (zb[r][elemId]) return zb[r][elemId];
  return null;
}

export function adoptDuplicatedZeroElems() {
  if (!state.data) return;
  const recId = zeroRecId();
  if (!recId || !document.querySelector('.tn-artboard')) return;
  // :not(.tn-elem__fake) — служебная обёртка мультивыделения Tilda тоже
  // .tn-elem[data-elem-id]; посчитав её «свежей», ломали бы сопоставление.
  const els = Array.from(
    document.querySelectorAll('.tn-artboard .tn-elem[data-elem-id]:not(.tn-elem__fake)'));
  const cur = new Set(els.map((e) => e.getAttribute('data-elem-id')));
  if (knownElemIds === null) { knownElemIds = cur; return; }
  const freshEls = els.filter((e) => !knownElemIds.has(e.getAttribute('data-elem-id')));
  const prevWasEmpty = knownElemIds.size === 0;
  knownElemIds = cur;
  // Пустой прошлый снимок = первичный рендер канваса (он приходит разом,
  // позже initTokens): всё «свежее» — это просто отрисовка, не вставка.
  // Жертвуем экзотикой «вставка в совсем пустой артборд» ради того, чтобы
  // Cmd+V сразу после открытия редактора (частый случай: скопировал в одном
  // блоке, открыл другой, вставил) не проваливался в прогревочное окно.
  if (prevWasEmpty || !freshEls.length) return;
  // Кандидат-источник — любой из двух буферов; оба подошли — берём свежайший.
  let best = null;
  for (const mode of ['duplicate', 'copy-paste']) {
    let buf = null;
    try { buf = JSON.parse(localStorage.getItem('tn_store_buffer__' + mode)); } catch (e) { /* ignore */ }
    const pairs = buf && bufferMatchesFresh(buf, freshEls);
    if (pairs && (!best || (buf.timestamp || 0) > best.ts)) best = { pairs, ts: buf.timestamp || 0 };
  }
  if (!best) return;
  const adoptions = best.pairs
    .map((p) => ({ oldId: p.oldId, newId: p.newId, fields: findZeroElemFields(p.oldId) }))
    .filter((p) => p.fields && p.newId);
  if (adoptions.length) adoptZeroElemBindings(recId, adoptions);
}

async function adoptZeroElemBindings(recId, adoptions) {
  try {
    const fresh = await readHeadCode();
    const data = parseTokensFromHead(fresh) || state.data || emptyData();
    const zb = (data.zeroBindings = data.zeroBindings || {});
    const rec = (zb[recId] = zb[recId] || {});
    let changed = false;
    for (const a of adoptions) {
      if (rec[a.newId]) continue;
      rec[a.newId] = JSON.parse(JSON.stringify(a.fields));
      changed = true;
    }
    if (!changed) return;
    const newHead = headWithData(fresh, data);
    if (newHead.length > HEAD_BUDGET) throw new Error('head-код превысит лимит Tilda');
    await writeHeadCode(newHead);
    state.serverHead = newHead;
    state.data = data;
    applyTokensLivePreview();
  } catch (e) {
    console.warn('[Tilda Helper] токены: не удалось перенести привязки на копию элемента', e);
  }
}

// Тик для /zero/: чипы «◆» у поддерживаемых полей панели выделенного элемента
// и панели настроек артборда (Artboard Settings → Bg color).
export function updateZeroTokenBindings() {
  const recId = zeroRecId();
  if (!recId) return;
  const panel = document.querySelector('.tn-settings[data-for-elem-id]');
  if (panel) {
    zeroPanelChips(panel, recId, panel.getAttribute('data-for-elem-id'), Object.keys(ZERO_FIELD_PROP));
  }
  const abPanel = document.querySelector('.tn-settings[data-for-artboard]');
  if (abPanel) {
    zeroPanelChips(abPanel, recId, ZERO_ARTBOARD_ELEM, Object.keys(ZERO_ARTBOARD_FIELDS));
  }
}

function zeroPanelChips(panel, recId, elemId, fields) {
  injectBindStyles();
  for (const field of fields) {
    const inp = panel.querySelector('input[name="' + field + '"]');
    if (!inp) continue;
    const host = inp.closest('td') || inp.parentElement;
    if (!host) continue;
    let chip = host.querySelector('.th-tk-chip');
    if (!chip) {
      chip = h('button', 'th-tk-chip');
      chip.type = 'button';
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openZeroBindDropdown(chip, chip.dataset.recId, chip.dataset.elemId, chip.dataset.field);
      });
      host.appendChild(chip);
    }
    // Панель одна и переиспользуется для разных элементов — dataset обновляем
    // каждый тик, чтобы клик всегда бил в актуальный элемент.
    chip.dataset.recId = recId;
    chip.dataset.elemId = elemId;
    chip.dataset.field = field;

    const zb = state.data && state.data.zeroBindings;
    const bound = (zb && zb[recId] && zb[recId][elemId] && zb[recId][elemId][field]) || null;
    const drift = bound ? zeroDrift(elemId, field, bound) : null;
    const label = bound ? (drift ? '⚠ ◆ {{' + bound + '}}' : '◆ {{' + bound + '}}') : '◆ токен';
    if (chip.textContent !== label) chip.textContent = label;
    chip.classList.toggle('th-tk-chip-bound', !!bound);
    chip.classList.toggle('th-tk-chip-drift', !!drift);
    chip.title = drift
      ? 'В поле вручную вписано «' + drift + '» (скрыто токеном) — кликните, чтобы разрешить конфликт'
      : 'Привязать дизайн-токен к этому полю (Tilda Helper)';

    // Пока токен привязан — родной контрол прячем (значение в нём всё равно
    // перебивается binding-CSS и только путает).
    for (const child of host.children) {
      if (child === chip) continue;
      child.classList.toggle('th-tk-native-hidden', !!bound);
    }
  }
}

function closeBindDropdown() {
  const dd = document.getElementById('th-tk-bind-dd');
  if (dd) dd.remove();
  document.removeEventListener('mousedown', onBindOutside, true);
  document.removeEventListener('scroll', onBindScroll, true);
  window.removeEventListener('resize', onBindScroll);
}

function onBindOutside(e) {
  const dd = document.getElementById('th-tk-bind-dd');
  if (dd && !dd.contains(e.target)) closeBindDropdown();
}

// Позиция дропдауна у чипа: вниз, а если снизу не влезает — вверх; max-height
// подрезаем под свободное место, чтобы список скроллился, а не уезжал за экран.
function positionBindDropdown(dd, chip) {
  const rect = chip.getBoundingClientRect();
  if (!chip.isConnected || rect.bottom < 0 || rect.top > window.innerHeight) {
    closeBindDropdown();
    return;
  }
  dd.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - 330)) + 'px';
  const below = window.innerHeight - rect.bottom - 12;
  const above = rect.top - 12;
  if (below >= 160 || below >= above) {
    dd.style.top = rect.bottom + 4 + 'px';
    dd.style.bottom = 'auto';
    dd.style.maxHeight = Math.min(300, Math.max(80, below)) + 'px';
  } else {
    dd.style.top = 'auto';
    dd.style.bottom = window.innerHeight - rect.top + 4 + 'px';
    dd.style.maxHeight = Math.min(300, Math.max(80, above)) + 'px';
  }
}

// Скролл страницы/сайдбара — репозиционируем (position:fixed сам не следует
// за прокруткой). Скролл ВНУТРИ дропдауна игнорируем — иначе список
// закрывался бы в момент собственной прокрутки.
function onBindScroll(e) {
  const dd = document.getElementById('th-tk-bind-dd');
  if (!dd) { closeBindDropdown(); return; }
  if (e && e.target instanceof Node && dd.contains(e.target)) return;
  if (!dd._thChip) { closeBindDropdown(); return; }
  positionBindDropdown(dd, dd._thChip);
}

function openBindDropdown(chip, recId, tplField, info) {
  closeBindDropdown();
  const data = state.data || emptyData();
  const groups = tokensForSuffix(data, info.suffix);
  const dd = h('div');
  dd.id = 'th-tk-bind-dd';
  dd._thChip = chip;

  if (!groups.length) {
    dd.appendChild(h('div', 'th-tk-dd-empty',
      info.suffix === 'opacity'
        ? 'Нет number-токенов с единицей «unitless» (прозрачность принимает только безразмерное число, например 0.5) — создайте в Design Tokens (ромбик в шапке)'
        : 'Нет токенов типа «' + typeForSuffix(info.suffix) + '» — создайте в Design Tokens (ромбик в шапке)'));
  }
  const resolved = resolveAll(data);
  const cur = (data.bindings && data.bindings[recId] && data.bindings[recId][tplField]) || null;

  // Конфликт: под привязкой лежит ручное значение (правка без расширения).
  const fieldGroup = chip.closest('[data-tpl-field]');
  const drift = cur ? bindingDrift(fieldGroup, cur, info.suffix) : null;
  if (drift) {
    const box = h('div', 'th-tk-dd-conflict');
    box.appendChild(h('div', 'th-tk-dd-conflict-text',
      '⚠ В поле вручную вписано «' + drift + '» — сейчас оно скрыто токеном.'));
    const accept = h('div', 'th-tk-dd-item', '↳ Записать «' + drift + '» в токен (Desktop)');
    accept.addEventListener('click', async () => {
      closeBindDropdown();
      const v = info.suffix === 'color' && !drift.startsWith('#') ? '#' + drift : drift;
      try { await saveTokenDesktopValue(cur, v); }
      catch (e) { alert('Tilda Tokens: не удалось обновить токен — ' + e.message); }
    });
    const wipe = h('div', 'th-tk-dd-item', '✕ Затереть ручное значение (оставить токен)');
    wipe.addEventListener('click', () => {
      closeBindDropdown();
      const r = resolveToken(data, cur, 0);
      if (!r.error) writeNativeValue(fieldGroup, nativeFormat(r.value, info.suffix));
    });
    box.appendChild(accept);
    box.appendChild(wipe);
    dd.appendChild(box);
  }
  for (const grp of groups) {
    dd.appendChild(h('div', 'th-tk-dd-group', grp.collection));
    for (const t of grp.tokens) {
      const item = h('div', 'th-tk-dd-item' + (t.name === cur ? ' th-tk-dd-cur' : ''));
      const val = resolved.desktop[t.name] || '';
      if (t.type === 'color' && val) {
        const sw = h('span', 'th-tk-dd-swatch');
        sw.style.background = val;
        item.appendChild(sw);
      }
      item.appendChild(h('span', 'th-tk-dd-name', t.name));
      item.appendChild(h('span', 'th-tk-dd-val', val));
      item.addEventListener('click', async () => {
        closeBindDropdown();
        chip.classList.add('th-tk-chip-busy');
        try {
          await saveBinding(recId, tplField, t.name);
          // Сразу затираем ручное значение значением токена — иначе каждый
          // раз вылезал бы конфликт «в поле вручную вписано …».
          const r = resolveToken(state.data || data, t.name, 0);
          if (!r.error) writeNativeValue(fieldGroup, nativeFormat(r.value, info.suffix));
        }
        catch (e) { alert('Tilda Tokens: не удалось сохранить привязку — ' + e.message); }
        chip.classList.remove('th-tk-chip-busy');
      });
      dd.appendChild(item);
    }
  }
  if (cur) {
    const rm = h('div', 'th-tk-dd-item th-tk-dd-remove', '× Отвязать токен');
    rm.addEventListener('click', async () => {
      closeBindDropdown();
      // «Запечь» текущее значение токена в родное поле ДО снятия привязки —
      // иначе наружу вылезет то, что лежало под override-CSS (в т.ч. чужая
      // ручная правка), и вид блока «прыгнет».
      const r = resolveToken(data, cur, 0);
      if (!r.error) writeNativeValue(fieldGroup, nativeFormat(r.value, info.suffix));
      try { await saveBinding(recId, tplField, null); }
      catch (e) { alert('Tilda Tokens: не удалось снять привязку — ' + e.message); }
    });
    dd.appendChild(rm);
  }
  document.body.appendChild(dd);
  positionBindDropdown(dd, chip);
  document.addEventListener('mousedown', onBindOutside, true);
  document.addEventListener('scroll', onBindScroll, true);
  window.addEventListener('resize', onBindScroll);
}

// На каждом тике: под поддерживаемыми полями (data-tpl-field вида
// prefix__suffix из FIELD_PROP, внутри формы с data-rec-id) держим чип
// «◆ …» — привязку токена к полю.
export function updateTokenBindings() {
  injectBindStyles();
  const groups = document.querySelectorAll('.pe-form-group[data-tpl-field]');
  for (const g of groups) {
    const info = parseTplField(g.dataset.tplField);
    if (!info) continue;
    const form = g.closest('[data-rec-id]');
    if (!form) continue;
    const recId = form.getAttribute('data-rec-id');

    // Чип живёт ВНУТРИ обёртки контрола (.pe-input__wrapper / .pe-color), а не
    // в конце .pe-form-group: в попапах типографики группа — flex-строка, и
    // чип-хвост вылезал за край панели («поехало»). Внутри обёртки (block) он
    // встаёт под инпутом, в колонке контрола.
    const host = g.querySelector(':scope > .pe-input__wrapper, :scope > .pe-color') || g;
    let chip = g.querySelector('.th-tk-chip');
    if (!chip) {
      chip = h('button', 'th-tk-chip');
      chip.type = 'button';
      chip.title = 'Привязать дизайн-токен к этому полю (Tilda Helper)';
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openBindDropdown(chip, chip.dataset.recId, g.dataset.tplField, info);
      });
      host.appendChild(chip);
    }
    chip.dataset.recId = recId;

    const bound = (state.data && state.data.bindings && state.data.bindings[recId] &&
      state.data.bindings[recId][g.dataset.tplField]) || null;
    const drift = bound ? bindingDrift(g, bound, info.suffix) : null;
    const label = bound ? (drift ? '⚠ ◆ {{' + bound + '}}' : '◆ {{' + bound + '}}') : '◆ токен';
    if (chip.textContent !== label) chip.textContent = label;
    chip.classList.toggle('th-tk-chip-bound', !!bound);
    chip.classList.toggle('th-tk-chip-drift', !!drift);
    chip.title = drift
      ? 'В поле вручную вписано «' + drift + '» (скрыто токеном) — кликните, чтобы разрешить конфликт'
      : 'Привязать дизайн-токен к этому полю (Tilda Helper)';

    // Пока токен привязан — родной контрол поля прячем целиком (значение,
    // вписанное в него, всё равно перебивается binding-CSS и только путает).
    // Лейбл и чип остаются; отвязка возвращает контрол на место.
    const hideScope = host === g ? g.children : host.children;
    for (const child of hideScope) {
      if (child === chip || child.classList.contains('pe-label')) continue;
      child.classList.toggle('th-tk-native-hidden', !!bound);
    }
  }
}

function injectBindStyles() {
  if (document.getElementById('th-tokens-bind-css')) return;
  const st = document.createElement('style');
  st.id = 'th-tokens-bind-css';
  st.textContent = `
.th-tk-chip {
  display: inline-flex; align-items: center; margin-top: 4px;
  border: 1px dashed #c9c9c9; background: none; border-radius: 6px;
  padding: 4px 6px; font-size: 10.5px; color: #999; cursor: pointer;
  font-family: inherit; line-height: 1.5; white-space: nowrap;
  /* Узкие панели (мобильный вид редактора): чип не должен вылезать за край. */
  max-width: 100%; overflow: hidden; text-overflow: ellipsis; display: inline-block;
}
/* Привязанный токен замещает родной контрол поля (тот скрыт). */
.th-tk-native-hidden { display: none !important; }
.th-tk-chip:hover { border-color: #FA8669; color: #FA8669; }
.th-tk-chip-bound {
  border: 1px solid #e4d5ff; background: #f5efff; color: #7b3ff2; font-weight: 600;
}
.th-tk-chip-bound:hover { border-color: #7b3ff2; color: #7b3ff2; }
.th-tk-chip-busy { opacity: .4; pointer-events: none; }
.th-tk-chip-drift, .th-tk-chip-drift:hover {
  border: 1px solid #f0d48a; background: #fff7e0; color: #8a6100;
}
#th-tk-bind-dd .th-tk-dd-conflict {
  margin: 2px 2px 6px; padding: 6px; border-radius: 8px;
  background: #fff7e0; border: 1px solid #f0e2b0;
}
#th-tk-bind-dd .th-tk-dd-conflict-text {
  padding: 4px 8px 6px; font-size: 11.5px; color: #8a6100; line-height: 1.4;
}
#th-tk-bind-dd .th-tk-dd-conflict .th-tk-dd-item { font-size: 12px; }
#th-tk-bind-dd .th-tk-dd-conflict .th-tk-dd-item:hover { background: #fdeec4; }
#th-tk-bind-dd {
  position: fixed; z-index: 2147483001; min-width: 220px; max-width: 320px;
  max-height: 300px; overflow-y: auto; background: #fff; border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0,0,0,.22); padding: 6px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
}
#th-tk-bind-dd .th-tk-dd-item {
  display: flex; align-items: center; gap: 8px; padding: 7px 10px;
  border-radius: 7px; cursor: pointer; font-size: 12.5px;
}
#th-tk-bind-dd .th-tk-dd-item:hover { background: #f5f5f5; }
#th-tk-bind-dd .th-tk-dd-cur { background: #f5efff; }
#th-tk-bind-dd .th-tk-dd-swatch {
  width: 14px; height: 14px; border-radius: 4px; flex-shrink: 0;
  border: 1px solid rgba(0,0,0,.15);
}
#th-tk-bind-dd .th-tk-dd-name { flex: 1; font-weight: 500; overflow: hidden; text-overflow: ellipsis; }
#th-tk-bind-dd .th-tk-dd-val { color: #aaa; font-size: 11px; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#th-tk-bind-dd .th-tk-dd-remove { color: #e0442b; }
#th-tk-bind-dd .th-tk-dd-empty { padding: 10px; font-size: 12px; color: #999; }
#th-tk-bind-dd .th-tk-dd-group {
  padding: 8px 10px 3px; font-size: 10px; text-transform: uppercase;
  letter-spacing: .5px; color: #b3b3b3;
}
`;
  (document.head || document.documentElement).appendChild(st);
}

// ---------------------------------------------------------------------------
// UI: кнопка в верхней панели
// ---------------------------------------------------------------------------

export function injectTokensButton() {
  const navbar = document.querySelector('.tp-menu__navbar');
  if (!navbar || navbar.querySelector('.th-tokens-btn')) return;
  const li = document.createElement('li');
  li.className = 'tp-menu__navbar__item';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 't-button tp-menu__navbar__button th-tokens-btn';
  btn.title = 'Design Tokens';
  btn.setAttribute('aria-label', 'Design Tokens');
  btn.innerHTML =
    '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M9 1.5L16 5.5V12.5L9 16.5L2 12.5V5.5L9 1.5Z" stroke="black" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<circle cx="9" cy="9" r="2.2" stroke="black" stroke-width="1.6"/></svg>';
  btn.addEventListener('click', openTokenManager);
  li.appendChild(btn);
  navbar.insertBefore(li, navbar.firstChild);
}

// ---------------------------------------------------------------------------
// UI: модалка Token Manager
// ---------------------------------------------------------------------------

const MODAL_ID = 'th-tokens-modal';
let statusTimer = null;

// Родная тильдовская иконка «удалить» (вытащена из CSS .tp-record-ui__icon_delete).
const TRASH_SVG =
  '<svg width="11" height="13" fill="none" xmlns="http://www.w3.org/2000/svg">' +
  '<path fill-rule="evenodd" clip-rule="evenodd" d="M1 4h9v9H1V4Zm2 2.038V11h1V6.038H3Zm2 0V11h1V6.038H5Zm2 0V11h1V6.038H7ZM0 1h11v2H0V1Zm4-1h3v1H4V0Z" fill="#000"/></svg>';

// Иконки типов токена для селекта.
const TYPE_ICONS = {
  color: '<svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="none" stroke="#000" stroke-width="1.4"/><circle cx="6" cy="6" r="2.4" fill="#000"/></svg>',
  number: '<span class="th-tk-type-glyph">#</span>',
  string: '<span class="th-tk-type-glyph">T</span>',
};

function h(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text != null) el.textContent = text;
  return el;
}

export async function openTokenManager() {
  if (document.getElementById(MODAL_ID)) return;

  // Свежее чтение с сервера: и для конкурентных правок, и на случай, если
  // initTokens не успел/упал.
  let freshHead = null;
  try { freshHead = await readHeadCode(); } catch (e) { /* оффлайн — работаем с кэшем */ }
  let conflictNote = '';
  if (freshHead != null) {
    const freshData = parseTokensFromHead(freshHead);
    const cachedJson = JSON.stringify(state.data || emptyData());
    if (state.loaded && freshData && JSON.stringify(freshData) !== cachedJson) {
      conflictNote = 'Токены на сервере изменились с момента загрузки редактора (другой дизайнер?). Показана серверная версия.';
    }
    state.serverHead = freshHead;
    state.data = parseTokensFromHead(freshHead) || state.data || emptyData();
    state.loaded = true;
  } else if (!state.loaded) {
    alert('Tilda Tokens: не удалось загрузить head-код сайта' + (state.loadError ? ' (' + state.loadError + ')' : ''));
    return;
  }

  state.draft = JSON.parse(JSON.stringify(state.data));
  if (!state.draft.collections.length) state.draft.collections.push({ name: 'Tokens', tokens: [] });
  state.selectedCollection = 0;

  buildModal(conflictNote);
}

function closeModal() {
  // Несохранённые правки с ошибкой валидации автосейв отбрасывает — молча
  // закрыть значит потерять их. Спрашиваем.
  if (saveTimer && state.draft) {
    const err = draftHasErrors();
    if (err && !confirm('Не сохранено: ' + err + '.\n\nЗакрыть без сохранения этих правок?')) return;
  }
  const m = document.getElementById(MODAL_ID);
  if (m) m.remove();
  closeTypeDropdown();
  closeAliasDropdown();
  if (saveTimer) autosave(); // дожать несохранённые правки (снимок берётся синхронно)
  state.draft = null;
  applyTokensLivePreview(); // вернуть превью к сохранённому состоянию
}

function buildModal(conflictNote) {
  injectModalStyles();
  const overlay = h('div');
  overlay.id = MODAL_ID;

  // Не отдавать хоткеи редактору Tilda (и другим фичам), пока модалка открыта.
  for (const ev of ['keydown', 'keyup', 'keypress']) {
    overlay.addEventListener(ev, (e) => {
      if (ev === 'keydown' && e.key === 'Escape') { closeModal(); return; }
      e.stopPropagation();
    });
  }
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) closeModal(); });

  const panel = h('div', 'th-tk-panel');
  overlay.appendChild(panel);

  // --- шапка
  const header = h('div', 'th-tk-header');
  header.appendChild(h('div', 'th-tk-title', 'Design Tokens'));
  const headBtns = h('div', 'th-tk-header-btns');
  headBtns.appendChild(h('span', 'th-tk-savestat', ''));
  const closeBtn = h('button', 'th-tk-close', '×');
  closeBtn.addEventListener('click', closeModal);
  headBtns.appendChild(closeBtn);
  header.appendChild(headBtns);
  panel.appendChild(header);

  if (conflictNote) {
    panel.appendChild(h('div', 'th-tk-conflict', '⚠ ' + conflictNote));
  }

  // --- корпус: сайдбар коллекций + таблица
  const body = h('div', 'th-tk-body');
  body.appendChild(h('div', 'th-tk-sidebar'));
  body.appendChild(h('div', 'th-tk-main'));
  panel.appendChild(body);

  document.body.appendChild(overlay);
  renderSidebar();
  renderTable();
}

function setStatus(text, kind) {
  const el = document.querySelector('#' + MODAL_ID + ' .th-tk-savestat');
  if (!el) return;
  el.textContent = text || '';
  el.className = 'th-tk-savestat' + (kind ? ' th-tk-status-' + kind : '');
  clearTimeout(statusTimer);
  if (text && kind === 'ok') statusTimer = setTimeout(() => { el.textContent = ''; }, 3000);
}

let previewTimer = null;
function schedulePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(applyTokensLivePreview, 200);
}

// ---------------------------------------------------------------------------
// Автосохранение: любая правка в модалке → дебаунс 800мс → запись в head.
// Кнопки «Сохранить» нет; статус живёт в шапке модалки (.th-tk-savestat).
// ---------------------------------------------------------------------------

let saveTimer = null;
let saveSeq = 0; // отбрасываем результат сейва, если после него стартовал более новый
let saveBusy = false;   // записи строго по одной: две в полёте могут доехать
let saveQueued = false; // до сервера в обратном порядке (последний выиграл бы не тот)

function markDirty() {
  if (state.draft) syncAliasTypes(state.draft);
  schedulePreview();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(autosave, 800);
  setStatus('…');
}

async function autosave() {
  clearTimeout(saveTimer);
  saveTimer = null;
  if (!state.draft) return;
  if (saveBusy) { saveQueued = true; return; } // дождаться текущей записи
  const err = draftHasErrors();
  if (err) { setStatus('⚠ ' + err, 'error'); return; }
  // Снимок синхронно — draft может обнулиться (закрытие модалки), пока ждём сеть.
  const snapshot = JSON.parse(JSON.stringify(state.draft));
  const seq = ++saveSeq;
  saveBusy = true;
  setStatus('Сохраняю…');
  try {
    // Свежий head с сервера — не затираем чужие правки остального head-кода.
    const fresh = await readHeadCode();
    if (seq !== saveSeq) return;
    const newHead = headWithData(fresh, snapshot);
    if (newHead.length > HEAD_BUDGET) {
      setStatus('head-код превысит лимит Tilda (~64КБ) — уменьшите число токенов', 'error');
      return;
    }
    await writeHeadCode(newHead);
    if (seq !== saveSeq) return;
    state.serverHead = newHead;
    state.data = snapshot;
    setStatus('Сохранено ✓', 'ok');
  } catch (e) {
    setStatus('Ошибка сохранения: ' + e.message, 'error');
  } finally {
    saveBusy = false;
    if (saveQueued) { saveQueued = false; autosave(); } // правки, пришедшие во время записи
  }
}

function renderSidebar() {
  const sb = document.querySelector('#' + MODAL_ID + ' .th-tk-sidebar');
  if (!sb) return;
  sb.textContent = '';
  sb.appendChild(h('div', 'th-tk-sb-caption', 'Коллекции'));
  state.draft.collections.forEach((col, i) => {
    const row = h('div', 'th-tk-sb-item' + (i === state.selectedCollection ? ' th-tk-sb-active' : ''));
    const label = h('span', 'th-tk-sb-name', col.name);
    label.title = 'Двойной клик — переименовать';
    row.appendChild(label);
    row.appendChild(h('span', 'th-tk-sb-count', String(col.tokens.length)));
    if (state.draft.collections.length > 1) {
      const del = h('button', 'th-tk-sb-del', '×');
      del.title = 'Удалить коллекцию';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!confirm('Удалить коллекцию «' + col.name + '» вместе с её токенами (' + col.tokens.length + ')?\n\n' +
          'Алиасы и привязки полей на эти токены станут broken, {{…}} в текстах перестанут подставляться.')) return;
        state.draft.collections.splice(i, 1);
        if (state.selectedCollection >= state.draft.collections.length) state.selectedCollection = 0;
        renderSidebar(); renderTable(); markDirty();
      });
      row.appendChild(del);
    }
    row.addEventListener('click', () => { state.selectedCollection = i; renderSidebar(); renderTable(); });
    label.addEventListener('dblclick', () => {
      const name = prompt('Название коллекции:', col.name);
      if (name && name.trim()) { col.name = name.trim(); renderSidebar(); markDirty(); }
    });
    sb.appendChild(row);
  });
  const add = h('button', 'th-tk-sb-add', '+ Коллекция');
  add.addEventListener('click', () => {
    state.draft.collections.push({ name: 'Collection ' + (state.draft.collections.length + 1), tokens: [] });
    state.selectedCollection = state.draft.collections.length - 1;
    renderSidebar(); renderTable(); markDirty();
  });
  sb.appendChild(add);
}

// Валидация имени: формат + уникальность во ВСЁМ проекте токенов.
function nameError(name, self) {
  if (!name) return 'Пустое имя';
  if (!NAME_RE.test(name)) return 'Имя: латиница/цифры/дефис, группы через «/» (button/bg)';
  for (const c of state.draft.collections)
    for (const t of c.tokens) {
      if (t === self) continue;
      if (t.name === name) return 'Имя «' + name + '» уже занято (коллекция «' + c.name + '»)';
      // «/» в CSS-переменной превращается в «-» — button/bg и button-bg
      // столкнулись бы в одной var(--button-bg).
      if (cssVarName(t.name) === cssVarName(name))
        return 'Конфликт CSS-переменной с токеном «' + t.name + '» («/» и «-» дают одно имя)';
    }
  return null;
}

function renderTable() {
  const main = document.querySelector('#' + MODAL_ID + ' .th-tk-main');
  if (!main) return;
  main.textContent = '';
  const col = state.draft.collections[state.selectedCollection];
  if (!col) return;

  const table = h('div', 'th-tk-table');
  const headRow = h('div', 'th-tk-row th-tk-row-head');
  headRow.appendChild(h('div', 'th-tk-cell th-tk-cell-name', 'Имя'));
  headRow.appendChild(h('div', 'th-tk-cell th-tk-cell-type', 'Тип'));
  for (const m of MODES) headRow.appendChild(h('div', 'th-tk-cell', m.label));
  headRow.appendChild(h('div', 'th-tk-cell th-tk-cell-del', ''));
  table.appendChild(headRow);

  // Группировка Figma-стиля: часть имени до последнего «/» — путь группы.
  // Токены одной группы собираются вместе, даже если в массиве они не соседи
  // (иначе заголовок группы дублировался на каждую «полосу»). Негруппированные
  // всегда сверху — иначе они визуально «прилипают» к предыдущей группе.
  // Порядок групп — по первому появлению, внутри группы — порядок пользователя.
  const groupOrder = [];
  const byGroup = new Map();
  col.tokens.forEach((token, ti) => {
    const path = token.name.includes('/') ? token.name.split('/').slice(0, -1).join('/') : '';
    if (!byGroup.has(path)) { byGroup.set(path, []); groupOrder.push(path); }
    byGroup.get(path).push({ token, ti });
  });
  groupOrder.sort((a, b) => (a === '' ? -1 : b === '' ? 1 : 0));
  for (const path of groupOrder) {
    if (path) table.appendChild(h('div', 'th-tk-group-row', path));
    for (const { token, ti } of byGroup.get(path)) table.appendChild(buildTokenRow(col, token, ti, path));
  }

  const addRow = h('button', 'th-tk-add-token', '+ Новый токен');
  addRow.addEventListener('click', () => {
    let n = 1;
    while (findToken(state.draft, 'token-' + n)) n++;
    const name = 'token-' + n;
    col.tokens.push({ name, type: 'number', unit: 'px', modes: {} });
    renderTable(); renderSidebar(); markDirty();
    // Фокус — именно на строку нового токена: негруппированные рисуются
    // ВВЕРХУ таблицы, «последняя строка» была бы чужой.
    const inp = main.querySelector('.th-tk-name-input[data-token="' + name + '"]');
    if (inp) { inp.scrollIntoView({ block: 'nearest' }); inp.focus(); inp.select(); }
  });

  main.appendChild(table);
  main.appendChild(addRow);
}

// Enter в текстовом поле = «готово»: снимаем фокус (blur коммитит значение
// и возвращает короткое отображение имени). Формы нет — сам Enter иначе
// ничего не делает.
function blurOnEnter(inp) {
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
  });
}

// Перетаскиваемый индекс (в col.tokens текущей коллекции) во время drag&drop.
let dragTi = null;

function buildTokenRow(col, token, ti, groupPath) {
  const row = h('div', 'th-tk-row' + (groupPath ? ' th-tk-row-grouped' : ''));

  // Drag&drop порядка: ручка «⠿» слева от имени, drop — выше/ниже строки по
  // положению курсора. Порядок правится в плоском col.tokens; визуальная
  // группировка пересобирается сама (группы идут по первому появлению).
  row.addEventListener('dragover', (e) => {
    if (dragTi === null || dragTi === ti) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const below = e.clientY > row.getBoundingClientRect().top + row.offsetHeight / 2;
    row.classList.toggle('th-tk-drop-above', !below);
    row.classList.toggle('th-tk-drop-below', below);
  });
  row.addEventListener('dragleave', () => {
    row.classList.remove('th-tk-drop-above', 'th-tk-drop-below');
  });
  row.addEventListener('drop', (e) => {
    if (dragTi === null || dragTi === ti) return;
    e.preventDefault();
    const below = e.clientY > row.getBoundingClientRect().top + row.offsetHeight / 2;
    let to = ti + (below ? 1 : 0);
    if (dragTi < to) to--;
    const [moved] = col.tokens.splice(dragTi, 1);
    col.tokens.splice(to, 0, moved);
    dragTi = null;
    renderTable(); markDirty();
  });

  // Имя. В группе показываем короткое имя (без префикса группы) — иерархию
  // даёт заголовок + отступ; полное имя подставляется на время фокуса,
  // чтобы группу можно было отредактировать прямо в поле.
  const shortName = () =>
    groupPath && token.name.startsWith(groupPath + '/') ? token.name.slice(groupPath.length + 1) : token.name;
  const nameCell = h('div', 'th-tk-cell th-tk-cell-name');
  const drag = h('span', 'th-tk-drag', '⠿');
  drag.title = 'Перетащить — изменить порядок';
  drag.draggable = true;
  drag.addEventListener('dragstart', (e) => {
    dragTi = ti;
    e.dataTransfer.effectAllowed = 'move';
    // Кастомный текст не нужен, но Firefox без setData drag не стартует.
    e.dataTransfer.setData('text/plain', token.name);
    row.classList.add('th-tk-dragging');
  });
  drag.addEventListener('dragend', () => {
    dragTi = null;
    row.classList.remove('th-tk-dragging');
    document.querySelectorAll('.th-tk-drop-above, .th-tk-drop-below')
      .forEach((el) => el.classList.remove('th-tk-drop-above', 'th-tk-drop-below'));
  });
  nameCell.appendChild(drag);
  const nameInp = h('input', 'th-tk-input th-tk-name-input');
  nameInp.value = shortName();
  nameInp.spellcheck = false;
  nameInp.title = token.name;
  nameInp.dataset.token = token.name;
  blurOnEnter(nameInp);
  let nameOnFocus = token.name;
  nameInp.addEventListener('focus', () => { nameOnFocus = token.name; nameInp.value = token.name; });
  nameInp.addEventListener('input', () => {
    const err = nameError(nameInp.value.trim(), token);
    nameInp.classList.toggle('th-tk-invalid', !!err);
    if (!err) {
      const prev = token.name;
      token.name = nameInp.value.trim();
      if (prev !== token.name) renameTokenRefs(state.draft, prev, token.name);
      markDirty(); refreshRowValidity(row, token);
    }
    // title после коммита — иначе показывал бы прежнее имя.
    nameInp.title = err || token.name;
  });
  // Фокус ушёл: если имя реально поменялось — перегруппировать таблицу;
  // иначе просто вернуть короткое отображение (без перестройки DOM, чтобы
  // не глотать клик, ради которого фокус и ушёл).
  nameInp.addEventListener('blur', () => {
    // token.name хранит последнее ВАЛИДНОЕ имя — невалидный хвост в инпуте
    // просто откатывается к нему при перерисовке. Полную перестройку таблицы
    // (она глотает клик, ради которого ушёл фокус) делаем ТОЛЬКО если
    // сменилась группа — иначе достаточно обновить текст в самом инпуте.
    const path = (n) => (n.includes('/') ? n.split('/').slice(0, -1).join('/') : '');
    if (token.name !== nameOnFocus && path(token.name) !== path(nameOnFocus)) {
      renderTable(); renderSidebar(); return;
    }
    nameInp.classList.remove('th-tk-invalid');
    nameInp.value = shortName();
    nameInp.title = token.name;
  });
  nameCell.appendChild(nameInp);
  row.appendChild(nameCell);

  // Тип — кастомный дропдаун с иконками (<option> нативного селекта не умеет
  // иконки), + единица для number.
  const typeCell = h('div', 'th-tk-cell th-tk-cell-type');
  const typeBtn = h('button', 'th-tk-select th-tk-type-btn');
  typeBtn.type = 'button';
  const unitSel = h('select', 'th-tk-select th-tk-unit');
  // Токен-алиас наследует тип целевого токена (syncAliasTypes) — руками
  // тип не меняется, селект единиц тоже прячем (единица уже в значении цели).
  const aliasLocked = () => !!firstAliasValue(token);
  const renderTypeBtn = () => {
    const locked = aliasLocked();
    typeBtn.innerHTML =
      '<span class="th-tk-type-icon">' + TYPE_ICONS[token.type] + '</span>' +
      '<span class="th-tk-type-label">' + token.type + '</span>' +
      (locked ? '' : '<span class="th-tk-type-caret">▾</span>');
    typeBtn.classList.toggle('th-tk-type-locked', locked);
    typeBtn.tabIndex = locked ? -1 : 0;
    typeBtn.title = locked ? 'Тип наследуется от токена, на который ссылается алиас' : '';
    unitSel.style.display = token.type === 'number' && !locked ? '' : 'none';
  };
  typeBtn.__thUpdateDecor = renderTypeBtn;
  typeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeTypeDropdown();
    if (aliasLocked()) return;
    const dd = h('div');
    dd.id = 'th-tk-type-dd';
    const rect = typeBtn.getBoundingClientRect();
    dd.style.left = rect.left + 'px';
    dd.style.top = rect.bottom + 4 + 'px';
    dd.style.minWidth = rect.width + 'px';
    for (const t of ['color', 'number', 'string']) {
      const item = h('div', 'th-tk-dd-item' + (token.type === t ? ' th-tk-dd-cur' : ''));
      item.innerHTML = '<span class="th-tk-type-icon">' + TYPE_ICONS[t] + '</span>' +
        '<span class="th-tk-dd-name">' + t + '</span>';
      item.addEventListener('click', () => {
        closeTypeDropdown();
        token.type = t;
        if (t === 'number' && !token.unit) token.unit = 'px';
        markDirty(); renderTable(); // markDirty до рендера — типы алиасов успевают синхронизироваться
      });
      dd.appendChild(item);
    }
    document.body.appendChild(dd);
    document.addEventListener('mousedown', onTypeOutside, true);
    document.addEventListener('scroll', closeTypeDropdown, true);
  });
  for (const u of ['px', '%', 'em', 'rem', 'unitless']) {
    const o = h('option', null, u); o.value = u;
    if ((token.unit || 'px') === u) o.selected = true;
    unitSel.appendChild(o);
  }
  unitSel.addEventListener('change', () => { token.unit = unitSel.value; markDirty(); });
  renderTypeBtn();
  typeCell.appendChild(typeBtn);
  typeCell.appendChild(unitSel);
  row.appendChild(typeCell);

  // Значения по режимам
  MODES.forEach((mode, mi) => {
    const cell = h('div', 'th-tk-cell');
    const wrap = h('div', 'th-tk-value-wrap');
    const inp = h('input', 'th-tk-input th-tk-value-input');
    inp.value = token.modes[mode.key] || '';
    inp.spellcheck = false;
    blurOnEnter(inp);
    if (mi > 0) inp.placeholder = '↤';

    // Свотч цвета: у color-токенов виден всегда и работает как нативный
    // пикер (<input type="color"> лежит поверх, прозрачный).
    const swatch = h('span', 'th-tk-swatch');
    const picker = h('input', 'th-tk-colorpick');
    picker.type = 'color';
    picker.tabIndex = -1;
    const applyValue = (v) => {
      if (v === '') delete token.modes[mode.key];
      else token.modes[mode.key] = v;
      updateDecor(); markDirty(); refreshAllDecor();
    };
    picker.addEventListener('input', () => {
      // Выбор в пикере не сбрасывает прозрачность текущего значения.
      const p = splitHexAlpha(token.modes[mode.key] || '');
      const v = joinHexAlpha(picker.value, p ? p.alpha : 100);
      inp.value = v;
      applyValue(v);
    });

    // Прозрачность: инпут «%», живёт поверх hex-значения (100% — чистый
    // #rrggbb, меньше — #rrggbbaa). Для rgba()/алиасов скрыт.
    const alphaInp = h('input', 'th-tk-input th-tk-alpha');
    alphaInp.inputMode = 'numeric';
    blurOnEnter(alphaInp);
    alphaInp.title = 'Прозрачность, % (100 — непрозрачный)';
    alphaInp.addEventListener('input', () => {
      const p = splitHexAlpha(token.modes[mode.key] || '');
      const n = parseFloat(alphaInp.value);
      if (!p || isNaN(n)) return;
      const v = joinHexAlpha(p.hex, n);
      inp.value = v;
      applyValue(v);
    });
    alphaInp.addEventListener('blur', () => updateDecor());
    const updateDecor = () => {
      // Значение могло смениться извне (алиас переехал за переименованным
      // токеном) — синхронизируем инпут, если пользователь его не редактирует.
      const stored = token.modes[mode.key] || '';
      if (document.activeElement !== inp && inp.value !== stored) inp.value = stored;
      const r = resolveToken(state.draft, token.name, mi);
      const own = stored.trim();
      inp.classList.toggle('th-tk-broken', !!own && (r.error === 'cycle' || r.error === 'missing'));
      inp.title = r.error === 'cycle' ? 'Циклическая ссылка ($…) — значение не применяется'
        : r.error === 'missing' ? 'Ссылка на несуществующий токен'
        : own && own[0] === '$' ? '→ ' + (r.value || '')
        : own && !cssSafeValue(own)
          ? 'Скобки/«;» в значении — в CSS-переменную не попадёт (замена {{…}} в текстах работает)'
        : '';
      const isAlias = !!own && own[0] === '$';
      inp.classList.toggle('th-tk-alias', isAlias);
      // Алиас руками не редактируется — только выбрать другую цель или
      // отвязать (клик по полю открывает ту же выпадашку, что и «◆»).
      inp.readOnly = isAlias;
      const isColor = token.type === 'color';
      wrap.classList.toggle('th-tk-wrap-color', isColor);
      swatch.style.display = isColor ? '' : 'none';
      // У алиаса пикер спрятан: выбор цвета перезаписал бы ссылку хексом.
      picker.style.display = isColor && !isAlias ? '' : 'none';
      if (isColor) {
        const val = !r.error && r.value ? r.value : '';
        swatch.style.background = val ||
          'repeating-conic-gradient(#ddd 0 25%, #fff 0 50%) 0 0 / 8px 8px';
        const p = splitHexAlpha(val);
        if (p) picker.value = p.hex;
        picker.title = 'Выбрать цвет';
      }
      // Инпут прозрачности показываем только когда своё значение — hex.
      const ap = isColor && !isAlias ? splitHexAlpha(own) : null;
      alphaInp.style.display = ap ? '' : 'none';
      if (ap && document.activeElement !== alphaInp) alphaInp.value = ap.alpha;
      // «◆» позиционирован от правого края обёртки — сдвигаем за инпут
      // прозрачности, когда тот виден.
      aliasBtn.style.right = ap ? '48px' : '';
    };
    inp.addEventListener('input', () => applyValue(inp.value.trim()));
    inp.addEventListener('mousedown', (e) => {
      if (!inp.readOnly) return;
      e.preventDefault(); // не давать фокус/каретку readonly-полю
      openAliasDropdown(inp, token, mi, applyValue);
    });
    // Кнопка «◆» — привязать алиас из списка, не набирая $имя руками.
    // Объявлена ДО первого updateDecor(): он двигает её при видимом
    // инпуте прозрачности.
    const aliasBtn = h('button', 'th-tk-alias-btn', '◆');
    aliasBtn.type = 'button';
    aliasBtn.tabIndex = -1;
    aliasBtn.title = 'Сослаться на другой токен (алиас)';
    aliasBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openAliasDropdown(aliasBtn, token, mi, applyValue);
    });

    updateDecor();
    inp.__thUpdateDecor = updateDecor;

    wrap.appendChild(swatch);
    wrap.appendChild(picker);
    wrap.appendChild(inp);
    wrap.appendChild(alphaInp);
    wrap.appendChild(aliasBtn);
    cell.appendChild(wrap);
    row.appendChild(cell);
  });

  // Удаление
  const delCell = h('div', 'th-tk-cell th-tk-cell-del');
  const delBtn = h('button', 'th-tk-del');
  delBtn.innerHTML = TRASH_SVG;
  delBtn.title = 'Удалить токен';
  delBtn.addEventListener('click', () => {
    if (!confirm(
      'Удалить токен «' + token.name + '»?\n\n' +
      'Автоматически найти все использования {{' + token.name + '}} в полях блоков невозможно — ' +
      'проверьте вручную, что он нигде не используется. Алиасы $' + token.name + ' в других токенах станут broken.'
    )) return;
    col.tokens.splice(ti, 1);
    renderTable(); renderSidebar(); markDirty();
  });
  delCell.appendChild(delBtn);
  row.appendChild(delCell);

  return row;
}

// Выпадашка алиасов у поля значения: все токены, кроме самого себя и тех,
// ссылка на которые замкнула бы цикл. Тип не фильтруем — тип алиаса сам
// наследуется от выбранной цели (syncAliasTypes).
function openAliasDropdown(anchor, token, mi, applyValue) {
  closeAliasDropdown();
  const data = state.draft;
  const dd = h('div');
  dd.id = 'th-tk-alias-dd';
  const rect = anchor.getBoundingClientRect();
  dd.style.left = Math.max(8, rect.right - 260) + 'px';
  dd.style.top = rect.bottom + 4 + 'px';
  const resolved = resolveAll(data);
  const own = (token.modes[MODES[mi].key] || '').trim();
  let any = false;
  for (const c of data.collections) {
    // Цикл: резолвим кандидата с уже «посещённым» текущим токеном — если
    // цепочка дойдёт до него, вернётся error:'cycle'.
    const items = c.tokens.filter((t) =>
      t !== token && resolveToken(data, t.name, mi, new Set([token.name])).error !== 'cycle');
    if (!items.length) continue;
    dd.appendChild(h('div', 'th-tk-dd-group', c.name));
    for (const t of items) {
      any = true;
      const item = h('div', 'th-tk-dd-item' + (own === '$' + t.name ? ' th-tk-dd-cur' : ''));
      const val = resolved[MODES[mi].key][t.name] || '';
      if (t.type === 'color' && val) {
        const sw = h('span', 'th-tk-dd-swatch');
        sw.style.background = val;
        item.appendChild(sw);
      } else {
        const ic = h('span', 'th-tk-type-icon');
        ic.innerHTML = TYPE_ICONS[t.type];
        item.appendChild(ic);
      }
      item.appendChild(h('span', 'th-tk-dd-name', t.name));
      item.appendChild(h('span', 'th-tk-dd-val', val));
      item.addEventListener('click', () => { closeAliasDropdown(); applyValue('$' + t.name); });
      dd.appendChild(item);
    }
  }
  if (!any) dd.appendChild(h('div', 'th-tk-dd-empty', 'Нет токенов, на которые можно сослаться'));
  if (own[0] === '$') {
    const rm = h('div', 'th-tk-dd-item th-tk-dd-remove', '× Убрать алиас');
    rm.addEventListener('click', () => { closeAliasDropdown(); applyValue(''); });
    dd.appendChild(rm);
  }
  document.body.appendChild(dd);
  document.addEventListener('mousedown', onAliasOutside, true);
  // position:fixed не следует за прокруткой таблицы — при скролле закрываем.
  document.addEventListener('scroll', closeAliasDropdown, true);
}

function closeAliasDropdown() {
  const dd = document.getElementById('th-tk-alias-dd');
  if (dd) dd.remove();
  document.removeEventListener('mousedown', onAliasOutside, true);
  document.removeEventListener('scroll', closeAliasDropdown, true);
}

function onAliasOutside(e) {
  const dd = document.getElementById('th-tk-alias-dd');
  if (dd && !dd.contains(e.target)) closeAliasDropdown();
}

function closeTypeDropdown() {
  const dd = document.getElementById('th-tk-type-dd');
  if (dd) dd.remove();
  document.removeEventListener('mousedown', onTypeOutside, true);
  document.removeEventListener('scroll', closeTypeDropdown, true);
}

function onTypeOutside(e) {
  const dd = document.getElementById('th-tk-type-dd');
  if (dd && !dd.contains(e.target)) closeTypeDropdown();
}

function refreshRowValidity() { refreshAllDecor(); }

function refreshAllDecor() {
  document.querySelectorAll('#' + MODAL_ID + ' .th-tk-value-input, #' + MODAL_ID + ' .th-tk-type-btn')
    .forEach((el) => { if (el.__thUpdateDecor) el.__thUpdateDecor(); });
}

function draftHasErrors() {
  const names = new Set();
  const varNames = new Set();
  for (const c of state.draft.collections) {
    for (const t of c.tokens) {
      if (!NAME_RE.test(t.name)) return 'Некорректное имя токена: «' + t.name + '»';
      if (names.has(t.name)) return 'Дубль имени токена: «' + t.name + '»';
      const vn = cssVarName(t.name);
      if (varNames.has(vn)) return 'Конфликт CSS-переменной у «' + t.name + '» («/» и «-» дают одно имя)';
      names.add(t.name);
      varNames.add(vn);
    }
  }
  for (const c of state.draft.collections)
    for (const t of c.tokens)
      for (let i = 0; i < MODES.length; i++) {
        const own = (t.modes[MODES[i].key] || '').trim();
        if (own && own[0] === '$') {
          const r = resolveToken(state.draft, t.name, i);
          if (r.error === 'cycle') return 'Циклическая ссылка: токен «' + t.name + '» (' + MODES[i].label + ')';
        }
      }
  return null;
}

// ---------------------------------------------------------------------------
// Стили модалки
// ---------------------------------------------------------------------------

function injectModalStyles() {
  if (document.getElementById('th-tokens-modal-css')) return;
  const st = document.createElement('style');
  st.id = 'th-tokens-modal-css';
  st.textContent = `
#${MODAL_ID} {
  position: fixed; inset: 0; z-index: 2147483000;
  background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
}
#${MODAL_ID} * { box-sizing: border-box; }
#${MODAL_ID} .th-tk-panel {
  width: min(1150px, calc(100vw - 40px)); height: min(660px, calc(100vh - 60px));
  background: #fff; border-radius: 14px; display: flex; flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,.35); overflow: hidden;
}
#${MODAL_ID} .th-tk-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-bottom: 1px solid #ececec;
}
#${MODAL_ID} .th-tk-title { font-size: 16px; font-weight: 600; }
#${MODAL_ID} .th-tk-header-btns { display: flex; gap: 12px; align-items: center; }
#${MODAL_ID} .th-tk-savestat { font-size: 12px; color: #aaa; white-space: nowrap; }
#${MODAL_ID} .th-tk-savestat.th-tk-status-ok { color: #1d8a3c; }
#${MODAL_ID} .th-tk-savestat.th-tk-status-error { color: #e0442b; }
#${MODAL_ID} .th-tk-close {
  border: none; background: none; font-size: 24px; line-height: 1;
  cursor: pointer; color: #999; padding: 0 4px;
}
#${MODAL_ID} .th-tk-conflict {
  background: #fff7e0; color: #8a6100; padding: 8px 20px; font-size: 12.5px;
  border-bottom: 1px solid #f0e2b0;
}
#${MODAL_ID} .th-tk-body { flex: 1; display: flex; min-height: 0; }
#${MODAL_ID} .th-tk-sidebar {
  width: 210px; border-right: 1px solid #ececec; padding: 12px 8px;
  overflow-y: auto; flex-shrink: 0; background: #fafafa;
}
#${MODAL_ID} .th-tk-sb-caption {
  font-size: 11px; text-transform: uppercase; letter-spacing: .5px;
  color: #999; padding: 2px 10px 8px;
}
#${MODAL_ID} .th-tk-sb-item {
  display: flex; align-items: center; gap: 6px; padding: 7px 10px;
  border-radius: 8px; cursor: pointer; font-size: 13.5px;
}
#${MODAL_ID} .th-tk-sb-item:hover { background: #f0f0f0; }
#${MODAL_ID} .th-tk-sb-active, #${MODAL_ID} .th-tk-sb-active:hover { background: #ececec; font-weight: 600; }
#${MODAL_ID} .th-tk-sb-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#${MODAL_ID} .th-tk-sb-count { font-size: 11px; color: #aaa; }
#${MODAL_ID} .th-tk-sb-del {
  border: none; background: none; color: #bbb; cursor: pointer; font-size: 15px;
  padding: 0 2px; visibility: hidden;
}
#${MODAL_ID} .th-tk-sb-item:hover .th-tk-sb-del { visibility: visible; }
#${MODAL_ID} .th-tk-sb-del:hover { color: #e0442b; }
#${MODAL_ID} .th-tk-sb-add {
  margin: 10px 10px 0; border: 1px dashed #ccc; background: none; color: #777;
  border-radius: 8px; padding: 6px 10px; font-size: 12.5px; cursor: pointer; width: calc(100% - 20px);
}
#${MODAL_ID} .th-tk-sb-add:hover { border-color: #999; color: #333; }
#${MODAL_ID} .th-tk-main { flex: 1; overflow: auto; padding: 14px 18px; }
#${MODAL_ID} .th-tk-table { min-width: 900px; }
#${MODAL_ID} .th-tk-row {
  display: grid;
  grid-template-columns: 180px 176px repeat(5, 1fr) 36px;
  gap: 6px; align-items: center; padding: 3px 0;
}
#${MODAL_ID} .th-tk-row-head { position: sticky; top: -14px; background: #fff; z-index: 1; padding: 6px 0; }
#${MODAL_ID} .th-tk-row-head .th-tk-cell {
  font-size: 11px; text-transform: uppercase; letter-spacing: .4px; color: #999;
}
#${MODAL_ID} .th-tk-group-row {
  margin-top: 14px; padding: 10px 0 5px; font-size: 11px; font-weight: 700;
  color: #666; letter-spacing: .5px; text-transform: uppercase;
  border-top: 1px solid #ececec;
}
#${MODAL_ID} .th-tk-group-row::before { content: '▾'; color: #b3b3b3; margin-right: 6px; font-size: 9px; }
/* Ряды внутри группы: отступ + вертикальная направляющая слева. */
#${MODAL_ID} .th-tk-row-grouped .th-tk-cell-name { padding-left: 20px; position: relative; }
#${MODAL_ID} .th-tk-row-grouped .th-tk-cell-name::before {
  content: ''; position: absolute; left: 7px; top: -4px; bottom: -4px;
  width: 1px; background: #e4e4e4;
}
#${MODAL_ID} .th-tk-cell-name { position: relative; }
#${MODAL_ID} .th-tk-drag {
  position: absolute; left: -14px; top: 50%; transform: translateY(-50%);
  cursor: grab; color: #c4c4c4; font-size: 10px; line-height: 1;
  padding: 4px 2px; opacity: 0; user-select: none;
}
#${MODAL_ID} .th-tk-row:hover .th-tk-drag { opacity: 1; }
#${MODAL_ID} .th-tk-drag:active { cursor: grabbing; }
#${MODAL_ID} .th-tk-dragging { opacity: .4; }
#${MODAL_ID} .th-tk-drop-above { box-shadow: 0 -2px 0 #FA8669; }
#${MODAL_ID} .th-tk-drop-below { box-shadow: 0 2px 0 #FA8669; }
#${MODAL_ID} .th-tk-input, #${MODAL_ID} .th-tk-select {
  width: 100%; border: 1px solid #e2e2e2; border-radius: 7px;
  padding: 6px 8px; font-size: 13px; background: #fff; outline: none;
}
#${MODAL_ID} .th-tk-input:focus, #${MODAL_ID} .th-tk-select:focus { border-color: #FA8669; }
#${MODAL_ID} .th-tk-cell-type { display: flex; gap: 4px; min-width: 0; }
#${MODAL_ID} .th-tk-type-btn { flex: 1; min-width: 0; }
#${MODAL_ID} .th-tk-unit { width: 58px; flex-shrink: 0; padding: 6px 4px; }
#${MODAL_ID} .th-tk-value-wrap { position: relative; display: flex; align-items: center; }
#${MODAL_ID} .th-tk-swatch {
  position: absolute; left: 7px; width: 14px; height: 14px; border-radius: 4px;
  border: 1px solid rgba(0,0,0,.15); pointer-events: none;
}
#${MODAL_ID} .th-tk-colorpick {
  position: absolute; left: 7px; width: 14px; height: 14px;
  opacity: 0; cursor: pointer; padding: 0; border: none;
}
#${MODAL_ID} .th-tk-wrap-color .th-tk-input { padding-left: 26px; }
#${MODAL_ID} .th-tk-value-input { padding-right: 22px; }
#${MODAL_ID} .th-tk-alpha {
  flex: 0 0 40px; width: 40px; margin-left: 4px; padding: 5px 4px;
  text-align: right;
}
#${MODAL_ID} .th-tk-wrap-color .th-tk-input.th-tk-alpha { padding-left: 4px; }
#${MODAL_ID} .th-tk-alias-btn {
  position: absolute; right: 4px; width: 16px; height: 16px;
  border: none; background: none; padding: 0; cursor: pointer;
  color: #c4c4c4; font-size: 10px; line-height: 1; opacity: 0;
}
#${MODAL_ID} .th-tk-value-wrap:hover .th-tk-alias-btn,
#${MODAL_ID} .th-tk-alias ~ .th-tk-alias-btn { opacity: 1; }
#${MODAL_ID} .th-tk-alias-btn:hover { color: #7b3ff2; }
#${MODAL_ID} .th-tk-type-locked { cursor: default; color: #999; background: #fafafa; }
#${MODAL_ID} .th-tk-type-locked:focus { border-color: #e2e2e2; }
#${MODAL_ID} .th-tk-input.th-tk-alias { cursor: pointer; }
#th-tk-alias-dd {
  position: fixed; z-index: 2147483002; min-width: 220px; max-width: 320px;
  max-height: 300px; overflow-y: auto; background: #fff; border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0,0,0,.22); padding: 6px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
}
#th-tk-alias-dd .th-tk-dd-item {
  display: flex; align-items: center; gap: 8px; padding: 7px 10px;
  border-radius: 7px; cursor: pointer; font-size: 12.5px;
}
#th-tk-alias-dd .th-tk-dd-item:hover { background: #f5f5f5; }
#th-tk-alias-dd .th-tk-dd-cur { background: #f5efff; }
#th-tk-alias-dd .th-tk-dd-swatch {
  width: 14px; height: 14px; border-radius: 4px; flex-shrink: 0;
  border: 1px solid rgba(0,0,0,.15);
}
#th-tk-alias-dd .th-tk-type-icon {
  display: inline-flex; align-items: center; justify-content: center; width: 14px; flex-shrink: 0;
}
#th-tk-alias-dd .th-tk-dd-name { flex: 1; font-weight: 500; overflow: hidden; text-overflow: ellipsis; }
#th-tk-alias-dd .th-tk-dd-val { color: #aaa; font-size: 11px; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#th-tk-alias-dd .th-tk-dd-remove { color: #e0442b; }
#th-tk-alias-dd .th-tk-dd-empty { padding: 10px; font-size: 12px; color: #999; }
#th-tk-alias-dd .th-tk-dd-group {
  padding: 8px 10px 3px; font-size: 10px; text-transform: uppercase;
  letter-spacing: .5px; color: #b3b3b3;
}
#${MODAL_ID} .th-tk-type-btn {
  display: flex; align-items: center; gap: 6px; cursor: pointer; text-align: left;
}
#${MODAL_ID} .th-tk-type-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 14px; flex-shrink: 0;
}
#${MODAL_ID} .th-tk-type-label { flex: 1; }
#${MODAL_ID} .th-tk-type-caret { color: #999; font-size: 10px; }
.th-tk-type-glyph { font-weight: 700; font-size: 12px; line-height: 1; }
#th-tk-type-dd {
  position: fixed; z-index: 2147483002; background: #fff; border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0,0,0,.22); padding: 6px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
}
#th-tk-type-dd .th-tk-dd-item {
  display: flex; align-items: center; gap: 8px; padding: 7px 10px;
  border-radius: 7px; cursor: pointer; font-size: 12.5px;
}
#th-tk-type-dd .th-tk-dd-item:hover { background: #f5f5f5; }
#th-tk-type-dd .th-tk-dd-cur { background: #f5efff; }
#th-tk-type-dd .th-tk-type-icon {
  display: inline-flex; align-items: center; justify-content: center; width: 14px;
}
#${MODAL_ID} .th-tk-del svg { pointer-events: none; }
#${MODAL_ID} .th-tk-alias { color: #7b3ff2; font-weight: 500; }
#${MODAL_ID} .th-tk-invalid, #${MODAL_ID} .th-tk-broken {
  border-color: #e0442b !important; background: #fff5f3;
}
#${MODAL_ID} .th-tk-del {
  border: none; background: none; cursor: pointer; font-size: 14px; opacity: .35;
}
#${MODAL_ID} .th-tk-row:hover .th-tk-del { opacity: 1; }
#${MODAL_ID} .th-tk-add-token {
  margin-top: 10px; border: 1px dashed #ccc; background: none; color: #777;
  border-radius: 8px; padding: 8px 14px; font-size: 13px; cursor: pointer;
}
#${MODAL_ID} .th-tk-add-token:hover { border-color: #999; color: #333; }
`;
  (document.head || document.documentElement).appendChild(st);
}
