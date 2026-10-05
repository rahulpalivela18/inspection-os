# Step 1: Turn this repo (Node 20 + Express + Vite) into a runnable image.
# Postgres is NOT built here — it comes from postgres:16-alpine later via compose/run.

# ── Stage 1: Build ──
FROM node:20-alpine AS builder
WORKDIR /app

# 1. Deps first for layer caching (rebuilds skip this if package*.json unchanged)
COPY package*.json ./
RUN npm ci

# 2. Source + build (Vite -> dist/public, esbuild -> dist/index.cjs)
COPY . .
RUN npm run build

# ── Stage 2: Production runner ──
FROM node:20-alpine AS runner
WORKDIR /app

# 3. Prod-only deps (smaller, no vite/tsx/typescript)
COPY package*.json ./
RUN npm ci --omit=dev

# 4. Only what we need to run
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/shared ./shared

ENV NODE_ENV=production
EXPOSE 5002

CMD ["node", "dist/index.cjs"]
