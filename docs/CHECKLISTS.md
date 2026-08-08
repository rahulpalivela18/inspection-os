# CHECKLISTS — Where Inspection OS stands

> Companion to `docs/PLAN.md` (the design/why) and `docs/FLOW.md` (the
> step-by-step build guide/how, written for whoever picks up this ticket).
> New agents/chats: read this first to know exactly where we are, then
> `docs/PLAN.md` for the target architecture, then `docs/FLOW.md` to build it.

## ✅ Done (committed to `feat/pwa-app`)

- [x] Removed dead "Sync Checklist" button from `ReportEditor.tsx` (it was never
      reachable — dialog had no trigger). Template changes now only affect new reports.
- [x] Landing page "Download Sample PDF" → opens GCP-hosted `SkyPark_-_Unit_12B_captures.pdf`
      in a new tab (no download). Local 15.7MB `client/public/pdfs/InspectionOS_Sample.pdf`
      deleted.
- [x] DB inspected (local + Railway prod).
- [x] Decided: only **AP31** is a real paying client; **MK BUILDERS** and **ECCC**
      are temp accounts (your `super_admin` login lives in MK BUILDERS — don't delete).

## 📊 Current prod data snapshot (Railway)

- 3 workspaces, all `starter` + active: AP31Homeinspections (1 admin, 15 projects),
  MK BUILDERS AND DEVELOPERS (super_admin + 1 admin, 1 project "MK ONE"), ECCC (1 admin, 0 projects).
- 5 reports total; captures/hotspots live in the `spatial` schema (many per project, e.g. KOMMADI STAGE = 171).
- AP31's 15 projects are a **mix** (sites + mislabeled sub-entities) — sorting plan in `docs/PLAN.md` §7.

## 🔲 PLANNED — Multi-User Hierarchy & Access (for ALL plans)

See `docs/PLAN.md` for the design and `docs/FLOW.md` for the exact build
steps (phases below map 1:1 to `FLOW.md`'s phases). Status tracking below.

### Phase 0. Local dev environment — not started
- [ ] Local Postgres installed, `inspection_os_dev` DB created
- [ ] `$LOCAL_DB` env var set; confirmed it does NOT point at Railway

### Phase 1. Schema — not started
- [ ] `blocks` table (`project_id` FK)
- [ ] `floors` table (`project_id` denorm + `block_id` FK)
- [ ] `units` table (`project_id` denorm + `floor_id` FK)
- [ ] `entities` table — the polymorphic "Item" (`project_id` denorm anchor +
      exactly one of `block_id`/`floor_id`/`unit_id`, or none = direct-under-project;
      enforced by a CHECK constraint)
- [ ] `project_members` table (`project_id`, `user_id`, role owner/admin/member/viewer,
      partial-UNIQUE where not deleted)
- [ ] `reports` + nullable `entity_id` (FK → entities) + `deleted_at`/`deleted_batch_id`
- [ ] `captures` (spatial) + nullable `entity_id` (FK → entities) + nullable `report_id`
      (FK → reports, for per-report photo grouping) + `deleted_at`/`deleted_batch_id`
- [ ] `deleted_at`/`deleted_batch_id` on projects/blocks/floors/units/entities/reports/captures
- [ ] `npm run check` passes
- [ ] `DATABASE_URL=$LOCAL_DB npm run db:push` — verified against LOCAL db only

> Note: earlier drafts of this plan had reports/captures attach via 3 separate
> nullable `block_id`/`floor_id`/`unit_id` columns. Superseded by the single
> `entities` resolver table (§3 of `PLAN.md`) — one attach point (`entity_id`)
> instead of duplicating the "which level" ambiguity onto both tables.

### Phase 2. Storage layer — not started
- [ ] Project members CRUD (`getProjectMembers`, `getProjectMember`,
      `listProjectIdsForUser`, `addProjectMember`, `updateProjectMemberRole`,
      `removeProjectMember`)
- [ ] Blocks/Floors/Units CRUD
- [ ] Entities CRUD + `getEntitiesByParent` (polymorphic lookup) +
      `getOrCreateDefaultEntity` (the "General" auto-item for simple/flat projects)
- [ ] Soft-delete: `softDeleteProject`/`Block`/`Floor`/`Unit`/`Entity`/`Report` —
      cascade `deleted_at` + shared `deleted_batch_id` over the subtree (by
      denormalized `project_id`) in one txn; `restoreBatch`; every list query
      filters `deleted_at IS NULL`
- [ ] `deleteObjectFromGCP(url)` helper in `gcp-storage.ts` (does not exist today)
- [ ] `purgeExpiredTrash()`: after 30 days, delete GCP objects for captures/hotspots
      → then hard-delete rows (route: `POST /api/admin/trash/purge`, super_admin only;
      wire to a Railway cron once verified manually)

### Phase 3. Routes — not started
- [ ] `getEffectiveProjectAccess` resolver (single source of truth for
      super_admin / workspace admin / project owner-admin-member-viewer) +
      `requireProjectAccess` (404 if not a member) / `requireProjectWrite` /
      `requireProjectDelete` middleware
- [ ] `GET /api/projects` scoped to membership (workspace admin + super_admin bypass)
- [ ] `POST /api/projects` auto-adds the creator as project `owner`
- [ ] Routes: `GET/POST /api/projects/:id/members`, `PATCH/DELETE /api/projects/:id/members/:userId`
- [ ] Routes: blocks/floors/units CRUD (scoped by project membership)
- [ ] Routes: entities CRUD under project/block/floor/unit ("Items" in API responses'
      user-facing context, `entities` internally)
- [ ] Report/capture creation routes auto-resolve `entityId` via
      `getOrCreateDefaultEntity` when the client omits it — existing "New Report"/
      "New Capture" flows keep working with zero client changes
- [ ] Plan profile caps (starter 3 / pro 10 / unlimited; super_admin excluded) on `POST /api/team`
- [ ] Destructive deletes → `requireProjectDelete` / `requireAdmin` + soft-delete
      (not hard delete)

### Phase 4. Client — not started
- [ ] Dashboard already filters correctly once `GET /api/projects` is scoped
      (no client change needed there)
- [ ] New "Structure" tab (`ProjectTabs.tsx`) + `ProjectStructure.tsx` page —
      breadcrumb: Project / Block / Floor / Unit, "+ Add Item" at every level
- [ ] **UI label check: the word "Entity" must never appear in any user-facing
      string — always "Item".** See `docs/FLOW.md` §0.5 for the full word map.
- [ ] New "Team" tab + `ProjectTeam.tsx` page (assign roster via dropdowns, set roles)
- [ ] `client/src/lib/api.ts` — thin wrappers for members/blocks/floors/units/entities
- [ ] Role gating uses effective access (workspace admin OR project role)
- [ ] Trash/restore UI
- [ ] Profiles page (name, avatar, password)
- [ ] Settings read-only for non-admins; Subscription admin-only

### Phase 5. Data migration — not started
- [ ] AP31 sort: 9 sites stay top-level; KOMMADI phases → blocks; Utkarsha Capital Towers → block; MVV GV 512 + TUNI FLAT-301/302 → units
- [ ] Membership backfill (all current users → member of every project in their workspace)
- [ ] Temp workspaces (MK BUILDERS, ECCC) — leave as-is
- [ ] Full `pg_dump` backup before touching AP31's real data — see `docs/PLAN.md` §7

## 🧭 Later phases (not this batch)

- [ ] Per-record membership checks on `/api/reports/:id`, `/api/captures/:id`,
      `/api/hotspots/:id`, etc. (this batch only gates the project-level and
      hierarchy routes — see `docs/FLOW.md`'s "deliberately NOT in this phase" note)
- [ ] Reports JSONB normalization (checklist/dimensions/issues + base64 images) — `OFFLINE_ROADMAP.md`
- [ ] Pagination on all list endpoints — `OFFLINE_ROADMAP.md`
- [ ] Shared-login abuse controls (session/device limits)
- [ ] Per-block/unit level access (currently inherits from top-level project)
- [ ] Project counts per plan (beyond trial cap)

## 🐛 Known issues (noted, not fixed)

- `client/src/lib/checklist.ts` `buildChecklistWithPreservedResponses` has an ID-collision
  bug when items were previously removed (id `c${++runningId}` can duplicate surviving ids).
  Sync button removed, so this only runs via `ProjectDetails.handleUpdateReport`/`handleCreateReport`
  — low priority, but fix before relying on frequent template edits.
- `GET /api/team` uses `requireAuth` (viewers can see the team list) though the roles doc
  suggested `requireAdmin` — decide intended behavior.
- **GCP objects are never deleted.** No delete logic exists anywhere; every capture/hotspot
  delete (even today's hard-delete cascades) orphans the image in `reportgen-images-rahul`
  forever — storage cost grows and "deleted" images physically persist. Fixed by the purge
  job + `deleteObjectFromGCP` above (`docs/PLAN.md` §6).
