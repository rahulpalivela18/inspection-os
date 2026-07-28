import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  workspaces,
  projects,
  reports,
  checklistTemplates,
  invoices,
  captures,
  hotspots,
  progressLogs,
  shareLinks,
  quotations,
  quotationItems,
  type User,
  type InsertUser,
  type Workspace,
  type InsertWorkspace,
  type Project,
  type InsertProject,
  type Report,
  type InsertReport,
  type ChecklistTemplate,
  type InsertChecklistTemplate,
  type Invoice,
  type InsertInvoice,
  type Capture,
  type InsertCapture,
  type Hotspot,
  type InsertHotspot,
  type ProgressLog,
  type InsertProgressLog,
  type ShareLink,
  type InsertShareLink,
  type Quotation,
  type InsertQuotation,
  type QuotationItem,
  type InsertQuotationItem,
} from "@shared/schema";

export interface IStorage {
  // Workspaces
  getWorkspace(id: string): Promise<Workspace | undefined>;
  getAllWorkspaces(): Promise<Workspace[]>;
  createWorkspace(w: InsertWorkspace): Promise<Workspace>;
  updateWorkspace(
    id: string,
    data: Partial<InsertWorkspace>,
  ): Promise<Workspace | undefined>;

  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByWorkspace(workspaceId: string): Promise<User[]>;
  deleteUser(id: string, workspaceId: string): Promise<boolean>;

  // Checklist Templates
  getChecklistTemplates(
    workspaceId: string,
    type?: string,
  ): Promise<ChecklistTemplate[]>;
  createChecklistTemplate(
    t: InsertChecklistTemplate,
  ): Promise<ChecklistTemplate>;
  updateChecklistTemplate(
    id: string,
    workspaceId: string,
    data: Partial<InsertChecklistTemplate>,
  ): Promise<ChecklistTemplate | undefined>;
  deleteChecklistTemplate(id: string, workspaceId: string): Promise<boolean>;

  // Projects
  getProjectsByWorkspace(workspaceId: string): Promise<Project[]>;
  getProject(id: string, workspaceId: string): Promise<Project | undefined>;
  createProject(p: InsertProject): Promise<Project>;
  updateProject(
    id: string,
    workspaceId: string,
    data: Partial<InsertProject>,
  ): Promise<Project | undefined>;
  deleteProject(id: string, workspaceId: string): Promise<boolean>;

  // Reports
  getReportsByProject(
    projectId: string,
    workspaceId: string,
  ): Promise<Report[]>;
  getReport(id: string, workspaceId: string): Promise<Report | undefined>;
  createReport(r: InsertReport): Promise<Report>;
  updateReport(
    id: string,
    workspaceId: string,
    data: Partial<InsertReport>,
  ): Promise<Report | undefined>;
  deleteReport(id: string, workspaceId: string): Promise<boolean>;

  // Invoices
  createInvoice(inv: InsertInvoice): Promise<Invoice>;
  getInvoicesByWorkspace(workspaceId: string): Promise<Invoice[]>;
  getAllInvoices(): Promise<Invoice[]>;

  // Progress Logs
  getProgressLogsByReport(
    reportId: string,
    workspaceId: string,
  ): Promise<ProgressLog[]>;
  createProgressLog(
    p: InsertProgressLog & { afterPhotos?: any },
  ): Promise<ProgressLog>;
  updateProgressLog(
    id: string,
    workspaceId: string,
    data: Partial<InsertProgressLog>,
  ): Promise<ProgressLog | undefined>;
  deleteProgressLog(id: string, workspaceId: string): Promise<boolean>;

  // Share Links
  getShareLinkByToken(token: string): Promise<ShareLink | undefined>;
  getShareLinksByProject(
    projectId: string,
    workspaceId: string,
  ): Promise<ShareLink[]>;
  createShareLink(data: InsertShareLink): Promise<ShareLink>;
  deleteShareLink(id: string, workspaceId: string): Promise<boolean>;

