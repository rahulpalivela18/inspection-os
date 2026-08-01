# Offline Support Roadmap — Inspection OS

## Why This Approach?

The user operates on iPad in the field (under-construction buildings, remote sites) with no internet. They need:

- Full CRUD offline (create projects, create reports, fill checklists, log issues)
- Take and attach photos offline
- Everything sync automatically when connectivity returns

**Chosen approach: local-first web app (PWA + IndexedDB + sync engine)**

| Option | Verdict |
|---|---|
| PWA cache-only | Cannot handle mutations — rejected |
| Electron/Tauri | Doesn't run on iPad — rejected |
| Native app (Swift/Kotlin) | Rewrite from scratch — overkill |
| **Local-first web app** | Runs on iPad, no install via App Store, full offline CRUD, server untouched |

**Key principle:** The server (Express + PostgreSQL) and all its endpoints stay **completely unchanged**. All offline logic lives client-side. The server just sees normal API calls during sync — it has no idea the client was ever offline.

---

## Phase 1 — PWA Shell (installable, loads offline)

### What
- Add `vite-plugin-pwa` to the Vite build
- Generate `manifest.json` with app name, icons, display: standalone
- Service worker caches all static assets (JS, CSS, fonts, images)
- User can "Add to Home Screen" on iPad — full-screen, no browser chrome

### Files to create
- `client/public/icons/` — 192x192 and 512x512 app icons (PNG)
- Vite config additions only

### Files to modify
- `vite.config.ts` — add `vite-plugin-pwa` plugin
- `client/index.html` — `<link rel="manifest">`, `<meta name="theme-color">`, iOS meta tags

### What works after this
- App icon on iPad home screen
- App shell loads without internet (HTML/JS/CSS from cache)
- User sees the login screen offline (but cannot log in or do anything useful)

---

## Phase 2 — Local Data Layer (IndexedDB)

### What
- Add `dexie` (IndexedDB wrapper, 14KB gzipped)
- Create local tables mirroring all API resources
- Replace all `api.ts` calls with a router that checks `navigator.onLine` first

### IndexedDB Schema

```typescript
// client/src/lib/db.ts
const db = new Dexie("InspectionOSDB");
db.version(1).stores({
  projects:        "id",
  reports:         "id",
  checklistTemplates: "id",
  team:            "id",
  workspace:       "workspaceId",
  mutationQueue:   "++id",
  pendingImages:   "++id",
});
```

### Core file — client/src/lib/offline.ts

```typescript
class OfflineManager {
  online: boolean;

  async request<T>(method, url, data?): Promise<T> {
    if (this.online) {
      try {
        const result = await fetch(url, ...);
        this.cacheResponse(url, result);
        return result;
      } catch {
        this.online = false;
        return this.offlineRead(method, url, data);
      }
    }
    return this.offlineRead(method, url, data);
  }

  async offlineRead(method, url, data?) {
    if (method !== "GET") return this.enqueueMutation(method, url, data);
    return this.readFromIndexedDB(url);
  }
}
```

### Files to create
- `client/src/lib/offline.ts` — OfflineManager class
- `client/src/lib/db.ts` — Dexie schema + CRUD helpers

### Files to modify
- `client/src/lib/api.ts` — route all calls through `OfflineManager.request()`
- `client/src/lib/queryClient.ts` — make TanStack Query work with offline data
- `client/src/App.tsx` — initialize OfflineManager

### What works after this
- Reading data (projects list, reports list, report detail, templates) works offline from IndexedDB
- Mutations (create/edit/delete) write to IndexedDB immediately and queue for sync
- UI remains fully interactive with no visible change

---

## Phase 3 — Image Handling (blobs, not base64)

### Current problem
- Photos are read as `FileReader.readAsDataURL()` → base64 string
- Base64 stored inline in report JSONB (`checklist[].image`, `issues[].images`)
- These base64 strings can be **megabytes each**
- They are transmitted on **every** report fetch and report list fetch
- They bloat IndexedDB storage (base64 is ~33% larger than binary)

### Offline solution — OPFS (Origin Private File System)

