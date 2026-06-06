# ReportGen Multi-Agent Orchestration Configuration

This document describes how the specialized agents work together to solve problems in the ReportGen codebase.

## Agent Registry

All specialized agents are located in `.opencode/agents/skills/`:

| Agent | Focus | Triggers |
|-------|-------|----------|
| **database.md** | Schema design, ORM optimization, queries, migrations | "schema", "migration", "query", "database", "drizzle", "orm" |
| **backend.md** | Server logic, routes, middleware, request handling | "route", "endpoint", "server", "express", "middleware", "handler" |
| **api.md** | REST design, request/response contracts, documentation | "api", "endpoint design", "contract", "request", "response" |
| **auth.md** | Authentication, authorization, security, sessions | "auth", "security", "jwt", "passport", "role", "permission" |
| **frontend.md** | React components, hooks, state, data fetching | "react", "component", "hook", "page", "state", "fetch" |
| **shared-types.md** | Type definitions, Zod schemas, type safety | "type", "schema", "zod", "interface", "type safety" |
| **ui-components.md** | Component library, shadcn/ui, Tailwind, accessibility | "button", "card", "form", "dialog", "a11y", "component library" |

## Routing Logic

### Problem Type → Agent Routing

**Full-Stack Feature Request**
```
Request: "Add user profile edit page"
Routing: Multi-agent (sequential)
1. api.md → Design /api/users/:id PUT endpoint
2. backend.md → Implement Express route handler
3. database.md → Ensure user schema supports updates
4. shared-types.md → Create/update InsertUser schema
5. frontend.md → Build React form component
6. ui-components.md → Use Button, Card, Form components
```

**Backend-Only Feature**
```
Request: "Implement password reset flow"
Routing:
1. auth.md (PRIMARY) → Security design
2. backend.md → Route implementation
3. database.md → Schema for reset tokens
4. shared-types.md → Types for reset payload
5. api.md → Document endpoints
```

**Database-Heavy Feature**
```
Request: "Optimize checklist queries causing N+1 problems"
Routing:
1. database.md (PRIMARY) → Query analysis
2. shared-types.md → Type optimization
3. backend.md → Implementation in route handler
4. api.md → Response contract updates (if needed)
```

**Frontend-Heavy Feature**
```
Request: "Build project dashboard with filters"
Routing:
1. frontend.md (PRIMARY) → Component architecture
2. ui-components.md → Layout components
3. api.md → API requirements
4. shared-types.md → Type definitions
```

**Security/Auth Feature**
```
Request: "Implement two-factor authentication"
Routing:
1. auth.md (PRIMARY) → Security design
2. backend.md → Session/passport modification
3. shared-types.md → TOTPSecret type
4. frontend.md → Auth form update
5. ui-components.md → Dialog/input components
```

## Agent Collaboration Patterns

### Pattern 1: Validate Schema Before Implementation
```
User: "Create new report field"
Orchestration:
1. shared-types.md → Add field to Report schema & Zod
2. database.md → Add column to reports table
3. backend.md → Update API handler to accept field
4. frontend.md → Add form field in ReportEditor
5. ui-components.md → Use Input/Select component
```

### Pattern 2: Security-First Authorization
```
User: "Only admins should delete projects"
Orchestration:
1. auth.md → Define permission rules
2. database.md → Verify user.role on deletion
3. backend.md → Add requireAdmin middleware
4. api.md → Document role requirement
5. frontend.md → Hide delete button for non-admins
```

### Pattern 3: Type-Safe API Update
```
User: "Add pagination to projects endpoint"
Orchestration:
1. shared-types.md → Create PaginatedProjects type
2. api.md → Design pagination contract
3. backend.md → Implement limit/offset in route
4. database.md → Optimize query (add LIMIT/OFFSET)
5. frontend.md → Use React Query with pagination
```

### Pattern 4: Component Refinement
```
User: "Make forms more accessible"
Orchestration:
1. ui-components.md → Add aria-labels, semantic HTML
2. frontend.md → Update form implementations
3. api.md → Ensure error messages are descriptive
4. backend.md → Return detailed validation errors
```

## Decision Tree for Agent Selection

```
START
  ↓
Is it about TYPE DEFINITIONS or SCHEMAS?
  YES → shared-types.md
  NO ↓
Is it about SECURITY, AUTH, or PERMISSIONS?
  YES → auth.md
  NO ↓
Is it about DATABASE, ORM, QUERIES, or MIGRATIONS?
  YES → database.md
  NO ↓
Is it about REST API CONTRACT, DOCUMENTATION, or DESIGN?
  YES → api.md
  NO ↓
Is it about REACT, PAGES, HOOKS, or STATE MANAGEMENT?
  YES → frontend.md
  NO ↓
Is it about UI COMPONENTS, STYLING, or ACCESSIBILITY?
  YES → ui-components.md
  NO ↓
Is it about SERVER, EXPRESS, ROUTES, or MIDDLEWARE?
  YES → backend.md
  NO ↓
DEFAULT → Escalate to user for clarification
```

## Skill File Structure Reference

Each skill file uses YAML frontmatter for opencode agent registration:

```yaml
---
name: "agent-name"
description: "One-line description"
mode: "subagent"
tools:
  read: true
  edit:
    fileRegex:
      - "^path/to/allowed/files$"
  bash:
    enabled: false
---
```

## Tool Restrictions

### database.md
**Can Edit**: `shared/schema.ts`, `shared/cleanData.ts`, `drizzle.config.ts`, `migrations/`
**Can Read**: All files
**Can Execute**: bash (database operations)

### backend.md
**Can Edit**: `server/`
**Can Read**: All files
**Can Execute**: bash

