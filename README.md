# IP Geolocation Web Service & REST API

An IP geolocation web service built with Express and Vite React that mirrors the response structure of `http://ip-api.com/json`.

---

## 🌟 Dual-Mode Architecture

1. **Browser Direct View (`/`)**: A Neo-brutalist web interface featuring:
   - Mobile-first responsive layout with minimum 44px touch targets.
   - Non-shifting, flash-free loading experience (zero vertical layout movement with fixed skeleton loader & header progress bar).
   - Live Leaflet map positioning with custom markers.
   - Real-time client IP auto-detection & custom IP/domain lookup.
   - Fully supported Dark Mode with eye-friendly dimmed colors (manual toggle syncing with localStorage/OS preferences).
   - Detailed breakdown (Country, Region, City, ZIP, Coordinates, Timezone with local time, ISP, Org, AS).
   - Collapsible Developer & API Tools section (hidden by default) with Raw JSON, code snippet generator (cURL, JavaScript, Python, PHP, Go), and interactive field sandbox (`?fields=...`).
   - Custom SVG favicon and full SEO metadata (Open Graph, Twitter Cards, JSON-LD structured data).
   - Centered GitHub repository button (`https://github.com/BotVibe/neo-ip`) in the footer.

2. **API Endpoint (`/api`, `/json`, `/api/:query`, `/json/:query`)**:
   - Production-hardened with `helmet` for security headers, gzip compression, and API rate limiting (300 requests / 15 min per IP).
   - Configured with `app.set('trust proxy', true)` and multi-header extraction (`cf-connecting-ip`, `true-client-ip`, `x-real-ip`, `x-forwarded-for`, etc.) to accurately detect caller IPs behind multi-layer reverse proxies (Dokploy, Traefik, Nginx, Cloudflare).
   - Returns strict raw JSON adhering to the `ip-api.com/json` schema.
   - Supports cross-origin requests (CORS enabled).
   - Supports field filtering via `?fields=status,country,city,lat,lon,query`.

---

## 📡 API Endpoints

| Endpoint | Method | Description | Example |
| :--- | :--- | :--- | :--- |
| `/api` | `GET` | Geolocation of the client caller IP | `/api` |
| `/json` | `GET` | Alias endpoint matching `ip-api.com` path | `/json` |
| `/api/:query` | `GET` | Geolocation for a target IP address or domain | `/api/170.205.81.42` |
| `/json/:query` | `GET` | Alias endpoint for target IP or domain | `/json/google.com` |

---

## 📋 Response Format (`http://ip-api.com/json` Compatible)

```json
{
  "status": "success",
  "country": "Switzerland",
  "countryCode": "CH",
  "region": "JU",
  "regionName": "Jura",
  "city": "Delémont",
  "zip": "2800",
  "lat": 47.3672,
  "lon": 7.3417,
  "timezone": "Europe/Zurich",
  "isp": "Swisscom (Schweiz) AG",
  "org": "Swisscom (Schweiz) AG",
  "as": "AS3303 Swisscom (Switzerland) Ltd",
  "query": "170.205.81.42"
}
```

---

## 🛠️ Development & Building

```bash
# Start dev server
npm run dev

# Run type checks and linter
npm run lint

# Build production bundle (bundled Node server + Vite client dist)
npm run build

# Start production server
npm run start
```

### 🚂 Railway & Railpack Deployment

The repository includes `nixpacks.toml` and `railway.json` configured with `NPM_CONFIG_OMIT="dev"` and `NPM_CONFIG_PRODUCTION=""` to suppress legacy `npm warn config production Use --omit=dev instead.` warnings during Railpack build phases.

---

## ⚠️ MAINTENANCE NOTE FOR AGENTS & DEVELOPERS

> **IMPORTANT:** Whenever endpoints, parameters, JSON fields, UI components, or server routing are modified, you **MUST** update both `README.md` and `AGENTS.md` to keep documentation and AI agent system instructions in sync with the codebase.
