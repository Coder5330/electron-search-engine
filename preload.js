const { contextBridge, ipcRenderer } = require('electron');

// Only these channels can cross from the main process into the page, and the
// page can never send anything back — it has no reason to.
const CHANNELS = [
  'new-tab', 'close-tab', 'next-tab', 'prev-tab', 'select-tab',
  'focus-search', 'reload', 'back', 'forward', 'devtools',
  'open-url-in-new-tab'
];

contextBridge.exposeInMainWorld('appShell', {
  on(channel, handler) {
    if (!CHANNELS.includes(channel)) return;
    ipcRenderer.on(`menu:${channel}`, (_event, ...args) => handler(...args));
  }
});
