# IP Geolocation Web Service & REST API

An IP geolocation web service built with Express and Vite React that mirrors the response structure of `http://ip-api.com/json`.

---

## 🌟 Dual-Mode Architecture

1. **Browser Direct View (`/`)**: A Neo-brutalist web interface featuring:
   - Live Leaflet map positioning with custom markers.
   - Real-time client IP auto-detection & custom IP/domain lookup.
   - Detailed breakdown (Country, Region, City, ZIP, Coordinates, Timezone with local time, ISP, Org, AS).
   - Code snippet generator (cURL, JavaScript, Python, PHP, Go).
   - Interactive field filtering test sandbox (`?fields=...`).

2. **API Endpoint (`/api`, `/json`, `/api/:query`, `/json/:query`)**:
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

---

## ⚠️ MAINTENANCE NOTE FOR AGENTS & DEVELOPERS

> **IMPORTANT:** Whenever endpoints, parameters, JSON fields, UI components, or server routing are modified, you **MUST** update both `README.md` and `AGENTS.md` to keep documentation and AI agent system instructions in sync with the codebase.
