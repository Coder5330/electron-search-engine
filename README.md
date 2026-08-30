# Quick Search

A minimal Electron desktop app that wraps Google search in an Electron `<webview>`.
Type a query, hit Enter, and it loads `https://www.google.com/search?q=<query>`.
Type something that looks like an address (`github.com`, `https://example.com`,
`localhost:3000`) and it navigates there instead.

## Install (Windows)

Download the latest installer from the
[releases page](https://github.com/Coder5330/electron-search-engine/releases/latest)
and run it.

> [!WARNING]
> **The installer is not code-signed.** On first run Windows SmartScreen shows a blue
> **"Windows protected your PC"** box whose only visible button is *Don't run*.
> Click **More info**, then **Run anyway**, to continue.
>
> This is expected for any unsigned installer and is not a sign that something is
> wrong with the download. Silencing it permanently requires an EV code-signing
> certificate from a commercial CA (roughly $200-500/year), which is not worth it
> for a project this size. Tell people you share the build with to expect it.

## Files

| File | Purpose |
| --- | --- |
| `main.js` | Electron main process — window, menu, shortcuts, webview hardening, Chrome user agent |
| `preload.js` | Narrow IPC bridge so menu actions reach the page |
| `index.html` | App shell: tab strip, toolbar, tab container |
| `renderer.js` | Tab management, search box logic, navigation |
| `styles.css` | Styling |
| `assets/icon.png` | App icon (electron-builder converts it to `.ico` at build time) |

## Run in development

```bash
npm install
npm start
```

## Build the Windows installer

```bash
npm run dist:win
```

The installer lands in `dist/` as `Quick Search Setup 1.0.0.exe` — a standard NSIS
installer with a directory picker, Start Menu entry, desktop shortcut, and an
uninstaller. It is unsigned, so it triggers the SmartScreen prompt described above.

## Tabs

Multiple tabs are supported. Open one with the `+` button or `Ctrl/Cmd+T`, close
with the `x` or `Ctrl/Cmd+W`, and switch by clicking, `Ctrl+Tab`, or `Ctrl/Cmd+1-9`.
Links that open a new window (`target="_blank"`) land in a background tab.

The tab strip hides itself when only one tab is open, so the single-tab layout
looks the same as before. Closing the last tab resets it to the home page rather
than quitting.

Background tabs stay alive: they are toggled with CSS `visibility` rather than
`display: none`, which would tear down and reload the page on every switch.

## Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd + T` | New tab |
| `Ctrl/Cmd + W` | Close tab |
| `Ctrl/Cmd + 1-9` | Jump to tab (9 = last tab) |
| `Ctrl + Tab` | Next tab (`Ctrl+Shift+Tab` for previous) |
| `Ctrl/Cmd + L` | Focus the search box |
| `Ctrl/Cmd + R` | Reload the page |
| `Alt + Left/Right` (`Cmd + [` / `]` on macOS) | Back / forward |
| `Esc` | Leave the search box |

Shortcuts are wired through the application menu and low-level input handlers on
every tab, so they still fire while the focus is inside a page.

## Changing the icon

Replace `assets/icon.png` with a **square** PNG of at least 256x256 and rebuild.
electron-builder converts it to `.ico` automatically.

The generated `.ico` holds a single 256x256 entry regardless of how large the
source is, and Windows downscales that for the taskbar and Explorer. A larger
source still helps: at 256x256 exactly the entry is a straight copy, while a
768x768 or 1024x1024 source gives a clean downscale instead of an upscale of
something small.
