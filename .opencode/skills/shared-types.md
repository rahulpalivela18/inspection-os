# Shared Types Skill

## Overview
`shared/schema.ts` is the single source of truth for all data types, DB schema, and validation schemas. It's imported by both client and server.

## Import Paths
```ts
// Server
import { projects, reports, users, workspaces, ... } from "@shared/schema";
import type { Project, Report, User, Workspace, ... } from "@shared/schema";

// Client
import type { Project, Report, User, Workspace } from "@shared/schema";
```

## What Lives Here
1. **Drizzle table definitions** — `pgTable(...)` for all 6 tables
2. **Enums** — `planEnum`, `planStatusEnum`, `roleEnum`, `reportStatusEnum`, `invoiceStatusEnum`
3. **Inferred TypeScript types** — `$inferSelect` and `$inferInsert`
4. **Zod insert schemas** — generated via `drizzle-zod`'s `createInsertSchema`

## Exported Types Reference
```ts
// Workspace
type Workspace = typeof workspaces.$inferSelect;
type NewWorkspace = typeof workspaces.$inferInsert;

// User (password excluded when sending to client — handle in routes)
type User = typeof users.$inferSelect;
type NewUser = typeof users.$inferInsert;

// Project
type Project = typeof projects.$inferSelect;
type NewProject = typeof projects.$inferInsert;

// Report
type Report = typeof reports.$inferSelect;
type NewReport = typeof reports.$inferInsert;

// ChecklistTemplate
type ChecklistTemplate = typeof checklistTemplates.$inferSelect;

// Invoice
type Invoice = typeof invoices.$inferSelect;
```

## Zod Schemas
```ts
insertProjectSchema       // validates POST /api/projects body
insertReportSchema        // validates POST /api/projects/:id/reports body
insertWorkspaceSchema     // validates workspace creation
insertUserSchema          // validates user creation
insertChecklistSchema     // validates checklist template creation
```

Use `.partial()` for PATCH endpoints:
```ts
const updateReportSchema = insertReportSchema.partial();
```

## Adding New Shared Types
1. Define in `shared/schema.ts`
2. Export the type
3. Import where needed — both client and server can access via `@shared/*` alias
4. If it's a new table: also see `database.md` for migration steps

## JSONB Field Types
The `reports` table has three JSONB columns. Define their TypeScript interfaces in `shared/schema.ts` and export them:

```ts
// Example — add alongside the table definition
export interface IssueItem {
  id: string;
  category: string;
  description: string;
  severity: "low" | "medium" | "high";
  photos: string[];
  notes?: string;
}

export interface ChecklistResponse {
  templateId: number;
  response: "pass" | "fail" | "na";
  notes?: string;
}
```

Cast JSONB fields explicitly when reading:
```ts
const issues = report.issues as IssueItem[];
```
