<p align="center">
  <img src="tauri-app/public/favicons/web/icon-512.png" alt="DaisyTube" width="128" height="128" />
</p>

<h1 align="center">DaisyTube</h1>

<p align="center">
  A privacy-respecting YouTube desktop client built with Tauri, React, and a bundled <a href="https://github.com/iv-org/invidious-companion">Invidious Companion</a>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-2-blue?logo=tauri" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript" />
  <img src="https://img.shields.io/badge/daisyUI-5-5A0EF8?logo=daisyui" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

## Features

- **YouTube Search** — Search videos via the Innertube client with automatic deduplication
- **DASH Video Playback** — Adaptive streaming via dash.js with full seeking support
- **Custom Video Controls** — Play/pause, ±10s seek, volume slider, 8 playback speeds (0.25×–2×), Picture-in-Picture, fullscreen, with auto-hide
- **Media Session API** — OS-level media controls from the system tray and lock screen
- **SponsorBlock** — Privacy-preserving hash-prefix lookup; auto-skips sponsors, self-promo, intros, outros, and more with colored progress bar markers
- **Channel Subscriptions** — Subscribe/unsubscribe with a reactive local database
- **Subscription Feed** — Home page aggregates the latest videos from all subscribed channels, sorted by date, with persistent caching
- **Encrypted Local Database** — RxDB with CryptoJS encryption on sensitive fields (channel IDs, names, thumbnails)
- **Cloud Sync** — Appwrite-powered authentication with bidirectional subscription sync and avatar upload
- **Invidious Companion Sidecar** — Bundled companion binary auto-launches on startup with health checking
- **Stream Proxy** — Custom `stream://` URI scheme in Rust for proxying video streams with full Range header support
- **Everforest Theme** — A beautiful custom color scheme built on daisyUI
- **3D Hover Effects** — Video cards with CSS 3D transforms

## Tech Stack