```
Photo → FileReader.readAsArrayBuffer()
     → Store as binary blob in OPFS
     → Store blob key in IndexedDB report data
     
On sync → blob uploaded to GCP
     → GCP URL replaces blob key in report data
     → report PATCHed to server (now has GCP URLs, not base64)
```

### Files to create
- `client/src/lib/blobStore.ts` — OPFS wrapper (save blob, get blob URL, delete blob)
- `client/src/lib/imageMigrator.ts` — one-time migration for existing base64 → OPFS blobs

### Files to modify
- `client/src/pages/ReportEditor.tsx` — replace `readAsDataURL` with `readAsArrayBuffer` + `blobStore.save()`
- `client/src/lib/sync.ts` — during sync: upload blobs to GCP, replace keys with URLs
- `server/routes.ts` — no change (server already handles base64 → GCP upload, but during sync we'll pre-upload and send GCP URLs directly)

### What works after this
- Photos are stored as binary blobs (much smaller than base64)
- Report data in IndexedDB no longer contains megabytes of image data
- Images are only uploaded to GCP during sync, not on every save attempt

---

## Phase 4 — Sync Engine (hardest part)

### Mutation Queue (IndexedDB)

```typescript
type QueuedMutation = {
  id: number;
  method: "POST" | "PATCH" | "DELETE";
  url: string;
  body?: any;
  createdAt: number;
  retries: number;
  maxRetries: 5;
  tempId?: string;      // local temp ID (e.g. "temp-project-abc123")
  realId?: string;      // resolved server ID after replay
  dependencies: string[]; // temp IDs this mutation depends on
  status: "pending" | "in-flight" | "failed";
  lastError?: string;
};
```

### Sync algorithm

```
1. Detect online (navigator.onLine + online event)
2. Mark all "pending" mutations as "in-flight"
3. Pull latest server data for all resources (to detect conflicts)
4. Sort mutations by dependency order:
   - POST projects (no dependencies)
   - POST reports (depends on project ID resolution)
   - PATCH reports (depends on report ID resolution)
   - DELETE (no dependencies)
5. For each mutation:
   a. Resolve temp IDs → real server IDs from previous mutations
   b. Rewrite body (e.g. projectId in report body)
   c. Upload any pending images → get GCP URLs
   d. Execute the API call
   e. Map response's real server ID back to the local record
   f. Update IndexedDB with real server data
   g. If failed → mark as "failed" with error, retry later
6. Notify user of results (success count, failure count)
```

### Conflict resolution

Strategy: **last-write-wins at field level** (simple, sufficient for this use case)

- Checklist items, dimensions, issues are arrays — the entire array is replaced on sync
- If two inspectors edited different fields, the last sync wins entirely
- Show a toast: "Some data was overwritten by server changes"
- No merge logic — the server always wins on conflicts

### Files to create
- `client/src/lib/sync.ts` — SyncEngine class (queue, replay, conflict detection, retry)

### Files to modify
- `client/src/App.tsx` — register online/offline event listeners, trigger sync
- `client/src/components/OfflineBanner.tsx` — "Working offline" indicator with sync status
- `client/src/pages/ReportEditor.tsx` — the existing "Sync" button repurposed for manual sync trigger

### What works after this
- Offline work → comes online → everything syncs automatically
- Mutations replay in correct order (project before report)
- Temp IDs are resolved to real server IDs
- Failed mutations retry up to 5 times
- User sees sync progress and errors

---

## Phase 5 — Auth Offline

### Problem
- Session-based auth requires `GET /api/auth/me` on every pageload
- Offline = no auth check = app redirects to login

### Solution
- On successful login, cache `{ user, workspace }` to IndexedDB
- On app load, if `GET /api/auth/me` fails (offline), fall back to cached auth
- Show a persistent banner: "Working offline — changes will sync when connected"
- On login page, show cached user info and allow "Continue Offline" button

### Files to modify
- `client/src/lib/auth.tsx` — fallback to cached auth on network failure
- `client/src/lib/offline.ts` — cache auth data on login
- `client/src/App.tsx` — `ProtectedRoute` allows cached auth

### What works after this
- User opens app offline → immediately sees dashboard with cached data
- No login required if previously authenticated

---

## Current API Performance Issues

These need to be addressed **before or during** offline implementation, since they affect both online UX and sync efficiency.

### ✅ 1. GET /api/projects/:projectId/reports — returns summaries only

**Severity:** High — **FIXED**

**Changes:**
- Server (`server/routes.ts`): strips `checklist`, `dimensions`, `issues` from list response
- Full report loaded lazily via `GET /api/reports/:id` (unchanged)

### ⏳ 2. GET /api/checklist-templates — caching fixed, filter pending

**Severity:** Medium — **partially fixed**

**Changes:**
- `staleTime: 0` → `Infinity` across all consumers (`ProjectDetails.tsx`, `ReportEditor.tsx`, `Templates.tsx`)
- Cache key mismatch fixed: `"checklistTemplates"` → `"checklist-templates"` (was creating two separate cache slots for the same data)
- Explicit invalidation on create/edit/delete in Templates.tsx already existed

**Still needed:**
- `?type=` query param to filter server-side (avoids sending all types when only one is needed)
- Pagination if templates grow beyond ~500

### ✅ 3. PATCH /api/reports/:id — stops sending full report on every save

**Severity:** Medium — **FIXED**

**Changes (client-side):**
- `ReportEditor.tsx`: all 6 `saveReport()` calls now send only the changed field(s) instead of `{ ...report, changedField }`
- `ProjectDetails.tsx`: `handleUpdateReport` uses `pick()` instead of `...editingReport`
- `Templates.tsx`: removed `isRepeatable`/`spaceType` (not in schema)

**Impact:** Toggling one checkbox now sends `{ checklist: [...] }` instead of the full report (computed fields, meta fields, collections).

### ✅ 4. GET /api/auth/me — stripped unused workspace fields

**Severity:** Low — **FIXED**

**Changes:**
- Strips `planStatus`, `createdAt` from workspace response (not used in UI)
- Uses shared `pick()` utility (in `shared/cleanData.ts`)

### 5. Base64 images stored inline in JSONB

**Severity:** Critical — **not started**

Images are stored as base64 data URLs directly in the `checklist[].image` and `issues[].images` JSONB fields. This means:
- Every report fetch includes megabytes of image data
- Impossible to load images lazily
- IndexedDB storage wasted on base64 overhead

**Fix:**
- Store images as files in GCP at capture time
- Or store images as blobs in OPFS/client-side and only upload during sync
- Remove base64 from report JSONB — store only GCP URLs

### 6. No pagination anywhere

**Severity:** Medium — **not started**

Every list endpoint returns all results in one response. No `?limit=` or `?offset=`.

**Fix:**
- `GET /api/projects` — add pagination (default 50 per page)
- `GET /api/projects/:projectId/reports` — add pagination (default 20 per page)
- `GET /api/checklist-templates` — add `?type=` filter + pagination

---

## Limitations

| Limitation | Impact | Acceptable? |
|---|---|---|
| **Conflict: last-write-wins** | Two offline users editing the same report: one's changes are lost | Likely yes (one inspector per report) |
| **No real-time collaboration** | Changes only visible after sync | Yes (inspection is single-user) |
| **No shared offline** | Two iPads in same building don't sync to each other | Yes (each syncs to server when online) |
| **iPad storage quota** | OS may evict OPFS/IndexedDB data on low storage | Monitor via StorageManager API |
| **Large report performance** | A report with 50+ photos may take 30+ seconds to sync | Mitigate: upload images in parallel |
| **Sync during active editing** | User editing a report while sync replays could lose changes | Lock report during sync or warn user |
| **PDF export offline** | Fonts must be cached by service worker | Works if SW caches Google Fonts |
| **Offline first load** | User must have internet on very first visit (login, SW install) | Acceptable — can't avoid |

---

## Future: Database Schema Redesign

If you ever redesign the database, here is how to make the app offline-friendly from the ground up.

### What to change

#### Reports — normalize the JSONB blobs into related tables

```sql
-- Current (bad)
reports (
  checklist jsonb,      -- 200+ items with image blobs
  dimensions jsonb,     -- array of objects
  issues jsonb,         -- can be megabytes
  images -- stored inline in checklist/issues as base64
)

-- Future (good)
reports (
  id, project_id, title, author, status, date, created_at,
  inspection_type text[], space_counts jsonb  -- small jsonb is fine
);

checklist_items (
  id, report_id, category, point, status, severity,
  trigger_on, image_url text, -- GCP URL only, never base64
  created_at
);

report_dimensions (
  id, report_id, space, space_name, length, width, unit, notes
);

issues (
  id, report_id, title, note, location,
  responsible_engineer, severity, status, created_at
);

issue_images (
  id, issue_id, gcp_url text, -- separate table for multiple images
  sort_order
);
```

#### Benefits

- **Selective fetching** — list reports without fetching all checklist items
- **Pagination** — fetch checklist items 50 at a time (virtual scroll)
- **Lazy loading** — load issues/dimensions on demand
- **Offline-friendly** — store each entity type separately in IndexedDB (no huge single record)
- **Sync-friendly** — update individual checklist items instead of replacing the entire array

#### Image storage

```sql
-- Instead of base64 in JSONB
images (
  id, report_id, entity_type text, -- 'checklist' or 'issue'
  entity_id text,  -- checklist_item_id or issue_id
  gcp_url text,
  local_blob_key text, -- OPFS key, used during offline capture
  synced boolean default false,
  created_at timestamp
);
```

### How to migrate safely

```mermaid
flowchart TD
    A[Add new tables with Drizzle migration] --> B[Write a backfill script<br/>reads each report's JSONB<br/>INSERTs into new tables]
    B --> C[Deploy new code that writes to<br/>BOTH jsonb column AND new tables<br/>(dual-write period)]
    C --> D[Monitor for data consistency<br/>(no missing rows)]
    D --> E[Remove jsonb writes from code]
    E --> F[DROP jsonb columns via migration]
    F --> G[Remove dual-write code]
```

1. **Add new tables** — use Drizzle migration to create `checklist_items`, `report_dimensions`, `issues`, `issue_images` tables
2. **Backfill** — a one-time Node script that reads every `reports.checklist`, `reports.dimensions`, `reports.issues` JSONB and INSERTs into the new normalized tables
3. **Dual-write** — deploy code that writes to both the old JSONB columns AND the new tables (backward compatibility)
4. **Verify** — compare row counts between old jsonb data and new tables. Fix any discrepancies.
5. **Cutover** — stop writing to JSONB columns. All reads come from new tables.
6. **Drop** — Drizzle migration drops `checklist`, `dimensions`, `issues`, `space_counts` columns from `reports` table
7. **Cleanup** — remove dual-write code, remove migration script

**Rollback plan:** During the dual-write phase, rolling back is safe — the old JSONB columns still have the latest data.

---

## Estimated Effort

| Phase | Time | Dependencies |
|---|---|---|
| 1. PWA Shell | 0.5 day | None |
| 2. Local Data Layer | 2–3 days | Phase 1 |
| 3. Image Handling | 1–2 days | Phase 2 |
| 4. Sync Engine | 3–5 days | Phases 2 + 3 |
| 5. Auth Offline | 1 day | Phase 2 |
| API performance fixes | 2 days | None (can do in parallel) |
| **Total** | **~2.5–3 weeks** | |

---

## Summary

### What makes this a "full app" in the future

1. **Normalized database schema** — separate tables for checklist items, dimensions, issues, images (removes the 100MB JSONB problem)
2. **Pagination on every list endpoint** — no more loading 10,000 rows at once
3. **Images stored in GCP at capture time** (upload in background) — removes base64 from the data layer entirely
4. **OPFS for offline blobs** — efficient binary storage on iPad
5. **Offline-first** — IndexedDB is the primary data store; server is just the sync target
6. **Conflict resolution UI** — let users manually resolve conflicts when they happen
7. **Background sync** — iOS supports Background Fetch (adds sync without opening the app)

### The current API is the bottleneck

Before doing any offline work, the **#1 priority** should be fixing the report list endpoint to return summaries (no checklist/issues/dimensions/ images in the list view). This alone will drop page loads from 5–15 MB to ~2 KB per report. This is a server-side change that makes everything else easier.
