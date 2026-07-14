# Five

Five is a Chrome Manifest V3 new-tab extension inspired by the calm, text-first character of Prod. It keeps five manual priorities visible, moves overflow into Later, surfaces recurring routines separately, and blocks chosen distractions until the current work is complete.

## Features

- Five-slot Today list with automatic Later overflow
- Separate Later backlog and intentional promotion to Today
- Unlimited Ideas inbox for brain-dump capture before triaging thoughts to Today or Later
- Up to five daily, weekday, or weekly routines
- Due routines shown in Today without consuming manual slots
- Desktop Daybook rail with completed work, daily done/open summary, restore, and a non-destructive manual page reset
- Up to five color-coded categories
- Local distraction blocklist using Manifest V3 dynamic rules
- Three daily 30-minute blocklist pauses, with early resume and a five-minute undo window
- Persistent 25/50-minute focus timer with 10/20-minute rests and daily 25-minute session units
- One-click Presentation mode that unmounts private content and shows one of six locally bundled wallpapers
- Light and dark themes

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

Chrome's all-sites host permission is used only to enforce declarative blocking rules for domains the user adds to the blocklist. Five does not inspect page contents or transmit browsing activity. See the full [privacy policy](PRIVACY.md).

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
