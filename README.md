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
   - Configured with `app.set('trust proxy', true)` and multi-header extraction (`cf-connecting-ip`, `true-client-ip`, `x-forwarded-for` prioritized before `x-real-ip`, etc.) to accurately detect caller IPs behind multi-layer reverse proxies (Dokploy, Traefik, Nginx, Cloudflare).
   - Returns strict raw JSON adhering to the `ip-api.com/json` schema.
   - Supports cross-origin requests (CORS enabled).
   - Supports field filtering via `?fields=status,country,city,lat,lon,query`.

---

## 📡 API Endpoints

| Endpoint | Method | Description | Example |
| :--- | :--- | :--- | :--- |
| `/api` | `GET` | Geolocation of the client caller IP | `/api` |
| `/json` | `GET` | Alias endpoint matching `ip-api.com` path | `/json` |
| `/api/json` | `GET` | Alias endpoint, same as `/api` | `/api/json` |
| `/api/:query` | `GET` | Geolocation for a target IP address or domain | `/api/192.178.223.101` |
| `/json/:query` | `GET` | Alias endpoint for target IP or domain | `/json/google.com` |
| `/api/json/:query` | `GET` | Alias endpoint for target IP or domain | `/api/json/google.com` |
| `/api/client-info` | `GET` | Debug endpoint: returns the resolved caller IP and raw request headers (useful for diagnosing reverse-proxy header issues) | `/api/client-info` |

---

## 📋 Response Format (`http://ip-api.com/json` Compatible)

```json
{
  "status": "success",
  "country": "United States",
  "countryCode": "US",
  "region": "CA",
  "regionName": "California",
  "city": "Mountain View",
  "zip": "94043",
  "lat": 37.4225,
  "lon": -122.085,
  "timezone": "America/Los_Angeles",
  "isp": "Google LLC",
  "org": "Google LLC",
  "as": "AS15169 Google LLC",
  "query": "192.178.223.101"
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

### 🔌 Local dev server lifecycle (`dev.sh`)

The project intentionally does **not** run permanently as a background/systemd service (running it 24/7 needlessly wastes resources, e.g. laptop battery). Instead, use the bundled helper script to start it only when needed and stop it again afterwards:

```bash
./dev.sh start    # starts `npm run dev` in the background (PID in .dev.pid, logs in .dev.log)
./dev.sh status   # shows whether it's currently running
./dev.sh stop     # stops it
./dev.sh restart  # stop + start, e.g. after `npm install`
```

`.dev.pid` and `.dev.log` are local, git-ignored artifacts.

### 🚂 Railway & Railpack Deployment

The repository includes `nixpacks.toml` and `railway.json` configured with `NIXPACKS_NODE_VERSION = "22"` and Node `>=20.0.0` engine enforcement. This ensures Nixpacks/Railpack builds use Node.js 22, enabling native binary compatibility for `@tailwindcss/oxide` and full support for Vite 6 build scripts.

### 🐳 Dokploy Deployment (Fixing Client IP)

When deploying to Dokploy (which uses Traefik by default), you may find that the client IP is incorrectly reported as the server's IP or an internal Docker gateway IP. This happens because Traefik doesn't trust forwarded headers by default.

To fix this, you need to configure Traefik in Dokploy to trust incoming headers.

**Option 1: Traefik Labels (if deploying as Docker Compose in Dokploy)**
Add the following labels to your Traefik proxy configuration or to the service itself:
```yaml
labels:
  - "traefik.http.middlewares.my-trust-forward.forwardedheaders.insecure=true"
  # Or, to be more secure, trust the specific IP range of your load balancer/CDN
  # - "traefik.http.middlewares.my-trust-forward.forwardedheaders.trustedips=127.0.0.1/32,10.0.0.0/8"
  - "traefik.http.routers.YOUR_ROUTER_NAME.middlewares=my-trust-forward"
```

**Option 2: Network Mode Host (Simpler fallback)**
If you are running a single application and want to bypass the proxy's IP masking, you can set the network mode to `host` in your Dokploy advanced settings or Docker Compose:
```yaml
network_mode: "host"
```

**Option 3: Global Traefik Config (Dokploy Traefik override)**
If you have access to modify the Traefik entrypoints on your Dokploy server, update the `traefik.yml` or CLI args to include:
```yaml
entryPoints:
  web:
    address: ":80"
    forwardedHeaders:
      insecure: true
  websecure:
    address: ":443"
    forwardedHeaders:
      insecure: true
```
This tells Traefik to accept the `X-Forwarded-For` header from the outside world, allowing Node.js to read the real client IP.

---

## ⚠️ MAINTENANCE NOTE FOR AGENTS & DEVELOPERS

> **IMPORTANT:** Whenever endpoints, parameters, JSON fields, UI components, or server routing are modified, you **MUST** update both `README.md` and `AGENTS.md` to keep documentation and AI agent system instructions in sync with the codebase.
