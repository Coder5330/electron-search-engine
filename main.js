const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// Electron's default UA looks like "... Chrome/130.0.0.0 Electron/33.2.0 Safari/537.36".
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 480,
    minHeight: 400,
    title: 'Quick Search',
    backgroundColor: '#ffffff',
    webPreferences: {
      webviewTag: true,        // enables the <webview> element in index.html
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Harden every <webview> the renderer creates: no node access, no preloads.
  mainWindow.webContents.on('will-attach-webview', (_event, webPreferences, params) => {
    delete webPreferences.preload;
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    params.allowpopups = false;
  });

  // target="_blank" links inside the page load in the same view rather than
  // silently doing nothing (popups are disabled on the guest).
  mainWindow.webContents.on('did-attach-webview', (_event, guest) => {
    guest.setWindowOpenHandler(({ url }) => {
      guest.loadURL(url).catch(() => {});
      return { action: 'deny' };
    });
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
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
