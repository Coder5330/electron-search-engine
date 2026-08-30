const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const ICON = path.join(__dirname, 'assets', 'icon.png');
const isMac = process.platform === 'darwin';

// Electron's default UA looks like "... Chrome/130.0.0.0 Electron/33.4.11 Safari/537.36".
// Google serves a degraded / blocked experience to that, so strip the app + Electron
// tokens and present ourselves as plain Chrome.
function cleanUserAgent() {
  return app.userAgentFallback
    .replace(/\s?Electron\/\S+/, '')
    .replace(new RegExp(`\\s?${app.getName().replace(/\s/g, '')}\\/\\S+`), '')
    .replace(/\s+/g, ' ')
    .trim();
}

let mainWindow = null;

// The renderer owns all tab state; the main process only forwards intent to it.
function send(channel, ...args) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(`menu:${channel}`, ...args);
  }
}

// Menu accelerators fire no matter which WebContents has focus, but Ctrl+Tab and
// Cmd/Ctrl+1..9 are awkward as accelerators, so they are handled at the input
// level instead — on the shell and on every guest page, so they work while
// the user is focused inside a page.
function handleInput(event, input) {
  if (input.type !== 'keyDown') return;

  if (input.control && input.key === 'Tab') {
    send(input.shift ? 'prev-tab' : 'next-tab');
    event.preventDefault();
    return;
  }

  const mod = isMac ? input.meta : input.control;
  if (mod && !input.alt && /^[1-9]$/.test(input.key)) {
    send('select-tab', Number(input.key) - 1);
    event.preventDefault();
  }
}

function buildMenu() {
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'New Tab', accelerator: 'CmdOrCtrl+T', click: () => send('new-tab') },
        { label: 'Close Tab', accelerator: 'CmdOrCtrl+W', click: () => send('close-tab') },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { label: 'Reload Page', accelerator: 'CmdOrCtrl+R', click: () => send('reload') },
        { label: 'Back', accelerator: isMac ? 'Cmd+[' : 'Alt+Left', click: () => send('back') },
        { label: 'Forward', accelerator: isMac ? 'Cmd+]' : 'Alt+Right', click: () => send('forward') },
        { type: 'separator' },
        { label: 'Focus Search Bar', accelerator: 'CmdOrCtrl+L', click: () => send('focus-search') },
        { type: 'separator' },
        {
          label: 'Toggle Developer Tools',
          accelerator: isMac ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => send('devtools')
        },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Tabs',
      submenu: [
        {
          label: 'Next Tab',
          accelerator: isMac ? 'Alt+Cmd+Right' : 'Ctrl+PageDown',
          click: () => send('next-tab')
        },
        {
          label: 'Previous Tab',
          accelerator: isMac ? 'Alt+Cmd+Left' : 'Ctrl+PageUp',
          click: () => send('prev-tab')
        }
      ]
    },
    ...(isMac ? [{ role: 'windowMenu' }] : [])
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  const options = {
    width: 1200,
    height: 800,
    minWidth: 560,
    minHeight: 400,
    title: 'Quick Search',
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,        // enables the <webview> elements the renderer creates per tab
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  };
  if (fs.existsSync(ICON)) options.icon = ICON;

  mainWindow = new BrowserWindow(options);
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.webContents.on('before-input-event', handleInput);

  // Harden every <webview> the renderer creates: no node access, no preloads.
  mainWindow.webContents.on('will-attach-webview', (_event, webPreferences, params) => {
    delete webPreferences.preload;
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    params.allowpopups = false;
  });

  mainWindow.webContents.on('did-attach-webview', (_event, guest) => {
    // target="_blank" and window.open() land in a new tab, like a real browser.
    guest.setWindowOpenHandler(({ url }) => {
      send('open-url-in-new-tab', url);
      return { action: 'deny' };
    });
    guest.on('before-input-event', handleInput);
  });

  // Anything the app shell itself tries to open goes to the real browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  app.userAgentFallback = cleanUserAgent();
  buildMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (!isMac) app.quit();
});
