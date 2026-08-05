# Inspection OS — Orchestration Guide

Concise reference for how this project's skills and agents are organized. Commands, architecture, DB, and build info live in the root `AGENTS.md`.

## Skills (`/skills/*/SKILL.md`)

Lazy-loaded on demand — load a skill before working in its area:

| Skill | Use for |
|---|---|
| `api` | REST endpoints, Zod request/response contracts, API docs |
| `auth` | Login, sessions, Passport.js, RBAC, permissions, security |
| `backend` | Express routes, middleware, server logic |
| `database` | Drizzle schema, queries, migrations, PostgreSQL |
| `frontend` | React pages, hooks, data fetching, state |
| `shared-types` | Type definitions, Zod schemas, shared contracts |
| `ui-components` | shadcn/ui, Tailwind, accessibility |
| `offline` | PWA, IndexedDB, sync, offline roadmap (`OFFLINE_ROADMAP.md`) |
| `roles-plans` | RBAC roles + plan-based inspector limits (`docs/roles-and-plans-implementation.md`) |

## Agents (`/agents/*.md`)

Subagents registered with the same names (`backend`, `frontend`, etc.) for delegating focused work via the Task tool.

## Routing

- **One-area change** → load the matching skill, do the work directly.
- **Multi-layer feature** → run in this order: `shared-types` → `database` → `backend` → `api` → `frontend` → `ui-components` (types first, UI last).
- **Security-sensitive** → start with `auth`.

## Docs Index

Orphaned planning docs that are only loaded when relevant:

- `OFFLINE_ROADMAP.md` — local-first PWA strategy, 5 phases, API perf issues (load with `offline` skill)
- `docs/roles-and-plans-implementation.md` — RBAC + inspector limits implementation guide (load with `roles-plans` skill)
