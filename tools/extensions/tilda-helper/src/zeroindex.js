// Фича «Z-index для Zero-блоков — через родные поля артборда, без T123-carrier».
//
// Для ОБЫЧНОГО блока поле «Z-index» в сайдбаре пишет служебный T123-carrier
// (см. carrier.js / zindex.js). Для Zero-блока (T396) это не работает как надо:
// внутренний контейнер артборда `.t396__artboard` имеет собственный
// `overflow:hidden` (поле `ab_ovrflw`), поэтому поднятый z-index'ом контент
// всё равно обрезается — «z-index не синхронизируется с контентом внутри».
//
// У Zero-блока для этого есть РОДНОЙ механизм: в настройках артборда поле
// Overflow = Visible открывает поле Z-index (`ab__panelSettings__updateZIndex
// FieldVisibility`: показывает `poszindex`, когда `ovrflw === 'visible'` либо
// position fixed/absolute). Значит carrier не нужен — пишем прямо в данные
// Zero-блока:
//   ab__setFieldValue(artboardEl, 'ovrflw', 'visible')   // → ab_ovrflw:"visible"
//   ab__setFieldValue(artboardEl, 'poszindex', N)        // → ab_poszindex:"N"
// сброс: оба в '' (ключи исчезают, возврат к дефолту hidden).
//
// БЕЗОПАСНОСТЬ: запись идёт РОДНЫМ сериализатором Tilda — открываем Zero-редактор
// (`tp__openZero`, тот же проверенный путь, что и HTML→Zero импорт, см.
// zeroimport.js), выставляем два поля через официальный `ab__setFieldValue`,
// сохраняем родным `ab__saveToDataBase()` и закрываем. Мы НЕ конструируем JSON
// блока сами и не перезаписываем `code` целиком — поэтому потеря контента
// невозможна (сохраняется ровно текущее состояние артборда + два поля).
// См. [[lesson-no-destructive-tilda-automation]].

import { getRecordWrapper, getRecordCod } from './dom.js';

// Сессионный кэш последнего заданного значения (numericId -> строка|null).
// Нужен, чтобы поле сайдбара и live-превью показывали значение сразу после
// записи, не дожидаясь перерисовки Zero-блока в канвасе /page/.
const cache = new Map();

// Zero-блок в /page/ — обёртка #recordXXXX с data-record-cod = 'T396'.
export function isZeroBlock(numericId) {
  return getRecordCod(getRecordWrapper('rec' + numericId)) === 'T396';
}

// Текущий z-index Zero-блока для префилла поля.
//
// ВАЖНО (выяснено вживую 2026-07-13): /page/-редактор block-level z-index
// зеро-блока НЕ хранит и НЕ рендерит — он лежит только в `code` на сервере и
// применяется лишь на паблише (в канвасе `data-artboard-poszindex` нет,
// computed z-index = auto). Поэтому единственный дешёвый достоверный источник —
// значение, поднятое из ОТКРЫТОГО зеро-редактора нашим же in-iframe скриптом
// (syncZeroZIndexToParent пишет в window.__thZeroZI). Так «поменял внутри зеро»
// отражается в сайдбаре. Приоритет: (1) поднятое из зеро (самое свежее),
// (2) наш сессионный кэш правок из сайдбара. null = не задан/неизвестно.
export function readZeroZIndex(numericId) {
  const shared = window.__thZeroZI;
  if (shared && Object.prototype.hasOwnProperty.call(shared, numericId)) {
    const v = shared[numericId];
    return v == null || v === '' ? null : String(v);
  }
  if (cache.has(numericId)) return cache.get(numericId);
  return null;
}

// Префилл z-index Zero-блока из ЧЕРНОВИКА на сервере — лечит «поставил z-index,
// обновил страницу — поле пустое» (значение сохранено, но /page/-редактор его
// нигде не рендерит, см. readZeroZIndex). Эндпоинт вскрыт из zero-редактора
// (fn _initializeArtboard в /front/zero/tester/index.js):
//   POST /zero/get/  FormData {comm:'getzerocode', pageid, recordid}
// → JSON артборда (то самое поле `code`, обычно единицы КБ), читаем только
// ab_poszindex. Дёргается лениво — при выборе Zero-блока в сайдбаре, один раз
// на блок за сессию. Сессионные источники (правка в сайдбаре/внутри зеро)
// свежее серверного значения, поэтому при них не фетчим и кэш не трогаем.
const fetchedFromServer = new Set(); // numericId, по которым запрос уже ушёл

