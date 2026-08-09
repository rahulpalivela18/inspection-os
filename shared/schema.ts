import { sql } from "drizzle-orm";
import {
  pgTable,
  pgSchema,
  text,
  varchar,
  boolean,
  timestamp,
  jsonb,
  integer,
  numeric,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Workspaces (Companies) ──────────────────────────────────────────────────
export const workspaces = pgTable("workspaces", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  address: text("address"),
  email: text("email"),
  phone: text("phone"),
  taxRate: text("tax_rate").default("18"),
  plan: text("plan", { enum: ["starter", "pro", "enterprise"] })
    .notNull()
    .default("starter"),
  planStatus: text("plan_status", { enum: ["active", "inactive"] })
    .notNull()
    .default("inactive"),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({
  id: true,
  createdAt: true,
});
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Workspace = typeof workspaces.$inferSelect;

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["super_admin", "admin", "inspector", "viewer"] })
    .notNull()
    .default("inspector"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ─── Checklist Templates (Master Checklist per workspace) ────────────────────
export const checklistTemplates = pgTable("checklist_templates", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  checklistType: text("checklist_type").notNull().default("Home Inspection"),
  category: text("category").notNull(),
  point: text("point").notNull(),
  order: integer("order").notNull().default(0),
  triggerOn: text("trigger_on", { enum: ["yes", "no"] }).default("no"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChecklistTemplateSchema = createInsertSchema(
  checklistTemplates,
).omit({ id: true, createdAt: true });
export type InsertChecklistTemplate = z.infer<
  typeof insertChecklistTemplateSchema
>;
export type ChecklistTemplate = typeof checklistTemplates.$inferSelect;

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projects = pgTable("projects", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  clientName: text("client_name").notNull(),
  address: text("address"),
  description: text("description"),
  isPinned: boolean("is_pinned").notNull().default(false),
  // "single" = One Building (simple, minimal tagging). "multi" = Multi-Block
  // Project (blocks/floors/flats seeded via the creation questionnaire).
  projectType: text("project_type", { enum: ["single", "multi"] })
    .notNull()
    .default("single"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// ─── Tag Values (per-project vocabulary for Block/Floor/Flat/Amenity) ────────
// Powers every faceted-tag dropdown on a capture. Self-populating: seeded by
// the project creation questionnaire, and appended whenever someone picks
// "Other" while tagging a capture. Category is plain text (not an enum table)
// on purpose — a fixed set of four ships in v1, but adding a custom category
// later ("Wing", "Tower") becomes a pure data insert with zero migration.
export const tagValues = pgTable(
  "tag_values",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    workspaceId: varchar("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: varchar("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    category: text("category", {
      enum: ["block", "floor", "flat", "amenity"],
    }).notNull(),
    value: text("value").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // Case-insensitive dedup — "401", "Flat 401", "flat401" must not fragment
    // the same dropdown into three different filter values.
    uniqueIndex("tag_values_unique").on(
      table.projectId,
      table.category,
      sql`lower(${table.value})`,
    ),
    index("tag_values_lookup_idx").on(table.projectId, table.category),
  ],
);

export const insertTagValueSchema = createInsertSchema(tagValues).omit({
  id: true,
  createdAt: true,
});
export type InsertTagValue = z.infer<typeof insertTagValueSchema>;
export type TagValue = typeof tagValues.$inferSelect;

// ─── Visits (WHEN, not WHERE) ─────────────────────────────────────────────────
// A named, explicit inspection round ("Initial Inspection", "Stage Inspection
// – Mar 2026"). Unlike tag_values (optional, descriptive, soft), a visit is a
// hard structural fact — every capture belongs to exactly one (see
// `captures.visitId` below, NOT NULL). The "current" visit for a project is
// simply the most-recently-created row; no separate "active" flag is needed.
// The camera button always uses the current visit; a "+ New Visit" action is
// the only way a new one starts — no automatic time-gap guessing.
export const visits = pgTable(
  "visits",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    workspaceId: varchar("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: varchar("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("visits_project_idx").on(table.projectId, table.createdAt)],
);

export const insertVisitSchema = createInsertSchema(visits).omit({
  id: true,
  createdAt: true,
});
export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type Visit = typeof visits.$inferSelect;

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reports = pgTable("reports", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  projectId: varchar("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  workspaceId: varchar("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  author: text("author").notNull(),
  date: text("date").notNull(),
  status: text("status", { enum: ["Draft", "Review", "Final"] })
    .notNull()
    .default("Draft"),
  inspectionType: jsonb("inspection_type").default(["Home Inspection"]),
  dimensionUnit: text("dimension_unit", { enum: ["ft", "m"] }).default("ft"),
  spaceCounts: jsonb("space_counts"),
  checklist: jsonb("checklist"),
  dimensions: jsonb("dimensions"),
  issues: jsonb("issues"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
});
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

// ─── Invoices (Receipts) ─────────────────────────────────────────────────────
export const invoices = pgTable("invoices", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  receiptNumber: text("receipt_number").notNull().unique(),
  plan: text("plan", { enum: ["starter", "pro", "enterprise"] }).notNull(),
  amount: text("amount").notNull(),
  status: text("status", { enum: ["paid", "refunded"] })
    .notNull()
    .default("paid"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// ─── Progress Logs (Track work done on a report over time) ───────────────────
export const progressLogs = pgTable("progress_logs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  reportId: varchar("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  workspaceId: varchar("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  author: text("author").notNull(),
  date: text("date").notNull(),
  notes: text("notes"),
  resolvedChecklistItemIds: jsonb("resolved_checklist_item_ids"),
  afterPhotos: jsonb("after_photos"),
  resolvedIssuePhotos: jsonb("resolved_issue_photos"),
  newFindings: jsonb("new_findings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProgressLogSchema = createInsertSchema(progressLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertProgressLog = z.infer<typeof insertProgressLogSchema>;
export type ProgressLog = typeof progressLogs.$inferSelect;

// ─── Share Links ─────────────────────────────────────────────────────────────
export const shareLinks = pgTable("share_links", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  projectId: varchar("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  workspaceId: varchar("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertShareLinkSchema = createInsertSchema(shareLinks).omit({
  id: true,
  createdAt: true,
});
export type InsertShareLink = z.infer<typeof insertShareLinkSchema>;
export type ShareLink = typeof shareLinks.$inferSelect;

// ─── Quotations ────────────────────────────────────────────────────────────
export const quotations = pgTable("quotations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, {
    onDelete: "cascade",
  }),
  workspaceId: varchar("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: text("status", { enum: ["Draft", "Sent", "Accepted", "Rejected"] })
    .notNull()
    .default("Draft"),
  clientName: text("client_name"),
  clientPhone: text("client_phone"),
  clientEmail: text("client_email"),
  propertyAddress: text("property_address"),
  propertyType: text("property_type"),
  bedrooms: text("bedrooms"),
  bathrooms: text("bathrooms"),
  areaSqFt: text("area_sqft"),
  taxRate: numeric("tax_rate").default("0"),
  notes: text("notes"),
  validityDays: integer("validity_days").default(30),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuotationSchema = createInsertSchema(quotations).omit({
  id: true,
  createdAt: true,
});
export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type Quotation = typeof quotations.$inferSelect;

export const quotationItems = pgTable("quotation_items", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  quotationId: varchar("quotation_id")
    .notNull()
    .references(() => quotations.id, { onDelete: "cascade" }),
  workspaceId: varchar("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  description: text("description"),
  estimatedCost: numeric("estimated_cost").default("0"),
  quantity: integer("quantity").default(1),
  unit: text("unit").default("nos"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuotationItemSchema = createInsertSchema(
  quotationItems,
).omit({
  id: true,
  createdAt: true,
});
export type InsertQuotationItem = z.infer<typeof insertQuotationItemSchema>;
export type QuotationItem = typeof quotationItems.$inferSelect;

// ─── Workspace Rates ─────────────────────────────────────────────────────
export const workspaceRates = pgTable("workspace_rates", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  rate: numeric("rate").notNull().default("0"),
  unit: text("unit").notNull().default("flat"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorkspaceRateSchema = createInsertSchema(
  workspaceRates,
).omit({
  id: true,
  createdAt: true,
});
export type InsertWorkspaceRate = z.infer<typeof insertWorkspaceRateSchema>;
export type WorkspaceRate = typeof workspaceRates.$inferSelect;

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

// ─── Spatial Schema (Captures + Hotspots) ──────────────────────────────────────
const spatial = pgSchema("spatial");

export const captures = spatial.table("captures", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  projectId: varchar("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  // Which inspection round this photo belongs to — always required (see
  // `visits` above). The camera button auto-resolves this to the project's
  // current visit; the client only sends it explicitly if the user just
  // created a new visit.
  visitId: varchar("visit_id")
    .notNull()
    .references(() => visits.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  is360: boolean("is_360").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCaptureSchema = createInsertSchema(captures).omit({
  id: true,
  createdAt: true,
});
export type InsertCapture = z.infer<typeof insertCaptureSchema>;
export type Capture = typeof captures.$inferSelect;

// ─── Capture Tags (join: which Block/Floor/Flat/Amenity a capture carries) ───
// A normalized join (not columns-on-capture) so a capture can carry several
// facets, and adding a custom category later needs no schema change.
export const captureTags = spatial.table(
  "capture_tags",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    workspaceId: varchar("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    captureId: varchar("capture_id")
      .notNull()
      .references(() => captures.id, { onDelete: "cascade" }),
    tagValueId: varchar("tag_value_id")
      .notNull()
      .references(() => tagValues.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("capture_tags_unique").on(table.captureId, table.tagValueId),
    index("capture_tags_tagvalue_idx").on(table.tagValueId),
  ],
);

export const insertCaptureTagSchema = createInsertSchema(captureTags).omit({
  id: true,
  createdAt: true,
});
export type InsertCaptureTag = z.infer<typeof insertCaptureTagSchema>;
export type CaptureTag = typeof captureTags.$inferSelect;

export const hotspots = spatial.table("hotspots", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  captureId: varchar("capture_id")
    .notNull()
    .references(() => captures.id, { onDelete: "cascade" }),
  x: numeric("x", { precision: 5, scale: 4 }).notNull(),
  y: numeric("y", { precision: 5, scale: 4 }).notNull(),
  label: text("label").notNull(),
  panoUrl: text("pano_url"),
  thumbnailUrl: text("thumbnail_url"),
  issueId: text("issue_id"),
  issueTitle: text("issue_title"),
  issueStatus: text("issue_status"),
  issueSeverity: text("issue_severity"),
  notes: text("notes"),
  resolvedPhoto: text("resolved_photo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHotspotSchema = createInsertSchema(hotspots).omit({
  id: true,
  createdAt: true,
});
export type InsertHotspot = z.infer<typeof insertHotspotSchema>;
export type Hotspot = typeof hotspots.$inferSelect;
