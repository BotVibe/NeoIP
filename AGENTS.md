# AI Coding Agent Guidelines for IP Geolocation Web Service

This project is a full-stack IP Geolocation web service and API developed with Express, Vite, React, Tailwind CSS, and Leaflet.

---

## 📌 CRITICAL RULE: DOCUMENTATION SYNCHRONIZATION

> **MANDATORY**: Whenever any changes, additions, or deprecations are made to:
> 1. API routes or query parameter handling (`server.ts`)
> 2. Data schemas or TypeScript interfaces (`src/types.ts`)
> 3. Neo-brutalist visual style rules or UI components
> 4. Build scripts, dependencies, or environment configurations
>
> You **MUST** update both `AGENTS.md` and `README.md` in the same session to reflect the new project state.

---

## 🏗️ Architecture Overview

- **`server.ts`**: Express backend server running on port `3000` (host `0.0.0.0`, overridable via `PORT`).
  - Implements production-grade security and optimization (`helmet` for headers, `compression` for gzipping, `express-rate-limit` for DDoS prevention).
  - Client IP via `TRUST_PROXY`: unset → legacy multi-header extraction (`cf-connecting-ip`, `true-client-ip`, `x-forwarded-for` before `x-real-ip`, RFC 7239 `forwarded`, etc. for Dokploy/Traefik/Cloudflare); `true` (Docker image default) → trust proxy and read **X-Forwarded-For only** (Caddy path; does not trust `Cf-Connecting-Ip` etc.); `false` → socket `remoteAddress` only.
  - Handles `/api`, `/json`, `/api/json`, `/api/:query`, `/json/:query`, `/api/json/:query` endpoints, plus a `/api/client-info` debug endpoint that returns the resolved caller IP and raw request headers.
  - Proxies geolocation requests to `ip-api.com` with a fallback mechanism to `ipwho.is` and in-memory TTL caching.
  - Serves Vite middleware in development (`NODE_ENV !== 'production'`) and static files from `dist/` in production.
- **Docker / GHCR**: `Dockerfile` (Node 22 alpine, multi-stage, non-root `app` user, `NODE_ENV=production`, `TRUST_PROXY=true`, port 3000, `HEALTHCHECK`). `.github/workflows/docker-publish.yml` pushes `ghcr.io/botvibe/neoip:main` and `sha-<short>` on push to `main`, with OCI `org.opencontainers.image.revision`. `deploy/compose.yml` runs that image as container `neoip` on external network `web` with no published ports (Caddy in front).
- **`index.html`**: Entry html file with custom Neo-brutalist SVG favicon (`/public/favicon.svg`), Open Graph, Twitter Cards, theme color, and JSON-LD WebApplication structured data.
- **`src/App.tsx`**: Single-page application rendering the Neo-brutalist dashboard with zero-layout-shift loading state (fixed skeleton loader & non-intrusive header progress bar), dimmed dark mode palette, a centered GitHub repository link (`https://github.com/BotVibe/neo-ip`) in the footer, and a collapsible Developer Tools section (hidden by default).
- **`src/components/`**:
  - `Header.tsx`: Title banner, caller IP lookup trigger, search bar, integrated non-shifting bottom progress bar loader, and “Open /api Direct” using `apiHref` (prefer `/api/<activeIp>`, usually IPv4 after dual-stack).
  - `InfoCard.tsx`: Formatted geolocation details with single-click copy buttons, updating indicator pill, and dimmed dark-mode badges.
  - `DualStackBanner.tsx`: Shown above `InfoCard` only for the caller's own IP (never for a manually searched IP/domain) when both an IPv4 and an IPv6 address were detected for the client. Renders two selectable cards (one per family); clicking a card swaps it into the main `InfoCard`/map/tabs view via `activeFamily`. On initial detection, **IPv4 is the default active family** and is applied to `geoData` (InfoCard + map); a concurrent Happy-Eyeballs `/api` self-lookup must not overwrite that once dual-stack owns the display.
  - `MapComponent.tsx`: Leaflet interactive map with custom Neo-brutalist marker and CARTO Voyager tile layer, loaded through the server proxy `/api/map/tiles/{z}/{x}/{y}{r}.png`, which adds `MAP_API_KEY` server-side (never ship the key to the browser).
  - `TabsSection.tsx`: Raw JSON viewer, multilingual code snippet generator (snippets pin `/api/<currentIp>` when known), interactive field tester, and an **API Docs** section that documents the three production API hosts with curl examples. Optionally probes `ipv4.` / `ipv6.` hosts in parallel (~3 s timeout) to show “Your IPv4” / “Your IPv6” (or “not available” when a family cannot be reached). Existing same-origin browser lookup behavior is otherwise unchanged.
