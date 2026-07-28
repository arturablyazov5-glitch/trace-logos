// ─────────────────────────────────────────────────────────────────────────────
// blog-svg-viewer.js — просмотрщик SVG, встраиваемый в статью блоком
// `:::widget svg-viewer` (разметка: templates/partials/blog-widget-svg-viewer.html,
// стили: css/blog-widget-svg.css).
//
// Всё считается в браузере, файл никуда не отправляется.
//
// БЕЗОПАСНОСТЬ: пользовательский SVG НИКОГДА не попадает в DOM страницы через
// innerHTML — внутри может быть <script>/on*-обработчик, и это был бы XSS на нашем
// домене. Отрисовка идёт через <img src="blob:…"> (скрипты внутри такого SVG браузер
// не исполняет), исходник живёт в <textarea> как значение, а разбор для диагностики —
// в отдельном инертном документе DOMParser, который никуда не вставляется.
// ─────────────────────────────────────────────────────────────────────────────
import { t } from './i18n.js';
import { svgToPngBlob } from './svg-utils.js';

const MAX_BYTES   = 3 * 1024 * 1024;   // больше — это уже не логотип, а карта
const MAX_EDIT_CH = 300_000;           // выше этого правка в textarea начинает тормозить
const EDIT_DELAY  = 350;               // пауза после последнего нажатия перед перерисовкой
const SCALES      = [1, 2, 4];

