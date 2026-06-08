---
name: ui-components
description: Use when working on UI components, shadcn/ui, Tailwind CSS styling, accessibility, responsive design, or component library usage.
---

# UI Components Skill

## Stack
- **Component library:** shadcn/ui (Radix UI primitives + Tailwind CSS)
- **Styling:** Tailwind CSS 4 + `tailwind-merge`
- **Icons:** Lucide React
- **Animations:** Framer Motion 12
- **Config:** `components.json` — uses "new-york" style, CSS variables for theming

## Component Locations
```
client/src/components/ui/   # 55 shadcn/ui components — DO NOT edit
client/src/components/      # App-specific shared components
client/src/pages/           # Full page components
```

## Using shadcn/ui Components
All components are pre-installed in `components/ui/`. Import directly:
```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
```

## `cn()` Utility
Always use for conditional/merged class names:
```tsx
import { cn } from "@/lib/utils";

<div className={cn("base-classes", isActive && "active-class", className)} />
```

## Toast Notifications
```tsx
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

toast({ title: "Success", description: "Project created." });
toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
```

Alternatively use Sonner directly (both are available):
```tsx
import { toast } from "sonner";
toast.success("Saved!");
toast.error("Failed to save");
```

## Icons (Lucide React)
```tsx
import { Plus, Trash2, Edit, ChevronDown, AlertCircle, CheckCircle } from "lucide-react";

<Plus className="h-4 w-4" />
```

Standard sizes: `h-4 w-4` (small), `h-5 w-5` (default), `h-6 w-6` (large).

## Layout Component
The main app shell is `components/Layout.tsx` — wraps authenticated pages with sidebar + header. Use it automatically via `ProtectedRoute` in `App.tsx`.

## Animations (Framer Motion)
```tsx
import { motion, AnimatePresence } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
>
  ...
</motion.div>
```

## Mobile Responsiveness
```tsx
import { useIsMobile } from "@/hooks/use-mobile";

const isMobile = useIsMobile();  // breakpoint: < 768px
```

Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) for layout shifts.

## PDF Components
For report PDF generation use `@react-pdf/renderer`:
- See `components/ReceiptPDF.tsx` for an existing example
- Use `<PDFDownloadLink>` for download buttons, `<PDFViewer>` for inline preview

## Common Patterns

### Loading State
```tsx
if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-full" /></div>;
```

### Empty State
```tsx
{items.length === 0 && (
  <div className="text-center py-12 text-muted-foreground">No items yet.</div>
)}
```

### Confirm Delete Dialog
Use `Dialog` + a state flag:
```tsx
const [deleteId, setDeleteId] = useState<number | null>(null);
// Trigger: <Button variant="destructive" onClick={() => setDeleteId(item.id)}>Delete</Button>
// Dialog: open={deleteId !== null}, onConfirm={() => deleteMutation.mutate(deleteId!)}
```

## Tailwind Conventions
- Use CSS variables (defined in `index.css`) for colors: `bg-background`, `text-foreground`, `border`, `text-muted-foreground`, `bg-primary`, etc.
- Avoid hardcoded hex/rgb values — prefer Tailwind semantic tokens
- Dark mode supported via `dark:` prefix (CSS variable approach)
