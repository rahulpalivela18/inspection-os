# Roles & Plan Limits — Implementation Guide

## Overview

Add role-based access control (`admin`, `inspector`, `viewer`, `super_admin`) and enforce plan-based inspector limits (`starter` = 2, `pro` = 9, `enterprise` = unlimited).

---

## Part 1 — Server: New Storage Method

**File: `server/storage.ts`**

### 1.1 Add to `IStorage` interface

After `deleteUser`, add:

```ts
countUsersByRole(workspaceId: string, role: string): Promise<number>;
```

### 1.2 Implement in `DatabaseStorage`

```ts
async countUsersByRole(workspaceId: string, role: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(and(eq(users.workspaceId, workspaceId), eq(users.role, role)));
  return Number(row.count);
}
```

Add `sql` to the drizzle-orm import if not already there.

---

## Part 2 — Server: New Middleware

**File: `server/routes.ts`**

### 2.1 Add `requireWriteAccess` middleware

After `requireSuperAdmin`, add:

```ts
function requireWriteAccess(req: Request, res: Response, next: NextFunction) {
  const user = req.user as any;
  if (!req.isAuthenticated())
    return res.status(401).json({ message: "Unauthorized" });
  if (user?.role === "viewer")
    return res.status(403).json({ message: "Viewers cannot modify data." });
  next();
}
```

### 2.2 Add inspector limit constants

Near the top of `registerRoutes`:

```ts
const INSPECTOR_LIMITS: Record<string, number> = {
  starter: 2,
  pro: 9,
  enterprise: Infinity,
};
```

---

## Part 3 — Server: Apply Middleware to Routes

**File: `server/routes.ts`**

### 3.1 Project routes

Find all project routes (`/api/projects`). Replace `requireAuth` with `requireWriteAccess` on:

| Method | Route | Change |
|---|---|---|
| POST | `/api/projects` | `requireAuth` → `requireWriteAccess` |
| PATCH | `/api/projects/:id` | `requireAuth` → `requireWriteAccess` |
| DELETE | `/api/projects/:id` | `requireAuth` → `requireWriteAccess` |

Leave `GET` routes with `requireAuth` (viewers can read).

### 3.2 Report routes

Same pattern for `/api/reports`:

| Method | Route | Change |
|---|---|---|
| POST | `/api/reports` | `requireAuth` → `requireWriteAccess` |
| PATCH | `/api/reports/:id` | `requireAuth` → `requireWriteAccess` |
| DELETE | `/api/reports/:id` | `requireAuth` → `requireWriteAccess` |

### 3.3 Capture routes

Same for `/api/captures` — POST, PATCH, DELETE get `requireWriteAccess`. GET stays `requireAuth`.

### 3.4 Hotspot routes

Same for `/api/hotspots` — POST, PATCH, DELETE get `requireWriteAccess`. GET stays `requireAuth`.

### 3.5 Checklist template routes

Currently GET is `requireAuth`, mutations are `requireAdmin`. Keep as-is — inspectors need access to view templates in the ReportEditor.

### 3.6 Team routes

Change `GET /api/team` from `requireAuth` to `requireAdmin` (only admins should see the member list).

---

## Part 4 — Server: Inspector Limit on Team Add

**File: `server/routes.ts`**

### 4.1 Add limit check in `POST /api/team`

After the existing validation (valid roles check) and before the existing-email check, insert:

```ts
if (role === "inspector") {
  const workspace = await storage.getWorkspace(admin.workspaceId);
  if (!workspace) return res.status(404).json({ message: "Workspace not found." });
  const limit = INSPECTOR_LIMITS[workspace.plan] ?? 2;
  const current = await storage.countUsersByRole(admin.workspaceId, "inspector");
  if (current >= limit) {
    const planLabel = workspace.plan.charAt(0).toUpperCase() + workspace.plan.slice(1);
    return res.status(403).json({
      message: `Your ${planLabel} plan supports up to ${limit === Infinity ? "unlimited" : limit} inspector${limit !== 1 ? "s" : ""}. Contact support to upgrade.`,
    });
  }
}
```

Place this after the valid roles check and before the existing-email check.

---

## Part 5 — Client: Viewer UI Restrictions

### 5.1 Dashboard (`client/src/pages/Dashboard.tsx`)