- **`src/utils/detectDualStackIps.ts`**: Client-side WebRTC/STUN probe (`RTCPeerConnection` + public STUN servers) that gathers server-reflexive ICE candidates per address family. Because WebRTC opens a UDP socket per local interface, a dual-stack client yields both an IPv4 and an IPv6 srflx candidate in one page load — unlike a plain HTTP request, which only ever reveals whichever family the OS chose for that connection (Happy Eyeballs). Falls back to returning `{ ipv4: null, ipv6: null }` (single-address behavior, unchanged) if `RTCPeerConnection` is unavailable, STUN is blocked, or only one family is reachable. **Bare `GET /api` on the dual-stack host cannot prefer IPv4** — the server only sees one connection IP; prefer `ipv4.neoip.rosentreter.site` / `ipv6.neoip.rosentreter.site`, or client-side UI + `/api/<ipv4>` links.

---

## 🌐 Production API hosts

Three hostnames, same Express app / Docker container. **No automatic redirects** anywhere — address-family pinning is DNS-only:

| Host | DNS | Behavior |
| :--- | :--- | :--- |
| `https://neoip.rosentreter.site/api/` | A + AAAA | IP the connection actually used |
| `https://ipv4.neoip.rosentreter.site/api/` | A `45.137.68.45` (no AAAA) | IPv4 only |
| `https://ipv6.neoip.rosentreter.site/api/` | AAAA `2a06:de00:401:909b::1` (no A) | IPv6 only |

Example curls:

```bash
curl https://neoip.rosentreter.site/api/
curl https://ipv4.neoip.rosentreter.site/api/
curl https://ipv6.neoip.rosentreter.site/api/
curl https://neoip.rosentreter.site/api/8.8.8.8
```

CORS already allows cross-origin GETs (`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, OPTIONS`, `Access-Control-Allow-Headers: Content-Type, Authorization`), which is enough for the docs tab’s parallel probes of `ipv4.` / `ipv6.` from the main origin.

### Prod Caddy (not in this repo)

The live reverse proxy lives on the production server under the shared Caddy stack (`/opt/proxy`, container `proxy-caddy-1`). Site config: **`/opt/proxy/sites/neoip.caddy`**. It is **not** deployed from this repository — edit it on the host when changing hostnames or proxy headers. Current shape (no secrets):

```caddyfile
(neoip_proxy) {
	encode zstd gzip
	reverse_proxy neoip:3000 {
		header_up -Cf-Connecting-Ip
		header_up -True-Client-Ip
		header_up -X-Real-Ip
		header_up -Forwarded
	}
}
neoip.rosentreter.site {
	import neoip_proxy
}
ipv4.neoip.rosentreter.site {
	header X-Robots-Tag "noindex"
	import neoip_proxy
}
ipv6.neoip.rosentreter.site {
	header X-Robots-Tag "noindex"
	import neoip_proxy
}
```

---

## 🎨 Design System: Neo-Brutalism

- **Colors**: Bold high-contrast palette:
  - Light Background: Off-white `#FFFDF5`
  - Dark Background: Deep Gray `#121212` (via `.dark` class toggle)
  - Accents: Bright Yellow `#FFE600`, Vivid Pink `#FF007A`, Cyan `#06B6D4`, Lime Green `#22C55E`, Purple `#A855F7`
  - Solid Black `#000000` borders and typography (White `#FFFFFF` text in dark mode for readable elements)
- **Dark Mode**: Fully supported via Tailwind CSS v4 custom variant (`@custom-variant dark (&:is(.dark *))`) with manual `localStorage` and OS preference syncing toggle in the top bar.
- **Borders & Shadows**:
  - `border-3 border-black` / `border-2 border-black`
  - Offset hard drop shadows: `shadow-[4px_4px_0px_0px_#000]` or `neo-box` class.
