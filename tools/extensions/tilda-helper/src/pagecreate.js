// ВРЕМЕННО (Friday 37, 2026-07-23): массовое создание технических страниц
// плана в Тильде — одной кнопкой создаёт все URL, под которые plan.html
// делает роутинг по location.pathname (см. проект Friday 37,
// «Планировки/plan.html», parsePath()). Расширение общее для всех Тильда-
// проектов пользователя, поэтому кнопка показывается ТОЛЬКО на этом
// конкретном projectid — на других сайтах не всплывает.
//
// API (реверс, снят Network-логом при ручном создании тестовой страницы
// 2026-07-23):
//   1. POST /projects/submit/ comm=addnewpagedublicateexample
//      {projectid, examplepageid, folderid, csrf} → дублирует системный
//      ПУСТОЙ шаблон (examplepageid=1231) и возвращает numeric pageid
//      (голым текстом, не JSON).
//   2. POST /projects/submit/ comm=savepagesettings
//      {pageid, title, alias, sort, folderid, date, csrf, jssubmit:'y', ...}
//      → 'OK'. alias — это и есть URL-путь страницы, ПОДДЕРЖИВАЕТ "/"
//      (проверено: alias=trst%2Fead создал страницу по пути /trst/ead).
//
// Кнопка НЕ вставляет HTML-код в страницы — только создаёт пустые страницы
// с правильным путём. T123-блок с кодом plan.html пользователь вставляет
// сам на каждой (так и было задумано с самого начала).
//
// Убрать целиком после использования: этот файл + import/вызов в index.js.

const FRIDAY37_PROJECT_ID = '11006165';
const BLANK_EXAMPLE_PAGE_ID = '1231';

const TOWNS = ['eclipse', 'sunrise', 'sunset', 'grande', 'double'];
const TOWN_LABEL = {
  eclipse: 'Eclipse', sunrise: 'Sunrise', sunset: 'Sunset',
  grande: 'Grande', double: 'Double',
};
// Как LEVELS в plan.html (см. Планировки/plan.html).
const FLOOR_SLUGS = ['1', '2', '3', '-1', 'mezzanine', 'roof'];
const FLOOR_LABEL = {
  '1': 'этаж 1', '2': 'этаж 2', '3': 'этаж 3', '-1': 'этаж -1',
  mezzanine: 'антресоль', roof: 'кровля',
};

// floorSlugPart(f) из plan.html: числовой этаж → 'floor-N', иначе как есть
// (используется ТОЛЬКО для вида «весь этаж», без тауна).
function floorSlugPart(f) {
  return /^-?\d+$/.test(f) ? 'floor-' + f : f;
}

// Список всех страниц: RU + EN (/en-префикс), раздел дома + весь этаж +
// таун (bare, дефолт этаж 1) + таун/этаж — см. friday37_architecture.md.
function buildPageList() {
  const pages = [];
  const push = (alias, title) => pages.push({ alias, title });

  function lang(prefix) {
    push(prefix + 'plan', 'План — разрез дома');
    FLOOR_SLUGS.forEach((f) =>
      push(prefix + 'plan/' + floorSlugPart(f), 'План — ' + FLOOR_LABEL[f] + ' (весь этаж)')
    );
    TOWNS.forEach((town) => {
      const label = TOWN_LABEL[town];
      push(prefix + 'plan/' + town, 'План — ' + label);
      // per-town URL ВСЕГДА 'floor-' + f (см. unitUrl() в plan.html), даже
      // для mezzanine/roof/-1 — НЕ floorSlugPart.
      FLOOR_SLUGS.forEach((f) =>
        push(prefix + 'plan/' + town + '/floor-' + f, 'План — ' + label + ', ' + FLOOR_LABEL[f])
      );
    });
  }

  lang('');
  lang('en/');

  return pages;
}

function getProjectId() {
  return new URLSearchParams(location.search).get('projectid') || String(window.projectid || '');
}

function csrf() {
  return (typeof window.getCSRF === 'function' && window.getCSRF()) || window.csrf || '';
}

// Ответ-страница логина (сессия слетела/разлогинило) вместо ожидаемого
// текста/JSON — верный признак, что дальше долбить API нельзя ни в коем
// случае (см. инцидент 2026-07-23: без этой проверки пакетный ран продолжил
// стучаться в мёртвую сессию ещё ~20 раз подряд).
function looksLikeLoginPage(res) {
  return typeof res === 'string' && /Авторизация - Tilda|ts-page-login/.test(res);
}

