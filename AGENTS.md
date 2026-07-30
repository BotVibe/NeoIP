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

- **`server.ts`**: Express backend server running on port `3000` (host `0.0.0.0`).
  - Implements production-grade security and optimization (`helmet` for headers, `compression` for gzipping, `express-rate-limit` for DDoS prevention).
  - Handles `/api`, `/json`, `/api/:query`, `/json/:query` endpoints.
  - Proxies geolocation requests to `ip-api.com` with a fallback mechanism to `ipwho.is` and in-memory TTL caching.
  - Serves Vite middleware in development (`NODE_ENV !== 'production'`) and static files from `dist/` in production.
- **`index.html`**: Entry html file with custom Neo-brutalist SVG favicon (`/public/favicon.svg`), Open Graph, Twitter Cards, theme color, and JSON-LD WebApplication structured data.
- **`src/App.tsx`**: Single-page application rendering the Neo-brutalist dashboard with zero-layout-shift loading state (fixed skeleton loader & non-intrusive header progress bar), dimmed dark mode palette, a centered GitHub repository link (`https://github.com/BotVibe/neo-ip`) in the footer, and a collapsible Developer Tools section (hidden by default).
- **`src/components/`**:
  - `Header.tsx`: Title banner, caller IP lookup trigger, search bar, and integrated non-shifting bottom progress bar loader.
  - `InfoCard.tsx`: Formatted geolocation details with single-click copy buttons, updating indicator pill, and dimmed dark-mode badges.
  - `MapComponent.tsx`: Leaflet interactive map with custom Neo-brutalist marker.
  - `TabsSection.tsx`: Raw JSON viewer, multilingual code snippet generator, and interactive field tester with touch-friendly controls (toggled on-demand).

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

## 🚀 Build & Production Pipeline

- `package.json` scripts:
  - `dev`: `tsx server.ts`
  - `build`: `vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`
  - `start`: `node dist/server.cjs`
