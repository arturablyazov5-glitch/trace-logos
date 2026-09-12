// js/kb.js — движок закрытой базы знаний (kb/index.html).
// Дерево разделов/статей любой глубины, роутинг по location.hash, notion-style сайдбар.
//
// Это НЕ настоящая защита данных — только лёгкий фильтр от случайного захода:
// страница уже закрыта от индексации (meta robots + robots.txt) и не имеет ссылок
// с сайта, пароль тут — третий, самый слабый слой, чисто клиентский. Не клади
// сюда ничего, что нельзя было бы прочитать через «Просмотр кода страницы».
const PASSWORD = '2202';
const SESSION_KEY = 'kb_unlocked';

const gate = document.getElementById('kb-gate');
const gateForm = document.getElementById('kb-gate-form');
const gateInput = document.getElementById('kb-gate-input');
const gateError = document.getElementById('kb-gate-error');
const app = document.getElementById('kb-app');
const treeEl = document.getElementById('kb-tree');
const searchEl = document.getElementById('kb-search');
const contentEl = document.getElementById('kb-content');
const crumbsEl = document.getElementById('kb-crumbs');
const burgerEl = document.getElementById('kb-burger');
const sidebarEl = document.getElementById('kb-sidebar');

let tree = [];
let byId = new Map(); // id -> { node, parents: [node,...] }

init();

function init() {
  gateForm.addEventListener('submit', onGateSubmit);
  if (sessionStorage.getItem(SESSION_KEY) === '1') {
    unlock(false);
  } else {
    gate.hidden = false;
    gateInput.focus();
  }
}

function onGateSubmit(e) {
  e.preventDefault();
  if (gateInput.value.trim() === PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, '1');
    unlock(true);
  } else {
    gateError.textContent = 'Неверный пароль';
    gateInput.classList.remove('kb-shake');
    // reflow, чтобы анимация запустилась повторно при повторной ошибке
    void gateInput.offsetWidth;
    gateInput.classList.add('kb-shake');
    gateInput.value = '';
    gateInput.focus();
  }
}

async function unlock(animate) {
  gate.hidden = true;
  app.classList.add('kb-app-visible');
  await loadData();
  buildIndex();
  renderTree();
  wireChrome();
  window.addEventListener('hashchange', render);
  render();
  if (animate) gateInput.blur();
}

async function loadData() {
  const res = await fetch('data.json', { cache: 'no-store' });
  tree = await res.json();
}

function buildIndex() {
  byId = new Map();
  (function walk(nodes, parents) {
    for (const node of nodes) {
      byId.set(node.id, { node, parents });
      if (node.type === 'section' && Array.isArray(node.children)) {
        walk(node.children, [...parents, node]);
      }
    }
  })(tree, []);
}

function wireChrome() {
  burgerEl.addEventListener('click', () => {
    sidebarEl.classList.toggle('kb-sidebar-open');
  });
  contentEl.addEventListener('click', (e) => {
    // закрыть мобильный сайдбар при переходе по ссылке в контенте
    if (e.target.closest('a')) sidebarEl.classList.remove('kb-sidebar-open');
  });
  searchEl.addEventListener('input', () => renderTree(searchEl.value.trim().toLowerCase()));
}

// ── Sidebar tree ──

function renderTree(query) {
  treeEl.innerHTML = '';
  const activeId = currentPath().at(-1);
  const activeChain = new Set(currentPath());

  const filtered = query ? filterTree(tree, query) : tree;
  if (query && filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'kb-tree-nomatch';
    empty.textContent = 'Ничего не найдено';
    treeEl.appendChild(empty);
    return;
  }
  const ul = buildTreeList(filtered, activeId, activeChain, !!query);
  treeEl.appendChild(ul);
}

function filterTree(nodes, query) {
  const out = [];
  for (const node of nodes) {
    const titleHit = node.title.toLowerCase().includes(query);
    if (node.type === 'article') {
      if (titleHit) out.push(node);
      continue;
    }
    const children = filterTree(node.children || [], query);
    if (titleHit || children.length) out.push({ ...node, children });
  }
  return out;
}

function buildTreeList(nodes, activeId, activeChain, forceOpen) {
  const ul = document.createElement('ul');
  ul.style.margin = '0';
  ul.style.padding = '0';
  for (const node of nodes) {
    ul.appendChild(buildTreeNode(node, activeId, activeChain, forceOpen));
  }
  return ul;
}