function ajax(data) {
  return new Promise((resolve, reject) => {
    if (typeof window.td__ajax !== 'function') { reject(new Error('td__ajax недоступен')); return; }
    window.td__ajax({
      url: '/projects/submit/',
      dataToSend: Object.assign({ csrf: csrf() }, data),
      ui: { ctext: 'th: Friday37 batch' },
      onSuccess: (res) => {
        if (looksLikeLoginPage(res)) reject(new SessionDeadError());
        else if (isDailyLimitMessage(res)) reject(new DailyLimitError(res));
        else resolve(res);
      },
      onError: (res) => {
        if (looksLikeLoginPage(res)) reject(new SessionDeadError());
        else if (isDailyLimitMessage(res)) reject(new DailyLimitError(res));
        else reject(new Error(typeof res === 'string' ? res.slice(0, 300) : 'ошибка запроса'));
      },
    });
  });
}

// Отдельный класс ошибки — чтобы runBatch мог достоверно отличить «сессия
// умерла, остановить ВСЁ немедленно» от обычной ошибки одной страницы
// (дубль alias и т.п.), которую можно залогировать и продолжить.
class SessionDeadError extends Error {
  constructor() {
    super('сессия Тильды недействительна (похоже на разлогин) — батч остановлен');
  }
}

// Дневной лимит тарифа Тильды на создание страниц (100/день, см. инцидент
// 2026-07-23: "Today you created maximum (100) pages..."). Безобидно (не
// разлогин, не бан), но повторять оставшиеся страницы бессмысленно — все
// они получат тот же отказ до завтра. Останавливаем батч сразу, без
// дальнейших запросов.
class DailyLimitError extends Error {
  constructor(raw) {
    super('дневной лимит страниц тарифа Тильды исчерпан — остальное создастся завтра тем же запуском (' + raw + ')');
  }
}

function isDailyLimitMessage(res) {
  return typeof res === 'string' && /maximum \(\d+\) pages/i.test(res);
}

function nowDateStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

// Уже существующие пути (по window.pages) — чтобы повторный запуск (после
// сбоя на середине) не плодил дубли уже созданных страниц.
function existingAliasSet() {
  const set = new Set();
  if (Array.isArray(window.pages)) {
    window.pages.forEach((p) => {
      if (p && !p.trash && p.alias) {
        set.add(String(p.alias).trim().replace(/^\/+|\/+$/g, '').toLowerCase());
      }
    });
  }
  return set;
}

