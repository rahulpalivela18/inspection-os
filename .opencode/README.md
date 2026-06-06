# ReportGen Multi-Agent System

**Domain-specific AI agents** for each layer of your ReportGen codebase. Each agent is an expert in their domain and coordinates with others for full-stack solutions.

---

## 🤖 7 Specialized Agents

All agents located in `agents/skills/`:

| Agent | Domain | Focus | Best For |
|-------|--------|-------|----------|
| 🗄️ **database.md** | Database | Drizzle ORM, PostgreSQL, migrations, queries | Schema design, N+1 fixes, performance |
| 🖥️ **backend.md** | Backend | Express routes, middleware, business logic | Route handlers, request handling, middleware |
| 🔗 **api.md** | REST API | Endpoint design, contracts, documentation | API design, request/response shapes |
| 🔐 **auth.md** | Security | Authentication, authorization, RBAC | Auth flows, permissions, security |
| ⚛️ **frontend.md** | Frontend | React, hooks, state, data fetching | Components, pages, state patterns |
| 🎨 **ui-components.md** | UI | shadcn/ui, Tailwind, accessibility | Component library, styling, a11y |
| 📝 **shared-types.md** | Types | Zod schemas, type definitions | Type safety, validation schemas |

---

## 🚀 Quick Start

### Ask Domain-Specific Questions

```
"Add a new report status field from database to UI"
→ AI automatically routes through all relevant agents
```

### Direct a Specific Agent

```
"@database.md - Optimize slow projects query"
→ Uses that agent's deep expertise
```

### Request End-to-End Implementation

```
"End-to-end: Add workspace logo upload with preview"
→ Agents coordinate automatically
```

---

## 📊 Routing Logic

### Decision Tree

```
START → Type definitions? → shared-types.md
     → Security/auth? → auth.md
     → Database/ORM? → database.md
     → REST API? → api.md
     → React/hooks? → frontend.md
     → Components? → ui-components.md
     → Express/routes? → backend.md
```

### Multi-Agent Workflow Examples

**End-to-End Feature:**
```
Request: "Add permission-based project access"
→ api.md → auth.md → backend.md → database.md → 
  shared-types.md → frontend.md → ui-components.md
```

**Performance Optimization:**
```
Request: "Dashboard is slow"
→ database.md → backend.md → frontend.md → api.md
```

**Security Fix:**
```
Request: "Only workspace members can view projects"
→ auth.md → backend.md → database.md → frontend.md
```

---

## 📁 File Organization

```
.opencode/
├── README.md                  ← This file (master guide)
├── agents/
│   └── skills/
│       ├── api.md
│       ├── auth.md
│       ├── backend.md
│       ├── database.md
│       ├── frontend.md
│       ├── shared-types.md
│       └── ui-components.md
```

---

## 🔐 Tool Restrictions

Each agent has **restricted edit access**:

| Agent | Can Edit | Cannot Edit |
|-------|----------|-------------|
| database.md | schema.ts, migrations/ | server/, client/ |
| backend.md | server/ | client/, migrations/ |
| api.md | routes.ts, api.ts | client/components/ |
| auth.md | routes.ts, auth.tsx | client/pages/, migrations/ |
| frontend.md | client/src/ | server/, migrations/ |
| ui-components.md | client/src/components/ | server/, pages/ |
| shared-types.md | schema.ts | server/, client/ |

---

## ✅ Validation Checklist

- [ ] Types in `shared/schema.ts`
- [ ] Database schema with migrations
- [ ] API endpoints documented
- [ ] Authentication/authorization checks
- [ ] Frontend components built
- [ ] UI uses shadcn/ui
- [ ] Error handling at all layers
- [ ] No N+1 queries
- [ ] Accessible (WCAG AA)
- [ ] Performance conscious (pagination, caching)

---

## 📚 Stack Reference

- **Frontend:** React 19 + TanStack Query + React Hook Form + shadcn/ui + Tailwind 4
- **Backend:** Express 5 + Passport.js (local) + express-session
- **Database:** PostgreSQL + Drizzle ORM + drizzle-zod
- **Language:** TypeScript (strict) throughout
- **Build:** Vite 7 (client) + tsx (server)

---

## 🎉 You're Ready!

Your 7 specialized agents are ready. Pick a feature and ask the AI!

**Start with:** `agents/skills/` → Pick an agent → Read the expertise section