const ICONS = {
  warn:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  danger: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>',
  ok:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

// Размеры: viewBox — источник правды; width/height берём только как запасной вариант
// и игнорируем проценты (width="100%" не про пиксели).
function readDims(root) {
  const vb = (root.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
  const hasVb = vb.length === 4 && vb.every(Number.isFinite) && vb[2] > 0 && vb[3] > 0;
  const attr = name => {
    const raw = root.getAttribute(name);
    if (!raw || raw.includes('%')) return null;
    const v = parseFloat(raw);
    return Number.isFinite(v) && v > 0 ? v : null;
  };
  const w = attr('width'), h = attr('height');
  if (hasVb) return { hasVb: true, w: w || vb[2], h: h || vb[3], vb: `${vb[0]} ${vb[1]} ${vb[2]} ${vb[3]}` };
  return { hasVb: false, w, h, vb: null };
}

// viewBox нужен и для корректного PNG-экспорта, и для отрисовки в чужих просмотрщиках.
// Если его нет, но есть width/height — дописываем в копию текста (сам файл не трогаем).
function withViewBox(text, d) {
  if (d.hasVb || !d.w || !d.h) return text;
  return text.replace(/<svg\b([^>]*?)(\/?)>/i, (m, attrs, slash) => `<svg${attrs} viewBox="0 0 ${d.w} ${d.h}"${slash}>`);
}

// Разбор в инертном документе: ищем всё, что делает файл проблемным.
function analyze(text) {
  const doc  = new DOMParser().parseFromString(text, 'image/svg+xml');
  const perr = doc.querySelector('parsererror');
  if (perr) {
    // Из служебной простыни браузера оставляем то, что реально помогает: место сбоя.
    const detail = perr.textContent.replace(/\s+/g, ' ').trim()
      .replace(/^.*?(error on line)/i, '$1')            // «This page contains the following errors:»
      .replace(/\s*Below is a rendering.*$/i, '')       // «…up to the first error.»
      .trim();
    return { fatal: 'parse', detail: detail.slice(0, 200) };
  }

  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== 'svg') return { fatal: 'notsvg' };

  const all   = [...root.querySelectorAll('*')];
  const dims  = readDims(root);
  const notes = [];

  // Скрипты и inline-обработчики — не «плохой стиль», а исполняемый код в картинке.
  const hasScript  = !!root.querySelector('script');
  const hasHandler = [root, ...all].some(el => [...el.attributes].some(a => /^on/i.test(a.name)));
  if (hasScript || hasHandler) notes.push(['danger', t('svgvNoteScript')]);

  // Встроенный растр: файл формально SVG, но масштабируется как JPEG.
  if (/data:image\/(png|jpe?g|gif|webp|bmp)/i.test(text)) notes.push(['warn', t('svgvNoteRaster')]);

  // Внешние ссылки — у другого человека или без интернета отрисуется не так.
  if (/(?:href|src|url\()\s*=?\s*["'(]?\s*https?:\/\//i.test(text)) notes.push(['warn', t('svgvNoteExternal')]);

  // Текст не в кривых: на чужом устройстве шрифт подменится.
  const hasText = !!root.querySelector('text, tspan');
  if (hasText && !/@font-face/i.test(text)) notes.push(['warn', t('svgvNoteFont')]);

  if (!dims.hasVb) notes.push(['warn', t('svgvNoteNoViewBox')]);

  if (!notes.length) notes.push(['ok', t('svgvNoteClean')]);

  const shapes = root.querySelectorAll('path, circle, rect, ellipse, line, polyline, polygon').length;
  const colors = new Set();
  for (const el of [root, ...all]) {
    for (const attr of ['fill', 'stroke']) {
      const v = (el.getAttribute(attr) || '').trim().toLowerCase();
      if (v && v !== 'none' && v !== 'currentcolor' && !v.startsWith('url(')) colors.add(v);
    }
    for (const m of (el.getAttribute('style') || '').toLowerCase().matchAll(/(?:fill|stroke)\s*:\s*([^;]+)/g)) {
      const v = m[1].trim();
      if (v && v !== 'none' && v !== 'currentcolor' && !v.startsWith('url(')) colors.add(v);
    }
  }

  return { fatal: null, dims, notes, shapes, colors: colors.size };
}

function init(widget) {
  const $ = sel => widget.querySelector(sel);
  const drop     = $('[data-svgv-drop]');
  const input    = $('[data-svgv-input]');
  const stage    = $('[data-svgv-stage]');
  const canvas   = $('[data-svgv-canvas]');
  const img      = $('[data-svgv-img]');
  const broken   = $('[data-svgv-broken]');
  const codeWrap = $('[data-svgv-codewrap]');
  const editor   = $('[data-svgv-code]');
  const editErr  = $('[data-svgv-editerr]');
  const codeHint = $('.svgv-code-hint');
  const revert   = $('[data-svgv-revert]');
  const info     = $('[data-svgv-info]');
  const notes    = $('[data-svgv-notes]');
  const errBox   = $('[data-svgv-error]');
  const copyBtn  = $('[data-svgv-copy]');
  const dlBtn    = $('[data-svgv-download]');
  const dlLabel  = $('[data-svgv-dl-label]');
  const modal    = $('[data-svgv-modal]');
  const modalCard = $('[data-svgv-card]');
  const modalTitle = $('[data-svgv-modal-title]');
  const fmtRow   = $('[data-svgv-fmt-row]');
  const sizeRow  = $('[data-svgv-size-row]');
  const sizesBox = $('[data-svgv-sizes]');

  let objUrl     = null;   // текущий blob: URL картинки
  let original   = '';     // текст файла, каким его открыли
  let current    = '';     // текст с учётом правок в редакторе
  let exportText = '';     // копия current с гарантированным viewBox — только для PNG
  let fileName   = 'image.svg';
  let fileSize   = 0;
  let dims       = null;
  let edited     = false;
  let view       = 'image';
  let editTimer  = null;
  let dlFmt      = 'png';
  let dlScale    = 2;

  const chip = (k, v) => `<span class="svgv-chip"><span class="svgv-chip-k">${esc(k)}</span><span class="svgv-chip-v">${esc(v)}</span></span>`;

  // Ошибка на входе (файл вообще не открылся) — уводим обратно к дропзоне.
  function showLoadError(title, detail) {
    errBox.innerHTML = `<b>${esc(title)}</b>${detail ? `<code>${esc(detail)}</code>` : ''}`;
    errBox.hidden = false;
    stage.hidden = true;
    drop.hidden = false;
  }

  function setView(next) {
    view = next;
    widget.querySelectorAll('[data-svgv-view]').forEach(btn => {
      const on = btn.dataset.svgvView === next;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', String(on));
    });
    canvas.hidden   = next !== 'image';
    codeWrap.hidden = next !== 'code';
    copyBtn.hidden  = next !== 'code';   // копировать код есть смысл только над кодом
    if (next === 'image') fitImage(dims); // пересчёт по реальной ширине, уже видимой
  }

  // Ширину задаём сами, высоту оставляем auto: пропорции держит сам <img>, а слишком
  // высокие картинки подрезает max-height из CSS (тоже пропорционально) — так значение
  // max-height не приходится дублировать в JS.
  //
  // Правило: широкую картинку растягиваем по доступной ширине, а мелкую иконку
  // увеличиваем — но не сильнее, чем до 300px по длинной стороне, иначе 16×16
  // раздувается на всю статью.
  function fitImage(d) {
    if (!d?.w || !d?.h) { img.style.width = img.style.height = ''; return; }
    const cs   = getComputedStyle(canvas);
    // На вкладке «Код» canvas скрыт и его ширина равна нулю — берём ширину виджета,
    // иначе после правки кода картинка схлопывалась до минимума.
    const box  = (canvas.clientWidth || widget.clientWidth) - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const maxUp = Math.max(1, 300 / Math.max(d.w, d.h));
    const k = Math.min(Math.max(box, 120) / d.w, maxUp);
    img.style.width  = `${Math.round(d.w * k)}px`;
    img.style.height = '';
  }

  function markEdited() {
    edited = current !== original;
    dlLabel.textContent = t(edited ? 'svgvDlFile' : 'svgvDlPng');
    revert.hidden = !edited;
    // После правки логичнее забрать сам SVG. Выбор, сделанный руками в открытой
    // модалке, не перебиваем.
    if (modal.hidden) dlFmt = edited ? 'svg' : 'png';
  }

  // Пересчёт всего, что зависит от текста: картинка, характеристики, замечания.
  // `fromEdit` — правка в редакторе: тогда при ошибке разбора не рушим стадию,
  // а показываем полоску с местом сбоя и оставляем прошлую картинку.
  function apply(text, { fromEdit = false } = {}) {
    const res = analyze(text);
    if (res.fatal) {
      const msg = res.fatal === 'parse' ? t('svgvErrParse') : t('svgvErrNotSvg');
      if (!fromEdit) { showLoadError(msg, res.detail); return false; }
      editErr.textContent = res.detail ? `${msg} ${res.detail}` : msg;
      editErr.hidden = false;
      // Картинка больше не соответствует коду в редакторе — прячем её вместо
      // того, чтобы держать на экране последний успешно собранный рендер.
      canvas.classList.add('is-broken');
      broken.hidden = false;
      return false;
    }

    canvas.classList.remove('is-broken');
    broken.hidden = true;
    editErr.hidden = true;
    current    = text;
    dims       = res.dims;
    exportText = withViewBox(text, res.dims);

    if (objUrl) URL.revokeObjectURL(objUrl);
    objUrl = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml;charset=utf-8' }));
    img.onerror = () => { editErr.textContent = t('svgvErrRender'); editErr.hidden = false; };
    img.src = objUrl;
    img.alt = fileName;

    info.innerHTML = [
      chip(t('svgvInfoSize'), fmtBytes(fromEdit ? new Blob([text]).size : fileSize)),
      dims.w && dims.h ? chip(t('svgvInfoDims'), `${+dims.w.toFixed(0)} × ${+dims.h.toFixed(0)}`) : '',
      dims.vb ? chip('viewBox', dims.vb) : '',
      chip(t('svgvInfoShapes'), String(res.shapes)),
      chip(t('svgvInfoColors'), String(res.colors)),
      // Почему кнопка вдруг называется «Скачать файл» — видно прямо здесь.
      edited ? `<span class="svgv-chip svgv-chip-edited">${esc(t('svgvInfoEdited'))}</span>` : '',
    ].filter(Boolean).join('');

    notes.innerHTML = res.notes
      .map(([kind, msg]) => `<div class="svgv-note svgv-note-${kind}">${ICONS[kind]}<span>${msg}</span></div>`)
      .join('');

    return true;
  }

  function load(text, name, size) {
    fileName = name;
    fileSize = size;
    original = text;
    current  = text;
    edited   = false;
    canvas.classList.remove('is-broken');
    broken.hidden = true;

    errBox.hidden = true;
    drop.hidden   = true;
    stage.hidden  = false;
    setView('image');

    if (!apply(text)) return;

    editor.value    = text;
    editor.readOnly = text.length > MAX_EDIT_CH;
    codeHint.textContent = editor.readOnly ? t('svgvCodeTooBig') : t('svgvCodeHint');
    markEdited();
    fitImage(dims);   // после показа: до этого у canvas нулевая ширина
  }

  function readFile(file) {
    if (!file) return;
    const isSvg = /\.svg$/i.test(file.name) || file.type === 'image/svg+xml';
    if (!isSvg)                return showLoadError(t('svgvErrNotSvg'), file.name);
    if (file.size > MAX_BYTES) return showLoadError(t('svgvErrTooBig')(Math.round(MAX_BYTES / 1024 / 1024)));

    const reader = new FileReader();
    reader.onload  = () => load(String(reader.result), file.name, file.size);
    reader.onerror = () => showLoadError(t('svgvErrRead'));
    reader.readAsText(file);
  }

  function reset() {
    if (objUrl) { URL.revokeObjectURL(objUrl); objUrl = null; }
    clearTimeout(editTimer);
    img.removeAttribute('src');
    img.style.width = img.style.height = '';
    canvas.classList.remove('is-broken');
    broken.hidden = true;
    editor.value = '';
    original = current = exportText = '';
    dims = null;
    edited = false;
    stage.hidden = true;
    drop.hidden = false;
    errBox.hidden = true;
    editErr.hidden = true;
    input.value = '';
    setView('image');
  }

  // Поворот экрана / изменение окна — пересчитываем ширину картинки.
  let fitRaf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(fitRaf);
    fitRaf = requestAnimationFrame(() => { if (dims && view === 'image') fitImage(dims); });
  });

  // ── Ввод: кнопка, drag&drop, вставка из буфера ──
  $('[data-svgv-pick]').addEventListener('click', () => input.click());
  input.addEventListener('change', () => readFile(input.files[0]));

  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => {
    e.preventDefault(); drop.classList.add('is-over');
  }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => {
    e.preventDefault(); drop.classList.remove('is-over');
  }));
  drop.addEventListener('drop', e => readFile(e.dataTransfer?.files?.[0]));

  // Глобальная вставка: реагируем только если в буфере реально SVG — иначе не мешаем
  // обычному копипасту на странице. Правку кода в редакторе не перехватываем.
  document.addEventListener('paste', e => {
    if (e.target === editor) return;
    const file = [...(e.clipboardData?.files || [])].find(f => /\.svg$/i.test(f.name) || f.type === 'image/svg+xml');
    if (file) { e.preventDefault(); readFile(file); return; }
    const text = e.clipboardData?.getData('text/plain') || '';
    if (/^\s*(<\?xml|<svg[\s>])/i.test(text)) {
      e.preventDefault();
      load(text, 'clipboard.svg', new Blob([text]).size);
      widget.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  // ── Правка кода: пересобираем картинку с паузой после последнего нажатия ──
  editor.addEventListener('input', () => {
    clearTimeout(editTimer);
    editTimer = setTimeout(() => {
      const text = editor.value;
      current = text;              // считаем изменённым даже если разбор упал
      markEdited();
      apply(text, { fromEdit: true });
      if (dims) fitImage(dims);
    }, EDIT_DELAY);
  });

  revert.addEventListener('click', () => {
    editor.value = original;
    current = original;
    markEdited();
    apply(original, { fromEdit: true });
    fitImage(dims);
  });

  // ── Панель ──
  widget.querySelectorAll('[data-svgv-view]').forEach(btn =>
    btn.addEventListener('click', () => setView(btn.dataset.svgvView)));

  widget.querySelectorAll('[data-svgv-bg]').forEach(btn => btn.addEventListener('click', () => {
    canvas.dataset.bg = btn.dataset.svgvBg;
    widget.querySelectorAll('[data-svgv-bg]').forEach(b => b.classList.toggle('is-active', b === btn));
  }));

  copyBtn.addEventListener('click', async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current);
      const label = copyBtn.querySelector('span');
      const prev  = label.textContent;
      label.textContent = t('svgvCopied');
      copyBtn.classList.add('is-copied');
      setTimeout(() => { label.textContent = prev; copyBtn.classList.remove('is-copied'); }, 1600);
    } catch { editErr.textContent = t('svgvErrCopy'); editErr.hidden = false; }
  });

  // ── Модалка скачивания ──
  function paintSizes() {
    const base = dims?.h || 512;
    const baseW = dims?.w || 512;
    sizesBox.innerHTML = SCALES.map(s => `
      <button type="button" class="svgv-size${s === dlScale ? ' is-active' : ''}" data-svgv-scale="${s}">
        <span class="svgv-size-x">${s}×</span>
        <span class="svgv-size-px">${Math.round(baseW * s)}×${Math.round(base * s)}</span>
      </button>`).join('');
  }

  function paintModal() {
    modalTitle.textContent = t(edited ? 'svgvDlFile' : 'svgvDlPng');
    fmtRow.hidden  = !edited;              // без правок скачивать SVG незачем — он уже есть
    sizeRow.hidden = dlFmt !== 'png';
    widget.querySelectorAll('[data-svgv-fmt]').forEach(b =>
      b.classList.toggle('is-active', b.dataset.svgvFmt === dlFmt));
    paintSizes();
  }

  let lastFocus = null;
  function openModal() {
    if (!current) return;
    lastFocus = document.activeElement;
    paintModal();
    modal.hidden = false;
    modalCard.focus();
  }
  function closeModal() {
    modal.hidden = true;
    lastFocus?.focus?.();
  }

  dlBtn.addEventListener('click', openModal);
  widget.querySelectorAll('[data-svgv-close]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  widget.querySelectorAll('[data-svgv-fmt]').forEach(btn => btn.addEventListener('click', () => {
    dlFmt = btn.dataset.svgvFmt;
    paintModal();
  }));

  sizesBox.addEventListener('click', e => {
    const btn = e.target.closest('[data-svgv-scale]');
    if (!btn) return;
    dlScale = Number(btn.dataset.svgvScale);
    paintSizes();
  });

  function saveBlob(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  $('[data-svgv-go]').addEventListener('click', async () => {
    const base = fileName.replace(/\.svg$/i, '');
    try {
      if (dlFmt === 'svg') {
        saveBlob(new Blob([current], { type: 'image/svg+xml;charset=utf-8' }), `${base}.svg`);
      } else {
        const px = (dims?.h || 512) * dlScale;
        const blob = await svgToPngBlob(exportText, { size: Math.max(16, Math.round(px)) });
        saveBlob(blob, `${base}@${dlScale}x.png`);
      }
      closeModal();
    } catch {
      closeModal();
      editErr.textContent = t('svgvErrPng');
      editErr.hidden = false;
    }
  });

  $('[data-svgv-reset]').addEventListener('click', reset);
}

document.querySelectorAll('[data-svg-viewer]').forEach(init);
