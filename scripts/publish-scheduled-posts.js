#!/usr/bin/env node
/**
 * Публикация постов блога по контент-плану.
 *
 * Посты в blog/posts/*.md датированы вперёд (frontmatter `date:`), публикуются
 * пачками по одной на день. Скрипт временно прячет ещё не наступившие посты,
 * снимает markdown-разметку с forward-ссылок на них в других постах, снимает
 * HTML-ссылки на них из about-текстов логотипов (logos/categories/*.json)
 * и пересобирает сайт — чтобы в прод уехало ровно то, что уже наступило.
 * Деплой скрипт НЕ делает.
 *
 * Режимы:
 *   node scripts/publish-scheduled-posts.js           — спрятать future и собрать
 *   node scripts/publish-scheduled-posts.js restore    — вернуть всё и пересобрать
 *   node scripts/publish-scheduled-posts.js status     — только отчёт, ничего не трогает
 *
 * Флаги:
 *   --force      прятать future даже если на сегодня нет новой пачки
 *   --no-build   не запускать npm run build (для отладки самого скрипта)
 *
 * Типовой цикл:
 *   1) node scripts/publish-scheduled-posts.js
 *   2) vercel --prod --yes --archive=tgz      (руками)
 *   3) node scripts/publish-scheduled-posts.js restore
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'blog', 'posts');
const CATEGORIES_DIR = path.join(ROOT, 'logos', 'categories');
const HOLD_ROOT = path.join(ROOT, '.blog-embargo-backup');
const HELD_DIR = path.join(HOLD_ROOT, 'future-posts');
const LINKS_DIR = path.join(HOLD_ROOT, 'link-backup');
const CATALOG_LINKS_DIR = path.join(HOLD_ROOT, 'catalog-link-backup');
const STATE_FILE = path.join(HOLD_ROOT, 'state.json');

const argv = process.argv.slice(2);
const mode = argv.find((a) => !a.startsWith('-')) || 'hold';
const FORCE = argv.includes('--force');
const NO_BUILD = argv.includes('--no-build');

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  b: (s) => `\x1b[1m${s}\x1b[0m`,
  g: (s) => `\x1b[32m${s}\x1b[0m`,
  y: (s) => `\x1b[33m${s}\x1b[0m`,
  r: (s) => `\x1b[31m${s}\x1b[0m`,
};

function die(msg) {
  console.error(`\n${c.r('✗')} ${msg}\n`);
  process.exit(1);
}

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Разбор frontmatter: только то, что нужно — date и title. */
function readPost(file) {
  const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
  const fm = raw.startsWith('---') ? raw.slice(3, raw.indexOf('\n---', 3)) : '';
  const date = (fm.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m) || [])[1];
  const title = (fm.match(/^title:\s*(.+)$/m) || [])[1] || '';
  // slug берём из frontmatter — именно он даёт URL в build-blog.js. Сейчас он
  // всегда равен имени файла, но если разойдётся, стрип ссылок промахнётся молча.
  const slug = ((fm.match(/^slug:\s*(\S+)/m) || [])[1] || file.replace(/\.md$/, '')).trim();
  if (!date) die(`в blog/posts/${file} нет валидного поля date: в frontmatter`);
  return { file, slug, date, title: title.trim() };
}

function allPosts() {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map(readPost)
    .sort((a, b) => a.date.localeCompare(b.date) || a.slug.localeCompare(b.slug));
}

function split(posts, day) {
  return {
    due: posts.filter((p) => p.date <= day),
    todays: posts.filter((p) => p.date === day),
    future: posts.filter((p) => p.date > day),
  };
}

function readState() {
  if (!fs.existsSync(STATE_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    die(`${path.relative(ROOT, STATE_FILE)} повреждён — разберись руками, ничего не трогаю`);
  }
}

function runBuild(label) {
  if (NO_BUILD) {
    console.log(c.y(`\n⚠ --no-build: пропускаю сборку (${label})`));
    return;
  }
  console.log(c.b(`\n▶ npm run build  ${c.dim(`(${label})`)}\n`));
  const res = spawnSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'inherit' });
  if (res.status !== 0) {
    die(
      `сборка упала (exit ${res.status}). Рабочая копия осталась как есть — ` +
        `почини причину и повтори. Вернуть полный набор постов: node scripts/publish-scheduled-posts.js restore`
    );
  }
}

/* ─────────────────────────── status ─────────────────────────── */

