// Единый служебный T123-блок («carrier») под целевым блоком. Один блок на
// целевой — несёт СРАЗУ и z-index (<style>), и произвольный атрибут (<script>),
// чтобы не плодить по два T123 на блок.
//
// Внутри carrier'а — до двух секций, каждая со своим маркером:
//   <style>  /* th-zi:recXXXX */   #recXXXX{...z-index...}       </style>
//   <script> /* th-attr:recXXXX enc:… */ …setAttribute(…)…      </script>
// Присутствует только та секция, что реально задана. Обе пусты → блок удаляем.
//
// Модуль — ЕДИНСТВЕННЫЙ владелец записи carrier'а: и z-index, и атрибуты идут
// через одну очередь сохранения (ключ = numericId целевого блока). Иначе два
// независимых сохранения писали бы в один блок наперегонки и затирали секцию
// друг друга.
//
// БЕЗОПАСНОСТЬ (см. историю инцидента в zindex): сохраняем ТОЛЬКО через
// tp__saveOnlyOneFieldInRecord по id нашего carrier'а; создаём через
// tp__addRecord; удаляем через tp__delRecord — всё адресно и в Undo-историю.

import {
  CARRIER_MARKER_PREFIX,
  ATTR_MARKER_PREFIX,
  T123_TPLID,
} from './constants.js';
import { getAllRecs, getT123Recs, waitFor } from './dom.js';

// ---- Разбор существующих carrier'ов ----

// numericId → z-index. Значение живёт в <style> секции «#recXXXX{…z-index:N…}».
export function getCurrentZIndexMap() {
  const map = new Map();
  getT123Recs().forEach((r) => {
    const t = r.textContent;
    if (!t.includes(CARRIER_MARKER_PREFIX)) return;
    const blockRe = /#rec(\d+)\s*\{([^}]*)\}/g;
    let m;
    while ((m = blockRe.exec(t))) {
      const z = m[2].match(/z-index\s*:\s*(-?\d+)/);
      if (z) map.set(m[1], z[1]);
    }
  });
  return map;
}

