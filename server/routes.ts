import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { storage, spatialStorage } from "./storage";
import { db } from "./db";
import { eq, inArray } from "drizzle-orm";
import {
  loginSchema,
  registerSchema,
  updateUserSchema,
  changePasswordSchema,
  insertProjectSchema,
  insertReportSchema,
  insertChecklistTemplateSchema,
  insertWorkspaceSchema,
  insertCaptureSchema,
  insertHotspotSchema,
  insertProgressLogSchema,
  insertTagValueSchema,
  insertVisitSchema,
  issueImages,
  checklistItems,
  reportDimensions,
  reportIssues,
} from "@shared/schema";
import { pick } from "@shared/cleanData";
import { DEFAULT_CHECKLIST_POINTS } from "./defaultChecklist";
import { uploadImageToGCP, isGCPUrl } from "./gcp-storage";

// Seeds the amenity picker in the Multi-Block project questionnaire. A
// workspace-editable version of this list is a clean v2 — deferred for now.
const DEFAULT_AMENITIES = [
  "Gym",
  "Swimming Pool",
  "Clubhouse",
  "Tennis Court",
  "Children's Play Area",
  "Garden",
  "Parking",
  "Lift",
  "Cafe",
  "Security Cabin",
];

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
  // Sessions — require a real secret in production; dev-only fallback otherwise
  const sessionSecret =
    process.env.SESSION_SECRET ||
    (process.env.NODE_ENV === "production"
      ? (() => {
          throw new Error(
            "SESSION_SECRET environment variable is required in production",
          );
        })()
      : "dev-only-insecure-session-secret");
  app.use(
    session({
      store: new PgSession({ pool, createTableIfMissing: true }),
      secret: sessionSecret,
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
        "taxRate",
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

  // ── Self-service User Profile Routes ─────────────────────────────────────────

  // Edit your own name/phone/avatar. Role, email, and password are NOT
  // accepted here (role changes stay admin-only via Team, email is the login
  // identifier, password has its own endpoint below) — stripped defensively
  // in case a client sends them anyway.
  app.patch("/api/user", requireAuth, async (req, res) => {
    const user = req.user as any;
    const { password: _, role, email, workspaceId, id, ...body } = req.body;
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.errors[0].message });

    // Upload avatar to GCP if it's a base64 data URL (same flow as the
    // workspace logo) — otherwise keep the existing GCP URL as-is.
    if (
      parsed.data.avatarUrl &&
      !isGCPUrl(parsed.data.avatarUrl) &&
      parsed.data.avatarUrl.startsWith("data:")
    ) {
      try {
        const gcpUrl = await uploadImageToGCP(
          parsed.data.avatarUrl,
          "avatar.jpg",
        );
        if (gcpUrl) parsed.data.avatarUrl = gcpUrl;
      } catch (err) {
        console.error("Avatar upload error:", err);
      }
    }

    const updated = await storage.updateUser(user.id, user.workspaceId, {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
      ...(parsed.data.avatarUrl !== undefined && {
        avatarUrl: parsed.data.avatarUrl,
      }),
    });
    if (!updated) return res.status(404).json({ message: "User not found" });
    const { password: _pw, ...safe } = updated;
    res.json(safe);
  });

  app.post("/api/user/password", requireAuth, async (req, res) => {
    const user = req.user as any;
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.errors[0].message });

    const valid = await bcrypt.compare(
      parsed.data.currentPassword,
      user.password,
    );
    if (!valid)
      return res
        .status(400)
        .json({ message: "Current password is incorrect." });

    const hashed = await bcrypt.hash(parsed.data.newPassword, 10);
    await storage.updateUser(user.id, user.workspaceId, { password: hashed });
    res.json({ success: true });
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

  // ── Team Project Assignment (admin only) ─────────────────────────────────────

  // Every project with its restricted flag + assigned member ids, so the Team
  // page can render a member's project assignments in one request.
  app.get("/api/team/access", requireAdmin, async (req, res) => {
    const user = req.user as any;
    const matrix = await storage.getProjectAccessMatrix(user.workspaceId);
    res.json(matrix);
  });

  // Member-centric assignment: replace the set of restricted projects a member
  // belongs to. Open projects are ignored by the storage layer (everyone sees
  // them already).
  app.put(
    "/api/team/members/:userId/access",
    requireAdmin,
    async (req, res) => {
      const admin = req.user as any;
      const userId = req.params.userId as string;
      const { projectIds } = req.body as { projectIds?: unknown };
      const list = Array.isArray(projectIds)
        ? (projectIds as unknown[]).filter((id) => typeof id === "string")
        : [];

      const members = await storage.getUsersByWorkspace(admin.workspaceId);
      const target = members.find((m) => m.id === userId);
      if (!target)
        return res.status(404).json({ message: "Member not found." });
      if (target.role === "admin" || target.role === "super_admin")
        return res.status(400).json({
          message: "Admins always have access to every project.",
        });

      await storage.setMemberProjects(admin.workspaceId, userId, list);
      res.json({ success: true });
    },
  );

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

  // ── Dashboard Stats ─────────────────────────────────────────────────────────

  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    const user = req.user as any;
    let scopedIds: string[] | undefined;
    if (user?.role !== "admin" && user?.role !== "super_admin") {
      const accessible = await storage.getAccessibleProjects(
        user.workspaceId,
        user.id,
      );
      scopedIds = accessible.map((p) => p.id);
    }
    const stats = await storage.getDashboardStats(user.workspaceId, scopedIds);
    res.json(stats);
  });

  // ── Project Routes ────────────────────────────────────────────────────────────

  app.get("/api/projects", requireAuth, async (req, res) => {
    const user = req.user as any;
    const items =
      user?.role === "admin" || user?.role === "super_admin"
        ? await storage.getProjectsByWorkspace(user.workspaceId)
        : await storage.getAccessibleProjects(user.workspaceId, user.id);
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

      // blockCount / amenities are questionnaire-only inputs used to seed
      // tag_values — not real project columns, so pull them out before
      // validating the project shape itself.
      const { blockCount, amenities, ...projectBody } = req.body;

      const parsed = insertProjectSchema.safeParse({
        ...projectBody,
        workspaceId: user.workspaceId,
      });
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: parsed.error.errors[0].message });
      const item = await storage.createProject(parsed.data);

      // Multi-Block: seed the Block dropdown ("Block 1".."Block N") and the
      // chosen Amenity values, so they're ready the first time someone tags
      // a capture. Floors/Flats always self-populate later via "Other".
      if (parsed.data.projectType === "multi") {
        const seeds: Promise<any>[] = [];
        const count = Math.max(0, Math.min(50, Number(blockCount) || 0));
        for (let i = 1; i <= count; i++) {
          seeds.push(
            storage.createTagValue({
              workspaceId: user.workspaceId,
              projectId: item.id,
              category: "block",
              value: `Block ${i}`,
            }),
          );
        }
        if (Array.isArray(amenities)) {
          for (const amenity of amenities) {
            if (typeof amenity === "string" && amenity.trim()) {
              seeds.push(
                storage.createTagValue({
                  workspaceId: user.workspaceId,
                  projectId: item.id,
                  category: "amenity",
                  value: amenity.trim(),
                }),
              );
            }
          }
        }
        await Promise.all(seeds);
      }

      res.status(201).json(item);
    },
  );

  app.get("/api/amenities/defaults", requireAuth, async (_req, res) => {
    res.json(DEFAULT_AMENITIES);
  });

  // Every route under /api/projects/:projectId (including /:id itself and all
  // nested reports/captures/visits/tag-values/quotations/share-links) is gated
  // by per-project access. Admins always pass; other roles need the project to
  // be unassigned (open to the team) or to be a member. 404 hides existence.
  app.use("/api/projects/:projectId", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      const projectId = (req.params.projectId || req.params.id) as string;
      const allowed = await storage.canUserAccessProject(
        projectId,
        user.workspaceId,
        user.id,
        user.role,
      );
      if (!allowed) return res.status(404).json({ message: "Not found" });
      next();
    } catch (err) {
      next(err);
    }
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

  app.patch(
    "/api/projects/:id",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const { id, createdAt, workspaceId, ...updates } = req.body;

      if (updates.isPinned === true) {
        const target = await storage.getProject(
          req.params.id as string,
          user.workspaceId,
        );
        if (!target) return res.status(404).json({ message: "Not found" });
        if (!target.isPinned) {
          const pinned = await storage.countPinnedProjects(user.workspaceId);
          if (pinned >= 3) {
            return res
              .status(400)
              .json({ message: "You can pin up to 3 projects." });
          }
        }
      }

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

  // ── Project Membership Routes (admin only) ──────────────────────────────────

  app.get(
    "/api/projects/:projectId/members",
    requireAdmin,
    async (req, res) => {
      const user = req.user as any;
      const projectId = req.params.projectId as string;
      const project = await storage.getProject(projectId, user.workspaceId);
      if (!project) return res.status(404).json({ message: "Not found" });
      const rows = await storage.getProjectMembers(projectId);
      const users = await storage.getUsersByWorkspace(user.workspaceId);
      res.json({
        restricted: project.restricted,
        members: rows.map((row) => {
          const member = users.find((u) => u.id === row.userId);
          if (!member) return null;
          const { password: _, ...safe } = member;
          return { ...safe, permission: row.permission };
        }),
      });
    },
  );

  // Replace the full member set for a project and its restricted flag.
  // restricted=false → open to everyone (members are cleared). restricted=true
  // with an empty list → only admins can see the project.
  app.put(
    "/api/projects/:projectId/members",
    requireAdmin,
    async (req, res) => {
      const user = req.user as any;
      const projectId = req.params.projectId as string;
      const project = await storage.getProject(projectId, user.workspaceId);
      if (!project) return res.status(404).json({ message: "Not found" });

      const { userIds, restricted } = req.body as {
        userIds?: unknown;
        restricted?: unknown;
      };
      const list = Array.isArray(userIds) ? (userIds as string[]) : [];
      if (list.some((id) => typeof id !== "string"))
        return res.status(400).json({ message: "Invalid userIds." });

      // Only workspace members can be assigned.
      const workspaceUsers = await storage.getUsersByWorkspace(
        user.workspaceId,
      );
      const validIds = new Set(workspaceUsers.map((u) => u.id));
      if (list.some((id) => !validIds.has(id)))
        return res
          .status(400)
          .json({ message: "One or more members are not in this workspace." });

      const isRestricted = restricted === true;
      await storage.setProjectMembers(
        projectId,
        user.workspaceId,
        isRestricted ? list : [],
        isRestricted,
      );

      const rows = await storage.getProjectMembers(projectId);
      res.json({
        restricted: isRestricted,
        members: rows.map((row) => {
          const member = workspaceUsers.find((u) => u.id === row.userId);
          if (!member) return null;
          const { password: _, ...safe } = member;
          return { ...safe, permission: row.permission };
        }),
      });
    },
  );

  // ── Tag Value Routes (Block/Floor/Flat/Amenity vocabulary) ───────────────────

  app.get(
    "/api/projects/:projectId/tag-values",
    requireAuth,
    async (req, res) => {
      const user = req.user as any;
      const category = req.query.category as string | undefined;
      const items = await storage.getTagValues(
        req.params.projectId as string,
        user.workspaceId,
        category,
      );
      res.json(items);
    },
  );

  app.post(
    "/api/projects/:projectId/tag-values",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const parsed = insertTagValueSchema.safeParse({
        ...req.body,
        projectId: req.params.projectId as string,
        workspaceId: user.workspaceId,
      });
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: parsed.error.errors[0].message });
      // Idempotent — reuses an existing case-insensitive match instead of
      // fragmenting the dropdown (see storage.createTagValue).
      const item = await storage.createTagValue(parsed.data);
      res.status(201).json(item);
    },
  );

  // ── Visit Routes (named inspection rounds) ───────────────────────────────────

  app.get("/api/projects/:projectId/visits", requireAuth, async (req, res) => {
    const user = req.user as any;
    const items = await storage.getVisitsByProject(
      req.params.projectId as string,
      user.workspaceId,
    );
    res.json(items);
  });

  // The camera button always targets this — "current" is simply the most
  // recently created visit, no separate flag needed. Returns 404 if the
  // project has no visits yet, so the client knows to prompt "name this visit".
  app.get(
    "/api/projects/:projectId/visits/current",
    requireAuth,
    async (req, res) => {
      const user = req.user as any;
      const current = await storage.getCurrentVisit(
        req.params.projectId as string,
        user.workspaceId,
      );
      if (!current) return res.status(404).json({ message: "No visits yet" });
      res.json(current);
    },
  );

  app.post(
    "/api/projects/:projectId/visits",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const parsed = insertVisitSchema.safeParse({
        ...req.body,
        projectId: req.params.projectId as string,
        workspaceId: user.workspaceId,
      });
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: parsed.error.errors[0].message });
      try {
        const item = await storage.createVisit(parsed.data);
        res.status(201).json(item);
      } catch (err: any) {
        // Unique constraint (project + title, case-insensitive). Drizzle wraps
        // the pg error — the SQLSTATE code lives on the original `cause`.
        const pgCode = err?.code ?? err?.cause?.code;
        if (pgCode === "23505") {
          return res.status(409).json({
            message: `A visit named "${parsed.data.title}" already exists in this project. Use a different name or open that visit instead.`,
          });
        }
        throw err;
      }
    },
  );

  // Switch which visit the camera targets. "Current" is whichever has
  // `active = true`; new captures always land there.
  app.post(
    "/api/projects/:projectId/visits/:visitId/activate",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const updated = await storage.setActiveVisit(
        req.params.projectId as string,
        user.workspaceId,
        req.params.visitId as string,
      );
      if (!updated) return res.status(404).json({ message: "Visit not found" });
      res.json(updated);
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

      // ── Dual-write: also insert into normalized tables ──
      if (
        parsed.data.checklist &&
        Array.isArray(parsed.data.checklist) &&
        parsed.data.checklist.length > 0
      ) {
        await storage.replaceChecklistItems(
          item.id,
          user.workspaceId,
          parsed.data.checklist,
        );
      }
      if (
        parsed.data.dimensions &&
        Array.isArray(parsed.data.dimensions) &&
        parsed.data.dimensions.length > 0
      ) {
        await storage.replaceReportDimensions(
          item.id,
          user.workspaceId,
          parsed.data.dimensions,
        );
      }
      if (
        parsed.data.issues &&
        Array.isArray(parsed.data.issues) &&
        parsed.data.issues.length > 0
      ) {
        await storage.replaceReportIssues(
          item.id,
          user.workspaceId,
          parsed.data.issues,
        );
      }

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

    // ── Read from normalized tables, assemble into report shape ──
    const [normChecklist, normDimensions, normIssues] = await Promise.all([
      storage.getChecklistItems(item.id),
      storage.getReportDimensions(item.id),
      storage.getReportIssues(item.id),
    ]);

    // Fetch issue images for all issues
    const issueIds = normIssues.map((i) => i.id);
    let issueImagesMap: Record<string, any[]> = {};
    if (issueIds.length > 0) {
      const allImages = await db
        .select()
        .from(issueImages)
        .where(inArray(issueImages.issueId, issueIds));
      for (const img of allImages) {
        if (!issueImagesMap[img.issueId]) issueImagesMap[img.issueId] = [];
        issueImagesMap[img.issueId].push(img);
      }
    }

    const report = {
      ...item,
      checklist: normChecklist.map((c) => ({
        id: c.id,
        category: c.category,
        point: c.point,
        status: c.status,
        severity: c.severity,
        triggerOn: c.triggerOn,
        image: c.imageUrl,
        workStatus: c.workStatus,
      })),
      dimensions: normDimensions.map((d) => ({
        id: d.id,
        space: d.space,
        spaceName: d.spaceName,
        length: d.length,
        width: d.width,
        unit: d.unit,
        notes: d.notes,
      })),
      issues: normIssues.map((iss) => ({
        id: iss.id,
        title: iss.title,
        note: iss.note,
        location: iss.location,
        responsibleEngineer: iss.responsibleEngineer,
        severity: iss.severity,
        status: iss.status,
        images: (issueImagesMap[iss.id] ?? []).map((img) => img.gcpUrl),
      })),
    };

    res.json(report);
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

      // ── Dual-write: also sync to normalized tables ──
      if (updates.checklist) {
        await storage.replaceChecklistItems(
          item.id,
          user.workspaceId,
          updates.checklist,
        );
      }
      if (updates.dimensions) {
        await storage.replaceReportDimensions(
          item.id,
          user.workspaceId,
          updates.dimensions,
        );
      }
      if (updates.issues) {
        await storage.replaceReportIssues(
          item.id,
          user.workspaceId,
          updates.issues,
        );
      }

      res.json(item);
    },
  );

  app.delete(
    "/api/reports/:id",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      // Delete normalized tables first (cascade would handle it, but be explicit)
      await storage.deleteReportNormalized(req.params.id as string);
      const ok = await storage.deleteReport(
        req.params.id as string,
        user.workspaceId,
      );
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ success: true });
    },
  );

  // ── Individual Normalized Table PATCH ───────────────────────────────────────
  // These let the client update one checklist item / dimension / issue at a time
  // instead of replacing entire arrays. Also syncs back to JSONB for backward compat.

  app.patch(
    "/api/checklist-items/:id",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const { id, reportId, createdAt, workspaceId, ...updates } = req.body;

      // Upload image to GCP if present
      if (
        updates.image &&
        !isGCPUrl(updates.image) &&
        updates.image.startsWith("data:")
      ) {
        try {
          const gcpUrl = await uploadImageToGCP(
            updates.image,
            `checklist-${req.params.id as string}.jpg`,
          );
          if (gcpUrl) updates.image = gcpUrl;
        } catch (err) {
          console.error("Checklist item image upload error:", err);
        }
      }

      // Map camelCase field names to snake_case DB columns
      const dbUpdates: Record<string, any> = {};
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.severity !== undefined) dbUpdates.severity = updates.severity;
      if (updates.workStatus !== undefined)
        dbUpdates.workStatus = updates.workStatus;
      if (updates.image !== undefined) dbUpdates.imageUrl = updates.image;
      if (updates.triggerOn !== undefined)
        dbUpdates.triggerOn = updates.triggerOn;

      const item = await storage.updateChecklistItem(
        req.params.id as string,
        dbUpdates,
      );
      if (!item) return res.status(404).json({ message: "Not found" });

      // Sync JSONB on report
      await storage.syncReportJsonbFromNormalized(
        item.reportId,
        user.workspaceId,
      );

      res.json(item);
    },
  );

  app.patch(
    "/api/report-dimensions/:id",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const { id, reportId, createdAt, workspaceId, ...updates } = req.body;

      const dbUpdates: Record<string, any> = {};
      if (updates.space !== undefined) dbUpdates.space = updates.space;
      if (updates.spaceName !== undefined)
        dbUpdates.spaceName = updates.spaceName;
      if (updates.length !== undefined) dbUpdates.length = updates.length;
      if (updates.width !== undefined) dbUpdates.width = updates.width;
      if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const [item] = await db
        .update(reportDimensions)
        .set(dbUpdates)
        .where(eq(reportDimensions.id, req.params.id as string))
        .returning();
      if (!item) return res.status(404).json({ message: "Not found" });

      await storage.syncReportJsonbFromNormalized(
        item.reportId,
        user.workspaceId,
      );

      res.json(item);
    },
  );

  app.patch(
    "/api/report-issues/:id",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const {
        id,
        reportId,
        createdAt,
        workspaceId,
        images: _images,
        ...updates
      } = req.body;

      const dbUpdates: Record<string, any> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.note !== undefined) dbUpdates.note = updates.note;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.responsibleEngineer !== undefined)
        dbUpdates.responsibleEngineer = updates.responsibleEngineer;
      if (updates.severity !== undefined) dbUpdates.severity = updates.severity;
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      const [item] = await db
        .update(reportIssues)
        .set(dbUpdates)
        .where(eq(reportIssues.id, req.params.id as string))
        .returning();
      if (!item) return res.status(404).json({ message: "Not found" });

      await storage.syncReportJsonbFromNormalized(
        item.reportId,
        user.workspaceId,
      );

      res.json(item);
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
      const visitId = req.query.visitId as string | undefined;
      const tagValueIds = req.query.tagValueIds
        ? (req.query.tagValueIds as string).split(",").filter(Boolean)
        : undefined;
      const items = await spatialStorage.getCapturesByProject(
        req.params.projectId as string,
        user.workspaceId,
        { visitId, tagValueIds },
      );
      // Hydrate each capture's tags in one query, so the grid/filter UI can
      // show tag chips + power the "Untagged" filter without N+1 requests.
      const tagRows = await spatialStorage.getTagsForCaptures(
        items.map((c) => c.id),
      );
      const tagsByCapture = new Map<string, typeof tagRows>();
      for (const row of tagRows) {
        const list = tagsByCapture.get(row.captureId) ?? [];
        list.push(row);
        tagsByCapture.set(row.captureId, list);
      }
      res.json(
        items.map((c) => ({ ...c, tags: tagsByCapture.get(c.id) ?? [] })),
      );
    },
  );

  app.post(
    "/api/projects/:projectId/captures",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const { tagValueIds, ...captureBody } = req.body;

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

      // Every capture must belong to a visit. If the client didn't pass one
      // explicitly (the common case — camera button just uses whatever's
      // current), resolve it here. If the project truly has no visits yet,
      // fail clearly so the client can prompt "name this visit" and retry —
      // we never silently invent one on the server.
      let visitId = captureBody.visitId;
      if (!visitId) {
        const current = await storage.getCurrentVisit(
          req.params.projectId as string,
          user.workspaceId,
        );
        if (!current)
          return res.status(400).json({
            message: "Create a visit before adding captures.",
            needsVisit: true,
          });
        visitId = current.id;
      }

      const parsed = insertCaptureSchema.safeParse({
        ...captureBody,
        visitId,
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

      if (Array.isArray(tagValueIds) && tagValueIds.length > 0) {
        await spatialStorage.setCaptureTags(
          item.id,
          user.workspaceId,
          tagValueIds,
        );
      }

      res.status(201).json(item);
    },
  );

  // Replaces a capture's tag set (used by the capture edit form).
  app.patch(
    "/api/captures/:id/tags",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const user = req.user as any;
      const { tagValueIds } = req.body;
      if (!Array.isArray(tagValueIds))
        return res
          .status(400)
          .json({ message: "tagValueIds must be an array." });
      const rows = await spatialStorage.setCaptureTags(
        req.params.id as string,
        user.workspaceId,
        tagValueIds,
      );
      res.json(rows);
    },
  );

  // Adds tags to several captures at once without removing existing ones —
  // used by the "Untagged" bulk-apply cleanup action.
  app.post(
    "/api/projects/:projectId/captures/bulk-tag",
    requireWriteAccess,
    requireActiveTrial,
    async (req, res) => {
      const { captureIds, tagValueIds } = req.body;
      const user = req.user as any;
      if (!Array.isArray(captureIds) || !Array.isArray(tagValueIds))
        return res
          .status(400)
          .json({ message: "captureIds and tagValueIds must be arrays." });
      await Promise.all(
        captureIds.map((captureId: string) =>
          spatialStorage.addCaptureTags(
            captureId,
            user.workspaceId,
            tagValueIds,
          ),
        ),
      );
      res.json({ success: true });
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
      const ws = await storage.getWorkspace(user.workspaceId);
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
        taxRate: taxRate ?? ws?.taxRate ?? "18",
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
      const ws = await storage.getWorkspace(user.workspaceId);
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
        taxRate: taxRate ?? ws?.taxRate ?? "18",
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
