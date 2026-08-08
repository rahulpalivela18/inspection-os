# PLAN — Multi-User Hierarchy & Access (for ALL plans)

> Status: **PLANNED — not yet implemented.** This is the source of truth for the
> next implementation phase. Read `docs/CHECKLISTS.md` for where we are.

## 1. Context

Inspection OS is a multi-tenant SaaS (Express + React + PostgreSQL/Drizzle).
Today the hierarchy is flat:

```
workspace → project → { reports, captures }
```

The real paying client (AP31) needs:
- **Per-project teams** — different people work on different projects; each person sees only what they're assigned to.
- **A site hierarchy** — a project (e.g. Kommadi) contains blocks → floors → units (flat 205, water tanker, lift shaft).
- **Re-inspections over time** — the same unit inspected multiple times ("initial", "4 months later", "final") = multiple reports + separate capture sets per visit.
- **Accidental-deletion safety** — an inspector must never be able to permanently wipe 500 reports with one click.

> This is **NOT an enterprise-only feature set.** All of it ships to **every plan**
> (Starter/Pro/Enterprise). Plans only cap **capacity** (profile counts, project
> counts), never features.

## 2. Target hierarchy

```
workspaces (company: Vaisakhi, AP31 — one subscription, one roster, one brand)
└─ projects  (site — SkyPark, Kommadi, MVV GV)              [existing table, untouched]
   └─ blocks (flexible sub-container — "Block 1", "Stage Inspection", "Tower A")   [NEW]
      └─ floors ("Floor 1", "Ground", "Mezzanine")                                 [NEW]
         └─ units ("Flat 205", "Water Tanker" — heavy: hundreds of GCP image links)[NEW]
            └─ reports (multiple per unit, date-sorted = re-inspections/phases)
```

- **Depth cap = 4 container levels** (Project → Block → Floor → Unit). **Hard stop below Unit** — nothing nests inside a Unit except reports/captures.
- Reports/captures attach to **exactly one parent node** — their single immediate
  container. A branch may be shallow (Project → Block, with reports on the Block) or
  deep (… → Unit, with reports on the Unit); each report/capture points at the one
  deepest node that exists for it, **never at two levels at once** (enforced by a CHECK
  constraint). Teams that skip a level simply don't create it. This is *not*
  "file at any depth" free-form filing — every item has exactly one home.
- **No fixed "phase" concept.** Re-inspection = just another report on the same unit, distinguished by title/date. Users name blocks/floors/units/reports however they work.
- Captures group under **their report** so each inspection's photo set stays together.

## 3. Schema changes (all additive, no downtime, reversible)

| Table | Change |
|---|---|
| `projects` | untouched — becomes the top-level **site** |
| `blocks` | NEW — `id, workspace_id, project_id FK, title, deleted_at, ...` |
| `floors` | NEW — `id, workspace_id, project_id (denorm), block_id FK, title, deleted_at, ...` |
| `units` | NEW — `id, workspace_id, project_id (denorm), floor_id FK, title, deleted_at, ...` |
| `reports` | + nullable `block_id`/`floor_id`/`unit_id` (immediate parent). `project_id` stays **NOT NULL** as the scope anchor. **CHECK: at most one of the three is set.** |
| `captures` (spatial) | + nullable `report_id`/`block_id`/`floor_id`/`unit_id`. `project_id`/`workspace_id` already present, stay NOT NULL. **CHECK: at most one container FK set.** |
| `project_members` | NEW — `project_id, user_id, role: owner/admin/member/viewer, deleted_at`, partial UNIQUE(project_id, user_id) WHERE deleted_at IS NULL |
| projects/blocks/floors/units/reports/captures | + `deleted_at` (soft-delete) |

No polymorphism: 4 separate tables, one FK per level, simple indexed joins.

**Denormalize `workspace_id` and `project_id` onto every level** (blocks/floors/units)
and keep them on reports/captures. Every access / tenant check is then a single indexed
`WHERE project_id = ANY(:userProjectIds)` with **no joins up the tree**.

> **Consistency rule (why this is safe):** the denormalized `project_id`/`workspace_id`
> are **derived server-side from the parent on insert** — never sent by the client. They
> are only ever rewritten by the one-time reparenting migration (§7). Normal operation
> never moves a node between projects, so the copy can't drift from the real parent chain.

**Indexing (required):** every FK column + each denormalized `project_id`; partial
indexes `WHERE deleted_at IS NULL` on hot read tables; the partial-unique on
`project_members` above.

## 4. Roles & access chain

```
super_admin (us — platform, all workspaces, excluded from plan limits)
└─ workspace admin (customer — Vaisakhi's admin)
   │  sees ALL their company's projects
   │  owns the ROSTER (registers every employee; assignment is via dropdowns only)
   │  creates project owners
   └─ project owner (workspace role: inspector, project role: owner)
      │  sees ONLY their project (all its blocks/floors/units)
      │  manages their project's team via roster dropdowns
      └─ members/inspectors — work on assigned projects, never delete
         viewers — read-only on assigned projects
```

- **Membership lives on the top-level project** → inherits to all its blocks/floors/units.
- **Non-members get 404** — the project is invisible (never a scary error).
- Multi-project membership = see exactly the projects you're on.
- `super_admin` bypasses every check (our support/debug path).
- Effective access = `super_admin` → workspace `admin` → project role, otherwise 404.

## 5. Plan gating (limits, not features)

| Plan | Profiles (incl. yourself) | Projects |
|---|---|---|
| Starter | 3 | limited |
| Pro | 10 | ... |
| Enterprise | unlimited | unlimited |

- Enforce a **total-profile cap** on `POST /api/team` (generalize the existing
  inspector-only limit; simplifies the current "max 1 admin" special case).