function buildTreeNode(node, activeId, activeChain, forceOpen) {
  const li = document.createElement('li');
  li.className = 'kb-node';

  const isSection = node.type === 'section';
  const hasChildren = isSection && Array.isArray(node.children) && node.children.length > 0;
  const shouldOpen = forceOpen || activeChain.has(node.id);
  if (hasChildren && shouldOpen) li.dataset.open = '1';

  const row = document.createElement('div');
  row.className = 'kb-node-row';
  if (node.id === activeId) row.classList.add('kb-active');

  const toggle = document.createElement('span');
  toggle.className = hasChildren ? 'kb-node-toggle' : 'kb-node-toggle kb-toggle-spacer';
  toggle.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>';
  row.appendChild(toggle);

  const icon = document.createElement('span');
  icon.className = 'kb-node-icon';
  icon.textContent = node.icon || (isSection ? '📁' : '📄');
  row.appendChild(icon);

  const label = document.createElement('span');
  label.className = 'kb-node-label';
  label.textContent = node.title;
  row.appendChild(label);

  if (hasChildren) {
    const count = document.createElement('span');
    count.className = 'kb-node-count';
    count.textContent = String(countArticles(node));
    row.appendChild(count);
  }

  row.addEventListener('click', () => {
    if (isSection) {
      const willOpen = li.dataset.open !== '1';
      li.dataset.open = willOpen ? '1' : '0';
      if (!willOpen && !hasChildren) return;
    }
    navigateTo(node.id);
  });

  li.appendChild(row);

  if (hasChildren) {
    const childrenWrap = document.createElement('div');
    childrenWrap.className = 'kb-children';
    childrenWrap.appendChild(buildTreeList(node.children, activeId, activeChain, forceOpen));
    li.appendChild(childrenWrap);
  } else if (isSection) {
    // раздел без детей — на всякий случай, чтобы дерево не выглядело сломанным
  }

  return li;
}

function countArticles(node) {
  if (node.type === 'article') return 1;
  return (node.children || []).reduce((sum, c) => sum + countArticles(c), 0);
}

// ── Routing ──

function currentPath() {
  const hash = location.hash.replace(/^#\/?/, '');
  if (!hash) return [];
  return hash.split('/').filter(Boolean);
}

function navigateTo(id) {
  location.hash = '#/' + id;
}

function render() {
  const path = currentPath();
  const id = path.at(-1);
  if (!id) {
    renderHome();
    renderCrumbs([]);
    renderTree(searchEl.value.trim().toLowerCase() || undefined);
    return;
  }
  const entry = byId.get(id);
  if (!entry) {
    renderHome();
    renderCrumbs([]);
    return;
  }
  const { node, parents } = entry;
  renderCrumbs([...parents, node]);
  if (node.type === 'article') {
    renderArticle(node, parents);
  } else {
    renderSection(node, parents);
  }
  renderTree(searchEl.value.trim().toLowerCase() || undefined);
  contentEl.scrollTop = 0;
  window.scrollTo(0, 0);
}

function renderCrumbs(chain) {
  crumbsEl.innerHTML = '';
  const home = document.createElement('a');
  home.href = '#/';
  home.textContent = 'База знаний';
  home.style.color = 'inherit';
  home.style.textDecoration = 'none';
  crumbsEl.appendChild(home);
  chain.forEach((node, i) => {
    const sep = document.createElement('span');
    sep.className = 'kb-crumb-sep';
    sep.textContent = '/';
    crumbsEl.appendChild(sep);
    if (i === chain.length - 1) {
      const cur = document.createElement('span');
      cur.className = 'kb-crumb-current';
      cur.textContent = node.title;
      crumbsEl.appendChild(cur);
    } else {
      const a = document.createElement('a');
      a.href = '#/' + node.id;
      a.textContent = node.title;
      a.style.color = 'inherit';
      a.style.textDecoration = 'none';
      crumbsEl.appendChild(a);
    }
  });
}

function renderHome() {
  const topLevelCount = tree.length;
  const totalArticles = tree.reduce((sum, n) => sum + countArticles(n), 0);
  const cards = tree.map((node) => `
    <a class="kb-home-card" href="#/${escapeAttr(node.id)}">
      <span class="kb-home-card-icon">${node.icon || '📁'}</span>
      <span class="kb-home-card-title">${escapeHtml(node.title)}</span>
      <span class="kb-home-card-count">${countArticles(node)} статей</span>
    </a>`).join('');
  contentEl.innerHTML = `
    <div class="kb-home">
      <h1>База знаний</h1>
      <p>${topLevelCount} верхнеуровневых раздела, ${totalArticles} статей всего. Выбери раздел слева или на плитке ниже.</p>
      <div class="kb-home-grid">${cards}</div>
    </div>`;
}

function renderSection(node, parents) {
  const items = (node.children || []).map((child) => `
    <a class="kb-section-item" href="#/${escapeAttr(child.id)}">
      <span class="kb-section-item-icon">${child.icon || (child.type === 'section' ? '📁' : '📄')}</span>
      <span class="kb-section-item-body">
        <span class="kb-section-item-title">${escapeHtml(child.title)}</span>
        ${child.excerpt ? `<span class="kb-section-item-excerpt">${escapeHtml(child.excerpt)}</span>` : ''}
      </span>
      <span class="kb-section-item-arrow" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
      </span>
    </a>`).join('');
  contentEl.innerHTML = `
    <div class="kb-section-view">
      <h1>${node.icon ? node.icon + ' ' : ''}${escapeHtml(node.title)}</h1>
      <div class="kb-section-list">${items || '<div class="kb-node-empty">Раздел пока пуст</div>'}</div>
    </div>`;
}

function renderArticle(node, parents) {
  const parentTitle = parents.at(-1)?.title;
  contentEl.innerHTML = `
    <article class="kb-article">
      <header class="kb-article-head">
        ${parentTitle ? `<div class="kb-article-eyebrow">${escapeHtml(parentTitle)}</div>` : ''}
        <h1>${escapeHtml(node.title)}</h1>
      </header>
      <div class="blog-body">${node.content || '<p>Пока пусто.</p>'}</div>
    </article>`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(str) {
  return escapeHtml(str);
}