  // Quotations
  getQuotationsByProject(
    projectId: string,
    workspaceId: string,
  ): Promise<Quotation[]>;
  getQuotation(id: string, workspaceId: string): Promise<Quotation | undefined>;
  createQuotation(data: InsertQuotation): Promise<Quotation>;
  updateQuotation(
    id: string,
    workspaceId: string,
    data: Partial<InsertQuotation>,
  ): Promise<Quotation | undefined>;
  deleteQuotation(id: string, workspaceId: string): Promise<boolean>;

  // Quotation Items
  getQuotationItems(
    quotationId: string,
    workspaceId: string,
  ): Promise<QuotationItem[]>;
  createQuotationItem(data: InsertQuotationItem): Promise<QuotationItem>;
  updateQuotationItem(
    id: string,
    workspaceId: string,
    data: Partial<InsertQuotationItem>,
  ): Promise<QuotationItem | undefined>;
  deleteQuotationItem(id: string, workspaceId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Workspaces
  async getWorkspace(id: string) {
    const [row] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id));
    return row;
  }
  async getAllWorkspaces() {
    return db.select().from(workspaces).orderBy(desc(workspaces.createdAt));
  }
  async createWorkspace(data: InsertWorkspace) {
    const [row] = await db.insert(workspaces).values(data).returning();
    return row;
  }
  async updateWorkspace(id: string, data: Partial<InsertWorkspace>) {
    const [row] = await db
      .update(workspaces)
      .set(data)
      .where(eq(workspaces.id, id))
      .returning();
    return row;
  }

  // Users
  async getUser(id: string) {
    const [row] = await db.select().from(users).where(eq(users.id, id));
    return row;
  }
  async getUserByEmail(email: string) {
    const [row] = await db.select().from(users).where(eq(users.email, email));
    return row;
  }
  async createUser(data: InsertUser) {
    const [row] = await db.insert(users).values(data).returning();
    return row;
  }
  async getUsersByWorkspace(workspaceId: string) {
    return db.select().from(users).where(eq(users.workspaceId, workspaceId));
  }
  async deleteUser(id: string, workspaceId: string) {
    const result = await db
      .delete(users)
      .where(and(eq(users.id, id), eq(users.workspaceId, workspaceId)))
      .returning();
    return result.length > 0;
  }

  // Checklist Templates
  async getChecklistTemplates(workspaceId: string, type?: string) {
    const conditions = [eq(checklistTemplates.workspaceId, workspaceId)];
    if (type) {
      conditions.push(eq(checklistTemplates.checklistType, type));
    }
    return db
      .select()
      .from(checklistTemplates)
      .where(and(...conditions))
      .orderBy(desc(checklistTemplates.createdAt));
  }
  async createChecklistTemplate(data: InsertChecklistTemplate) {
    const [row] = await db.insert(checklistTemplates).values(data).returning();
    return row;
  }
  async updateChecklistTemplate(
    id: string,
    workspaceId: string,
    data: Partial<InsertChecklistTemplate>,
  ) {
    const [row] = await db
      .update(checklistTemplates)
      .set(data)
      .where(
        and(
          eq(checklistTemplates.id, id),
          eq(checklistTemplates.workspaceId, workspaceId),
        ),
      )
      .returning();
    return row;
  }
  async deleteChecklistTemplate(id: string, workspaceId: string) {
    const result = await db
      .delete(checklistTemplates)
      .where(
        and(
          eq(checklistTemplates.id, id),
          eq(checklistTemplates.workspaceId, workspaceId),
        ),
      )
      .returning();
    return result.length > 0;
  }

  // Projects
  async getProjectsByWorkspace(workspaceId: string) {
    return db
      .select()
      .from(projects)
      .where(eq(projects.workspaceId, workspaceId));
  }
  async getProject(id: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)));
    return row;
  }
  async createProject(data: InsertProject) {
    const [row] = await db.insert(projects).values(data).returning();
    return row;
  }
  async updateProject(
    id: string,
    workspaceId: string,
    data: Partial<InsertProject>,
  ) {
    const [row] = await db
      .update(projects)
      .set(data)
      .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)))
      .returning();
    return row;
  }
  async deleteProject(id: string, workspaceId: string) {
    const result = await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)))
      .returning();
    return result.length > 0;
  }

  // Reports
  async getReportsByProject(projectId: string, workspaceId: string) {
    return db
      .select()
      .from(reports)
      .where(
        and(
          eq(reports.projectId, projectId),
          eq(reports.workspaceId, workspaceId),
        ),
      );
  }
  async getReport(id: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(reports)
      .where(and(eq(reports.id, id), eq(reports.workspaceId, workspaceId)));
    return row;
  }
  async createReport(data: InsertReport) {
    const [row] = await db.insert(reports).values(data).returning();
    return row;
  }
  async updateReport(
    id: string,
    workspaceId: string,
    data: Partial<InsertReport>,
  ) {
    const [row] = await db
      .update(reports)
      .set(data)
      .where(and(eq(reports.id, id), eq(reports.workspaceId, workspaceId)))
      .returning();
    return row;
  }
  async deleteReport(id: string, workspaceId: string) {
    const result = await db
      .delete(reports)
      .where(and(eq(reports.id, id), eq(reports.workspaceId, workspaceId)))
      .returning();
    return result.length > 0;
  }

  // Invoices
  async createInvoice(data: InsertInvoice) {
    const [row] = await db.insert(invoices).values(data).returning();
    return row;
  }
  async getInvoicesByWorkspace(workspaceId: string) {
    return db
      .select()
      .from(invoices)
      .where(eq(invoices.workspaceId, workspaceId))
      .orderBy(desc(invoices.createdAt));
  }
  async getAllInvoices() {
    return db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  // Progress Logs
  async getProgressLogsByReport(reportId: string, workspaceId: string) {
    return db
      .select()
      .from(progressLogs)
      .where(
        and(
          eq(progressLogs.reportId, reportId),
          eq(progressLogs.workspaceId, workspaceId),
        ),
      )
      .orderBy(desc(progressLogs.createdAt));
  }
  async createProgressLog(data: InsertProgressLog & { afterPhotos?: any }) {
    const [row] = await db
      .insert(progressLogs)
      .values(data as any)
      .returning();
    return row;
  }
  async updateProgressLog(
    id: string,
    workspaceId: string,
    data: Partial<InsertProgressLog>,
  ) {
    const [row] = await db
      .update(progressLogs)
      .set(data)
      .where(
        and(eq(progressLogs.id, id), eq(progressLogs.workspaceId, workspaceId)),
      )
      .returning();
    return row;
  }
  async deleteProgressLog(id: string, workspaceId: string) {
    const result = await db
      .delete(progressLogs)
      .where(
        and(eq(progressLogs.id, id), eq(progressLogs.workspaceId, workspaceId)),
      )
      .returning();
    return result.length > 0;
  }

  // Share Links
  async getShareLinkByToken(token: string) {
    const [row] = await db
      .select()
      .from(shareLinks)
      .where(eq(shareLinks.token, token));
    return row;
  }
  async getShareLinksByProject(projectId: string, workspaceId: string) {
    return db
      .select()
      .from(shareLinks)
      .where(
        and(
          eq(shareLinks.projectId, projectId),
          eq(shareLinks.workspaceId, workspaceId),
        ),
      )
      .orderBy(desc(shareLinks.createdAt));
  }
  async createShareLink(data: InsertShareLink) {
    const [row] = await db.insert(shareLinks).values(data).returning();
    return row;
  }
  async deleteShareLink(id: string, workspaceId: string) {
    const result = await db
      .delete(shareLinks)
      .where(
        and(eq(shareLinks.id, id), eq(shareLinks.workspaceId, workspaceId)),
      )
      .returning();
    return result.length > 0;
  }

  // Quotations
  async getQuotationsByProject(projectId: string, workspaceId: string) {
    return db
      .select()
      .from(quotations)
      .where(
        and(
          eq(quotations.projectId, projectId),
          eq(quotations.workspaceId, workspaceId),
        ),
      )
      .orderBy(desc(quotations.createdAt));
  }
  async getQuotation(id: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(quotations)
      .where(
        and(eq(quotations.id, id), eq(quotations.workspaceId, workspaceId)),
      );
    return row;
  }
  async createQuotation(data: InsertQuotation) {
    const [row] = await db.insert(quotations).values(data).returning();
    return row;
  }
  async updateQuotation(
    id: string,
    workspaceId: string,
    data: Partial<InsertQuotation>,
  ) {
    const [row] = await db
      .update(quotations)
      .set(data)
      .where(
        and(eq(quotations.id, id), eq(quotations.workspaceId, workspaceId)),
      )
      .returning();
    return row;
  }
  async deleteQuotation(id: string, workspaceId: string) {
    const result = await db
      .delete(quotations)
      .where(
        and(eq(quotations.id, id), eq(quotations.workspaceId, workspaceId)),
      )
      .returning();
    return result.length > 0;
  }

  // Quotation Items
  async getQuotationItems(quotationId: string, workspaceId: string) {
    return db
      .select()
      .from(quotationItems)
      .where(
        and(
          eq(quotationItems.quotationId, quotationId),
          eq(quotationItems.workspaceId, workspaceId),
        ),
      )
      .orderBy(quotationItems.order);
  }
  async createQuotationItem(data: InsertQuotationItem) {
    const [row] = await db.insert(quotationItems).values(data).returning();
    return row;
  }
  async updateQuotationItem(
    id: string,
    workspaceId: string,
    data: Partial<InsertQuotationItem>,
  ) {
    const [row] = await db
      .update(quotationItems)
      .set(data)
      .where(
        and(
          eq(quotationItems.id, id),
          eq(quotationItems.workspaceId, workspaceId),
        ),
      )
      .returning();
    return row;
  }
  async deleteQuotationItem(id: string, workspaceId: string) {
    const result = await db
      .delete(quotationItems)
      .where(
        and(
          eq(quotationItems.id, id),
          eq(quotationItems.workspaceId, workspaceId),
        ),
      )
      .returning();
    return result.length > 0;
  }
}

