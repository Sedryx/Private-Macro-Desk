# ---- deps ----
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build ----
FROM node:20-slim AS build
WORKDIR /app
# Placeholder only — `prisma generate` and `next build` both need DATABASE_URL to resolve
# (prisma.config.ts reads it via env()), but neither actually connects to a database at
# build time. The real value is supplied at container startup via docker-compose.
ENV DATABASE_URL="postgresql://user:password@localhost:5432/build_placeholder"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- runtime ----
FROM node:20-slim AS runtime

ARG APP_VERSION=dev
LABEL org.opencontainers.image.title="Private Macro Desk" \
      org.opencontainers.image.description="Private trading cockpit for two traders: dashboard, watchlist, trade journal, economic calendar, research library and a macro terminal." \
      org.opencontainers.image.source="https://github.com/Sedryx/Private-Macro-Desk" \
      org.opencontainers.image.licenses="UNLICENSED" \
      org.opencontainers.image.version="${APP_VERSION}"

WORKDIR /app
ENV NODE_ENV=production
# Docker auto-sets HOSTNAME to the container ID, and Next's standalone server binds to
# whatever HOSTNAME resolves to — without this override it ends up listening only on the
# container's own IP, not on localhost, which breaks in-container checks (e.g. the
# HEALTHCHECK below) even though external access via the published port still works.
ENV HOSTNAME="0.0.0.0"
# Prisma's engine needs a real OpenSSL install to detect the right variant, otherwise it
# silently falls back to a guessed version on every startup. wget powers the healthcheck.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl wget \
    && rm -rf /var/lib/apt/lists/*

# Runs as root deliberately: the app writes trade screenshots to a bind-mounted host
# directory (see docker-compose.yml), and matching a non-root container user's UID to
# whatever owns that directory on the host adds real fragility for a two-user private
# app that isn't worth it here. Fine for this trust model; revisit if this ever needs
# to run in a shared/multi-tenant environment.
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

# The standalone output's node_modules only bundles what the Next.js server itself
# imports at runtime. `prisma migrate deploy` is invoked separately at container
# startup (see docker-entrypoint.sh) and pulls in its own, much larger dependency
# tree (config loader, engines, etc.) — copying the build stage's full node_modules
# over is simpler and more reliable than cherry-picking individual packages.
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/node_modules ./node_modules

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# CLI password reset — for when Settings isn't reachable (e.g. locked out, no browser
# session). Usage: docker compose exec app node docker-set-password.cjs <email> <password>
COPY scripts/docker-set-password.cjs ./docker-set-password.cjs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --spider http://localhost:3000/login || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