- **Typography**:
  - Primary text: `Plus Jakarta Sans`
  - Monospace / API data: `JetBrains Mono`

---

## ⚙️ Schema Contract

All API responses must strictly conform to the `ip-api.com/json` standard structure:
```ts
export interface GeoResponse {
  status: 'success' | 'fail';
  message?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
  query: string;
}
```

---

## 🧑‍💻 Local Dev Server Lifecycle (`dev.sh`)

> **IMPORTANT FOR AGENTS (Claude Code, remote or local):** This project does **not** run as an always-on background/systemd service anymore. The dev server must only run while it is actually needed (e.g. while you're making and verifying code changes) and **must be stopped again once you're done**, so it doesn't keep consuming resources/battery/ports indefinitely between sessions.

Use `./dev.sh` instead of invoking `npm run dev` directly, since it manages the process lifecycle (PID tracking, logging, idempotent start/stop) for you:

| Command | Effect |
| :--- | :--- |
| `./dev.sh start` | Starts `npm run dev` in the background (nohup), writes the PID to `.dev.pid` and output to `.dev.log`. No-ops if already running. Serves on `http://localhost:3000`. |
| `./dev.sh status` | Prints `running (PID ...)` or `stopped`. Check this before assuming server state. |
| `./dev.sh stop` | Kills the tracked PID and removes `.dev.pid`. **Always run this when you're done testing**, e.g. after verifying an endpoint or UI change, or at the end of your task/session. |
| `./dev.sh restart` | `stop` followed by `start` — use after dependency changes (`npm install`) since Vite/tsx won't pick those up via HMR. |

Typical agent workflow:
1. `./dev.sh status` — check nothing is already running (avoid double-starting on a stale checkout).
2. `./dev.sh start`, then curl/test against `http://localhost:3000` to verify your change.
3. Inspect `.dev.log` if something doesn't behave as expected.
4. `./dev.sh stop` before finishing the task — do not leave the process running in the background.

`.dev.pid` and `.dev.log` are git-ignored artifacts of this script and should never be committed.

---

## 🚀 Build & Production Pipeline

- `package.json` scripts:
  - `dev`: `tsx server.ts`
  - `build`: `vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`
  - `start`: `node dist/server.cjs`
- Deployment Configuration (`nixpacks.toml` & `railway.json`):
  - Configured with `NIXPACKS_NODE_VERSION = "22"` and Node `>=20.0.0` engine specification to enforce Node.js 22 runtime during Nixpacks/Railpack container builds, ensuring full compatibility with `@tailwindcss/oxide` native binary bindings and Vite 6.
- Production: https://neoip.rosentreter.site plus family hosts https://ipv4.neoip.rosentreter.site and https://ipv6.neoip.rosentreter.site (GHCR image via `deploy/compose.yml` behind Caddy). Caddy site file is on the server at `/opt/proxy/sites/neoip.caddy` (shared `/opt/proxy`, container `proxy-caddy-1`) and is not shipped from the repo. GitHub Pages is shut down; do not re-add a Pages workflow. `vite.config.ts` keeps `base: process.env.BASE_PATH || '/'` (default `/`).
- CI (`.github/workflows/ci.yml`):
  - On pull requests and pushes to `main`, runs `npm ci`, `npm run lint`, and `npm run build` on Node 22.
- Docker publish (`.github/workflows/docker-publish.yml`):
  - On pull requests, builds the root `Dockerfile` (no registry push) so the image stays green before merge.
  - On push to `main` (and `workflow_dispatch`), builds and pushes to GHCR as `ghcr.io/botvibe/neoip:main` plus `sha-<shortsha>`, labeling `org.opencontainers.image.revision` with the full commit SHA.
  - VPS deploy: `deploy/compose.yml` pulls that image onto external network `web` (container name `neoip`, no published ports); Caddy terminates TLS and sets `X-Forwarded-For`. Do not treat merging this docs/UI PR as a deploy of `/opt/proxy/sites/neoip.caddy`.