function cmdStatus() {
  const day = today();
  const state = readState();
  const posts = allPosts();
  const { due, todays, future } = split(posts, day);

  console.log(`\n${c.b('Контент-план блога')}   ${c.dim(day)}`);
  console.log(`  всего постов:      ${posts.length}`);
  console.log(`  уже наступило:     ${due.length}`);
  console.log(`  из них сегодня:    ${todays.length}`);
  console.log(`  ещё впереди:       ${future.length}`);

  if (state) {
    const catalogPatched = state.catalogPatched || [];
    console.log(
      c.y(`\n⚠ сейчас активен hold от ${state.date}: спрятано ${state.held.length} постов, ` +
        `поправлено ссылок в постах ${state.patched.reduce((n, p) => n + p.count, 0)}, ` +
        `в каталоге ${catalogPatched.reduce((n, p) => n + p.count, 0)}`)
    );
    console.log(c.dim('  вернуть: node scripts/publish-scheduled-posts.js restore'));
  }

  if (todays.length) {
    console.log(`\n${c.b('Пачка на сегодня:')}`);
    for (const p of todays) console.log(`  • ${p.slug}  ${c.dim(p.title)}`);
  }
  if (future.length) {
    const next = future[0].date;
    console.log(`\n  ближайшая будущая пачка: ${next} (${future.filter((p) => p.date === next).length} шт.)`);
    console.log(`  последняя дата плана:    ${future[future.length - 1].date}`);
  } else if (state) {
    console.log(c.dim('\n  (счётчики выше — только по постам в blog/posts; спрятанные не учтены)'));
  } else {
    console.log(c.g('\n✓ будущих постов не осталось — контент-план исчерпан'));
  }
  console.log();
}

/* ──────────────────────────── hold ──────────────────────────── */