export function prefillZeroZIndex(numericId, onValue) {
  if (readZeroZIndex(numericId) != null) return; // уже знаем значение
  if (cache.has(numericId)) return; // юзер правил в этой сессии (в т.ч. сброс в null)
  if (fetchedFromServer.has(numericId)) return;
  if (!window.pageid) return;
  fetchedFromServer.add(numericId);

  const fd = new FormData();
  fd.append('comm', 'getzerocode');
  fd.append('pageid', String(window.pageid));
  fd.append('recordid', String(numericId));
  fetch('/zero/get/', { method: 'POST', body: fd, credentials: 'include' })
    .then((r) => r.text())
    .then((t) => {
      let d = null;
      try {
        d = JSON.parse(t);
      } catch (e) {}
      if (!d) return;
      const v = d.ab_poszindex ? String(d.ab_poszindex) : null;
      // Пока летел запрос, юзер мог успеть поправить значение — не затираем.
      if (!cache.has(numericId)) cache.set(numericId, v);
      if (v != null && typeof onValue === 'function') onValue(v);
    })
    .catch(() => {
      fetchedFromServer.delete(numericId); // сетевая ошибка — можно повторить
    });
}

// Вызывается ВНУТРИ iframe зеро-редактора (world:MAIN, same-origin с /page/).
// Поднимает текущий z-index артборда в окно /page/, чтобы сайдбар показывал
// актуальное значение, даже если пользователь поменял его прямо в зеро-редакторе.
export function syncZeroZIndexToParent() {
  try {
    if (typeof window.allelems__getJsonData !== 'function') return;
    const ab = document.querySelector('.tn-artboard');
    if (!ab) return;
    const recid = ab.getAttribute('data-record-id');
    if (!recid) return;
    const d = window.allelems__getJsonData();
    if (!d || !d.ab_height) return; // не догидрирован — не портим кэш ложным null
    const parent = window.parent || window;
    const store = (parent.__thZeroZI = parent.__thZeroZI || {});
    store[recid] = d.ab_poszindex ? String(d.ab_poszindex) : null;
  } catch (e) {}
}

// Ждём готовности Zero-редактора в iframe: функции появляются раньше стейта
// артборда, единственный надёжный признак — allelems__getJsonData() без
// исключения (см. zeroimport.js — тот же приём).
//
// КРИТИЧНО (иначе потеря контента): allelems__getJsonData() начинает отвечать
// РАНЬШЕ, чем артборд догидрируется данными с сервера — в этом окне он пуст
// (0 элементов, ab_height отсутствует). Проверено вживую 2026-07-13 на
// iframe-варианте (&iframe=y — тот, что открывает tp__openZero). Если в этот
// момент сохранить, ab__saveToDataBase запишет ПУСТОЙ артборд и сотрёт зеро-
// блок. Поэтому ждём именно ГИДРАЦИЮ: `ab_height` присутствует И число
// элементов в JSON СТАБИЛЬНО на нескольких опросах подряд (гидратация
// завершилась и больше не меняется). Возвращаем {w, count} — эталонное число
// элементов, с которым потом сверяемся ПЕРЕД сохранением.
const elemCount = (d) => Object.keys(d).filter((k) => /^\d+$/.test(k)).length;

function apiReady(w) {
  return (
    w &&
    typeof w.ab__setFieldValue === 'function' &&
    typeof w.ab__saveToDataBase === 'function' &&
    typeof w.allelems__getJsonData === 'function' &&
    typeof w.ab__getFieldValue === 'function'
  );
}

