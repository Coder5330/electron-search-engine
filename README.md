# Quick Search

A minimal Electron desktop app that wraps Google search in an Electron `<webview>`.
Type a query, hit Enter, and it loads `https://www.google.com/search?q=<query>`.
Type something that looks like an address (`github.com`, `https://example.com`,
`localhost:3000`) and it navigates there instead.

## Install

### Windows

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

### macOS

Download the `.dmg` for your chip — `arm64` for Apple Silicon (M1 and later),
`x64` for Intel — open it, and drag **Quick Search** into Applications.

> [!WARNING]
> **The app is ad-hoc signed, not signed with an Apple Developer ID or notarized**,
> so Gatekeeper blocks it on first launch with *"cannot be opened because the
> developer cannot be verified"*.
>
> To open it anyway, right-click the app in Applications and choose **Open**, then
> **Open** again in the dialog. You only have to do this once.
>
> If macOS instead claims the app is *damaged*, clear the quarantine flag it picked
> up from being downloaded:
>
> ```bash
> xattr -dr com.apple.quarantine "/Applications/Quick Search.app"
> ```
>
> Silencing this properly needs a paid Apple Developer account ($99/year) plus
> notarization.

## Files

| File | Purpose |
| --- | --- |
| `main.js` | Electron main process — window, menu, shortcuts, webview hardening, Chrome user agent |
| `preload.js` | Narrow IPC bridge for menu actions and the theme setting |
| `index.html` | App shell: tab strip, toolbar, tab container |
| `renderer.js` | Tab management, search box logic, navigation |
| `styles.css` | Styling |
| `assets/icon.png` | App icon (electron-builder converts it to `.ico` / `.icns` at build time) |
| `scripts/adhoc-sign.js` | Build hook that ad-hoc signs the macOS app |

## Run in development

```bash
npm install
npm start
```

## Building

```bash
npm run dist:win    # Windows NSIS installer
npm run dist:mac    # macOS .dmg for Apple Silicon and Intel
```

Output lands in `dist/`:

| File | Notes |
| --- | --- |
| `Quick Search Setup <version>.exe` | NSIS installer: directory picker, Start Menu entry, desktop shortcut, uninstaller |
| `Quick Search-<version>-arm64.dmg` | macOS, Apple Silicon |
| `Quick Search-<version>.dmg` | macOS, Intel |
| `mac-arm64/Quick Search.app` | The raw `.app`, if you want it without the disk image |

Neither is signed with a real certificate, so both trigger the warnings described
above. The Windows installer can be built from macOS — electron-builder downloads
the toolchain it needs, no Wine install required. The macOS build has to run on a Mac.

`scripts/adhoc-sign.js` runs after packaging and ad-hoc signs the `.app`. Without
it, electron-builder leaves the stock Electron signature on a bundle it has since
modified, and macOS reports the downloaded app as *damaged* — a harsher failure
than the unidentified-developer prompt, and one that right-click -> Open will not
get past.

## Tabs

Multiple tabs are supported. Open one with the `+` button or `Ctrl/Cmd+T`, close
with the `x` or `Ctrl/Cmd+W`, and switch by clicking, `Ctrl+Tab`, or `Ctrl/Cmd+1-9`.
Links that open a new window (`target="_blank"`) land in a background tab.

The tab strip hides itself when only one tab is open, so the single-tab layout
looks the same as before. Closing the last tab resets it to the home page rather
than quitting.

Background tabs stay alive: they are toggled with CSS `visibility` rather than
`display: none`, which would tear down and reload the page on every switch.

## Dark mode

The toolbar button cycles **System -> Light -> Dark**, and the same options live
under *View -> Appearance*. `Ctrl/Cmd+D` toggles straight between light and dark.
The choice is saved to `preferences.json` in the app's user-data folder and
restored on next launch.

System mode follows the OS and updates live when the OS theme flips.

Because the theme is applied through Electron's `nativeTheme`, it themes the
**pages inside the tabs** too, not just the app chrome — Google itself renders
dark rather than a bright page in a dark frame.

## Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd + T` | New tab |
| `Ctrl/Cmd + W` | Close tab |
| `Ctrl/Cmd + 1-9` | Jump to tab (9 = last tab) |
| `Ctrl + Tab` | Next tab (`Ctrl+Shift+Tab` for previous) |
| `Ctrl/Cmd + L` | Focus the search box |
| `Ctrl/Cmd + R` | Reload the page |
| `Ctrl/Cmd + D` | Toggle dark mode |
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
