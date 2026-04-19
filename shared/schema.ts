import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Workspaces (Companies) ──────────────────────────────────────────────────
export const workspaces = pgTable("workspaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  address: text("address"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({ id: true, createdAt: true });
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Workspace = typeof workspaces.$inferSelect;

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "inspector", "viewer"] }).notNull().default("inspector"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ─── Checklist Templates (Master Checklist per workspace) ────────────────────
export const checklistTemplates = pgTable("checklist_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  point: text("point").notNull(),
  isRepeatable: boolean("is_repeatable").notNull().default(false),
  spaceType: text("space_type"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChecklistTemplateSchema = createInsertSchema(checklistTemplates).omit({ id: true, createdAt: true });
export type InsertChecklistTemplate = z.infer<typeof insertChecklistTemplateSchema>;
export type ChecklistTemplate = typeof checklistTemplates.$inferSelect;

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  clientName: text("client_name").notNull(),
  address: text("address"),
  description: text("description"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  author: text("author").notNull(),
  date: text("date").notNull(),
  status: text("status", { enum: ["Draft", "Review", "Final"] }).notNull().default("Draft"),
  inspectionType: text("inspection_type").default("Home Inspection"),
  dimensionUnit: text("dimension_unit", { enum: ["ft", "m"] }).default("ft"),
  spaceCounts: jsonb("space_counts"),
  checklist: jsonb("checklist"),
  dimensions: jsonb("dimensions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReportSchema = createInsertSchema(reports).omit({ id: true, createdAt: true });
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

// ─── Auth schemas (used in routes) ───────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  companyName: z.string().min(1),
});