export class SpatialStorage {
  // Captures
  async getCapturesByProject(projectId: string, workspaceId: string) {
    return db
      .select()
      .from(captures)
      .where(
        and(
          eq(captures.projectId, projectId),
          eq(captures.workspaceId, workspaceId),
        ),
      )
      .orderBy(desc(captures.createdAt));
  }

  async getCapturesByWorkspace(workspaceId: string) {
    return db
      .select()
      .from(captures)
      .where(eq(captures.workspaceId, workspaceId));
  }

  async getCapture(id: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(captures)
      .where(and(eq(captures.id, id), eq(captures.workspaceId, workspaceId)));
    return row;
  }

  async createCapture(data: InsertCapture) {
    const [row] = await db.insert(captures).values(data).returning();
    return row;
  }

  async updateCapture(
    id: string,
    workspaceId: string,
    data: Partial<InsertCapture>,
  ) {
    const [row] = await db
      .update(captures)
      .set(data)
      .where(and(eq(captures.id, id), eq(captures.workspaceId, workspaceId)))
      .returning();
    return row;
  }

  async deleteCapture(id: string, workspaceId: string) {
    const result = await db
      .delete(captures)
      .where(and(eq(captures.id, id), eq(captures.workspaceId, workspaceId)))
      .returning();
    return result.length > 0;
  }

