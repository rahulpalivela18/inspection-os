import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import {
  loginSchema,
  registerSchema,
  insertProjectSchema,
  insertReportSchema,
  insertChecklistTemplateSchema,
  insertWorkspaceSchema,
} from "@shared/schema";
import { DEFAULT_CHECKLIST_POINTS } from "./defaultChecklist";
import { uploadImageToGCP, isGCPUrl } from "./gcp-storage";

const PgSession = connectPgSimple(session);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Auth middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated())
    return res.status(401).json({ message: "Unauthorized" });
  next();
}
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = req.user as any;
  if (!req.isAuthenticated() || user?.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Sessions
  app.use(
    session({
      store: new PgSession({ pool, createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET || "reportgen-secret-2024",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
    }),
  );

  // Passport
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user)
            return done(null, false, { message: "Invalid email or password" });
          const valid = await bcrypt.compare(password, user.password);
          if (!valid)
            return done(null, false, { message: "Invalid email or password" });
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      },
    ),
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || false);
    } catch (err) {
      done(err);
    }
  });

  app.use(passport.initialize());
  app.use(passport.session());

  // ── Auth Routes ──────────────────────────────────────────────────────────────

  app.post("/api/auth/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.errors[0].message });
    const { name, email, password, companyName } = parsed.data;

    const existing = await storage.getUserByEmail(email);
    if (existing)
      return res.status(409).json({ message: "Email already registered" });

    const workspace = await storage.createWorkspace({ name: companyName });
    const hashed = await bcrypt.hash(password, 10);
    const user = await storage.createUser({
      name,
      email,
      password: hashed,
      workspaceId: workspace.id,
      role: "admin",
    });

    // Seed the workspace with default checklist points
    for (let i = 0; i < DEFAULT_CHECKLIST_POINTS.length; i++) {
      const p = DEFAULT_CHECKLIST_POINTS[i];
      await storage.createChecklistTemplate({
        workspaceId: workspace.id,
        category: p.category,
        point: p.point,
        order: i,
        triggerOn: p.triggerOn ?? "no",
      });
    }

    req.login(user, (err) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Login failed after registration" });
      const { password: _, ...safe } = user;
      res.status(201).json({ user: safe, workspace });
    });
  });

  app.post("/api/auth/login", (req, res, next) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.errors[0].message });

    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user)
        return res
          .status(401)
          .json({ message: info?.message || "Invalid credentials" });
      req.login(user, async (loginErr) => {
        if (loginErr) return next(loginErr);
        const workspace = await storage.getWorkspace(user.workspaceId);
        const { password: _, ...safe } = user;
        res.json({ user: safe, workspace });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => res.json({ success: true }));
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Not authenticated" });
    const user = req.user as any;
    const workspace = await storage.getWorkspace(user.workspaceId);
    const { password: _, ...safe } = user;
    res.json({ user: safe, workspace });
  });

  // ── Team Routes ───────────────────────────────────────────────────────────────

  app.get("/api/team", requireAuth, async (req, res) => {
    const user = req.user as any;
    const members = await storage.getUsersByWorkspace(user.workspaceId);
    res.json(members.map(({ password: _, ...m }) => m));
  });

  app.post("/api/team", requireAdmin, async (req, res) => {
    const admin = req.user as any;
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res
        .status(400)
        .json({ message: "Name, email, and password are required." });
    if (password.length < 6)
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters." });
    const validRoles = ["admin", "inspector", "viewer"];
    if (role && !validRoles.includes(role))
      return res.status(400).json({ message: "Invalid role." });
    const existing = await storage.getUserByEmail(email);
    if (existing)
      return res
        .status(409)
        .json({ message: "A user with this email already exists." });
    const hashed = await bcrypt.hash(password, 10);
    const member = await storage.createUser({
      name,
      email,
      password: hashed,
      workspaceId: admin.workspaceId,
      role: role || "inspector",
    });
    const { password: _, ...safe } = member;
    res.status(201).json(safe);
  });

  app.delete("/api/team/:id", requireAdmin, async (req, res) => {
    const admin = req.user as any;
    if (req.params.id === admin.id)
      return res.status(400).json({ message: "You cannot remove yourself." });
    const ok = await storage.deleteUser(
      req.params.id as string,
      admin.workspaceId,
    );
    if (!ok) return res.status(404).json({ message: "Member not found." });
    res.json({ success: true });
  });

  // ── Workspace Routes ──────────────────────────────────────────────────────────

  app.patch("/api/workspace", requireAdmin, async (req, res) => {
    const user = req.user as any;
    const { id, createdAt, ...body } = req.body;
    const parsed = insertWorkspaceSchema.partial().safeParse(body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.errors[0].message });
    const workspace = await storage.updateWorkspace(
      user.workspaceId,
      parsed.data,
    );
    res.json(workspace);
  });

  // ── Checklist Template Routes ─────────────────────────────────────────────────

  app.get("/api/checklist-templates", requireAuth, async (req, res) => {
    const user = req.user as any;
    const items = await storage.getChecklistTemplates(user.workspaceId);
    res.json(items);
  });

  app.post("/api/checklist-templates", requireAdmin, async (req, res) => {
    const user = req.user as any;
    const parsed = insertChecklistTemplateSchema.safeParse({
      ...req.body,
      workspaceId: user.workspaceId,
    });
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.errors[0].message });
    const item = await storage.createChecklistTemplate(parsed.data);
    res.status(201).json(item);
  });

  app.patch("/api/checklist-templates/:id", requireAdmin, async (req, res) => {
    const user = req.user as any;
    const item = await storage.updateChecklistTemplate(
      req.params.id as string,
      user.workspaceId,
      req.body,
    );
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.delete("/api/checklist-templates/:id", requireAdmin, async (req, res) => {
    const user = req.user as any;
    const ok = await storage.deleteChecklistTemplate(
      req.params.id as string,
      user.workspaceId,
    );
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
  });

  // ── Project Routes ────────────────────────────────────────────────────────────

  app.get("/api/projects", requireAuth, async (req, res) => {
    const user = req.user as any;
    const items = await storage.getProjectsByWorkspace(user.workspaceId);
    res.json(items);
  });

  app.post("/api/projects", requireAuth, async (req, res) => {
    const user = req.user as any;
    const parsed = insertProjectSchema.safeParse({
      ...req.body,
      workspaceId: user.workspaceId,
    });
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.errors[0].message });
    const item = await storage.createProject(parsed.data);
    res.status(201).json(item);
  });

  app.get("/api/projects/:id", requireAuth, async (req, res) => {
    const user = req.user as any;
    const item = await storage.getProject(
      req.params.id as string,
      user.workspaceId,
    );
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.patch("/api/projects/:id", requireAuth, async (req, res) => {
    const user = req.user as any;
    const { id, createdAt, workspaceId, ...updates } = req.body;
    const item = await storage.updateProject(
      req.params.id as string,
      user.workspaceId,
      updates,
    );
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.delete("/api/projects/:id", requireAuth, async (req, res) => {
    const user = req.user as any;
    const ok = await storage.deleteProject(
      req.params.id as string,
      user.workspaceId,
    );
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
  });

  // ── Report Routes ─────────────────────────────────────────────────────────────

  app.get("/api/projects/:projectId/reports", requireAuth, async (req, res) => {
    const user = req.user as any;
    const items = await storage.getReportsByProject(
      req.params.projectId as string,
      user.workspaceId,
    );
    res.json(items);
  });

  app.post(
    "/api/projects/:projectId/reports",
    requireAuth,
    async (req, res) => {
      const user = req.user as any;
      const parsed = insertReportSchema.safeParse({
        ...req.body,
        projectId: req.params.projectId as string,
        workspaceId: user.workspaceId,
      });
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: parsed.error.errors[0].message });
      const item = await storage.createReport(parsed.data);
      res.status(201).json(item);
    },
  );

  app.get("/api/reports/:id", requireAuth, async (req, res) => {
    const user = req.user as any;
    const item = await storage.getReport(
      req.params.id as string,
      user.workspaceId,
    );
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.patch("/api/reports/:id", requireAuth, async (req, res) => {
    const user = req.user as any;
    // Strip read-only / auto-generated fields before passing to Drizzle
    let { id, createdAt, workspaceId, projectId, ...updates } = req.body;

    // Upload images to GCP if present in checklist
    if (updates.checklist) {
      for (const item of updates.checklist) {
        if (
          item.image &&
          !isGCPUrl(item.image) &&
          item.image.startsWith("data:")
        ) {
          try {
            const gcpUrl = await uploadImageToGCP(
              item.image,
              `checklist-${item.id}.jpg`,
            );
            if (gcpUrl) {
              item.image = gcpUrl;
            }
          } catch (err) {
            console.error("Image upload error:", err);
            // Keep base64 if GCP fails
          }
        }
      }
    }

    // Upload images to GCP if present in issues
    if (updates.issues) {
      for (const issue of updates.issues) {
        if (issue.images && Array.isArray(issue.images)) {
          issue.images = await Promise.all(
            issue.images.map(async (imageUrl: string) => {
              if (
                imageUrl &&
                !isGCPUrl(imageUrl) &&
                imageUrl.startsWith("data:")
              ) {
                try {
                  const gcpUrl = await uploadImageToGCP(
                    imageUrl,
                    `issue-${issue.id}.jpg`,
                  );
                  return gcpUrl || imageUrl;
                } catch (err) {
                  console.error("Issue image upload error:", err);
                  return imageUrl; // Keep base64 if GCP fails
                }
              }
              return imageUrl;
            }),
          );
        }
      }
    }

    const item = await storage.updateReport(
      req.params.id as string,
      user.workspaceId,
      updates,
    );
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.delete("/api/reports/:id", requireAuth, async (req, res) => {
    const user = req.user as any;
    const ok = await storage.deleteReport(
      req.params.id as string,
      user.workspaceId,
    );
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
  });

  return httpServer;
}
