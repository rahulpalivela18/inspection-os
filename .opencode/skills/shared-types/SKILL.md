---
name: shared-types
description: Use when working on type definitions, Drizzle schemas, Zod validation schemas, TypeScript type safety, or data contracts shared between client and server.
---

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
type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;

// User (password excluded when sending to client — handle in routes)
type User = typeof users.$inferSelect;
type InsertUser = z.infer<typeof insertUserSchema>;

// Project
type Project = typeof projects.$inferSelect;
type InsertProject = z.infer<typeof insertProjectSchema>;

// Report
type Report = typeof reports.$inferSelect;
type InsertReport = z.infer<typeof insertReportSchema>;

// ChecklistTemplate
type ChecklistTemplate = typeof checklistTemplates.$inferSelect;
type InsertChecklistTemplate = z.infer<typeof insertChecklistTemplateSchema>;

// Invoice
type Invoice = typeof invoices.$inferSelect;
type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
```

## Zod Schemas
```ts
insertProjectSchema       // validates POST /api/projects body
insertReportSchema        // validates POST /api/projects/:id/reports body
insertWorkspaceSchema     // validates workspace creation / PATCH /api/workspace
insertUserSchema          // validates user creation
insertChecklistSchema     // validates checklist template creation
insertInvoiceSchema       // validates invoice creation (admin)

// Auth schemas (standalone, not generated from tables)
loginSchema               // { email, password }
registerSchema            // { name, email, password, companyName }
```

Use `.partial()` for PATCH endpoints:
```ts
const updateReportSchema = insertReportSchema.partial();
```

## Adding New Shared Types
1. Define in `shared/schema.ts`
2. Export the type
3. Import where needed — both client and server can access via `@shared/*` alias
4. If it's a new table: also see database skill for migration steps

## JSONB Field Types
The `reports` table has three JSONB columns. Define their TypeScript interfaces in `shared/schema.ts` and export them:

```ts
// Example — add alongside the table definition
export interface IssueItem {
  id: string;
  category: string;
  description: string;
  severity: "low" | "medium" | "high";
  images: string[];
  notes?: string;
}

export interface ChecklistResponse {
  templateId: number;
  response: "pass" | "fail" | "na";
  notes?: string;
  image?: string;
}
```

Cast JSONB fields explicitly when reading:
```ts
const issues = report.issues as IssueItem[];
```
