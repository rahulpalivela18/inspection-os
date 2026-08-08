# CHECKLISTS — Where Inspection OS stands

> Companion to `docs/PLAN.md`. New agents/chats: read this first to know exactly
> where we are, then read `docs/PLAN.md` for the target architecture.

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

See `docs/PLAN.md` for full detail. Status tracking below.

### 1. Schema — not started
- [ ] `blocks` table (`project_id` FK)
- [ ] `floors` table (`block_id` FK)
- [ ] `units` table (`floor_id` FK)
- [ ] `project_members` table (project_id, user_id, role owner/admin/member/viewer, UNIQUE)
- [ ] `reports` + nullable `block_id`/`floor_id`/`unit_id`
- [ ] `captures` (spatial) + nullable `report_id`/`block_id`/`floor_id`/`unit_id`
- [ ] `deleted_at` on projects/blocks/floors/units/reports/captures
- [ ] `npm run db:push`

### 2. Backend — not started
- [ ] Storage: membership CRUD (`getProjectMembers`, `addProjectMember`, `updateMemberRole`, `removeMember`, `listProjectsForUser`)
- [ ] Storage: hierarchy CRUD (blocks/floors/units)
- [ ] Storage: soft-delete (trash/restore/purge)
- [ ] Routes: `GET/POST /api/projects/:id/members`, `PATCH/DELETE /api/projects/:id/members/:userId`
- [ ] Routes: blocks/floors/units CRUD (scoped by project membership)
- [ ] `GET /api/projects` scoped to membership (workspace admin + super_admin bypass)
- [ ] Report/capture routes → attach point (block/floor/unit) + membership check
- [ ] `requireProjectAccess` / `requireProjectAdmin` middleware
- [ ] Plan profile caps (starter 3 / pro 10 / unlimited; super_admin excluded) on `POST /api/team`
- [ ] Destructive deletes → `requireAdmin` + soft-delete

### 3. Client — not started
- [ ] Dashboard filters to your projects; "not assigned" state
- [ ] Breadcrumb navigation: Project / Block / Floor / Unit
- [ ] Context buttons: Add Block / Add Floor / Add Unit / New Report
- [ ] Per-project Team tab (assign roster via dropdowns, set roles)
- [ ] Role gating uses effective access (workspace admin OR project role)
- [ ] Trash/restore UI
- [ ] Profiles page (name, avatar, password)
- [ ] Settings read-only for non-admins; Subscription admin-only

### 4. Data migration — not started
- [ ] AP31 sort: 9 sites stay top-level; KOMMADI phases → blocks; Utkarsha Capital Towers → block; MVV GV 512 + TUNI FLAT-301/302 → units
- [ ] Membership backfill (all current users → member of every project in their workspace)
- [ ] Temp workspaces (MK BUILDERS, ECCC) — leave as-is

## 🧭 Later phases (not this batch)

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