| Layer | Technology |
| --- | --- |
| Desktop Framework | [Tauri 2](https://tauri.app/) (Rust) |
| Frontend | [React 19](https://react.dev/) + [TypeScript 5.8](https://www.typescriptlang.org/) |
| Build Tool | [Vite 7](https://vite.dev/) |
| Routing | [React Router 7](https://reactrouter.com/) |
| UI | [daisyUI 5](https://daisyui.com/) + [Tailwind CSS 4](https://tailwindcss.com/) |
| Video Player | [dash.js 5](https://github.com/Dash-Industry-Forum/dash.js) |
| YouTube API | [youtubei.js 17](https://github.com/LuanRT/YouTube.js) |
| Local Database | [RxDB 17](https://rxdb.info/) + IndexedDB + [CryptoJS](https://github.com/brix/crypto-js) |
| Cloud Backend | [Appwrite](https://appwrite.io/) |
| Companion Server | [Deno](https://deno.com/) + [Hono](https://hono.dev/) |

## Project Structure

```
daisy-invidious/
├── tauri-app/                          # Main application
│   ├── src/
│   │   ├── App.tsx                     # Routes: /, /search, /watch/:videoId
│   │   ├── api.ts                      # YouTube search & channel API
│   │   ├── db.ts                       # RxDB encrypted database setup
│   │   ├── appwrite.ts                 # Auth, cloud sync, avatar storage
│   │   ├── sync.ts                     # Bidirectional local ↔ cloud sync
│   │   ├── companion.ts               # Sidecar process management
│   │   ├── sponsorblock.ts            # SponsorBlock segment fetching
│   │   └── components/
│   │       ├── VideoPlayer.tsx         # dash.js player + Media Session API
│   │       ├── VideoControlBar.tsx     # Custom control bar with SponsorBlock
│   │       ├── VideoGrid.tsx           # Responsive 1–4 column grid
│   │       ├── VideoCard.tsx           # Thumbnail card with 3D hover
│   │       ├── SearchBar.tsx           # Search form
│   │       ├── Sidebar.tsx             # Subscription list
│   │       ├── AuthModal.tsx           # Login/signup + avatar upload
│   │       └── icons/                  # 16 custom SVG icon components
│   ├── src-tauri/
│   │   ├── src/
│   │   │   ├── main.rs                 # Tauri entry point
│   │   │   └── lib.rs                  # proxy_fetch, proxy_request, stream://
│   │   ├── binaries/                   # Companion sidecar binary
│   │   ├── icons/                      # App icons (icns, ico, png)
│   │   ├── capabilities/              # Tauri security permissions
│   │   ├── Cargo.toml
│   │   └── tauri.conf.json
│   ├── public/favicons/               # Web favicons
│   ├── package.json
│   └── vite.config.ts
├── invidious-companion/               # Forked invidious-companion (Deno)
│   ├── src/
│   │   ├── main.ts                    # Hono server on Deno.serve
│   │   └── routes/                    # Health, player, captions, manifest
│   ├── deno.json
│   └── Dockerfile
└── .github/workflows/
    └── android-build.yml              # CI: Android APK build
```

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Rust](https://rustup.rs/) (latest stable)
- [Deno](https://deno.com/) (for building the companion from source)
- Platform-specific Tauri dependencies — see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/rheactdev/daisy-invidious.git
cd daisy-invidious
```

### 2. Set up environment variables

Create a `.env` file in `tauri-app/`:

```env
VITE_APPWRITE_ENDPOINT=https://your-appwrite-instance.com/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_PROJECT_NAME=your-project-name
VITE_APPWRITE_BUCKET_ID=your-bucket-id
VITE_COMPANION_SECRET_KEY=your-companion-secret
VITE_RXDB_PASSWORD=your-encryption-password
```

| Variable | Purpose |
| --- | --- |
| `VITE_APPWRITE_ENDPOINT` | Appwrite server URL |
| `VITE_APPWRITE_PROJECT_ID` | Appwrite project ID |
| `VITE_APPWRITE_PROJECT_NAME` | Appwrite project name |
| `VITE_APPWRITE_BUCKET_ID` | Appwrite Storage bucket for avatars |
| `VITE_COMPANION_SECRET_KEY` | Auth key for the companion sidecar |
| `VITE_RXDB_PASSWORD` | Encryption password for the local database |

### 3. Build the companion binary

```bash
cd invidious-companion
deno task compile
# Copy the binary to the sidecar location:
cp invidious-companion ../tauri-app/src-tauri/binaries/invidious-companion-$(rustc -vV | grep host | cut -d' ' -f2)
```

### 4. Install dependencies and run

```bash
cd tauri-app
pnpm install
pnpm tauri dev
```

## Build

### macOS / Windows / Linux

```bash
cd tauri-app
pnpm tauri build
```

The output will be in `tauri-app/src-tauri/target/release/bundle/`.

### Android (CI)

An Android APK can be built via GitHub Actions. The workflow is at `.github/workflows/android-build.yml` and triggers on `v*` tags or manual dispatch.

> **Note:** The companion sidecar binary does not work on Android. A remote companion server or alternative proxy approach is required for mobile builds.

Required GitHub Secrets: all six `VITE_*` environment variables listed above.

## How It Works

### Video Playback Pipeline

```
                                   ┌──────────────────────┐
  1. User picks a video            │  invidious-companion  │
  2. Frontend requests manifest ──▶│  (Hono + Deno)        │
  3. Companion returns DASH XML    │  localhost:8282        │
                                   └──────────┬───────────┘
                                              │
  4. dash.js parses manifest                  │
  5. Segments requested via stream:// ────────┘
                                              │
                                   ┌──────────▼───────────┐
                                   │  Rust stream://       │
                                   │  protocol handler     │
                                   │  (reqwest + Range)    │
                                   └──────────────────────┘
```

1. The frontend requests a DASH manifest from the companion at `/companion/api/manifest/dash/id/{videoId}`
2. The companion fetches the manifest from YouTube via youtubei.js
3. dash.js parses the manifest and requests video/audio segments
4. Segment URLs go through the custom `stream://` protocol in Rust, which proxies the request to YouTube's servers with full Range header forwarding for seeking

### SponsorBlock

Uses a privacy-preserving approach: the video ID is SHA-256 hashed and only the first 4 characters of the hash prefix are sent to the SponsorBlock API. Segments matching the full hash are filtered client-side. Skipped categories: sponsor, selfpromo, interaction, intro, outro, music_offtopic.

### Encrypted Database

Subscriptions are stored locally in RxDB (IndexedDB backend). Sensitive fields (`channelId`, `channelName`, `channelThumbnail`) are encrypted with CryptoJS using the password from `VITE_RXDB_PASSWORD`. This means these fields cannot be queried with database selectors — lookups use the primary key or in-memory filtering.

### Cloud Sync

When logged in via Appwrite, subscriptions sync bidirectionally:
- Local additions are pushed to Appwrite
- Cloud additions are pulled to local RxDB
- Deletions use soft-delete to prevent re-sync conflicts

## Development

### Scripts

| Command | Description |
| --- | --- |
| `pnpm tauri dev` | Start app in development mode (Vite + Tauri + companion) |
| `pnpm tauri build` | Build production bundle |
| `pnpm dev` | Vite dev server only (localhost:1420) |
| `pnpm build` | TypeScript check + Vite build |
| `pnpm preview` | Preview production build |

### Companion (standalone)

```bash
cd invidious-companion
SERVER_SECRET_KEY=CHANGEME deno task dev    # Dev mode with watch
deno task compile                           # Compile to native binary
deno task test                              # Run tests
deno task format                            # Format code
deno task lint                              # Lint
```

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- [Tauri Extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## License

MIT
