#!/bin/sh
set -e

echo "[entrypoint] Applying database migrations..."
# Invoked directly (not via `npx prisma`/node_modules/.bin) because copying the .bin symlink
# into the runtime image dereferences it, which breaks Prisma's relative lookup of its .wasm
# files — those only resolve correctly next to the real build/index.js.
node node_modules/prisma/build/index.js migrate deploy

echo "[entrypoint] Starting server..."
exec "$@"