function ensureCleanHoldDirs() {
  const state = readState();
  if (state) {
    die(
      `уже активен hold от ${state.date} (${state.held.length} постов спрятано). ` +
        `Сначала: node scripts/publish-scheduled-posts.js restore`
    );
  }
  // Остатки от старых ручных прогонов: безопасно снести, только если каждый
  // файл-остаток уже лежит в blog/posts (значит, восстановление прошло копией).
  for (const dir of [HELD_DIR, LINKS_DIR]) {
    if (!fs.existsSync(dir)) continue;
    const stray = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
    const lost = stray.filter((f) => !fs.existsSync(path.join(POSTS_DIR, f)));
    if (lost.length) {
      die(
        `в ${path.relative(ROOT, dir)} лежат файлы, которых нет в blog/posts: ` +
          `${lost.join(', ')}. Похоже на недовосстановленный прогон — разберись руками.`
      );
    }
    if (stray.length) console.log(c.dim(`  чищу остатки прошлого прогона: ${path.relative(ROOT, dir)} (${stray.length})`));
    fs.rmSync(dir, { recursive: true, force: true });
  }
  // То же самое для бэкапов логотипов, только сверяем с logos/categories.
  if (fs.existsSync(CATALOG_LINKS_DIR)) {
    const stray = fs.readdirSync(CATALOG_LINKS_DIR).filter((f) => f.endsWith('.json'));
    const lost = stray.filter((f) => !fs.existsSync(path.join(CATEGORIES_DIR, f)));
    if (lost.length) {
      die(
        `в ${path.relative(ROOT, CATALOG_LINKS_DIR)} лежат файлы, которых нет в logos/categories: ` +
          `${lost.join(', ')}. Похоже на недовосстановленный прогон — разберись руками.`
      );
    }
    if (stray.length) console.log(c.dim(`  чищу остатки прошлого прогона: ${path.relative(ROOT, CATALOG_LINKS_DIR)} (${stray.length})`));
    fs.rmSync(CATALOG_LINKS_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(HELD_DIR, { recursive: true });
  fs.mkdirSync(LINKS_DIR, { recursive: true });
  fs.mkdirSync(CATALOG_LINKS_DIR, { recursive: true });
}

/** [текст](../slug/) → текст, для слагов из held. Возвращает число замен. */
function stripForwardLinks(text, slugs) {
  const re = new RegExp(`\\[([^\\]\\n]+)\\]\\(\\.\\./(?:${slugs.join('|')})/\\)`, 'g');
  let count = 0;
  const out = text.replace(re, (_, anchor) => {
    count++;
    return anchor;
  });
  return { out, count };
}

/**
 * <a href="/blog/slug/">текст</a> → текст, для слагов из held.
 * Работает на сыром тексте JSON-файла (about-поля хранят HTML внутри
 * JSON-строки с экранированными кавычками \" — поэтому regex, а не JSON.parse:
 * так правка остаётся точечной и не переформатирует остальной файл).
 * Возвращает число замен.
 */
function stripCatalogLinks(text, slugs) {
  const re = new RegExp(`<a href=\\\\"/blog/(?:${slugs.join('|')})/\\\\">([^<]*)<\\/a>`, 'g');
  let count = 0;
  const out = text.replace(re, (_, anchor) => {
    count++;
    return anchor;
  });
  return { out, count };
}

function cmdHold() {
  // Проверка ДО любых расчётов: при активном hold будущие посты лежат вне
  // blog/posts, и любая арифметика по датам соврёт («будущих нет» = «план исчерпан»).
  const active = readState();
  if (active) {
    die(
      `уже активен hold от ${active.date}: спрятано ${active.held.length} постов. ` +
        `Задеплой то, что собрано, и верни всё обратно: node scripts/publish-scheduled-posts.js restore`
    );
  }

  const day = today();
  const posts = allPosts();
  const { due, todays, future } = split(posts, day);

  console.log(`\n${c.b('Публикация по расписанию')}   ${c.dim(day)}`);
  console.log(`  всего ${posts.length} · наступило ${due.length} · сегодня ${todays.length} · впереди ${future.length}`);

  if (!todays.length && !FORCE) {
    console.log(c.g('\n✓ на сегодня новых статей по расписанию нет — сайт не трогаю'));
    if (!future.length) console.log(c.g('✓ будущих постов не осталось: контент-план исчерпан'));
    console.log();
    return;
  }
  if (!future.length) {
    console.log(c.g('\n✓ будущих постов нет — прятать нечего, собираю полный набор'));
    runBuild('полный набор');
    console.log(c.g('\n✓ готово. Это последняя пачка: контент-план исчерпан.'));
    console.log(c.dim('  деплой: vercel --prod --yes --archive=tgz'));
    console.log(c.dim('  restore не нужен — ничего не пряталось\n'));
    return;
  }

  const dirty = spawnSync('git', ['status', '--porcelain', 'blog/posts'], { cwd: ROOT, encoding: 'utf8' });
  if (dirty.stdout && dirty.stdout.trim()) {
    console.log(c.y(`\n⚠ в blog/posts есть незакоммиченные изменения (${dirty.stdout.trim().split('\n').length} файлов) — они сохранятся, но имей в виду`));
  }

  ensureCleanHoldDirs();

  // 1. Прячем будущие посты.
  const held = future.map((p) => p.file);
  for (const f of held) fs.renameSync(path.join(POSTS_DIR, f), path.join(HELD_DIR, f));
  console.log(`\n  спрятано будущих постов: ${held.length}  ${c.dim('→ ' + path.relative(ROOT, HELD_DIR))}`);

  // 2. Снимаем разметку с forward-ссылок на спрятанные посты.
  const heldSlugs = future.map((p) => p.slug);
  const patched = [];
  for (const p of due) {
    const src = path.join(POSTS_DIR, p.file);
    const text = fs.readFileSync(src, 'utf8');
    const { out, count } = stripForwardLinks(text, heldSlugs);
    if (!count) continue;
    fs.copyFileSync(src, path.join(LINKS_DIR, p.file));
    fs.writeFileSync(src, out);
    patched.push({ file: p.file, count });
  }
  const totalLinks = patched.reduce((n, p) => n + p.count, 0);
  console.log(`  снято forward-ссылок:    ${totalLinks} в ${patched.length} постах  ${c.dim('(оригиналы в ' + path.relative(ROOT, LINKS_DIR) + ')')}`);

  // 2b. То же самое для HTML-ссылок на спрятанные посты в about-текстах логотипов.
  const catalogFiles = fs.readdirSync(CATEGORIES_DIR).filter((f) => f.endsWith('.json'));
  const catalogPatched = [];
  for (const file of catalogFiles) {
    const src = path.join(CATEGORIES_DIR, file);
    const text = fs.readFileSync(src, 'utf8');
    const { out, count } = stripCatalogLinks(text, heldSlugs);
    if (!count) continue;
    fs.copyFileSync(src, path.join(CATALOG_LINKS_DIR, file));
    fs.writeFileSync(src, out);
    catalogPatched.push({ file, count });
  }
  const totalCatalogLinks = catalogPatched.reduce((n, p) => n + p.count, 0);
  console.log(`  снято ссылок из каталога: ${totalCatalogLinks} в ${catalogPatched.length} файлах  ${c.dim('(оригиналы в ' + path.relative(ROOT, CATALOG_LINKS_DIR) + ')')}`);

  fs.writeFileSync(STATE_FILE, JSON.stringify({ mode: 'held', date: day, held, patched, catalogPatched }, null, 2));

  // 3. Сборка (build-all сам гоняет test-data/test-html/test-links и падает на битой ссылке).
  runBuild('без будущих постов');

  console.log(`\n${c.g('✓ готово к деплою')}`);
  if (todays.length) {
    console.log(`\n${c.b('Опубликовано сегодня:')} ${todays.length}`);
    for (const p of todays) console.log(`  • ${p.slug}  ${c.dim(p.title)}`);
  }
  console.log(`\n${c.b('Дальше:')}`);
  console.log(`  1) vercel --prod --yes --archive=tgz`);
  console.log(`  2) node scripts/publish-scheduled-posts.js restore`);
  console.log(c.y(`\n  ⚠ пока не сделан restore, в рабочей копии нет ${held.length} будущих постов\n`));
}

/* ────────────────────────── restore ─────────────────────────── */

function cmdRestore() {
  const state = readState();
  if (!state) {
    const leftovers = fs.existsSync(HELD_DIR) ? fs.readdirSync(HELD_DIR).filter((f) => f.endsWith('.md')) : [];
    if (!leftovers.length) {
      console.log(c.g('\n✓ активного hold нет — восстанавливать нечего\n'));
      return;
    }
    die(`нет ${path.relative(ROOT, STATE_FILE)}, но в future-posts лежит ${leftovers.length} файлов — разберись руками`);
  }

  console.log(`\n${c.b('Восстановление')}   ${c.dim('hold от ' + state.date)}`);

  // 1. Возвращаем оригинальный текст постов со ссылками.
  for (const { file } of state.patched) {
    const backup = path.join(LINKS_DIR, file);
    if (!fs.existsSync(backup)) die(`пропал бэкап ${path.relative(ROOT, backup)} — не могу вернуть ссылки в ${file}`);
    fs.copyFileSync(backup, path.join(POSTS_DIR, file));
  }
  console.log(`  вернул ссылки:      ${state.patched.reduce((n, p) => n + p.count, 0)} в ${state.patched.length} постах`);

  // 1b. Возвращаем оригинальные about-тексты логотипов со ссылками.
  const catalogPatched = state.catalogPatched || []; // старые state.json (до этой доработки) поля не имеют — просто пропускаем
  for (const { file } of catalogPatched) {
    const backup = path.join(CATALOG_LINKS_DIR, file);
    if (!fs.existsSync(backup)) die(`пропал бэкап ${path.relative(ROOT, backup)} — не могу вернуть ссылки в ${file}`);
    fs.copyFileSync(backup, path.join(CATEGORIES_DIR, file));
  }
  if (catalogPatched.length) {
    console.log(`  вернул ссылки в каталоге: ${catalogPatched.reduce((n, p) => n + p.count, 0)} в ${catalogPatched.length} файлах`);
  }

  // 2. Возвращаем спрятанные посты.
  for (const file of state.held) {
    const from = path.join(HELD_DIR, file);
    if (!fs.existsSync(from)) die(`пропал ${path.relative(ROOT, from)} — не могу вернуть пост ${file}`);
    fs.renameSync(from, path.join(POSTS_DIR, file));
  }
  console.log(`  вернул постов:      ${state.held.length}`);

  fs.rmSync(HOLD_ROOT, { recursive: true, force: true });

  // 3. Локальная копия снова отражает полный контент. Это НЕ деплоится.
  runBuild('полный набор, локально');

  const future = split(allPosts(), today()).future;
  console.log(`\n${c.g('✓ рабочая копия снова содержит полный набор постов')}`);
  if (!future.length) {
    console.log(c.g('✓ будущих постов не осталось — контент-план исчерпан, ежедневный прогон больше не нужен'));
  } else {
    console.log(`  впереди ещё ${future.length} постов, ближайшая пачка ${future[0].date}`);
  }
  console.log();
}

/* ──────────────────────────── main ──────────────────────────── */

const commands = { hold: cmdHold, restore: cmdRestore, status: cmdStatus };
if (!commands[mode]) die(`неизвестный режим "${mode}". Доступны: hold (по умолчанию), restore, status`);
commands[mode]();
