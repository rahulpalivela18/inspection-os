---
name: offline
description: Use when working on offline support, PWA, service worker, IndexedDB, sync engine, OPFS, image/blob storage, or the API performance issues in OFFLINE_ROADMAP.md.
---

# Offline / PWA Skill

## Full Roadmap

Read `OFFLINE_ROADMAP.md` before doing any offline/PWA/sync/image-storage work. It contains the complete 5-phase plan, IndexedDB schema, sync algorithm, conflict resolution strategy, and API perf issues.

## Summary

**Approach:** local-first web app — PWA + IndexedDB + sync engine. Server (Express + PostgreSQL) stays completely unchanged; all offline logic lives client-side.

**Core principle:** the server sees normal API calls during sync and has no idea the client was offline.

## Key Decisions (from the roadmap)

| Topic | Decision |
|---|---|
| Approach | Local-first PWA, NOT cache-only, Electron, or native |
| Offline storage | IndexedDB via `dexie` (tables: projects, reports, checklistTemplates, team, workspace, mutationQueue, pendingImages) |
| Images offline | OPFS binary blobs, not base64 (base64 is ~33% larger and bloats JSONB) |
| Conflicts | Last-write-wins at field level; server wins; no merge |
| Sync order | Dependencies resolved: POST projects → POST reports → PATCH reports → DELETE |
| Auth offline | Cache `{ user, workspace }` on login; fall back when `/api/auth/me` fails |

## Phases

1. **PWA Shell** — `vite-plugin-pwa`, manifest, service worker caches static assets
2. **Local Data Layer** — dexie + `client/src/lib/offline.ts` OfflineManager, route all `api.ts` calls through it
3. **Image Handling** — OPFS blobs via `client/src/lib/blobStore.ts`, upload to GCP during sync
4. **Sync Engine** — `client/src/lib/sync.ts` mutation queue + replay + conflict detection + retry (max 5)
5. **Auth Offline** — cached auth fallback in `client/src/lib/auth.tsx`, "Continue Offline" on login page

## API Performance Status (from roadmap)

- ✅ Fixed: report list returns summaries only; PATCH sends only changed fields; auth/me stripped unused fields
- ⏳ Partially fixed: checklist-templates caching (staleTime Infinity, cache key fixed); still needs `?type=` filter
- ❌ Not started: base64→GCP image storage (Critical); pagination on list endpoints (Medium)

## Gotchas

- Existing code reads photos as `readAsDataURL()` → base64 → must migrate to `readAsArrayBuffer()` + OPFS
- iPad has no install via App Store; quota eviction risk for OPFS/IndexedDB
- Server currently handles base64 → GCP upload; during sync we pre-upload and send GCP URLs directly
