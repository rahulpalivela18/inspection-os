# AGENTS.md

## Commands

- `npm run dev` — Start dev server (tsx watches `server/index.ts`)
- `npm run dev:client` — Vite dev server on port 5000
- `npm run build` — Production build via `script/build.ts` (esbuild + vite)
- `npm start` — Run production build from `dist/index.cjs`
- `npm run check` — TypeScript type check (noEmit)
- `npm run db:push` — Push Drizzle schema changes to DB

No test, lint, or format commands configured

## Architecture

Single package, three directories:
- `server/` — Express backend, entry point `server/index.ts`
- `client/src/` — React frontend, entry point `client/src/main.tsx`
- `shared/` — Drizzle ORM schema + Zod types, shared by server and client

Path aliases: `@/*` → `client/src/*`, `@shared/*` → `shared/*`

## Database

- PostgreSQL with Drizzle ORM
- Schema defined in `shared/schema.ts`
- `drizzle.config.ts` points to `./migrations` for migration files
- Requires `DATABASE_URL` in `.env` (gitignored)

## Build

- Server: esbuild bundles `server/index.ts` to `dist/index.cjs` (CJS)
- Client: Vite builds to `dist/public`
- `script/build.ts` runs both sequentially

## Gotchas

- `checklist_templates.order` column allows duplicates (default 0) — queries now use `ORDER BY created_at DESC` for deterministic ordering
- `.env` and `.env.local` are gitignored — exist locally but not in repo; must be created for new setups
- Server runs with `tsx` in dev; production build is CJS despite `"type": "module"` in root
