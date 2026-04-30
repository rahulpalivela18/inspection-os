import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users, workspaces, projects, reports, checklistTemplates,
  type User, type InsertUser,
  type Workspace, type InsertWorkspace,
  type Project, type InsertProject,
  type Report, type InsertReport,
  type ChecklistTemplate, type InsertChecklistTemplate,
} from "@shared/schema";

export interface IStorage {
  // Workspaces
  getWorkspace(id: string): Promise<Workspace | undefined>;
  createWorkspace(w: InsertWorkspace): Promise<Workspace>;
  updateWorkspace(id: string, data: Partial<InsertWorkspace>): Promise<Workspace | undefined>;

  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByWorkspace(workspaceId: string): Promise<User[]>;
  deleteUser(id: string, workspaceId: string): Promise<boolean>;

  // Checklist Templates
  getChecklistTemplates(workspaceId: string): Promise<ChecklistTemplate[]>;
  createChecklistTemplate(t: InsertChecklistTemplate): Promise<ChecklistTemplate>;
  updateChecklistTemplate(id: string, workspaceId: string, data: Partial<InsertChecklistTemplate>): Promise<ChecklistTemplate | undefined>;
  deleteChecklistTemplate(id: string, workspaceId: string): Promise<boolean>;

  // Projects
  getProjectsByWorkspace(workspaceId: string): Promise<Project[]>;
  getProject(id: string, workspaceId: string): Promise<Project | undefined>;
  createProject(p: InsertProject): Promise<Project>;
  updateProject(id: string, workspaceId: string, data: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string, workspaceId: string): Promise<boolean>;

  // Reports
  getReportsByProject(projectId: string, workspaceId: string): Promise<Report[]>;
  getReport(id: string, workspaceId: string): Promise<Report | undefined>;
  createReport(r: InsertReport): Promise<Report>;
  updateReport(id: string, workspaceId: string, data: Partial<InsertReport>): Promise<Report | undefined>;
  deleteReport(id: string, workspaceId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Workspaces
  async getWorkspace(id: string) {
    const [row] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return row;
  }
  async createWorkspace(data: InsertWorkspace) {
    const [row] = await db.insert(workspaces).values(data).returning();
    return row;
  }
  async updateWorkspace(id: string, data: Partial<InsertWorkspace>) {
    const [row] = await db.update(workspaces).set(data).where(eq(workspaces.id, id)).returning();
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
    const result = await db.delete(users)
      .where(and(eq(users.id, id), eq(users.workspaceId, workspaceId)))
      .returning();
    return result.length > 0;
  }

  // Checklist Templates
  async getChecklistTemplates(workspaceId: string) {
    return db.select().from(checklistTemplates).where(eq(checklistTemplates.workspaceId, workspaceId)).orderBy(desc(checklistTemplates.createdAt));
  }
  async createChecklistTemplate(data: InsertChecklistTemplate) {
    const [row] = await db.insert(checklistTemplates).values(data).returning();
    return row;
  }
  async updateChecklistTemplate(id: string, workspaceId: string, data: Partial<InsertChecklistTemplate>) {
    const [row] = await db.update(checklistTemplates).set(data)
      .where(and(eq(checklistTemplates.id, id), eq(checklistTemplates.workspaceId, workspaceId)))
      .returning();
    return row;
  }
  async deleteChecklistTemplate(id: string, workspaceId: string) {
    const result = await db.delete(checklistTemplates)
      .where(and(eq(checklistTemplates.id, id), eq(checklistTemplates.workspaceId, workspaceId)))
      .returning();
    return result.length > 0;
  }

  // Projects
  async getProjectsByWorkspace(workspaceId: string) {
    return db.select().from(projects).where(eq(projects.workspaceId, workspaceId));
  }
  async getProject(id: string, workspaceId: string) {
    const [row] = await db.select().from(projects)
      .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)));
    return row;
  }
  async createProject(data: InsertProject) {
    const [row] = await db.insert(projects).values(data).returning();
    return row;
  }
  async updateProject(id: string, workspaceId: string, data: Partial<InsertProject>) {
    const [row] = await db.update(projects).set(data)
      .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)))
      .returning();
    return row;
  }
  async deleteProject(id: string, workspaceId: string) {
    const result = await db.delete(projects)
      .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)))
      .returning();
    return result.length > 0;
  }

  // Reports
  async getReportsByProject(projectId: string, workspaceId: string) {
    return db.select().from(reports)
      .where(and(eq(reports.projectId, projectId), eq(reports.workspaceId, workspaceId)));
  }
  async getReport(id: string, workspaceId: string) {
    const [row] = await db.select().from(reports)
      .where(and(eq(reports.id, id), eq(reports.workspaceId, workspaceId)));
    return row;
  }
  async createReport(data: InsertReport) {
    const [row] = await db.insert(reports).values(data).returning();
    return row;
  }
  async updateReport(id: string, workspaceId: string, data: Partial<InsertReport>) {
    const [row] = await db.update(reports).set(data)
      .where(and(eq(reports.id, id), eq(reports.workspaceId, workspaceId)))
      .returning();
    return row;
  }
  async deleteReport(id: string, workspaceId: string) {
    const result = await db.delete(reports)
      .where(and(eq(reports.id, id), eq(reports.workspaceId, workspaceId)))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
