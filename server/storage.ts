import { eq, and, desc, asc, sql, inArray, or, exists } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  workspaces,
  projects,
  tagValues,
  visits,
  reports,
  checklistTemplates,
  invoices,
  captures,
  captureTags,
  hotspots,
  progressLogs,
  shareLinks,
  quotations,
  quotationItems,
  workspaceRates,
  projectMembers,
  checklistItems,
  reportDimensions,
  reportIssues,
  issueImages,
  type User,
  type InsertUser,
  type Workspace,
  type InsertWorkspace,
  type Project,
  type InsertProject,
  type TagValue,
  type InsertTagValue,
  type Visit,
  type InsertVisit,
  type Report,
  type InsertReport,
  type ChecklistTemplate,
  type InsertChecklistTemplate,
  type Invoice,
  type InsertInvoice,
  type Capture,
  type InsertCapture,
  type CaptureTag,
  type InsertCaptureTag,
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
  type WorkspaceRate,
  type InsertWorkspaceRate,
  type ProjectMember,
  type InsertProjectMember,
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
  updateUser(
    id: string,
    workspaceId: string,
    data: Partial<Pick<User, "name" | "phone" | "avatarUrl" | "password">>,
  ): Promise<User | undefined>;

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
  countPinnedProjects(workspaceId: string): Promise<number>;

  // Project access control
  canUserAccessProject(
    projectId: string,
    workspaceId: string,
    userId: string,
    role: string,
  ): Promise<boolean>;
  getAccessibleProjects(
    workspaceId: string,
    userId: string,
  ): Promise<Project[]>;
  getProjectMembers(projectId: string): Promise<ProjectMember[]>;
  setProjectMembers(
    projectId: string,
    workspaceId: string,
    userIds: string[],
    restricted: boolean,
  ): Promise<void>;
  getProjectAccessMatrix(
    workspaceId: string,
  ): Promise<
    { id: string; name: string; restricted: boolean; memberIds: string[] }[]
  >;
  setMemberProjects(
    workspaceId: string,
    userId: string,
    projectIds: string[],
  ): Promise<void>;

  // Dashboard stats
  getDashboardStats(
    workspaceId: string,
    projectIds?: string[],
  ): Promise<{
    projects: number;
    captures: number;
    reports: number;
    reportsByStatus: { Draft: number; Review: number; Final: number };
  }>;

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
  getQuotationsByWorkspace(workspaceId: string): Promise<Quotation[]>;
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

  // Workspace Rates
  getWorkspaceRates(workspaceId: string): Promise<WorkspaceRate[]>;
  createWorkspaceRate(data: InsertWorkspaceRate): Promise<WorkspaceRate>;
  updateWorkspaceRate(
    id: string,
    workspaceId: string,
    data: Partial<InsertWorkspaceRate>,
  ): Promise<WorkspaceRate | undefined>;
  deleteWorkspaceRate(id: string, workspaceId: string): Promise<boolean>;

  // Tag Values (Block/Floor/Flat/Amenity vocabulary)
  getTagValues(
    projectId: string,
    workspaceId: string,
    category?: string,
  ): Promise<TagValue[]>;
  createTagValue(data: InsertTagValue): Promise<TagValue>;

  // Visits (named inspection rounds)
  getVisitsByProject(projectId: string, workspaceId: string): Promise<Visit[]>;
  getCurrentVisit(
    projectId: string,
    workspaceId: string,
  ): Promise<Visit | undefined>;
  createVisit(data: InsertVisit): Promise<Visit>;
  setActiveVisit(
    projectId: string,
    workspaceId: string,
    visitId: string,
  ): Promise<Visit | undefined>;
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
    const [row] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = lower(${email})`);
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
  async updateUser(
    id: string,
    workspaceId: string,
    data: Partial<Pick<User, "name" | "phone" | "avatarUrl" | "password">>,
  ) {
    const [row] = await db
      .update(users)
      .set(data)
      .where(and(eq(users.id, id), eq(users.workspaceId, workspaceId)))
      .returning();
    return row;
  }

  // Workspace Rates
  async getWorkspaceRates(workspaceId: string) {
    return db
      .select()
      .from(workspaceRates)
      .where(eq(workspaceRates.workspaceId, workspaceId))
      .orderBy(desc(workspaceRates.createdAt));
  }
  async createWorkspaceRate(data: InsertWorkspaceRate) {
    const [row] = await db.insert(workspaceRates).values(data).returning();
    return row;
  }
  async updateWorkspaceRate(
    id: string,
    workspaceId: string,
    data: Partial<InsertWorkspaceRate>,
  ) {
    const [row] = await db
      .update(workspaceRates)
      .set(data)
      .where(
        and(
          eq(workspaceRates.id, id),
          eq(workspaceRates.workspaceId, workspaceId),
        ),
      )
      .returning();
    return row;
  }
  async deleteWorkspaceRate(id: string, workspaceId: string) {
    const result = await db
      .delete(workspaceRates)
      .where(
        and(
          eq(workspaceRates.id, id),
          eq(workspaceRates.workspaceId, workspaceId),
        ),
      )
      .returning();
    return result.length > 0;
  }
  // Tag Values
  async getTagValues(
    projectId: string,
    workspaceId: string,
    category?: string,
  ) {
    const conditions = [
      eq(tagValues.projectId, projectId),
      eq(tagValues.workspaceId, workspaceId),
    ];
    if (category) conditions.push(eq(tagValues.category, category as any));
    return db
      .select()
      .from(tagValues)
      .where(and(...conditions))
      .orderBy(asc(tagValues.value));
  }
  async createTagValue(data: InsertTagValue) {
    // Idempotent on (project, category, case-insensitive value) — "Other"
    // re-adding an existing value (e.g. typed slightly differently) reuses
    // the same row instead of fragmenting the dropdown.
    const [existing] = await db
      .select()
      .from(tagValues)
      .where(
        and(
          eq(tagValues.projectId, data.projectId),
          eq(tagValues.category, data.category),
          sql`lower(${tagValues.value}) = lower(${data.value})`,
        ),
      );
    if (existing) return existing;
    const [row] = await db.insert(tagValues).values(data).returning();
    return row;
  }

  // Visits
  async getVisitsByProject(projectId: string, workspaceId: string) {
    return db
      .select()
      .from(visits)
      .where(
        and(
          eq(visits.projectId, projectId),
          eq(visits.workspaceId, workspaceId),
        ),
      )
      .orderBy(desc(visits.createdAt));
  }
  async getCurrentVisit(projectId: string, workspaceId: string) {
    // "Current" = the visit flagged active. If none is active yet (e.g. the
    // unique-title migration backfilled visits before this column shipped),
    // fall back to the most recently created one.
    const [active] = await db
      .select()
      .from(visits)
      .where(
        and(
          eq(visits.projectId, projectId),
          eq(visits.workspaceId, workspaceId),
          eq(visits.active, true),
        ),
      )
      .limit(1);
    if (active) return active;
    const [row] = await db
      .select()
      .from(visits)
      .where(
        and(
          eq(visits.projectId, projectId),
          eq(visits.workspaceId, workspaceId),
        ),
      )
      .orderBy(desc(visits.createdAt))
      .limit(1);
    return row;
  }
  async createVisit(data: InsertVisit) {
    // A fresh "+ New Visit" becomes the active one: it's what the camera will
    // target next, so deactivate every other visit in this project.
    const rows = await db.transaction(async (tx) => {
      await tx
        .update(visits)
        .set({ active: false })
        .where(eq(visits.projectId, data.projectId));
      const [row] = await tx
        .insert(visits)
        .values({ ...data, active: true })
        .returning();
      return [row];
    });
    return rows[0];
  }
  async setActiveVisit(
    projectId: string,
    workspaceId: string,
    visitId: string,
  ) {
    // Single active visit per project: clear the flag everywhere, then set it
    // on the target. Also guards the target actually belongs to this workspace.
    const [row] = await db.transaction(async (tx) => {
      const target = await tx
        .select()
        .from(visits)
        .where(
          and(
            eq(visits.id, visitId),
            eq(visits.projectId, projectId),
            eq(visits.workspaceId, workspaceId),
          ),
        )
        .limit(1);
      if (!target.length) return [];
      await tx
        .update(visits)
        .set({ active: false })
        .where(eq(visits.projectId, projectId));
      const [updated] = await tx
        .update(visits)
        .set({ active: true })
        .where(eq(visits.id, visitId))
        .returning();
      return [updated];
    });
    return row;
  }

  async getChecklistTemplates(workspaceId: string, type?: string) {
    const conditions = [eq(checklistTemplates.workspaceId, workspaceId)];
    if (type) {
      conditions.push(eq(checklistTemplates.checklistType, type));
    }
    return db
      .select()
      .from(checklistTemplates)
      .where(and(...conditions))
      .orderBy(asc(checklistTemplates.order));
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
      .where(eq(projects.workspaceId, workspaceId))
      .orderBy(desc(projects.isPinned), desc(projects.createdAt));
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
  async countPinnedProjects(workspaceId: string) {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(
        and(eq(projects.workspaceId, workspaceId), eq(projects.isPinned, true)),
      );
    return Number(row.count);
  }

  // Project access control: admins see everything; everyone else sees projects
  // that are open to the team (restricted = false) OR ones they're a member of.
  async canUserAccessProject(
    projectId: string,
    workspaceId: string,
    userId: string,
    role: string,
  ) {
    const project = await this.getProject(projectId, workspaceId);
    if (!project) return false;
    if (role === "admin" || role === "super_admin") return true;
    if (!project.restricted) return true;
    const [member] = await db
      .select({ id: projectMembers.id })
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId),
        ),
      );
    return !!member;
  }
  async getAccessibleProjects(workspaceId: string, userId: string) {
    return db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.workspaceId, workspaceId),
          or(
            eq(projects.restricted, false),
            exists(
              db
                .select({ id: projectMembers.id })
                .from(projectMembers)
                .where(
                  and(
                    eq(projectMembers.projectId, projects.id),
                    eq(projectMembers.userId, userId),
                  ),
                ),
            ),
          ),
        ),
      )
      .orderBy(desc(projects.isPinned), desc(projects.createdAt));
  }
  async getProjectMembers(projectId: string) {
    return db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.projectId, projectId));
  }
  async setProjectMembers(
    projectId: string,
    workspaceId: string,
    userIds: string[],
    restricted: boolean,
  ) {
    await db.transaction(async (tx) => {
      await tx
        .update(projects)
        .set({ restricted })
        .where(
          and(
            eq(projects.id, projectId),
            eq(projects.workspaceId, workspaceId),
          ),
        );
      await tx
        .delete(projectMembers)
        .where(eq(projectMembers.projectId, projectId));
      if (userIds.length > 0) {
        await tx.insert(projectMembers).values(
          userIds.map((userId) => ({
            projectId,
            workspaceId,
            userId,
            permission: "edit" as const,
          })),
        );
      }
    });
  }

  // Full access matrix for the workspace: every project with its restricted
  // flag and the ids of assigned members. Drives the admin Team-page UI so a
  // member's projects can be assigned without one request per project.
  async getProjectAccessMatrix(workspaceId: string) {
    const projects = await this.getProjectsByWorkspace(workspaceId);
    const rows = await db
      .select({
        projectId: projectMembers.projectId,
        userId: projectMembers.userId,
      })
      .from(projectMembers)
      .where(eq(projectMembers.workspaceId, workspaceId));
    const byProject = new Map<string, string[]>();
    for (const row of rows) {
      const list = byProject.get(row.projectId) ?? [];
      list.push(row.userId);
      byProject.set(row.projectId, list);
    }
    return projects.map((p) => ({
      id: p.id,
      name: p.title,
      restricted: p.restricted,
      memberIds: byProject.get(p.id) ?? [],
    }));
  }

  // Member-centric assignment: sets which restricted projects a user belongs
  // to. Open projects (restricted = false) are skipped — everyone already sees
  // those, so membership is irrelevant.
  async setMemberProjects(
    workspaceId: string,
    userId: string,
    projectIds: string[],
  ) {
    const projects = await this.getProjectsByWorkspace(workspaceId);
    const restrictedIds = new Set(
      projects.filter((p) => p.restricted).map((p) => p.id),
    );
    const targetIds = projectIds.filter((id) => restrictedIds.has(id));
    await db.transaction(async (tx) => {
      await tx
        .delete(projectMembers)
        .where(
          and(
            eq(projectMembers.workspaceId, workspaceId),
            eq(projectMembers.userId, userId),
          ),
        );
      if (targetIds.length > 0) {
        await tx.insert(projectMembers).values(
          targetIds.map((projectId) => ({
            projectId,
            workspaceId,
            userId,
            permission: "edit" as const,
          })),
        );
      }
    });
  }

  // Dashboard stats
  async getDashboardStats(workspaceId: string, projectIds?: string[]) {
    const projectsCond = projectIds
      ? and(
          eq(projects.workspaceId, workspaceId),
          inArray(projects.id, projectIds),
        )
      : eq(projects.workspaceId, workspaceId);
    const reportsCond = projectIds
      ? and(
          eq(reports.workspaceId, workspaceId),
          inArray(reports.projectId, projectIds),
        )
      : eq(reports.workspaceId, workspaceId);
    const capturesCond = projectIds
      ? and(
          eq(captures.workspaceId, workspaceId),
          inArray(captures.projectId, projectIds),
        )
      : eq(captures.workspaceId, workspaceId);

    const [projectRows, reportRows, captureRows] = await Promise.all([
      db.select({ id: projects.id }).from(projects).where(projectsCond),
      db
        .select({ id: reports.id, status: reports.status })
        .from(reports)
        .where(reportsCond),
      db.select({ id: captures.id }).from(captures).where(capturesCond),
    ]);

    const reportsByStatus: { Draft: number; Review: number; Final: number } = {
      Draft: 0,
      Review: 0,
      Final: 0,
    };
    for (const r of reportRows) {
      if (r.status in reportsByStatus) reportsByStatus[r.status]++;
    }

    return {
      projects: projectRows.length,
      captures: captureRows.length,
      reports: reportRows.length,
      reportsByStatus,
    };
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

  // ── Normalized Report Tables ────────────────────────────────────────────────

  async getChecklistItems(reportId: string) {
    return db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.reportId, reportId))
      .orderBy(asc(checklistItems.order));
  }

  async replaceChecklistItems(
    reportId: string,
    workspaceId: string,
    items: Array<{
      id: string;
      category: string;
      point: string;
      status?: string | null;
      severity?: string | null;
      triggerOn?: string | null;
      image?: string | null;
      workStatus?: string | null;
      order?: number;
    }>,
  ) {
    // Delete existing then insert fresh — simplest for full-array replacement
    await db
      .delete(checklistItems)
      .where(eq(checklistItems.reportId, reportId));
    if (items.length === 0) return;
    await db.insert(checklistItems).values(
      items.map((item, idx) => ({
        id: item.id,
        reportId,
        workspaceId,
        category: item.category,
        point: item.point,
        status: item.status as any,
        severity: item.severity as any,
        triggerOn: (item.triggerOn as any) ?? "no",
        imageUrl: item.image ?? null,
        workStatus: (item.workStatus as any) ?? null,
        order: item.order ?? idx,
      })),
    );
  }

  async updateChecklistItem(id: string, updates: Record<string, any>) {
    const [row] = await db
      .update(checklistItems)
      .set(updates)
      .where(eq(checklistItems.id, id))
      .returning();
    return row;
  }

  async getReportDimensions(reportId: string) {
    return db
      .select()
      .from(reportDimensions)
      .where(eq(reportDimensions.reportId, reportId))
      .orderBy(asc(reportDimensions.order));
  }

  async replaceReportDimensions(
    reportId: string,
    workspaceId: string,
    dims: Array<{
      id: string;
      space: string;
      spaceName?: string | null;
      length?: string | null;
      width?: string | null;
      unit?: string | null;
      notes?: string | null;
      order?: number;
    }>,
  ) {
    await db
      .delete(reportDimensions)
      .where(eq(reportDimensions.reportId, reportId));
    if (dims.length === 0) return;
    await db.insert(reportDimensions).values(
      dims.map((d, idx) => ({
        id: d.id,
        reportId,
        workspaceId,
        space: d.space,
        spaceName: d.spaceName ?? null,
        length: d.length ?? null,
        width: d.width ?? null,
        unit: (d.unit as any) ?? "ft",
        notes: d.notes ?? null,
        order: d.order ?? idx,
      })),
    );
  }

  async getReportIssues(reportId: string) {
    return db
      .select()
      .from(reportIssues)
      .where(eq(reportIssues.reportId, reportId))
      .orderBy(asc(reportIssues.order));
  }

  async replaceReportIssues(
    reportId: string,
    workspaceId: string,
    issues: Array<{
      id: string;
      title: string;
      note?: string | null;
      location?: string | null;
      responsibleEngineer?: string | null;
      severity?: string | null;
      status?: string | null;
      images?: string[];
      order?: number;
    }>,
  ) {
    // Delete existing issues (cascade deletes issue_images too)
    await db.delete(reportIssues).where(eq(reportIssues.reportId, reportId));
    if (issues.length === 0) return;
    for (let idx = 0; idx < issues.length; idx++) {
      const iss = issues[idx];
      const [row] = await db
        .insert(reportIssues)
        .values({
          id: iss.id,
          reportId,
          workspaceId,
          title: iss.title,
          note: iss.note ?? null,
          location: iss.location ?? null,
          responsibleEngineer: iss.responsibleEngineer ?? null,
          severity: (iss.severity as any) ?? null,
          status: (iss.status as any) ?? "Open",
          order: iss.order ?? idx,
        })
        .returning();
      // Insert issue images
      if (iss.images && iss.images.length > 0) {
        await db.insert(issueImages).values(
          iss.images.map((url, imgIdx) => ({
            issueReportId: reportId,
            issueId: row.id,
            workspaceId,
            gcpUrl: url,
            sortOrder: imgIdx,
          })),
        );
      }
    }
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
  async getQuotationsByWorkspace(workspaceId: string) {
    return db
      .select()
      .from(quotations)
      .where(eq(quotations.workspaceId, workspaceId))
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
  async getCapturesByProject(
    projectId: string,
    workspaceId: string,
    filters?: { visitId?: string; tagValueIds?: string[] },
  ) {
    const conditions = [
      eq(captures.projectId, projectId),
      eq(captures.workspaceId, workspaceId),
    ];
    if (filters?.visitId)
      conditions.push(eq(captures.visitId, filters.visitId));
    let rows = await db
      .select()
      .from(captures)
      .where(and(...conditions))
      .orderBy(desc(captures.createdAt));

    if (filters?.tagValueIds && filters.tagValueIds.length > 0) {
      const matches = await db
        .selectDistinct({ captureId: captureTags.captureId })
        .from(captureTags)
        .where(inArray(captureTags.tagValueId, filters.tagValueIds));
      const matchingIds = new Set(matches.map((m) => m.captureId));
      rows = rows.filter((r) => matchingIds.has(r.id));
    }
    return rows;
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

  // Capture Tags
  async getCaptureTags(captureId: string) {
    return db
      .select()
      .from(captureTags)
      .where(eq(captureTags.captureId, captureId));
  }

  // Bulk-hydrate tags (with their category/value) for a set of captures in
  // one query — used to render tag chips on the capture grid without N+1s.
  async getTagsForCaptures(captureIds: string[]) {
    if (captureIds.length === 0) return [];
    return db
      .select({
        captureId: captureTags.captureId,
        tagValueId: captureTags.tagValueId,
        category: tagValues.category,
        value: tagValues.value,
      })
      .from(captureTags)
      .innerJoin(tagValues, eq(tagValues.id, captureTags.tagValueId))
      .where(inArray(captureTags.captureId, captureIds));
  }

  // Replaces a capture's full tag set — used by the capture form (create/edit).
  async setCaptureTags(
    captureId: string,
    workspaceId: string,
    tagValueIds: string[],
  ) {
    await db.delete(captureTags).where(eq(captureTags.captureId, captureId));
    if (tagValueIds.length === 0) return [];
    return db
      .insert(captureTags)
      .values(
        tagValueIds.map((tagValueId) => ({
          workspaceId,
          captureId,
          tagValueId,
        })),
      )
      .returning();
  }

  // Adds tags to a capture without removing existing ones — used by the
  // "Untagged" bulk-apply cleanup action.
  async addCaptureTags(
    captureId: string,
    workspaceId: string,
    tagValueIds: string[],
  ) {
    if (tagValueIds.length === 0) return [];
    return db
      .insert(captureTags)
      .values(
        tagValueIds.map((tagValueId) => ({
          workspaceId,
          captureId,
          tagValueId,
        })),
      )
      .onConflictDoNothing()
      .returning();
  }
}

export const storage = new DatabaseStorage();
export const spatialStorage = new SpatialStorage();
