---
name: roles-plans
description: Use when working on RBAC roles (admin, inspector, viewer, super_admin), permission guards, plan-based inspector limits, team member limits, billing limits, or viewer read-only UI.
---

# Roles & Plans Skill

## Full Implementation Guide

Read `docs/roles-and-plans-implementation.md` before permission/role/plan/billing work. It contains the complete step-by-step implementation guide with code.

## Summary

RBAC: `admin`, `inspector`, `viewer`, `super_admin`. Plan-based inspector limits: `starter` = 2, `pro` = 9, `enterprise` = unlimited.

## Key Facts

| Role | Permissions |
|---|---|
| `super_admin` | All routes including `/api/admin/*`; manages all workspaces; not constrained by plan limits |
| `admin` | All workspace routes; manage team, workspace settings, templates |
| `inspector` | Create/edit reports and projects |
| `viewer` | Read-only access to reports and projects |

**Limits:** `INSPECTOR_LIMITS = { starter: 2, pro: 9, enterprise: Infinity }` — enforced on `POST /api/team` when role is `inspector`.

## Implementation Checklist

**Server:**
- `IStorage.countUsersByRole(workspaceId, role)` added to `server/storage.ts` (Drizzle `count(*)` where workspaceId + role)
- `requireWriteAccess` middleware in `server/routes.ts` — blocks `viewer` from mutations (403 "Viewers cannot modify data.")
- Apply `requireWriteAccess` to POST/PATCH/DELETE on `/api/projects`, `/api/reports`, `/api/captures`, `/api/hotspots` — GET stays `requireAuth`
- `GET /api/team` uses `requireAdmin` (not `requireAuth`)
- Inspector limit check inserted in `POST /api/team` before existing-email check

**Client (viewer restrictions):**
- Dashboard: hide "New Project" + delete buttons
- ProjectDetails: hide "Add Report" + edit/delete on report cards
- ReportEditor: read-only mode (`isViewer`), disable inputs, hide save/add/delete, show banner
- CaptureManager: hide "Add Capture" + delete
- Templates: hide add/edit/delete (list still visible)
- Layout: hide Settings + Templates nav items for viewers

**Inspector limit UX:**
- Settings: show `inspectorCount / limit` above member list; disable "Add Member" when at limit
- Billing: show inspector count vs plan limit + "Contact support to upgrade"

## Edge Cases

- Existing viewers blocked from mutations immediately after deploy — no migration needed
- Role-editing to `inspector` later must also check the limit (not currently implemented)
- Self-service registration is "Coming Soon" — re-enforce limit there when re-enabled
- `super_admin` bypasses plan limits

## Gotchas

- Checklist template routes: GET is `requireAuth`, mutations `requireAdmin` — inspectors need read access for ReportEditor, do NOT change this
- The current team route only creates members, doesn't update roles
