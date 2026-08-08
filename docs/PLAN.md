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
- Reports/captures may attach at **project, block, floor, or unit** level ("file at any folder depth"). Teams that skip a level don't create it.
- **No fixed "phase" concept.** Re-inspection = just another report on the same unit, distinguished by title/date. Users name blocks/floors/units/reports however they work.
- Captures group under **their report** so each inspection's photo set stays together.

## 3. Schema changes (all additive, no downtime, reversible)

| Table | Change |
|---|---|
| `projects` | untouched — becomes the top-level **site** |
| `blocks` | NEW — `id, workspace_id, project_id FK, title, ...` |
| `floors` | NEW — `id, workspace_id, block_id FK, title, ...` |
| `units` | NEW — `id, workspace_id, floor_id FK, title, ...` |
| `reports` | + nullable `block_id`, `floor_id`, `unit_id` (attach point) |
| `captures` (spatial) | + nullable `report_id`, `block_id`, `floor_id`, `unit_id` |
| `project_members` | NEW — `project_id, user_id, role: owner/admin/member/viewer`, UNIQUE(project_id, user_id) |
| projects/blocks/floors/units/reports/captures | + `deleted_at` (soft-delete) |

No polymorphism: 4 separate tables, one FK per level, simple indexed joins.

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

- `DELETE` = set `deleted_at`, move to trash (never a hard delete).
- Restore within 30 days; admin-only permanent purge after that.
- Destructive deletes (`projects`, `reports`, `captures`, etc.) become
  `requireAdmin` — inspectors create/edit but never delete.
- Rollback: drop the new tables/columns + revert code; existing data identical.

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