- Wrap the "New Project" button with `{user.role !== "viewer" && ( ... )}`
- Wrap delete/project action buttons the same way
- Import `useAuth()` to get `user`

### 5.2 ProjectDetails (`client/src/pages/ProjectDetails.tsx`)

- Hide "Add Report" button for viewers
- Hide edit/delete on each report card
- Use `user.role !== "viewer"` checks

### 5.3 ReportEditor (`client/src/pages/ReportEditor.tsx`)

- At the top of the component, add a read-only mode:
  ```tsx
  const isViewer = user?.role === "viewer";
  ```
- Disable all form inputs, hide save/submit buttons, hide add/delete controls
- Show a banner: "You are viewing this report in read-only mode."
- The report data should still render so viewers can see it and export PDFs

### 5.4 CaptureManager (`client/src/pages/CaptureManager.tsx`)

- Hide "Add Capture" button for viewers
- Hide delete capture buttons

### 5.5 Settings (`client/src/pages/Settings.tsx`)

- Viewer cannot access Settings at all — redirect or show "Access denied" message
- Or: show only profile info in read-only mode without team management
- (Simpler: just don't show Settings in the sidebar for viewers, handled in Layout.tsx)

### 5.6 Layout (`client/src/pages/Layout.tsx`)

- Hide "Settings" nav item if `user.role === "viewer"` and `user.role !== "admin"` and `user.role !== "super_admin"`
- Hide "Templates" nav item for viewers

### 5.7 Templates (`client/src/pages/Templates.tsx`)

- Hide "Add Template" and edit/delete controls for viewers
- They can still see the template list (useful for understanding the checklist)

---

## Part 6 — Client: Inspector Limit UX

### 6.1 Settings — Show inspector count

In `Settings.tsx`, after fetching team data, compute:

```tsx
const inspectorCount = team.filter((m) => m.role === "inspector").length;
const planLabel = workspace?.plan || "starter";
const inspectorLimit = planLabel === "starter" ? 2 : planLabel === "pro" ? 9 : Infinity;
const atLimit = inspectorCount >= inspectorLimit;
```

Display above the member list:

```tsx
<div className="text-sm text-muted-foreground mb-2">
  {inspectorCount}{inspectorLimit !== Infinity ? ` / ${inspectorLimit}` : ""} inspectors used
  {atLimit && (
    <span className="text-amber-600 ml-2">
      · Your {planLabel} plan supports {inspectorLimit} inspectors. Contact support to upgrade.
    </span>
  )}
</div>
```

When `atLimit` is true, disable the "Add Member" button and show the limit message.

---

## Part 7 — Client: Billing Page Enhancement

### 7.1 Billing (`client/src/pages/Billing.tsx`)

- Add a section showing current inspector count vs plan limit
- Show the "Contact support to upgrade" message when at limit
- Already shows plan-based limits — just add live inspector count from team API

---

## Summary of Files Changed

| File | Changes |
|---|---|
| `server/storage.ts` | Add `countUsersByRole` to interface + implementation |
| `server/routes.ts` | New middleware, apply to routes, inspector limit on team add |
| `client/src/pages/Dashboard.tsx` | Viewer hides New Project / delete buttons |
| `client/src/pages/ProjectDetails.tsx` | Viewer hides Add Report / edit/delete |
| `client/src/pages/ReportEditor.tsx` | Viewer read-only mode |
| `client/src/pages/CaptureManager.tsx` | Viewer hides Add Capture / delete |
| `client/src/pages/Settings.tsx` | Inspector count display + limit gating |
| `client/src/pages/Templates.tsx` | Viewer hides add/edit/delete |
| `client/src/pages/Layout.tsx` | Viewer hides Settings nav item |
| `client/src/pages/Billing.tsx` | Live inspector count vs plan limit |

## Edge Cases

- **Existing viewers in DB** — After deploying, existing viewers will immediately be blocked from mutations. No migration needed.
- **Inspector limit on update** — If an existing member's role is changed TO `inspector`, should also check limit. (Currently the team route only creates, doesn't update roles. If role editing is added later, apply the same check.)
- **Self-service registration disabled** — Registration is "Coming Soon" so no one can create a workspace with too many inspectors on signup. When re-enabled, enforce the limit during registration too.
- **super_admin bypass** — `super_admin` users are not constrained by plan limits (they manage all workspaces).
