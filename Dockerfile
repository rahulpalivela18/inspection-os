# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Copy built assets from build stage
COPY --from=builder /app/dist ./dist

# Copy migrations so drizzle-kit push can run at startup
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/shared ./shared

ENV NODE_ENV=production
EXPOSE 5002

CMD ["node", "dist/index.cjs"]
