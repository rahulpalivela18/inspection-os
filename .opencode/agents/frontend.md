---
name: "frontend"
description: "Frontend expert — React components, hooks, data fetching, routing, and state management"
mode: "subagent"
permission:
  read: allow
  edit:
    "*": deny
    "client/src/**": allow
  bash: deny
---

# Frontend Skill

## Stack
- **Framework:** React 19 (functional components + hooks only)
- **Router:** Wouter 3 — lightweight, no React Router; use `useLocation`, `useRoute`, `<Link>`, `<Route>`
- **State:** React Context (global auth/workspace) + TanStack React Query 5 (server state) + `useState` (local UI)
- **Forms:** React Hook Form 7 + Zod validation — always pair with `zodResolver`
- **Build:** Vite 7 + TypeScript strict mode
- **Path alias:** `@/*` resolves to `client/src/*`, `@shared/*` resolves to `shared/*`

## Directory Layout
```
client/src/
  pages/        # Route-level page components
  components/   # Shared/reusable components
  components/ui # shadcn/ui wrappers — DO NOT edit directly
  hooks/        # Custom React hooks
  lib/          # Utilities, clients, context providers
```

## Routing (App.tsx)
- All routes defined in `App.tsx` using Wouter `<Route>`
- `ProtectedRoute` — wraps authenticated pages, redirects to `/login` if no session
- `PublicRoute` — redirects already-authenticated users away from `/login`, `/register`
- Always add new pages to `App.tsx`; no file-based routing

## Data Fetching Pattern
Use React Query for all server data. Never fetch directly in components without `useQuery`/`useMutation`.

```tsx
// Query
const { data, isLoading } = useQuery({
  queryKey: ["/api/projects"],
  queryFn: () => request<Project[]>("/api/projects"),
});

// Mutation
const mutation = useMutation({
  mutationFn: (data: CreateProject) => request<Project>("/api/projects", { method: "POST", body: data }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/projects"] }),
});
```

The `request<T>()` helper lives in `lib/api.ts` — use it for all API calls (handles JSON, credentials, error extraction).

## Auth
- Access current user via `useAuth()` from `lib/auth.tsx`
- Provides: `user`, `workspace`, `isLoading`, `login()`, `register()`, `logout()`, `refreshWorkspace()`
- `AuthProvider` wraps the entire app in `main.tsx` — do not re-wrap

## Form Pattern
```tsx
const form = useForm<FormSchema>({
  resolver: zodResolver(formSchema),
  defaultValues: { ... },
});

// Submit
const onSubmit = (data: FormSchema) => mutation.mutate(data);
```

## Key Libraries
| Purpose | Library |
|---|---|
| Icons | `lucide-react` |
| Animations | `framer-motion` |
| PDF generation | `@react-pdf/renderer` |
| Charts | `recharts` |
| Date formatting | `date-fns` |
| Toast notifications | `sonner` (via `useToast` from `hooks/use-toast.ts`) |
| Carousel | `embla-carousel-react` |
| Theme | `next-themes` |
| Date picker | `react-day-picker` |
| Command palette | `cmdk` |
| Drawer | `vaul` |
| Resizable panels | `react-resizable-panels` |
| Print | `react-to-print` |

## Conventions
- Tailwind for all styling — use `cn()` from `lib/utils.ts` for conditional classes
- Keep page components in `pages/`, extract reusable UI into `components/`
- Mobile detection: `useIsMobile()` hook from `hooks/use-mobile.tsx`
- No default exports for hooks; named exports preferred
- Shared types come from `@shared/schema` — never redefine what's already there