  // Hotspots
  async getHotspotsByCapture(captureId: string, workspaceId: string) {
    return db
      .select()
      .from(hotspots)
      .where(
        and(
          eq(hotspots.captureId, captureId),
          eq(hotspots.workspaceId, workspaceId),
        ),
      )
      .orderBy(desc(hotspots.createdAt));
  }

  async getHotspot(id: string, workspaceId: string) {
    const [row] = await db
      .select()
      .from(hotspots)
      .where(and(eq(hotspots.id, id), eq(hotspots.workspaceId, workspaceId)));
    return row;
  }

  async createHotspot(data: InsertHotspot) {
    const [row] = await db.insert(hotspots).values(data).returning();
    return row;
  }

  async updateHotspot(
    id: string,
    workspaceId: string,
    data: Partial<InsertHotspot>,
  ) {
    const [row] = await db
      .update(hotspots)
      .set(data)
      .where(and(eq(hotspots.id, id), eq(hotspots.workspaceId, workspaceId)))
      .returning();
    return row;
  }

  async deleteHotspot(id: string, workspaceId: string) {
    const result = await db
      .delete(hotspots)
      .where(and(eq(hotspots.id, id), eq(hotspots.workspaceId, workspaceId)))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
export const spatialStorage = new SpatialStorage();
