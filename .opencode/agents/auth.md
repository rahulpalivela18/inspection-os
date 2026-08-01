---
name: "auth"
description: "Security expert — Passport.js authentication, RBAC, session management, and authorization flows"
mode: "subagent"
permission:
  read: allow
  edit:
    "*": deny
    "server/routes.ts": allow
    "server/index.ts": allow
    "client/src/lib/auth.tsx": allow
    "shared/schema.ts": allow
  bash: deny
---

# Auth Skill

## Overview
Session-based authentication using Passport.js local strategy. No JWTs. Sessions stored in PostgreSQL via `connect-pg-simple`.

## Server-Side

### Session Setup (routes.ts, inside registerRoutes)
```ts
app.use(session({
  store: new PgSession({ pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || "dev-only-insecure-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
}));
app.use(passport.initialize());
app.use(passport.session());
```

### Passport Strategy (routes.ts)
Local strategy verifies `email` + `password` (bcrypt compare), then calls `done(null, user)`.

Serialize: stores `user.id` in session.
Deserialize: fetches full user from DB by id on each request.

### TypeScript: req.user type
Extend Express's `Request` in a `.d.ts` file if needed:
```ts
declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}
```

### Auth Middleware
```ts
requireAuth        // req.isAuthenticated() check
requireAdmin       // isAuthenticated + role in ["admin", "super_admin"]
requireSuperAdmin  // isAuthenticated + role === "super_admin"
```

### Registration Flow
`POST /api/auth/register`:
1. Hash password with `bcryptjs`
2. Create `workspace` record
3. Create `user` record with `role: "admin"`, linked to workspace
4. Return workspace + user (no password field)

### Login Flow
`POST /api/auth/login`:
1. Passport local strategy validates credentials
2. `req.logIn()` serializes user into session
3. Returns `{ user, workspace }`

### Logout
`POST /api/auth/logout`:
```ts
req.logout(() => res.json({ success: true }));
```

## Client-Side (lib/auth.tsx)

### useAuth Hook
```ts
const { user, workspace, isLoading, login, register, logout, refreshWorkspace } = useAuth();
```

- `user` — current `User` object or `null`
- `workspace` — current `Workspace` object or `null`
- `isLoading` — true while initial `/api/auth/me` is in flight
- `login(email, password)` — POST + updates context
- `register(data)` — POST + updates context
- `logout()` — POST + clears context, redirects to `/`
- `refreshWorkspace()` — re-fetches workspace (use after workspace settings update)

### Route Protection (App.tsx)
```tsx
// Requires authenticated session
<ProtectedRoute path="/dashboard" component={Dashboard} />

// Redirects authenticated users away
<PublicRoute path="/login" component={Login} />
```

## Role-Based Access Control (RBAC)

| Role | Permissions |
|---|---|
| `super_admin` | All routes including `/api/admin/*`; manages all workspaces |
| `admin` | All workspace routes; manage team, workspace settings, templates |
| `inspector` | Create/edit reports and projects |
| `viewer` | Read-only access to reports and projects |

Check role in UI to conditionally show buttons/actions:
```tsx
const { user } = useAuth();
if (user?.role === "admin" || user?.role === "super_admin") { /* show admin UI */ }
```

## Security Notes
- Passwords: never returned in any API response (destructured out before sending)
- Sessions: `httpOnly` cookies, `secure` in production
- All resource access scoped to `req.user!.workspaceId` — cross-workspace access is impossible by design
- bcrypt salt rounds default (10) — do not lower this