- **`super_admin` accounts are excluded** from profile counts.
- All hierarchy/membership/profile/soft-delete features are **core for every plan**.

## 6. Safety — soft-delete / trash

**Delete = soft.** `DELETE` sets `deleted_at = now()` + a shared `deleted_batch_id`
(one uuid per delete action). The row moves to trash; never a hard delete.

**Cascade the timestamp yourself — FK `cascade` does NOT fire on soft-delete.** A
soft-delete is an `UPDATE`, so the FK `onDelete: cascade` never triggers; only the target
row would be stamped, orphaning its descendants (alive but parent-less = ghost data).
So deleting a container stamps the node **and its whole subtree** in one transaction.
Cheap because `project_id` is denormalized on every level (see §3):

```sql
UPDATE {blocks,floors,units,reports,captures}
   SET deleted_at = now(), deleted_batch_id = :batch
 WHERE project_id = :projectId AND deleted_at IS NULL;   -- whole project subtree
```
For a narrower delete (a single block/floor/unit), scope the WHERE to that node + its
descendants (same idea, tighter filter) instead of the whole `project_id`.

**Restore = revert the exact batch.**
```sql
UPDATE ... SET deleted_at = NULL, deleted_batch_id = NULL WHERE deleted_batch_id = :batch;
```
Reverting by `deleted_batch_id` (not `project_id`) guarantees a restore brings back only
what was deleted *together* — it never resurrects something deleted in a separate earlier
action.

**Reads filter `deleted_at IS NULL` — centrally.** Apply via one query helper or DB views
(`active_*`), not hand-written on every endpoint, or ghost rows leak into lists/PDFs.

**Retention + purge (scheduled job).** Restore allowed for **30 days**; after that a daily
scheduled job (Railway cron) hard-deletes:
```sql
DELETE ... WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
```
The hard delete is where FK `onDelete: cascade` finally does the DB-row cleanup.

**Purge MUST also delete the GCP objects — the bucket leaks otherwise.**
⚠️ Today there is **no** GCP-delete logic at all (`gcp-storage.ts` only has
`uploadImageToGCP`/`isGCPUrl`), so every delete already orphans images in
`reportgen-images-rahul` forever. The purge job must, **before** hard-deleting each
`capture`/`hotspot`, collect its GCP-hosted URLs and delete those objects:
- `captures.image_url`, `captures.thumbnail_url`
- `hotspots.pano_url`, `hotspots.thumbnail_url`, `hotspots.resolved_photo`
- Report `checklist[]`/`issues[]` images are **base64 inline in JSONB** today → they vanish
  with the row (no GCP action). When normalized to GCP URLs (later phase), add them here.

Rules:
- **Order:** delete the GCP object(s) → then the DB row. A GCP failure is logged + retried
  (leaves a harmless orphan); it never blocks the DB purge.
- **Idempotent:** treat "object already gone" (404) as success.
- **No refcounting needed** — each object is referenced by exactly one row (no dedup/sharing).
- **New helper required:** `deleteObjectFromGCP(url)` in `server/gcp-storage.ts`.

**Destructive deletes → `requireAdmin`** (plus project-admin via effective access, §4):
inspectors create/edit, never delete.

**Rollback:** drop the new tables/columns + revert code; existing data identical.

## 7. Prod migration

1. `npm run db:push` → add new tables + columns.
2. **AP31 data sort** (only AP31 is a real client; MK BUILDERS/ECCC are temp):
   - 9 sites stay top-level: Kommadi, Utkarsha, MVV GV, Dharani Residency,
     Achanti homes, Ramky Krystal, Sai surya constructions, Aspen castle, TUNI.
   - KOMMADI STAGE/FINAL/last stage → **blocks under Kommadi** (client confirmed:
     "all under Kommadi" — inspections at different stages).
   - Utkarsha Capital Towers → **block under Utkarsha**.
   - MVV GV 512, TUNI FLAT-301, TUNI FLAT-302 → **units** (under their sites).
3. **Membership backfill**: insert every existing workspace user as `member` of
   every project in their workspace → post-deploy behavior unchanged; admins then trim.
4. Temp workspaces: keep MK BUILDERS + ECCC as-is (recommended) — your
   `super_admin` login lives in MK BUILDERS.

## 8. UI

- Dashboard = your projects only (workspace admin sees all).
- Breadcrumb drill-down: Project / Block / Floor / Unit.
- Context buttons: "Add Block" under project, "Add Floor" under block, "Add Unit"
  under floor, "New Report" on any node.
- Per-project **Team tab**: assign roster members via dropdowns, set roles.
- Personal **Profiles** page (name, avatar, password change).
- **Settings** read-only for non-admins; **Subscription/Billing** admin-only.
- Capture PDF becomes **per-report** (each inspection's captures render together).

## 9. Out of scope — later phases

- Reports JSONB normalization (`checklist`, `dimensions`, `issues` blobs + inline
  base64 images) — see `OFFLINE_ROADMAP.md`. Build the new schema now, normalize later.
- Pagination on list endpoints — `OFFLINE_ROADMAP.md`.
- Shared-login abuse controls (session/device limits) — future decision.
- Per-block/unit level access (currently inherits from top-level project).

## 10. Implementation order

1. Schema (`shared/schema.ts`) → `npm run db:push`
2. Storage methods (`server/storage.ts`) + membership/hierarchy/soft-delete routes (`server/routes.ts`)
3. Client: dashboard filter, breadcrumb navigation, context buttons
4. Per-project Team tab + role gating
5. Profiles page + Settings/Subscription role gating
6. Soft-delete/trash UI
7. AP31 data sort + membership backfill (one-time script)
8. `npm run check` + manual test

Track progress in `docs/CHECKLISTS.md`.
