const { contextBridge, ipcRenderer } = require('electron');

// Only these channels can cross from the main process into the page.
const CHANNELS = [
  'new-tab', 'close-tab', 'next-tab', 'prev-tab', 'select-tab',
  'focus-search', 'reload', 'back', 'forward', 'devtools',
  'open-url-in-new-tab', 'theme-changed'
];

const THEMES = ['system', 'light', 'dark'];

contextBridge.exposeInMainWorld('appShell', {
  on(channel, handler) {
    if (!CHANNELS.includes(channel)) return;
    ipcRenderer.on(`menu:${channel}`, (_event, ...args) => handler(...args));
  },

  // Theme is the one thing the page needs to push back to the main process,
  // since nativeTheme lives there and also drives the pages inside the tabs.
  getTheme: () => ipcRenderer.invoke('theme:get'),
  setTheme: (theme) => {
    if (!THEMES.includes(theme)) return Promise.resolve(null);
    return ipcRenderer.invoke('theme:set', theme);
  }
});
