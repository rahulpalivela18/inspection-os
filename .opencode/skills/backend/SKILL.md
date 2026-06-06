---
name: backend
description: Use when working on Express routes, server middleware, business logic, request handlers, or backend implementation.
---

# Backend Skill

## Stack
- **Framework:** Express 5
- **Language:** TypeScript (strict), executed via `tsx`
- **Auth:** Passport.js local strategy + express-session (PostgreSQL session store via `connect-pg-simple`)
- **Password hashing:** `bcryptjs`
- **File upload:** Multer
- **Cloud storage:** Google Cloud Storage (`@google-cloud/storage`)
- **WebSockets:** `ws`

## Directory Layout
```
server/
  index.ts          # App entry — middleware stack, session, Passport init
  routes.ts         # All API route handlers (~500 lines)
  storage.ts        # Database operations via IStorage interface
  db.ts             # Drizzle ORM + PostgreSQL pool initialization
  gcp-storage.ts    # GCP file upload helpers
  static.ts         # Static file serving (production)
  vite.ts           # Vite dev server integration
```

## Middleware Stack
**index.ts (global middleware):**
1. `express.json({ limit: "10mb" })` — captures `rawBody` on request
2. `express.urlencoded({ extended: false, limit: "10mb" })`
3. Request logger (logs method, path, status, duration)

**routes.ts (inside registerRoutes):**
4. Session middleware (PostgreSQL-backed session store via connect-pg-simple)
5. `passport.initialize()` + `passport.session()`

All API routes are registered after the passport middleware.

## Route File Conventions (routes.ts)
- All routes prefixed `/api/`
- Authenticate with `requireAuth` middleware before accessing protected resources
- Role guards: `requireAdmin` (admin | super_admin), `requireSuperAdmin` (super_admin only)
- Validate all inputs with Zod `.safeParse()` — reject early on parse failure

```ts
app.post("/api/resource", requireAuth, async (req, res) => {
  const result = createResourceSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "Invalid input" });

  const data = await storage.createResource(req.user!.workspaceId, result.data);
  res.json(data);
});
```

## Auth Middleware
```ts
function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
  next();
}

function requireAdmin(req, res, next) {
  if (!["admin", "super_admin"].includes(req.user?.role)) return res.status(403).json({ message: "Forbidden" });
  next();
}
```

## Storage Abstraction (storage.ts)
- `IStorage` interface defines all 30+ DB operations
- `DatabaseStorage` implements it using Drizzle ORM
- All methods are workspace-scoped — always pass `workspaceId` from `req.user!.workspaceId`
- Never write raw Drizzle queries in routes — go through storage methods

## Error Responses
Always respond with `{ message: string }` for errors:
```ts
res.status(400).json({ message: "Descriptive error here" });
```

## GCP Storage (gcp-storage.ts)
- `uploadImageToGCP(base64: string, filename: string): Promise<string | null>` — returns public URL or null
- Filenames: `timestamp-random-hex-sanitizedName.ext`
- Cache-control: `public, max-age=31536000` for uploaded assets
- Use `isGCPUrl(url)` to validate before saving

## Session / User on Request
```ts
req.user   // PassportJS user object (from DB, set during deserialization)
req.user!.workspaceId  // Always scope queries to this
req.user!.role         // "super_admin" | "admin" | "inspector" | "viewer"
```

## Conventions
- Passwords are never returned in JSON responses (destructure out `password` field)
- Workspace scoping is enforced both in routes AND in storage layer
- Use `req.user!` (non-null assertion) after `requireAuth` middleware — it's safe
- 500 errors: catch async errors and return `res.status(500).json({ message: "..." })`
