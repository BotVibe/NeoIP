# syntax=docker/dockerfile:1
#
# Production image for NeoIP (Express + Vite). CI publishes to
# ghcr.io/botvibe/neoip; deploy/compose.yml pulls that image behind Caddy.

FROM node:22-alpine AS base
WORKDIR /app

# ---------------------------------------------------------------- dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------- build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

# -------------------------------------------------------------------- runtime
FROM base AS runtime
ENV NODE_ENV=production
# Behind Caddy (or any reverse proxy): trust X-Forwarded-For only.
# Unset TRUST_PROXY outside this image to keep the legacy multi-header path.
ENV TRUST_PROXY=true
ENV PORT=3000

ARG APP_REVISION=unknown
LABEL org.opencontainers.image.revision=$APP_REVISION

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

RUN addgroup -S app && adduser -S app -G app \
 && chown -R app:app /app

USER app
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/ || exit 1

CMD ["npm", "run", "start"]
