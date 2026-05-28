# Database Skill

## Stack
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM 0.45 (`drizzle-orm/pg-core`)
- **Validation bridge:** `drizzle-zod` — generates Zod schemas from Drizzle tables
- **Migrations:** Drizzle Kit (`drizzle-kit generate` + `drizzle-kit migrate`)
- **Connection:** `pg` pool in `server/db.ts`, exported as `db`
- **Schema location:** `shared/schema.ts` (shared between client + server)

## Schema Overview

```
workspaces       — top-level tenant (all data scoped to this)
  └── users            — team members with roles
  └── projects         — client projects
       └── reports     — inspection reports (heavy JSONB fields)
  └── checklistTemplates — master checklist items
  └── invoices         — billing records
```

All child tables cascade-delete on `workspaceId` FK deletion.

## Tables & Key Fields

### workspaces
```ts
{ id, name, logoUrl, address, email,
  plan: "starter"|"pro"|"enterprise",
  planStatus: "active"|"inactive", createdAt }
```

### users
```ts
{ id, workspaceId, email, password, name,
  role: "super_admin"|"admin"|"inspector"|"viewer", createdAt }
```

### projects
```ts
{ id, workspaceId, title, clientName, address, description, createdAt }
```

### reports
```ts
{ id, projectId, workspaceId, title, author, date,
  status: "Draft"|"Review"|"Final",
  inspectionType, dimensionUnit, spaceCounts,
  checklist,    // JSONB — checklist responses
  dimensions,   // JSONB — room/space dimension data
  issues,       // JSONB — issues list with severity, photos, notes
  createdAt }
```

### checklistTemplates
```ts
{ id, workspaceId, checklistType, category, point, order, triggerOn, createdAt }
```

### invoices
```ts
{ id, workspaceId, receiptNumber, plan, amount,
  status: "paid"|"refunded", createdAt }
```

## Drizzle Query Patterns

Always import `db` from `server/db.ts` and tables from `@shared/schema`.

```ts
import { db } from "./db";
import { projects, reports } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

// Select
const rows = await db.select().from(projects)
  .where(eq(projects.workspaceId, workspaceId))
  .orderBy(desc(projects.createdAt));

// Insert
const [row] = await db.insert(projects).values({ workspaceId, ...data }).returning();

// Update
const [updated] = await db.update(projects)
  .set({ title: "New Title" })
  .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)))
  .returning();

// Delete
await db.delete(projects)
  .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)));
```

**Always include `workspaceId` in WHERE clauses** — this is the tenant-isolation boundary.

## Adding New Tables

1. Define table in `shared/schema.ts` using `pgTable`
2. Export insert/select types: `export type NewFoo = typeof foo.$inferInsert`
3. Add `drizzle-zod` schema: `export const insertFooSchema = createInsertSchema(foo)`
4. Generate migration: `drizzle-kit generate`
5. Add storage methods to `IStorage` interface + `DatabaseStorage` class in `server/storage.ts`

## JSONB Fields (reports table)
`checklist`, `dimensions`, and `issues` are stored as JSONB. Always define TypeScript types for these in `shared/schema.ts` and cast when reading:

```ts
const issues = report.issues as IssueItem[];
```

## Type Inference Pattern
```ts
// Prefer Drizzle inference over manual type definitions
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
```

## Migrations
- Config: `drizzle.config.ts` — dialect `postgresql`, schema `shared/schema.ts`, output `./migrations`
- Never edit migration files manually
- Run `drizzle-kit generate` after schema changes, then `drizzle-kit migrate` to apply
