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
WORKDIR /app
ENV NODE_ENV=production
# Prisma's engine needs a real OpenSSL install to detect the right variant, otherwise it
# silently falls back to a guessed version on every startup.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

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

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
