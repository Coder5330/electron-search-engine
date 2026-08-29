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
| `main.js` | Electron main process — window, webview hardening, Chrome user agent |
| `index.html` | App shell: toolbar + `<webview>` |
| `renderer.js` | Search box logic, navigation buttons, loading state |
| `styles.css` | Styling |

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

## Shortcuts

- `Ctrl/Cmd + L` — focus the search box
- `Ctrl/Cmd + R` — reload the page
- `Esc` — leave the search box

## Adding an icon

Drop a 256x256 `icon.ico` into a `build/` folder at the project root.
electron-builder picks it up automatically; without one it uses the default
Electron icon.
