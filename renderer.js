const view = document.getElementById('view');
const form = document.getElementById('search-form');
const input = document.getElementById('q');
const back = document.getElementById('back');
const forward = document.getElementById('forward');
const reload = document.getElementById('reload');
const home = document.getElementById('home');
const progress = document.getElementById('progress');

const HOME = 'https://www.google.com';

// Bare hostnames like "github.com" or "localhost:3000" should be treated as
// addresses; everything else is a search query.
const LOOKS_LIKE_HOST = /^[^\s/?#]+\.[a-z]{2,}(:\d+)?([/?#]\S*)?$/i;
const LOOKS_LIKE_LOCAL = /^localhost(:\d+)?([/?#]\S*)?$/i;

// Google frequently aborts a load to redirect (consent, region, /search rewrites).
// ERR_ABORTED (-3) is expected there, so swallow it instead of leaking a rejection.
function navigate(url) {
  view.loadURL(url).catch((err) => {
    if (!String(err).includes('ERR_ABORTED')) console.error('Navigation failed:', err);
  });
}

function toURL(text) {
  const value = text.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (LOOKS_LIKE_HOST.test(value) || LOOKS_LIKE_LOCAL.test(value)) return 'https://' + value;
  return 'https://www.google.com/search?q=' + encodeURIComponent(value);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const url = toURL(input.value);
  if (url) navigate(url);
});

back.addEventListener('click', () => { if (view.canGoBack()) view.goBack(); });
forward.addEventListener('click', () => { if (view.canGoForward()) view.goForward(); });
reload.addEventListener('click', () => view.reload());
home.addEventListener('click', () => {
  input.value = '';
  navigate(HOME);
});

function syncNav() {
  back.disabled = !view.canGoBack();
  forward.disabled = !view.canGoForward();
}

// Keep the box showing the current search term (or URL) as the user browses.
function syncInput(url) {
  try {
    const parsed = new URL(url);
    const q = parsed.searchParams.get('q');
    if (q && /(^|\.)google\./i.test(parsed.hostname)) {
      input.value = q;
      return;
    }
    if (parsed.href === HOME + '/' || parsed.href === HOME) {
      input.value = '';
      return;
    }
    input.value = parsed.href;
  } catch {
    /* about:blank and friends — leave the box alone */
  }
}

view.addEventListener('did-start-loading', () => progress.classList.add('loading'));
view.addEventListener('did-stop-loading', () => {
  progress.classList.remove('loading');
  syncNav();
});

view.addEventListener('did-navigate', (e) => { syncInput(e.url); syncNav(); });
view.addEventListener('did-navigate-in-page', (e) => { syncInput(e.url); syncNav(); });

view.addEventListener('page-title-updated', (e) => {
  document.title = e.title ? `${e.title} — Quick Search` : 'Quick Search';
});

document.addEventListener('keydown', (event) => {
  const mod = event.metaKey || event.ctrlKey;
  if (mod && event.key.toLowerCase() === 'l') {
    event.preventDefault();
    input.focus();
    input.select();
  } else if (mod && event.key.toLowerCase() === 'r') {
    event.preventDefault();
    view.reload();
  } else if (event.key === 'Escape') {
    input.blur();
  }
});