// numericId → {name, value}. Живёт в <script> секции, маркер «th-attr:recXXXX
// enc:<encodeURIComponent(JSON)>» (enc не содержит пробелов/кавычек/`<`/`/`).
export function getCurrentAttrMap() {
  const map = new Map();
  getT123Recs().forEach((r) => {
    const t = r.textContent;
    if (!t.includes(ATTR_MARKER_PREFIX)) return;
    const m = t.match(/th-attr:rec(\d+)\s+enc:(\S+)\s+\*\//);
    if (!m) return;
    try {
      const p = JSON.parse(decodeURIComponent(m[2]));
      if (p && typeof p.name === 'string' && p.name !== '') {
        map.set(m[1], { name: p.name, value: p.value == null ? '' : String(p.value) });
      }
    } catch (e) {}
  });
  return map;
}

// ---- Оптимистичные правки (держим, пока сохранение не подтвердилось) ----
const zIndexOverrides = new Map(); // numericId -> val | null
const attrOverrides = new Map(); // numericId -> {name,value} | null

export function getEffectiveZIndexMap() {
  const map = getCurrentZIndexMap();
  zIndexOverrides.forEach((val, id) => {
    if (val === null) map.delete(id);
    else map.set(id, val);
  });
  return map;
}

export function getEffectiveAttrMap() {
  const map = getCurrentAttrMap();
  attrOverrides.forEach((val, id) => {
    if (val === null) map.delete(id);
    else map.set(id, val);
  });
  return map;
}

export function setZIndexOverride(numericId, val) {
  zIndexOverrides.set(numericId, val);
}

export function setAttrOverride(numericId, info) {
  attrOverrides.set(numericId, info);
}

function sameInfo(a, b) {
  if (a === b) return true; // оба null
  if (!a || !b) return false;
  return a.name === b.name && a.value === b.value;
}

// ---- Сборка содержимого carrier'а ----

function buildStyleSection(targetFullId, zVal) {
  if (zVal == null) return '';
  // position:relative обязателен — на static-блоке (дефолт Tilda) z-index
  // игнорируется браузером и на опубликованном сайте не сработает.
  // overflow:visible — чтобы поднятый z-index'ом блок не обрезался родным
  // overflow:hidden контейнера (иначе выступающая часть перекрытия исчезает).
  return (
    '<style>\n/* ' + CARRIER_MARKER_PREFIX + targetFullId + ' */\n' +
    '#' + targetFullId + '{position:relative;z-index:' + zVal + ' !important;overflow:visible !important;}\n' +
    '</style>'
  );
}

function buildScriptSection(targetFullId, info) {
  if (!info) return '';
  const enc = encodeURIComponent(JSON.stringify({ name: info.name, value: info.value }));
  const nameJs = JSON.stringify(info.name);
  const valueJs = JSON.stringify(info.value);
  return (
    '<script>\n/* ' + ATTR_MARKER_PREFIX + targetFullId + ' enc:' + enc + ' */\n' +
    '(function(){try{var e=document.getElementById(' + JSON.stringify(targetFullId) + ');' +
    'if(e){e.setAttribute(' + nameJs + ',' + valueJs + ');}}catch(x){}})();\n' +
    '</' + 'script>'
  );
}

function buildCarrierContent(targetFullId, zVal, info) {
  return [buildStyleSection(targetFullId, zVal), buildScriptSection(targetFullId, info)]
    .filter(Boolean)
    .join('\n');
}

// Все carrier'ы целевого блока = T123 с нашим маркером (любым из двух) для него.
// Обычно один; после апгрейда со старой схемы (отдельные th-zi и th-attr
// блоки) их может быть два — консолидируем при первом же сохранении.
function findAllCarriersFor(targetFullId) {
  return getT123Recs().filter((r) => {
    const t = r.textContent;
    return t.includes(CARRIER_MARKER_PREFIX + targetFullId) || t.includes(ATTR_MARKER_PREFIX + targetFullId);
  });
}

function delRecord(rec) {
  if (rec && typeof window.tp__delRecord === 'function') {
    window.tp__delRecord(rec.id.replace('rec', ''));
  }
}

// Создать T123 СТРОГО под целевым блоком через штатный tp__addRecord — сервер
// вставляет блок сразу после afterid (привязка по ID, без геометрии). id
// нового блока функция не возвращает — ловим диффом getAllRecs().
export async function createCarrierUnder(targetFullId) {
  if (typeof window.tp__addRecord !== 'function') return null;
  const numericId = targetFullId.replace('rec', '');
  const before = new Set(getAllRecs().map((r) => r.id));
  window.tp__addRecord(T123_TPLID, numericId, '');
  return waitFor(() => getAllRecs().find((r) => !before.has(r.id)) || null);
}

// Прямое безопасное сохранение поля 'code' конкретного блока на сервер.
function saveCarrierCode(numericId, html) {
  if (typeof window.tp__saveOnlyOneFieldInRecord !== 'function') {
    alert('Не удалось сохранить: функция сохранения Tilda недоступна.');
    return;
  }
  // tp__saveOnlyOneFieldInRecord при успехе делает scrollToRecord(carrier) —
  // возвращаем прокрутку на место, чтобы не отпрыгивать от редактируемого блока.
  const sx = window.scrollX;
  const sy = window.scrollY;
  window.tp__saveOnlyOneFieldInRecord(numericId, 'code', 'code', html);
  [400, 900].forEach((t) => setTimeout(() => window.scrollTo(sx, sy), t));
}

// ---- Очередь сохранений: по одному за раз, ключ = numericId ----
let saving = false;
const pending = new Set(); // numericId

// Поставить блок в очередь на пересборку carrier'а из ТЕКУЩЕГО effective-стейта
// (z-index + атрибут). Вызывать после setZIndexOverride/setAttrOverride.
export function commitBlock(numericId) {
  pending.add(numericId);
  drainSaves();
}

async function drainSaves() {
  if (saving) return;
  saving = true;
  try {
    while (pending.size) {
      const numericId = pending.values().next().value;
      pending.delete(numericId);
      await doSaveForBlock(numericId);
    }
  } finally {
    saving = false;
  }
}

async function doSaveForBlock(numericId) {
  const targetFullId = 'rec' + numericId;
  const zEff = getEffectiveZIndexMap();
  const attrEff = getEffectiveAttrMap();
  const zVal = zEff.has(numericId) ? zEff.get(numericId) : null;
  const info = attrEff.has(numericId) ? attrEff.get(numericId) : null;

  const carriers = findAllCarriersFor(targetFullId);

  if (zVal == null && info == null) {
    // Обе секции пусты — служебный блок больше не нужен, удаляем все его копии.
    carriers.forEach(delRecord);
  } else {
    let carrier = carriers[0];
    if (!carrier) {
      carrier = await createCarrierUnder(targetFullId);
      if (!carrier) {
        alert(
          'Не удалось автоматически создать служебный блок под этим блоком.\n' +
            'Добавьте вручную блок «T123 HTML-код» и повторите попытку.'
        );
        return;
      }
    } else {
      // Дубли (в т.ч. старые раздельные th-zi/th-attr блоки) схлопываем в один.
      carriers.slice(1).forEach(delRecord);
    }
    saveCarrierCode(carrier.id.replace('rec', ''), buildCarrierContent(targetFullId, zVal, info));
  }

  // Даём Tilda перерисовать carrier, затем снимаем оптимистичные override'ы,
  // если они всё ещё совпадают с тем, что мы сохраняли.
  setTimeout(() => {
    if (zIndexOverrides.get(numericId) === zVal) zIndexOverrides.delete(numericId);
    if (sameInfo(attrOverrides.get(numericId), info)) attrOverrides.delete(numericId);
  }, 1500);
}
