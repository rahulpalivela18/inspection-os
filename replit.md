# ReportGen - Replit.md

## Overview

ReportGen is a multi-tenant SaaS web application for construction inspection teams. It allows companies to create private workspaces where they can manage inspection projects, run checklist-based inspections, and generate professional PDF reports.

**Core features:**
- Multi-tenant workspace model (one workspace per company)
- Project management with client information and logos
- Inspection reports with structured checklists (pass/fail/severity ratings)
- Photo evidence capture for failed items
- Space dimension tracking (bedrooms, bathrooms, balconies)
- Printable professional report output
- Configurable checklist templates per workspace

The app is built as a full-stack TypeScript monorepo with a React frontend and an Express backend, sharing types and schema through a `shared/` directory.

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Project Structure

```
/
├── client/          # React frontend (Vite)
│   └── src/
│       ├── pages/   # Route-level page components
│       ├── components/ui/  # shadcn/ui component library
│       ├── hooks/   # Custom React hooks
│       └── lib/     # Auth context, API helpers, store types
├── server/          # Express backend
│   ├── index.ts     # Express app entry
│   ├── routes.ts    # All API route definitions
│   ├── storage.ts   # Database access layer (interface + implementation)
│   ├── db.ts        # Drizzle ORM + pg pool setup
│   └── defaultChecklist.ts  # Default checklist seed data
├── shared/
│   └── schema.ts    # Drizzle schema + Zod validation schemas (shared)
├── script/
│   └── build.ts     # Custom esbuild + Vite build script
└── migrations/      # Drizzle migration outputs
```

### Frontend Architecture

- **Framework:** React 18 with TypeScript, built by Vite
- **Routing:** `wouter` (lightweight client-side router)
- **State/Data Fetching:** TanStack Query (React Query v5) with a custom `queryClient` and typed `api` helper (`client/src/lib/api.ts`)
- **Auth State:** React Context (`AuthProvider` in `client/src/lib/auth.tsx`) — fetches `/api/auth/me` on load, exposes `user`, `workspace`, and auth actions
- **UI Components:** shadcn/ui (Radix UI primitives + Tailwind CSS), "new-york" style
- **Styling:** Tailwind CSS v4 with CSS variables for theming, custom Inter + Outfit fonts
- **Form Handling:** React Hook Form with `@hookform/resolvers`
- **Print/PDF:** `react-to-print` for generating printable report previews

**Page routing pattern:**
- Public routes (`/`, `/login`, `/register`) redirect to dashboard if authenticated
- Protected routes redirect to `/login` if not authenticated
- `ProtectedRoute` and `PublicRoute` wrapper components handle this

### Backend Architecture

- **Framework:** Express.js (Node.js, ESM, TypeScript via `tsx`)
- **Authentication:** Passport.js with `passport-local` strategy, email+password
- **Session Management:** `express-session` backed by PostgreSQL via `connect-pg-simple`
- **Password Hashing:** `bcryptjs`
- **Database ORM:** Drizzle ORM with `drizzle-orm/node-postgres`
- **Validation:** Zod schemas generated from Drizzle schema via `drizzle-zod`

**Request flow:**
1. Sessions checked on every request via Passport
2. `requireAuth` / `requireAdmin` middleware guards protected routes
3. All data access is routed through `storage.ts` (`DatabaseStorage` class implementing `IStorage` interface)
4. Workspace isolation: every data query is scoped by `workspaceId` from the session user

**Multi-tenancy model:**
- Each company registration creates a `workspace` + an `admin` user
- All data (projects, reports, checklist templates) is scoped to `workspaceId`
- Database cascades on workspace deletion

### Data Model (PostgreSQL via Drizzle)

| Table | Key Fields | Notes |
|---|---|---|
| `workspaces` | id, name, logoUrl, address, email | One per company |
| `users` | id, workspaceId, email, password, name, role | Roles: admin, inspector, viewer |
| `checklist_templates` | id, workspaceId, category, point, isRepeatable, spaceType, order | Per-workspace master checklist |
| `projects` | id, workspaceId, title, clientName, address, description, logoUrl | Client projects |
| `reports` | id, projectId, workspaceId, title, status, checklist (jsonb), dimensions (jsonb), spaceCounts (jsonb) | Checklist + dimensions stored as JSONB |

**Important design decision:** Report checklist items and dimension data are stored as JSONB columns on the report row (not as normalized rows). This keeps the report self-contained and simplifies snapshotting at report time.

### Build System

- **Development:** `tsx` runs the Express server directly; Vite middleware is injected for HMR (`server/vite.ts`)
- **Production build:** Custom `script/build.ts` runs Vite for the client, then esbuild for the server, bundling key dependencies (listed in allowlist) while externalizing the rest
- **Output:** `dist/public/` (client static files) + `dist/index.cjs` (server bundle)

---

## External Dependencies

### Database
- **PostgreSQL** — Required. Connection via `DATABASE_URL` environment variable
- **Drizzle ORM** — Schema definition, query builder, migrations (`drizzle-kit push`)
- **connect-pg-simple** — PostgreSQL-backed session store

### Environment Variables Required
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Express session signing secret (falls back to hardcoded default in dev) |

### Key npm Dependencies
| Package | Purpose |
|---|---|
| `express` | HTTP server |
| `passport`, `passport-local` | Authentication |
| `bcryptjs` | Password hashing |
| `drizzle-orm`, `drizzle-kit` | ORM + migrations |
| `pg` | PostgreSQL client |
| `@tanstack/react-query` | Server state management |
| `wouter` | Client-side routing |
| `react-to-print` | Print/PDF report generation |
| `framer-motion` | Landing page animations |
| `date-fns` | Date formatting |
| `zod`, `drizzle-zod` | Schema validation |
| `shadcn/ui` (Radix UI) | Accessible UI components |

### Replit-Specific Integrations
- `@replit/vite-plugin-runtime-error-modal` — Error overlay in dev
- `@replit/vite-plugin-cartographer` — Dev tooling (Replit only, conditionally loaded)
- `@replit/vite-plugin-dev-banner` — Dev banner (Replit only, conditionally loaded)
- `vite-plugin-meta-images.ts` — Custom plugin that updates OG/Twitter image meta tags with the Replit deployment URL at build time