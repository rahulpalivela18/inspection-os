# API Skill

## Architecture
- All endpoints live in `server/routes.ts` under the `/api/` prefix
- Express 5 route handlers (async-safe by default)
- Zod validation on every mutating endpoint
- Workspace-scoped data access enforced on every route
- Session-based auth (no JWT) — credentials sent via cookies

## Route Structure

```
POST   /api/auth/register         — create workspace + first admin user
POST   /api/auth/login            — Passport local strategy
POST   /api/auth/logout           — destroy session
GET    /api/auth/me               — current user + workspace

GET    /api/team                  — list workspace members
POST   /api/team                  — create member (admin+)
DELETE /api/team/:id              — remove member (admin+)

PATCH  /api/workspace             — update workspace settings (admin+)
GET    /api/workspace/invoices    — billing history

GET    /api/projects              — list projects
POST   /api/projects              — create project
DELETE /api/projects/:id          — delete project

GET    /api/projects/:id/reports  — list reports for project
POST   /api/projects/:id/reports  — create report

GET    /api/reports/:id           — get single report
PATCH  /api/reports/:id           — update report fields
DELETE /api/reports/:id           — delete report

GET    /api/checklist-templates   — list templates
POST   /api/checklist-templates   — create template (admin+)
PATCH  /api/checklist-templates/:id  — update template (admin+)
DELETE /api/checklist-templates/:id  — delete template (admin+)

GET    /api/admin/workspaces      — all workspaces (super_admin)
GET    /api/admin/invoices        — all invoices (super_admin)
```

## Standard Route Template

```ts
app.post("/api/resource", requireAuth, requireAdmin, async (req, res) => {
  // 1. Validate input
  const result = createResourceSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  // 2. Scope to workspace
  const { workspaceId } = req.user!;

  // 3. Call storage layer (never raw DB in routes)
  const resource = await storage.createResource(workspaceId, result.data);

  // 4. Return result
  res.json(resource);
});
```

## Validation Schemas
All schemas defined in `shared/schema.ts` using `drizzle-zod` + manual refinements:

```ts
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, workspaceId: true });
export const updateReportSchema = insertReportSchema.partial();
```

Use `.safeParse()` — never `.parse()` in route handlers (avoids uncaught throws).

## Auth Guards (middleware)
| Middleware | Requirement |
|---|---|
| `requireAuth` | Valid session (`req.isAuthenticated()`) |
| `requireAdmin` | Role is `admin` or `super_admin` |
| `requireSuperAdmin` | Role is `super_admin` only |

Apply them in order: `requireAuth` first, then role guards.

## Error Response Format
```ts
// 400 Bad Request
res.status(400).json({ message: "Descriptive reason" });

// 401 Unauthorized
res.status(401).json({ message: "Unauthorized" });

// 403 Forbidden
res.status(403).json({ message: "Forbidden" });

// 404 Not Found
res.status(404).json({ message: "Not found" });

// 500 Server Error
res.status(500).json({ message: "Internal server error" });
```

## Client-Side API Call (lib/api.ts)
```ts
import { request } from "@/lib/api";

// GET
const projects = await request<Project[]>("/api/projects");

// POST
const project = await request<Project>("/api/projects", {
  method: "POST",
  body: { title: "My Project", clientName: "ACME" },
});

// PATCH
await request(`/api/reports/${id}`, { method: "PATCH", body: updates });

// DELETE
await request(`/api/projects/${id}`, { method: "DELETE" });
```

`request()` automatically:
- Sets `Content-Type: application/json`
- Includes credentials (cookies)
- Parses JSON response
- Throws with the error message from `{ message }` response body

## Workspace Isolation Rule
Every data-access route MUST scope its queries to `req.user!.workspaceId`. A user should never be able to read or mutate another workspace's data, even if they supply a valid resource ID. The storage layer enforces this too — treat it as defense-in-depth, not a substitute.

## Adding a New Endpoint
1. Define/reuse Zod schema in `shared/schema.ts`
2. Add storage method to `IStorage` + `DatabaseStorage` in `server/storage.ts`
3. Add route in `server/routes.ts` following the template above
4. Use `request<T>()` + React Query on the client