async function waitZeroHydrated() {
  const started = Date.now();
  let lastSig = null;
  let stable = 0;
  while (Date.now() - started < 25000) {
    const f = document.querySelector('.t396__iframe');
    const w = f && f.contentWindow;
    if (apiReady(w)) {
      let d = null;
      try {
        d = w.allelems__getJsonData();
      } catch (e) {
        d = null;
      }
      // ab_height есть только у догидрированного артборда (до гидратации — null).
      if (d && d.ab_height) {
        const sig = elemCount(d) + ':' + d.ab_height;
        if (sig === lastSig) {
          stable += 1;
          if (stable >= 2) return { w, count: elemCount(d) }; // ~600мс без изменений
        } else {
          lastSig = sig;
          stable = 0;
        }
      }
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return null;
}

// Запись выполняется по одной за раз: открытие Zero-редактора — тяжёлая
// операция (полноэкранный iframe), параллельные открытия ломали бы друг друга.
let writing = false;
const writeQueue = [];

function enqueueWrite(numericId, val) {
  cache.set(numericId, val === '' ? null : val); // оптимистично — для префилла
  writeQueue.push({ numericId, val });
  drainWrites();
}

async function drainWrites() {
  if (writing) return;
  writing = true;
  try {
    while (writeQueue.length) {
      // last-write-wins по блоку: если в очереди несколько правок одного блока,
      // применяем только последнюю.
      const item = writeQueue.shift();
      const later = writeQueue.filter((q) => q.numericId === item.numericId);
      const eff = later.length ? later[later.length - 1] : item;
      for (let i = writeQueue.length - 1; i >= 0; i--) {
        if (writeQueue[i].numericId === item.numericId) writeQueue.splice(i, 1);
      }
      await applyZeroZIndex(eff.numericId, eff.val);
    }
  } finally {
    writing = false;
  }
}

async function applyZeroZIndex(numericId, val) {
  if (typeof window.tp__openZero !== 'function') {
    alert('Не удалось сохранить z-index Zero-блока: функция Tilda tp__openZero недоступна.');
    return;
  }
  const sx = window.scrollX;
  const sy = window.scrollY;
  window.tp__openZero(numericId, true);

  const ready = await waitZeroHydrated();
  if (!ready) {
    if (typeof window.tp__closeZero === 'function') window.tp__closeZero();
    [300, 800].forEach((t) => setTimeout(() => window.scrollTo(sx, sy), t));
    alert('Zero-редактор не догрузился — z-index не сохранён. Контент блока НЕ тронут.');
    return;
  }
  const fw = ready.w;
  const hydratedCount = ready.count; // эталон для проверки целостности перед save

  try {
    const wantOvrflw = val == null || val === '' ? '' : 'visible';
    const wantPos = val == null || val === '' ? '' : String(val);

    const ab = fw.document.querySelector('.tn-artboard');
    if (!ab) throw new Error('артборд Zero-блока не найден');
    // Порядок важен: сперва overflow (открывает поле z-index), затем z-index.
    fw.ab__setFieldValue(ab, 'ovrflw', wantOvrflw);
    fw.ab__setFieldValue(ab, 'poszindex', wantPos);

    // ПРЕДОХРАНИТЕЛЬ перед сохранением: убеждаемся, что (1) наши поля легли и
    // (2) артборд всё ещё целый — число элементов и ab_height не «схлопнулись»
    // (гонка гидратации). Если что-то не так — НЕ сохраняем, чтобы не затереть
    // блок пустым. См. [[lesson-no-destructive-tilda-automation]].
    const d = fw.allelems__getJsonData();
    const ok =
      String(d.ab_ovrflw || '') === wantOvrflw &&
      String(d.ab_poszindex || '') === wantPos &&
      !!d.ab_height &&
      elemCount(d) === hydratedCount;
    if (!ok) {
      throw new Error(
        'проверка целостности перед сохранением не прошла (артборд неполный) — сохранение отменено, контент не тронут'
      );
    }

    await fw.ab__saveToDataBase();
    await new Promise((r) => setTimeout(r, 600));
  } catch (e) {
    console.warn('[Tilda Helper] запись z-index в Zero-блок не удалась:', e);
  } finally {
    if (typeof window.tp__closeZero === 'function') window.tp__closeZero();
    // tp__closeZero/перерисовка могут прокрутить страницу — возвращаем позицию.
    [300, 800].forEach((t) => setTimeout(() => window.scrollTo(sx, sy), t));
  }
}

// Публичный вход: сохранить z-index Zero-блока (val — строка числа или null/''
// для сброса). Асинхронно, через очередь.
export function writeZeroZIndex(numericId, val) {
  enqueueWrite(numericId, val);
}
