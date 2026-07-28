import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { storage, spatialStorage } from "./storage";
import {
  loginSchema,
  registerSchema,
  insertProjectSchema,
  insertReportSchema,
  insertChecklistTemplateSchema,
  insertWorkspaceSchema,
  insertCaptureSchema,
  insertHotspotSchema,
  insertProgressLogSchema,
} from "@shared/schema";
import { pick } from "@shared/cleanData";
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
  if (
    !req.isAuthenticated() ||
    (user?.role !== "admin" && user?.role !== "super_admin")
  )
    return res.status(403).json({ message: "Forbidden" });
  next();
}
function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const user = req.user as any;
  if (!req.isAuthenticated() || user?.role !== "super_admin")
    return res.status(403).json({ message: "Forbidden" });
  next();
}
function requireWriteAccess(req: Request, res: Response, next: NextFunction) {
  const user = req.user as any;
  if (!req.isAuthenticated())
    return res.status(401).json({ message: "Unauthorized" });
  if (user?.role === "viewer")
    return res.status(403).json({ message: "Viewers cannot modify data." });
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

    // 14-day free trial starts on registration
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const workspace = await storage.createWorkspace({
      name: companyName,
      planStatus: "active",
      trialEndsAt,
    });
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
      const safeWs = pick(workspace, [
        "id",
        "name",
        "logoUrl",
        "address",
        "email",
        "phone",
        "plan",
        "planStatus",
        "trialEndsAt",
      ]);
      res.status(201).json({ user: safe, workspace: safeWs });
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
        const safeWs = pick(workspace, [
          "id",
          "name",
          "logoUrl",
          "address",
          "email",
          "phone",
          "plan",
          "planStatus",
          "trialEndsAt",
        ]);
        res.json({ user: safe, workspace: safeWs });
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
    const safeWs = pick(workspace, [
      "id",
      "name",
      "logoUrl",
      "address",
      "email",
      "phone",
      "plan",
      "planStatus",
      "trialEndsAt",
    ]);
    res.json({ user: safe, workspace: safeWs });
  });

  // ── Trial Routes ──────────────────────────────────────────────────────────────

  const TRIAL_LIMITS = { maxProjects: 1, maxCaptures: 5 };

  app.get("/api/workspace/trial-status", requireAuth, async (req, res) => {
    const user = req.user as any;
    const workspace = await storage.getWorkspace(user.workspaceId);
    if (!workspace)
      return res.status(404).json({ message: "Workspace not found" });

    const trialEndsAt = workspace.trialEndsAt;
    if (!trialEndsAt) {
      return res.json({
        isTrial: false,
        trialEndsAt: null,
        daysRemaining: null,
        isExpired: false,
        limits: null,
        usage: null,
      });
    }

    const now = new Date();
    const end = new Date(trialEndsAt);
    const diffMs = end.getTime() - now.getTime();
    const daysRemaining = Math.max(
      0,
      Math.ceil(diffMs / (1000 * 60 * 60 * 24)),
    );
    const isExpired = diffMs <= 0;

    const projectCount = await storage.getProjectsByWorkspace(user.workspaceId);
    const captures = await spatialStorage.getCapturesByWorkspace(
      user.workspaceId,
    );

    res.json({
      isTrial: true,
      trialEndsAt,
      daysRemaining,
      isExpired,
      limits: TRIAL_LIMITS,
      usage: { projects: projectCount.length, captures: captures.length },
    });
  });

  // Middleware: blocks write operations when trial has expired (non-super_admin)
  function requireActiveTrial(req: Request, res: Response, next: NextFunction) {
    const user = req.user as any;
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });
    if (user?.role === "super_admin") return next();

    storage
      .getWorkspace(user.workspaceId)
      .then((workspace: any) => {
        if (!workspace)
          return res.status(404).json({ message: "Workspace not found" });

        // No trial end date = paid plan, allow
        if (!workspace.trialEndsAt) return next();

        const isExpired = new Date(workspace.trialEndsAt) < new Date();
        if (isExpired) {
          return res.status(403).json({
            message: "Your free trial has expired. Contact us to upgrade.",
            trialExpired: true,
          });
        }
        next();
      })
      .catch((err: any) => {
        console.error("Trial check error:", err);
        next();
      });
  }

  // ── Team Routes ───────────────────────────────────────────────────────────────

  app.get("/api/team", requireAuth, async (req, res) => {
    const user = req.user as any;
    const members = await storage.getUsersByWorkspace(user.workspaceId);
    res.json(members.map(({ password: _, ...m }) => m));
  });

  const PLAN_INSPECTOR_LIMITS: Record<string, number> = {
    starter: 2,
    pro: 9,
    enterprise: Infinity,
  };

  const TRIAL_MAX_MEMBERS = 2;

  app.post("/api/team", requireAdmin, requireActiveTrial, async (req, res) => {
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

    // Max 1 admin per workspace
    const targetRole = role || "inspector";
    if (targetRole === "admin") {
      const allMembers = await storage.getUsersByWorkspace(admin.workspaceId);
      const adminCount = allMembers.filter((m) => m.role === "admin").length;
      if (adminCount >= 1) {
        return res.status(403).json({
          message: "Each workspace can only have 1 admin.",
        });
      }
    }

    // Trial member limit
    const workspace = await storage.getWorkspace(admin.workspaceId);
    if (
      workspace?.trialEndsAt &&
      new Date(workspace.trialEndsAt) > new Date()
    ) {
      const allMembers = await storage.getUsersByWorkspace(admin.workspaceId);
      if (allMembers.length >= TRIAL_MAX_MEMBERS) {
        return res.status(403).json({
          message: `Free trial allows up to ${TRIAL_MAX_MEMBERS} team members. Contact us to upgrade.`,
          trialLimit: true,
        });
      }
    }

    if (targetRole === "inspector") {
      const workspace = await storage.getWorkspace(admin.workspaceId);
      if (!workspace)
        return res.status(404).json({ message: "Workspace not found." });
      const limit = PLAN_INSPECTOR_LIMITS[workspace.plan] ?? 2;
      const allMembers = await storage.getUsersByWorkspace(admin.workspaceId);
      const currentCount = allMembers.filter(
        (m) => m.role === "inspector",
      ).length;
      if (currentCount >= limit)
        return res.status(403).json({
          message: `Your ${workspace.plan} plan allows up to ${limit === Infinity ? "unlimited" : limit} inspector${limit === 1 ? "" : "s"}. You already have ${currentCount}.`,
        });
    }

    const hashed = await bcrypt.hash(password, 10);
    const member = await storage.createUser({
      name,
      email,
      password: hashed,
      workspaceId: admin.workspaceId,
      role: targetRole,
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
    const { id, createdAt, targetWorkspaceId, ...body } = req.body;
    const parsed = insertWorkspaceSchema.partial().safeParse(body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.errors[0].message });

    // Only super_admin can change billing fields
    if (
      parsed.data.plan !== undefined ||
      parsed.data.planStatus !== undefined
    ) {
      if (user.role !== "super_admin")
        return res.status(403).json({
          message: "Only the platform owner can change billing settings.",
        });
    }

    // Upload logo to GCP if it's a base64 data URL
    if (
      parsed.data.logoUrl &&
      !isGCPUrl(parsed.data.logoUrl) &&
      parsed.data.logoUrl.startsWith("data:")
    ) {
      try {
        const gcpUrl = await uploadImageToGCP(parsed.data.logoUrl, "logo.jpg");
        if (gcpUrl) parsed.data.logoUrl = gcpUrl;
      } catch (err) {
        console.error("Logo upload error:", err);
      }
    }
    const wsId =
      user.role === "super_admin" && targetWorkspaceId
        ? targetWorkspaceId
        : user.workspaceId;
    const workspace = await storage.updateWorkspace(wsId, parsed.data);
    res.json(workspace);
  });

  // ── Admin Routes (super_admin only) ────────────────────────────────────────────

  app.get("/api/admin/workspaces", requireSuperAdmin, async (_req, res) => {
    const all = await storage.getAllWorkspaces();
    res.json(all);
  });

  app.post("/api/admin/invoices", requireSuperAdmin, async (req, res) => {
    const { workspaceId, plan, amount } = req.body;
    if (!workspaceId || !plan || !amount)
      return res
        .status(400)
        .json({ message: "workspaceId, plan, and amount are required" });
    const ws = await storage.getWorkspace(workspaceId);
    if (!ws) return res.status(404).json({ message: "Workspace not found" });
    const receiptNumber = `RCP-${workspaceId.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`;
    const invoice = await storage.createInvoice({
      workspaceId,
      plan,
      amount,
      receiptNumber,
      status: "paid",
    });
    res.status(201).json(invoice);
  });

  app.get("/api/admin/invoices", requireSuperAdmin, async (_req, res) => {
    const all = await storage.getAllInvoices();
    res.json(all);
  });

  app.get("/api/workspace/invoices", requireAuth, async (req, res) => {
    const user = req.user as any;
    const items = await storage.getInvoicesByWorkspace(user.workspaceId);
    res.json(items);
  });

  // ── Checklist Template Routes ─────────────────────────────────────────────────

  app.get("/api/checklist-templates", requireAuth, async (req, res) => {
    const user = req.user as any;
    const type = req.query.type as string | undefined;
    const items = await storage.getChecklistTemplates(user.workspaceId, type);
    res.json(items);
  });

  app.post(
    "/api/checklist-templates",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const parsed = insertChecklistTemplateSchema.safeParse({
        ...req.body,
        workspaceId: user.workspaceId,
      });
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: parsed.error.errors[0].message });
      const item = await storage.createChecklistTemplate(parsed.data);
      res.status(201).json(item);
    },
  );

  app.patch(
    "/api/checklist-templates/:id",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const item = await storage.updateChecklistTemplate(
        req.params.id as string,
        user.workspaceId,
        req.body,
      );
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json(item);
    },
  );

  app.delete(
    "/api/checklist-templates/:id",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const ok = await storage.deleteChecklistTemplate(
        req.params.id as string,
        user.workspaceId,
      );
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    },
  );

  // ── Project Routes ────────────────────────────────────────────────────────────

  app.get("/api/projects", requireAuth, async (req, res) => {
    const user = req.user as any;
    const items = await storage.getProjectsByWorkspace(user.workspaceId);
    res.json(items);
  });

  app.post(
    "/api/projects",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;

      // Trial project limit
      const workspace = await storage.getWorkspace(user.workspaceId);
      if (
        workspace?.trialEndsAt &&
        new Date(workspace.trialEndsAt) > new Date()
      ) {
        const projects = await storage.getProjectsByWorkspace(user.workspaceId);
        if (projects.length >= TRIAL_LIMITS.maxProjects) {
          return res.status(403).json({
            message: `Free trial allows up to ${TRIAL_LIMITS.maxProjects} project. Contact us to upgrade.`,
            trialLimit: true,
          });
        }
      }

      const parsed = insertProjectSchema.safeParse({
        ...req.body,
        workspaceId: user.workspaceId,
      });
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: parsed.error.errors[0].message });
      const item = await storage.createProject(parsed.data);
      res.status(201).json(item);
    },
  );

  app.get("/api/projects/:id", requireAuth, async (req, res) => {
    const user = req.user as any;
    const item = await storage.getProject(
      req.params.id as string,
      user.workspaceId,
    );
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.patch(
    "/api/projects/:id",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const { id, createdAt, workspaceId, ...updates } = req.body;
      const item = await storage.updateProject(
        req.params.id as string,
        user.workspaceId,
        updates,
      );
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json(item);
    },
  );

  app.delete(
    "/api/projects/:id",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const ok = await storage.deleteProject(
        req.params.id as string,
        user.workspaceId,
      );
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    },
  );

  // ── Report Routes ─────────────────────────────────────────────────────────────

  app.get("/api/projects/:projectId/reports", requireAuth, async (req, res) => {
    const user = req.user as any;
    const items = await storage.getReportsByProject(
      req.params.projectId as string,
      user.workspaceId,
    );
    const summaries = items.map(
      ({ checklist, dimensions, issues, ...rest }) => rest,
    );
    res.json(summaries);
  });

  app.post(
    "/api/projects/:projectId/reports",
    requireWriteAccess,
    requireActiveTrial,
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

  app.patch(
    "/api/reports/:id",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      // Strip read-only / auto-generated fields before passing to Drizzle
      let { id, createdAt, workspaceId, projectId, ...updates } = req.body;

      // Upload images to GCP if present in checklist (parallel)
      if (updates.checklist) {
        await Promise.all(
          updates.checklist.map(async (item: any) => {
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
          }),
        );
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
    },
  );

  app.delete(
    "/api/reports/:id",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const ok = await storage.deleteReport(
        req.params.id as string,
        user.workspaceId,
      );
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    },
  );

  // ── Progress Log Routes ──────────────────────────────────────────────────────

  app.get(
    "/api/reports/:reportId/progress-logs",
    requireAuth,
    async (req, res) => {
      const user = req.user as any;
      const items = await storage.getProgressLogsByReport(
        req.params.reportId as string,
        user.workspaceId,
      );
      res.json(items);
    },
  );

  app.post(
    "/api/reports/:reportId/progress-logs",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const { afterPhotos, ...bodyRest } = req.body;

      // Upload afterPhotos to GCP
      let uploadedAfterPhotos: Record<string, string[]> | undefined;
      if (afterPhotos && typeof afterPhotos === "object") {
        uploadedAfterPhotos = {};
        for (const [itemId, photos] of Object.entries(
          afterPhotos as Record<string, string[]>,
        )) {
          if (Array.isArray(photos)) {
            uploadedAfterPhotos[itemId] = await Promise.all(
              photos.map(async (photo: string) => {
                if (photo && !isGCPUrl(photo) && photo.startsWith("data:")) {
                  try {
                    const gcpUrl = await uploadImageToGCP(
                      photo,
                      `after-${itemId}-${Date.now()}.jpg`,
                    );
                    return gcpUrl || photo;
                  } catch (err) {
                    console.error("After photo upload error:", err);
                    return photo;
                  }
                }
                return photo;
              }),
            );
          }
        }
      }

      const item = await storage.createProgressLog({
        ...bodyRest,
        reportId: req.params.reportId as string,
        workspaceId: user.workspaceId,
        afterPhotos: uploadedAfterPhotos ?? afterPhotos ?? undefined,
      });
      res.status(201).json(item);
    },
  );

  app.patch(
    "/api/progress-logs/:id",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      let { id, createdAt, reportId, workspaceId, ...updates } = req.body;

      if (updates.afterPhotos) {
        for (const [itemId, photos] of Object.entries(
          updates.afterPhotos as Record<string, string[]>,
        )) {
          if (Array.isArray(photos)) {
            (updates.afterPhotos as any)[itemId] = await Promise.all(
              photos.map(async (photo: string) => {
                if (photo && !isGCPUrl(photo) && photo.startsWith("data:")) {
                  try {
                    const gcpUrl = await uploadImageToGCP(
                      photo,
                      `after-${itemId}-${Date.now()}.jpg`,
                    );
                    return gcpUrl || photo;
                  } catch (err) {
                    console.error("After photo upload error:", err);
                    return photo;
                  }
                }
                return photo;
              }),
            );
          }
        }
      }

      const item = await storage.updateProgressLog(
        req.params.id as string,
        user.workspaceId,
        updates,
      );
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json(item);
    },
  );

  app.delete(
    "/api/progress-logs/:id",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const ok = await storage.deleteProgressLog(
        req.params.id as string,
        user.workspaceId,
      );
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    },
  );

  // ── Capture Routes ───────────────────────────────────────────────────────────

  app.get(
    "/api/projects/:projectId/captures",
    requireAuth,
    async (req, res) => {
      const user = req.user as any;
      const items = await spatialStorage.getCapturesByProject(
        req.params.projectId as string,
        user.workspaceId,
      );
      res.json(items);
    },
  );

  app.post(
    "/api/projects/:projectId/captures",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;

      // Trial capture limit
      const workspace = await storage.getWorkspace(user.workspaceId);
      if (
        workspace?.trialEndsAt &&
        new Date(workspace.trialEndsAt) > new Date()
      ) {
        const captures = await spatialStorage.getCapturesByWorkspace(
          user.workspaceId,
        );
        if (captures.length >= TRIAL_LIMITS.maxCaptures) {
          return res.status(403).json({
            message: `Free trial allows up to ${TRIAL_LIMITS.maxCaptures} captures. Contact us to upgrade.`,
            trialLimit: true,
          });
        }
      }

      const parsed = insertCaptureSchema.safeParse({
        ...req.body,
        projectId: req.params.projectId as string,
        workspaceId: user.workspaceId,
      });
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: parsed.error.errors[0].message });

      if (
        parsed.data.imageUrl &&
        !isGCPUrl(parsed.data.imageUrl) &&
        parsed.data.imageUrl.startsWith("data:")
      ) {
        try {
          const gcpUrl = await uploadImageToGCP(
            parsed.data.imageUrl,
            `capture-${Date.now()}.png`,
          );
          if (gcpUrl) parsed.data.imageUrl = gcpUrl;
        } catch (err) {
          console.error("Capture image upload error:", err);
        }
      }

      const item = await spatialStorage.createCapture(parsed.data);
      res.status(201).json(item);
    },
  );

  app.get("/api/captures/:id", requireAuth, async (req, res) => {
    const user = req.user as any;
    const item = await spatialStorage.getCapture(
      req.params.id as string,
      user.workspaceId,
    );
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.patch(
    "/api/captures/:id",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      let { id, createdAt, workspaceId, projectId, ...updates } = req.body;

      if (
        updates.imageUrl &&
        !isGCPUrl(updates.imageUrl) &&
        updates.imageUrl.startsWith("data:")
      ) {
        try {
          const gcpUrl = await uploadImageToGCP(
            updates.imageUrl,
            `capture-${Date.now()}.png`,
          );
          if (gcpUrl) updates.imageUrl = gcpUrl;
        } catch (err) {
          console.error("Capture image upload error:", err);
        }
      }

      const item = await spatialStorage.updateCapture(
        req.params.id as string,
        user.workspaceId,
        updates,
      );
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json(item);
    },
  );

  app.delete(
    "/api/captures/:id",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const ok = await spatialStorage.deleteCapture(
        req.params.id as string,
        user.workspaceId,
      );
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    },
  );

  // ── Hotspot Routes ───────────────────────────────────────────────────────────

  app.get(
    "/api/captures/:captureId/hotspots",
    requireAuth,
    async (req, res) => {
      const user = req.user as any;
      const items = await spatialStorage.getHotspotsByCapture(
        req.params.captureId as string,
        user.workspaceId,
      );
      res.json(items);
    },
  );

  app.post(
    "/api/captures/:captureId/hotspots",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const parsed = insertHotspotSchema.safeParse({
        ...req.body,
        captureId: req.params.captureId as string,
        workspaceId: user.workspaceId,
      });
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: parsed.error.errors[0].message });

      if (
        parsed.data.panoUrl &&
        !isGCPUrl(parsed.data.panoUrl) &&
        parsed.data.panoUrl.startsWith("data:")
      ) {
        try {
          const gcpUrl = await uploadImageToGCP(
            parsed.data.panoUrl,
            `pano-${Date.now()}.jpg`,
          );
          if (gcpUrl) parsed.data.panoUrl = gcpUrl;
        } catch (err) {
          console.error("Pano image upload error:", err);
        }
      }

      if (
        parsed.data.resolvedPhoto &&
        !isGCPUrl(parsed.data.resolvedPhoto) &&
        parsed.data.resolvedPhoto.startsWith("data:")
      ) {
        try {
          const gcpUrl = await uploadImageToGCP(
            parsed.data.resolvedPhoto,
            `resolved-${Date.now()}.jpg`,
          );
          if (gcpUrl) parsed.data.resolvedPhoto = gcpUrl;
        } catch (err) {
          console.error("Resolved photo upload error:", err);
        }
      }

      const item = await spatialStorage.createHotspot(parsed.data);
      res.status(201).json(item);
    },
  );

  app.patch(
    "/api/hotspots/:id",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      let { id, createdAt, workspaceId, captureId, ...updates } = req.body;

      if (
        updates.panoUrl &&
        !isGCPUrl(updates.panoUrl) &&
        updates.panoUrl.startsWith("data:")
      ) {
        try {
          const gcpUrl = await uploadImageToGCP(
            updates.panoUrl,
            `pano-${Date.now()}.jpg`,
          );
          if (gcpUrl) updates.panoUrl = gcpUrl;
        } catch (err) {
          console.error("Pano image upload error:", err);
        }
      }

      if (
        updates.resolvedPhoto &&
        !isGCPUrl(updates.resolvedPhoto) &&
        updates.resolvedPhoto.startsWith("data:")
      ) {
        try {
          const gcpUrl = await uploadImageToGCP(
            updates.resolvedPhoto,
            `resolved-${Date.now()}.jpg`,
          );
          if (gcpUrl) updates.resolvedPhoto = gcpUrl;
        } catch (err) {
          console.error("Resolved photo upload error:", err);
        }
      }

      const item = await spatialStorage.updateHotspot(
        req.params.id as string,
        user.workspaceId,
        updates,
      );
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json(item);
    },
  );

  app.delete(
    "/api/hotspots/:id",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const ok = await spatialStorage.deleteHotspot(
        req.params.id as string,
        user.workspaceId,
      );
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    },
  );

  // ── Share Link Routes ────────────────────────────────────────────────────────

  // Public: resolve a share token (no auth required)
  app.get("/api/shared/:token", async (req, res) => {
    try {
      const link = await storage.getShareLinkByToken(req.params.token);
      if (!link) return res.status(404).json({ message: "Link not found" });
      if (new Date(link.expiresAt) < new Date())
        return res.status(410).json({ message: "Link expired" });

      const project = await storage.getProject(
        link.projectId,
        link.workspaceId,
      );
      if (!project)
        return res.status(404).json({ message: "Project not found" });

      const reports = await storage.getReportsByProject(
        link.projectId,
        link.workspaceId,
      );
      const captures = await spatialStorage.getCapturesByProject(
        link.projectId,
        link.workspaceId,
      );

      // Attach progress logs to reports
      const reportsWithLogs = await Promise.all(
        reports.map(async (report: any) => {
          const progressLogs = await storage.getProgressLogsByReport(
            report.id,
            link.workspaceId,
          );
          return { ...report, progressLogs };
        }),
      );

      // Attach hotspots to captures
      const capturesWithHotspots = await Promise.all(
        captures.map(async (capture: any) => {
          const hotspots = await spatialStorage.getHotspotsByCapture(
            capture.id,
            link.workspaceId,
          );
          return { ...capture, hotspots };
        }),
      );

      res.json({
        project,
        reports: reportsWithLogs,
        captures: capturesWithHotspots,
        expiresAt: link.expiresAt,
      });
    } catch (err: any) {
      console.error("Shared portal error:", err);
      res.status(500).json({ message: err.message || "Internal server error" });
    }
  });

  app.get(
    "/api/projects/:projectId/share-links",
    requireAuth,
    async (req, res) => {
      const user = req.user as any;
      const links = await storage.getShareLinksByProject(
        req.params.projectId as string,
        user.workspaceId,
      );
      res.json(links);
    },
  );

  app.post(
    "/api/projects/:projectId/share-links",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const { expiresInDays = 180 } = req.body;
      const token =
        Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const link = await storage.createShareLink({
        projectId: req.params.projectId as string,
        workspaceId: user.workspaceId,
        token,
        expiresAt,
      });
      res.status(201).json(link);
    },
  );

  app.delete(
    "/api/share-links/:id",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const ok = await storage.deleteShareLink(
        req.params.id as string,
        user.workspaceId,
      );
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    },
  );

  // ── Quotations ─────────────────────────────────────────────────────────────

  app.get("/api/quotations", requireAuth, async (req, res) => {
    const user = req.user as any;
    const quotations = await storage.getQuotationsByWorkspace(user.workspaceId);
    res.json(quotations);
  });

  app.get(
    "/api/projects/:projectId/quotations",
    requireAuth,
    async (req, res) => {
      const user = req.user as any;
      const quotations = await storage.getQuotationsByProject(
        req.params.projectId as string,
        user.workspaceId,
      );
      res.json(quotations);
    },
  );

  app.post(
    "/api/quotations",
    requireAuth,
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const {
        projectId,
        title,
        taxRate,
        notes,
        validityDays,
        clientName,
        clientPhone,
        clientEmail,
        propertyAddress,
        propertyType,
        bedrooms,
        bathrooms,
        areaSqFt,
      } = req.body;
      if (!title)
        return res.status(400).json({ message: "Title is required." });
      const quotation = await storage.createQuotation({
        projectId: projectId || null,
        workspaceId: user.workspaceId,
        title,
        taxRate: taxRate ?? "18",
        notes: notes ?? null,
        validityDays: validityDays ?? 30,
        clientName: clientName ?? null,
        clientPhone: clientPhone ?? null,
        clientEmail: clientEmail ?? null,
        propertyAddress: propertyAddress ?? null,
        propertyType: propertyType ?? null,
        bedrooms: bedrooms ?? null,
        bathrooms: bathrooms ?? null,
        areaSqFt: areaSqFt ?? null,
      });
      res.status(201).json(quotation);
    },
  );

  app.post(
    "/api/projects/:projectId/quotations",
    requireAuth,
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const {
        title,
        taxRate,
        notes,
        validityDays,
        clientName,
        clientPhone,
        clientEmail,
        propertyAddress,
        propertyType,
        bedrooms,
        bathrooms,
        areaSqFt,
      } = req.body;
      if (!title)
        return res.status(400).json({ message: "Title is required." });
      const quotation = await storage.createQuotation({
        projectId: req.params.projectId as string,
        workspaceId: user.workspaceId,
        title,
        taxRate: taxRate ?? "0",
        notes: notes ?? null,
        validityDays: validityDays ?? 30,
        clientName: clientName ?? null,
        clientPhone: clientPhone ?? null,
        clientEmail: clientEmail ?? null,
        propertyAddress: propertyAddress ?? null,
        propertyType: propertyType ?? null,
        bedrooms: bedrooms ?? null,
        bathrooms: bathrooms ?? null,
        areaSqFt: areaSqFt ?? null,
      });
      res.status(201).json(quotation);
    },
  );

  app.get("/api/quotations/:id", requireAuth, async (req, res) => {
    const user = req.user as any;
    const quotation = await storage.getQuotation(
      req.params.id as string,
      user.workspaceId,
    );
    if (!quotation) return res.status(404).json({ message: "Not found" });
    res.json(quotation);
  });

  app.patch(
    "/api/quotations/:id",
    requireAuth,
    requireWriteAccess,
    async (req, res) => {
      const user = req.user as any;
      const updated = await storage.updateQuotation(
        req.params.id as string,
        user.workspaceId,
        req.body,
      );
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    },
  );

  app.delete(
    "/api/quotations/:id",
    requireAuth,
    requireWriteAccess,
    async (req, res) => {
      const user = req.user as any;
      const ok = await storage.deleteQuotation(
        req.params.id as string,
        user.workspaceId,
      );
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    },
  );

  // ── Quotation Items ────────────────────────────────────────────────────────

  app.get(
    "/api/quotations/:quotationId/items",
    requireAuth,
    async (req, res) => {
      const user = req.user as any;
      const items = await storage.getQuotationItems(
        req.params.quotationId as string,
        user.workspaceId,
      );
      res.json(items);
    },
  );

  app.post(
    "/api/quotations/:quotationId/items",
    requireAuth,
    requireWriteAccess,
    async (req, res) => {
      const user = req.user as any;
      const item = await storage.createQuotationItem({
        quotationId: req.params.quotationId as string,
        workspaceId: user.workspaceId,
        ...req.body,
      });
      res.status(201).json(item);
    },
  );

  app.patch(
    "/api/quotation-items/:id",
    requireAuth,
    requireWriteAccess,
    async (req, res) => {
      const user = req.user as any;
      const updated = await storage.updateQuotationItem(
        req.params.id as string,
        user.workspaceId,
        req.body,
      );
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    },
  );

  app.delete(
    "/api/quotation-items/:id",
    requireAuth,
    requireWriteAccess,
    async (req, res) => {
      const user = req.user as any;
      const ok = await storage.deleteQuotationItem(
        req.params.id as string,
        user.workspaceId,
      );
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    },
  );

  // ── Image proxy ────────────────────────────────────────────────────────────

  app.get("/api/image-proxy", async (req, res) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ message: "Missing url param" });

    try {
      const response = await fetch(url);
      if (!response.ok)
        return res
          .status(response.status)
          .json({ message: "Failed to fetch image" });

      const contentType = response.headers.get("content-type") || "image/jpeg";
      const buffer = Buffer.from(await response.arrayBuffer());

      res.set("Content-Type", contentType);
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Cache-Control", "public, max-age=86400");
      res.send(buffer);
    } catch (err) {
      res.status(502).json({ message: "Image proxy failed" });
    }
  });

  // ── Workspace Rates ──────────────────────────────────────────────────────

  app.get("/api/workspace/rates", requireAuth, async (req, res) => {
    const user = req.user as any;
    const rates = await storage.getWorkspaceRates(user.workspaceId);
    res.json(rates);
  });

  app.post(
    "/api/workspace/rates",
    requireAuth,
    requireWriteAccess,
    async (req, res) => {
      const user = req.user as any;
      const { label, rate, unit } = req.body;
      if (!label)
        return res.status(400).json({ message: "Label is required." });
      const created = await storage.createWorkspaceRate({
        workspaceId: user.workspaceId,
        label,
        rate: rate ?? "0",
        unit: unit ?? "flat",
      });
      res.status(201).json(created);
    },
  );

  app.patch(
    "/api/workspace/rates/:id",
    requireAuth,
    requireWriteAccess,
    async (req, res) => {
      const user = req.user as any;
      const updated = await storage.updateWorkspaceRate(
        req.params.id as string,
        user.workspaceId,
        req.body,
      );
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    },
  );

  app.delete(
    "/api/workspace/rates/:id",
    requireAuth,
    requireWriteAccess,
    async (req, res) => {
      const user = req.user as any;
      const ok = await storage.deleteWorkspaceRate(
        req.params.id as string,
        user.workspaceId,
      );
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    },
  );

  return httpServer;
}
