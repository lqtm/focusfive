# Five

Five is a Chrome Manifest V3 new-tab extension inspired by the calm, text-first character of Prod. It keeps five manual priorities visible, moves overflow into Later, surfaces recurring routines separately, and blocks chosen distractions until the current work is complete.

## Features

- Five-slot Today list with one task marked Now; done tasks hold their slot until cleared
- Full-screen Focus mode started from the Now row, with 25/50-minute focus blocks, 10/20-minute rests, and daily session counts
- Later backlog with a swap picker when Today is full
- Unlimited Ideas inbox with a one-at-a-time Triage card
- `#tag` parsing into up to five categories
- Up to five daily, weekday, or weekly routines on their own page; due routines appear in the Today sidebar without using a slot
- Daybook sidebar with the day's crossed-off work and a daily note
- Optional one-line hints under compressed task titles (`title // hint`)
- Inline editing of task titles and hints (pencil, double-click, or E / H)
- Drag-to-reorder Today and Later (or move rows with the keyboard)
- Keyboard shortcuts: N, ↑/↓ (J/K) to pick Now, Shift+↑/↓ to move it, Enter to start, 1–5, L (to Later), I (back to Ideas), Space, Esc, and G T / G L / G I
- Local distraction blocklist using Manifest V3 dynamic rules, with Chrome access requested one site at a time
- Backup export and restore (JSON file) in Settings
- Three daily 30-minute blocklist pauses, with early resume and a five-minute undo window
- One-click Presentation mode that unmounts private content and shows one of six locally bundled wallpapers
- Nine themes: System, Light, Dark, Paper, Dot grid, Blueprint, Dusk, and two brutalist themes (Brutal, Acid)

## Architecture

- React 19 and TypeScript for the new-tab UI
- Small focused components under `src/components`
- Typed domain models and pure recurrence helpers under `src/domain`
- A storage repository under `src/data`
- Cross-context state transactions serialized with the Web Locks API
- An event-driven Manifest V3 service worker under `src/background`
- `chrome.storage.local` for extension data
- `declarativeNetRequest` dynamic rules for site blocking
- Vite and CRXJS for development and packaging

No remote account or server is required; task data stays in the browser profile.

## Privacy and permissions

Five has no account, analytics, telemetry, ads, or remote application service. The extension stores its state in `chrome.storage.local`; bundled fonts and presentation wallpapers work offline.

Five requests no website access at install. When you add a site to the blocklist, Chrome asks for access to that one site so the blocking rule can redirect it; sites you haven't allowed show an Allow button in Settings. Five does not inspect page contents or transmit browsing activity. See the full [privacy policy](PRIVACY.md).

Store listing copy, privacy-practice answers, and images for the Chrome Web Store live in [`store/`](store/LISTING.md).

## Load in Chrome or Brave

1. Run `npm install` and `npm run build`.
2. Open `chrome://extensions` in Chrome or `brave://extensions` in Brave.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select this project's `dist` directory.

The extension replaces the new-tab page. Clicking its toolbar action also opens Five.

## Development

- `npm ci` installs the locked dependency versions.
- `npm run dev` starts the local CRXJS development server.
- `npm run build` produces the unpacked extension in `dist`.

The current data schema is versioned in `src/domain/models.ts`, and normalization is centralized in `src/data/storage.ts` so future migrations do not leak into UI components.

## Package a release

Run `npm run package`. This builds the unpacked extension into `dist` and creates a versioned Chrome Web Store upload ZIP under `release`.

Generated `dist` and `release` files are intentionally excluded from Git. Publish versioned ZIPs through GitHub Releases or the Chrome Web Store rather than committing generated artifacts.

## Project documentation

- [Roadmap](TODO.md)
- [Design reference and comparisons](docs/design/)
- [Visual QA history](docs/qa/)
