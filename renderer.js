const tabsEl = document.getElementById('tabs');
const viewsEl = document.getElementById('views');
const newTabBtn = document.getElementById('new-tab');
const form = document.getElementById('search-form');
const input = document.getElementById('q');
const back = document.getElementById('back');
const forward = document.getElementById('forward');
const reload = document.getElementById('reload');
const home = document.getElementById('home');
const progress = document.getElementById('progress');

const HOME = 'https://www.google.com';

/** @type {Array<{id:number, view:Element, el:Element, titleEl:Element, iconEl:Element, loading:boolean, url:string}>} */
const tabs = [];
let activeId = null;
let nextId = 1;

const tabById = (id) => tabs.find((t) => t.id === id) || null;
const activeTab = () => tabById(activeId);
const indexOf = (id) => tabs.findIndex((t) => t.id === id);

// ---------------------------------------------------------------- navigation

// Bare hostnames like "github.com" or "localhost:3000" should be treated as
// addresses; everything else is a search query.
const LOOKS_LIKE_HOST = /^[^\s/?#]+\.[a-z]{2,}(:\d+)?([/?#]\S*)?$/i;
const LOOKS_LIKE_LOCAL = /^localhost(:\d+)?([/?#]\S*)?$/i;

function toURL(text) {
  const value = text.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (LOOKS_LIKE_HOST.test(value) || LOOKS_LIKE_LOCAL.test(value)) return 'https://' + value;
  return 'https://www.google.com/search?q=' + encodeURIComponent(value);
}

// Google frequently aborts a load to redirect (consent, region, /search rewrites).
// ERR_ABORTED (-3) is expected there, so swallow it instead of leaking a rejection.
function navigate(view, url) {
  view.loadURL(url).catch((err) => {
    if (!String(err).includes('ERR_ABORTED')) console.error('Navigation failed:', err);
  });
}

// ---------------------------------------------------------------------- tabs

function createTab(url = HOME, { background = false } = {}) {
  const id = nextId++;

  const view = document.createElement('webview');
  view.className = 'view';
  view.setAttribute('src', url);
  viewsEl.appendChild(view);

  const el = document.createElement('div');
  el.className = 'tab';
  el.title = 'New Tab';

  const iconEl = document.createElement('img');
  iconEl.className = 'tab-icon';
  iconEl.alt = '';
  iconEl.hidden = true;

  const titleEl = document.createElement('span');
  titleEl.className = 'tab-title';
  titleEl.textContent = 'New Tab';

  const closeEl = document.createElement('button');
  closeEl.className = 'tab-close';
  closeEl.title = 'Close tab';
  closeEl.innerHTML = '&times;';

  el.append(iconEl, titleEl, closeEl);
  tabsEl.appendChild(el);

  const tab = { id, view, el, titleEl, iconEl, loading: false, url };
  tabs.push(tab);

  el.addEventListener('click', () => activate(id));
  el.addEventListener('auxclick', (e) => { if (e.button === 1) closeTab(id); });
  closeEl.addEventListener('click', (e) => { e.stopPropagation(); closeTab(id); });

  wireView(tab);
  if (!background || activeId === null) activate(id);
  updateStripState();
  return tab;
}

function wireView(tab) {
  const { view } = tab;

  view.addEventListener('did-start-loading', () => {
    tab.loading = true;
    tab.el.classList.add('loading');
    if (tab.id === activeId) progress.classList.add('loading');
  });

  view.addEventListener('did-stop-loading', () => {
    tab.loading = false;
    tab.el.classList.remove('loading');
    if (tab.id === activeId) {
      progress.classList.remove('loading');
      syncNav();
    }
  });

  const onNavigate = (e) => {
    tab.url = e.url;
    if (tab.id === activeId) { syncInput(e.url); syncNav(); }
  };
  view.addEventListener('did-navigate', onNavigate);
  view.addEventListener('did-navigate-in-page', onNavigate);

  view.addEventListener('page-title-updated', (e) => {
    const title = e.title || 'New Tab';
    tab.titleEl.textContent = title;
    tab.el.title = title;
    if (tab.id === activeId) document.title = `${title} — Quick Search`;
  });

  view.addEventListener('page-favicon-updated', (e) => {
    const href = e.favicons && e.favicons[0];
    if (!href) return;
    tab.iconEl.src = href;
    tab.iconEl.hidden = false;
  });

  tab.iconEl.addEventListener('error', () => { tab.iconEl.hidden = true; });
}

function activate(id) {
  const tab = tabById(id);
  if (!tab) return;
  activeId = id;

  for (const t of tabs) {
    const on = t.id === id;
    t.view.classList.toggle('active', on);
    t.el.classList.toggle('active', on);
  }

  tab.el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  syncInput(tab.url);
  syncNav();
  progress.classList.toggle('loading', tab.loading);
  document.title = `${tab.titleEl.textContent} — Quick Search`;
}

function closeTab(id) {
  const i = indexOf(id);
  if (i === -1) return;
  const [tab] = tabs.splice(i, 1);

  tab.view.remove();
  tab.el.remove();

  // Never leave an empty window — the last tab closing just resets to Home.
  if (tabs.length === 0) {
    activeId = null;
    createTab(HOME);
    return;
  }
  if (activeId === id) activate(tabs[Math.min(i, tabs.length - 1)].id);
  updateStripState();
}

function cycle(step) {
  if (tabs.length < 2) return;
  const i = indexOf(activeId);
  activate(tabs[(i + step + tabs.length) % tabs.length].id);
}

// A lone tab has nothing to switch to, so hide its close button and the strip.
function updateStripState() {
  document.body.classList.toggle('single-tab', tabs.length < 2);
}

// ------------------------------------------------------------------ toolbar

function syncNav() {
  const view = activeTab()?.view;
  back.disabled = !view || !view.canGoBack();
  forward.disabled = !view || !view.canGoForward();
}

// Keep the box showing the current search term (or URL) as the user browses.
function syncInput(url) {
  try {
    const parsed = new URL(url);
    const q = parsed.searchParams.get('q');
    if (q && /(^|\.)google\./i.test(parsed.hostname)) { input.value = q; return; }
    if (parsed.href === HOME + '/' || parsed.href === HOME) { input.value = ''; return; }
    input.value = parsed.href;
  } catch {
    input.value = '';
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const url = toURL(input.value);
  const tab = activeTab();
  if (url && tab) navigate(tab.view, url);
});

back.addEventListener('click', () => { const v = activeTab()?.view; if (v?.canGoBack()) v.goBack(); });
forward.addEventListener('click', () => { const v = activeTab()?.view; if (v?.canGoForward()) v.goForward(); });
reload.addEventListener('click', () => activeTab()?.view.reload());
home.addEventListener('click', () => {
  const tab = activeTab();
  if (!tab) return;
  input.value = '';
  navigate(tab.view, HOME);
});
newTabBtn.addEventListener('click', () => {
  createTab(HOME);
  input.focus();
});

// -------------------------------------------------------- menu / shortcuts

const shellAPI = window.appShell;
if (shellAPI) {
  shellAPI.on('new-tab', () => { createTab(HOME); input.focus(); });
  shellAPI.on('close-tab', () => { if (activeId !== null) closeTab(activeId); });
  shellAPI.on('next-tab', () => cycle(1));
  shellAPI.on('prev-tab', () => cycle(-1));
  shellAPI.on('select-tab', (i) => {
    // Matching Chrome: 1-8 pick that tab, 9 always jumps to the last one.
    const target = i === 8 ? tabs.length - 1 : i;
    if (tabs[target]) activate(tabs[target].id);
  });
  shellAPI.on('focus-search', () => { input.focus(); input.select(); });
  shellAPI.on('reload', () => activeTab()?.view.reload());
  shellAPI.on('back', () => { const v = activeTab()?.view; if (v?.canGoBack()) v.goBack(); });
  shellAPI.on('forward', () => { const v = activeTab()?.view; if (v?.canGoForward()) v.goForward(); });
  shellAPI.on('devtools', () => {
    const v = activeTab()?.view;
    if (!v) return;
    v.isDevToolsOpened() ? v.closeDevTools() : v.openDevTools();
  });
  shellAPI.on('open-url-in-new-tab', (url) => createTab(url, { background: true }));
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') input.blur();
});

createTab(HOME);
input.focus();