### api.md
**Can Edit**: `server/routes.ts`, `client/src/lib/api.ts`, `shared/schema.ts`
**Can Read**: All files
**Can Execute**: bash

### auth.md
**Can Edit**: `server/routes.ts`, `server/index.ts`, `client/src/lib/auth.tsx`, `shared/schema.ts`
**Can Read**: All files
**Can Execute**: bash

### frontend.md
**Can Edit**: `client/src/` (all files)
**Can Read**: All files
**Can Execute**: bash

### shared-types.md
**Can Edit**: `shared/schema.ts`, `shared/cleanData.ts`, `tsconfig.json`
**Can Read**: All files
**Can Execute**: bash

### ui-components.md
**Can Edit**: `client/src/components/` (all files)
**Can Read**: All files
**Can Execute**: bash

## Example Multi-Agent Workflow

### Scenario: "Add permission-based project access"

**User Request**:
> "Projects should be accessible only to workspace members with inspector role or higher. Implement from DB to UI."

**Orchestration**:

1. **shared-types.md** (Step 1)
   - Review Project type
   - Verify workspaceId relationship
   - Check User role enum: `["super_admin", "admin", "inspector", "viewer"]`
   - ✓ No changes needed

2. **database.md** (Step 2)
   - Query pattern: `WHERE workspaceId = ? AND role IN (admin, super_admin, inspector)`
   - Add index on `(workspaceId, role)` for performance
   - Implement in storage layer

3. **backend.md** (Step 3)
   - Update `GET /api/projects` handler
   - Add permission check:
     ```typescript
     const user = req.user as any;
     if (!["admin", "inspector", "super_admin"].includes(user.role)) {
       return res.status(403).json({ message: "Forbidden" });
     }
     ```
   - Query via database layer with workspace filter

4. **api.md** (Step 4)
   - Document: "Requires inspector role or higher"
   - Add error code: `403 FORBIDDEN`
   - Update API docs

5. **frontend.md** (Step 5)
   - Update `useQuery` to handle 403 error
   - Redirect to empty state if not permitted
   - Show toast: "You don't have access to projects"

6. **ui-components.md** (Step 6)
   - Use Alert component for permission message
   - Use Button to request access (if applicable)

**Result**: Complete permission-based access across all layers, fully type-safe.

## Handoff Between Agents

When one agent needs to involve another, use this pattern:

```
From: database.md
To: backend.md

"I've added the indexed query:
  db.select().from(projects)
    .where(and(
      eq(projects.workspaceId, workspaceId),
      inArray(projects.status, ["active", "archived"])
    ))

You should call this via storage.getProjectsByWorkspace(workspaceId)
and handle the 403 case for non-members."
```

## Escalation Scenarios

### When to Escalate to User

1. **Ambiguous Requirements**: "Make the dashboard better"
2. **Cross-Cutting Concerns**: Need multiple agents and unclear priority
3. **Product Decisions**: "Should we cache reports?"
4. **Design Disagreement**: Conflicting guidance from multiple agents

### When to Escalate Up**

1. **Database**: Query performance issues → Use EXPLAIN ANALYZE
2. **Frontend**: Complex state management → Consider Redux if needed
3. **API**: Versioning strategy → Discuss with product
4. **Security**: Novel attack surface → Consult security specialist

## Validation Checklist

When a feature is complete across agents, verify:

- [ ] **Type Safety**: No `any` types, all types inferred from schemas
- [ ] **Security**: Auth/permissions checked at API boundary and DB
- [ ] **Testing**: Can manually test each layer (DB → API → UI)
- [ ] **Docs**: API docs in sync with implementation
- [ ] **Performance**: No N+1 queries, pagination for large lists
- [ ] **Accessibility**: Form labels, aria-labels, semantic HTML
- [ ] **Error Handling**: Clear error messages at every layer

## Performance Checkpoints

### Database Layer (database.md)
- [ ] Query uses indexed columns
- [ ] No N+1 problems
- [ ] Pagination for lists > 100 items
- [ ] Connection pooling configured

### Backend Layer (backend.md)
- [ ] Route has auth middleware
- [ ] Request validation with Zod
- [ ] Error messages don't leak PII
- [ ] Proper HTTP status codes

### API Contract (api.md)
- [ ] Response payload < 1MB
- [ ] Consistent error format
- [ ] Documented rate limits
- [ ] CORS configured correctly

### Frontend Layer (frontend.md)
- [ ] React Query caching configured
- [ ] No unnecessary re-renders
- [ ] Code-split page components
- [ ] Loading/error states shown

### UI Components (ui-components.md)
- [ ] Responsive design tested
- [ ] Dark mode compatible
- [ ] Keyboard accessible
- [ ] Touch-friendly on mobile

---

## Quick Reference: File Organization

```
ReportGen/
├── .opencode/
│   ├── AGENTS.md (← YOU ARE HERE)
│   ├── opencode.json
│   └── agents/
│   └── agents/
│       └── skills/
│           ├── api.md
│           ├── auth.md
│           ├── backend.md
│           ├── database.md
│           ├── frontend.md
│           ├── shared-types.md
│           └── ui-components.md
├── shared/
│   ├── schema.ts (SOURCE OF TRUTH for types)
│   └── cleanData.ts
├── server/
│   ├── index.ts
│   ├── routes.ts
│   ├── storage.ts
│   ├── db.ts
│   └── ...
└── client/
    └── src/
        ├── pages/
        ├── components/
        ├── lib/
        └── ...
```

---

**Created**: 2025-06-06
**Version**: 1.0
**Status**: Active (All agents operational)