async function createOnePage(projectid, entry, sort) {
  const newId = await ajax({
    comm: 'addnewpagedublicateexample',
    projectid,
    examplepageid: BLANK_EXAMPLE_PAGE_ID,
    folderid: '',
  });
  if (!Number.isFinite(Number(newId))) throw new Error('addnewpagedublicateexample: ' + newId);

  // ВСЕ поля родной формы, включая пустые файловые — savepagesettings
  // отбивает запрос с "No imgfile!", если ключа вообще нет в теле (см.
  // инцидент 2026-07-23), даже когда значение пустое. Список — 1-в-1 из
  // реального запроса, снятого Network-логом.
  const res = await ajax({
    comm: 'savepagesettings',
    pageid: newId,
    title: entry.title,
    descr: '',
    alias: entry.alias,
    imgfile: '',
    'img-tuinfo-uuid': '',
    'img-tuinfo-cdnurl': '',
    'img-tuinfo-name': '',
    'img-tuinfo-width': '',
    'img-tuinfo-size': '',
    fb_title: '',
    fb_descr: '',
    fb_imgfile: '',
    'fb_img-tuinfo-uuid': '',
    'fb_img-tuinfo-cdnurl': '',
    'fb_img-tuinfo-name': '',
    'fb_img-tuinfo-width': '',
    'fb_img-tuinfo-size': '',
    fb_img: '',
    fb_url: '',
    fb_appid: '',
    twitter_site: '',
    meta_title: '',
    meta_descr: '',
    meta_keywords: '',
    link_canonical: '',
    sort: String(sort),
    label: '',
    comment: '',
    folderid: '',
    writing_direction: '',
    date: nowDateStr(),
    tag: '',
    shorttitle: '',
    customlink: '',
    featureimgfile: '',
    'featureimg-tuinfo-uuid': '',
    'featureimg-tuinfo-cdnurl': '',
    'featureimg-tuinfo-name': '',
    'featureimg-tuinfo-width': '',
    'featureimg-tuinfo-size': '',
    viewpassword: '',
    jssubmit: 'y',
  });
  if (String(res).trim() !== 'OK') throw new Error('savepagesettings: ' + res);
  return newId;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ---------------------------------------------------------------------------
// UI: плавающая панель с кнопкой и логом прогресса
// ---------------------------------------------------------------------------

const PANEL_ID = 'th-f37-panel';

// Флаг «остановить» — проверяется между каждой страницей батча (см. runBatch).
// Модуль-уровня, не локальная переменная: кнопка «Стоп» должна достучаться
// до уже запущенного цикла независимо от того, как он был вызван.
let stopRequested = false;

function ensurePanel() {
  let panel = document.getElementById(PANEL_ID);
  if (panel) return panel;
  panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.style.cssText =
    'position:fixed;right:16px;bottom:16px;z-index:99999;background:#1e1e1e;color:#eee;' +
    'font:12px/1.4 -apple-system,Arial,sans-serif;border-radius:10px;padding:12px 14px;' +
    'box-shadow:0 6px 24px rgba(0,0,0,.35);max-width:360px;';
  panel.innerHTML =
    '<div style="font-weight:600;margin-bottom:6px;">Friday 37 — создать страницы плана (врем.)</div>' +
    '<div style="display:flex;gap:8px;">' +
    '<button type="button" id="th-f37-run" style="padding:6px 12px;border:0;border-radius:6px;background:#4a8;color:#fff;cursor:pointer;font:inherit;font-weight:600;">Создать все страницы</button>' +
    '<button type="button" id="th-f37-stop" disabled style="padding:6px 12px;border:0;border-radius:6px;background:#a44;color:#fff;cursor:pointer;font:inherit;font-weight:600;opacity:.5;">Остановить</button>' +
    '</div>' +
    '<div id="th-f37-log" style="margin-top:8px;max-height:220px;overflow:auto;white-space:pre-wrap;"></div>';
  document.body.appendChild(panel);
  panel.querySelector('#th-f37-run').addEventListener('click', () => {
    runBatch().catch((e) => log('Общая ошибка: ' + e.message));
  });
  panel.querySelector('#th-f37-stop').addEventListener('click', () => {
    stopRequested = true;
    log('⏸ Остановка запрошена — досчитаю текущий запрос и встану на паузу.');
  });
  return panel;
}

function setRunningUI(running) {
  const runBtn = document.getElementById('th-f37-run');
  const stopBtn = document.getElementById('th-f37-stop');
  if (runBtn) runBtn.disabled = running;
  if (stopBtn) { stopBtn.disabled = !running; stopBtn.style.opacity = running ? '1' : '.5'; }
}

function log(text) {
  ensurePanel();
  const el = document.getElementById('th-f37-log');
  el.textContent += text + '\n';
  el.scrollTop = el.scrollHeight;
}

async function runBatch() {
  stopRequested = false;
  setRunningUI(true);
  document.getElementById('th-f37-log').textContent = '';
  const projectid = getProjectId();
  const pages = buildPageList();
  const existing = existingAliasSet();
  const already = pages.filter((p) => existing.has(p.alias.toLowerCase())).length;
  log('Всего в списке: ' + pages.length + ', уже существует: ' + already);

  let created = 0, skipped = 0, failed = 0;
  let sort = 100;
  for (const entry of pages) {
    if (stopRequested) {
      log('⏹ Остановлено пользователем на /' + entry.alias + '. Уже созданные страницы никуда не делись.');
      setRunningUI(false);
      return;
    }
    const key = entry.alias.toLowerCase();
    if (existing.has(key)) { skipped++; continue; }
    try {
      const id = await createOnePage(projectid, entry, sort);
      created++;
      log('✓ /' + entry.alias + ' → страница #' + id);
    } catch (e) {
      if (e instanceof SessionDeadError) {
        // Сессия мертва — дальше долбить нечего и опасно (см. инцидент
        // 2026-07-23): останавливаем ВЕСЬ батч немедленно, а не идём дальше
        // по списку с уже недействительной сессией.
        log('⛔ ' + e.message + '. Остановлено на /' + entry.alias + '.');
        log('Перезайдите в Тильду и запустите кнопку снова — уже созданные страницы не задвоятся.');
        setRunningUI(false);
        return;
      }
      if (e instanceof DailyLimitError) {
        // Дневной лимит тарифа — безобидно, но остальные попытки сегодня
        // гарантированно провалятся тем же способом (см. инцидент 2026-07-23:
        // 45/56 создано, оставшиеся 11 упёрлись в лимит). Не тратим оставшиеся
        // запросы впустую.
        log('⏳ ' + e.message + '. Остановлено на /' + entry.alias + '.');
        log('Создано ' + created + ' страниц. Запустите кнопку снова завтра — оставшиеся создадутся, уже готовые пропустятся.');
        setRunningUI(false);
        return;
      }
      failed++;
      log('✗ /' + entry.alias + ' — ' + e.message);
    }
    sort += 10;
    // Долгая пауза между страницами — намеренно медленно (см. инцидент
    // 2026-07-23: частые программные POST triggerили защиту Тильды и
    // разлогинивали аккаунт). Лучше 3 минуты на весь батч, чем повтор бана.
    await sleep(2800);
  }
  log('Готово. Создано: ' + created + ', пропущено (уже было): ' + skipped + ', ошибок: ' + failed);
  setRunningUI(false);
}

export function initFriday37PageBatch() {
  if (getProjectId() !== FRIDAY37_PROJECT_ID) return;
  ensurePanel();
}
