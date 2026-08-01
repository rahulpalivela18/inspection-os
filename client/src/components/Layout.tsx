import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  Menu,
  Building2,
  CheckSquare,
  Shield,
  CreditCard,
  Clock,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import Footer from "@/components/Footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, workspace, trial } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/dashboard", icon: FolderOpen },
    { name: "Quotations", href: "/quotations", icon: FileText },
    ...(user?.role !== "viewer"
      ? [{ name: "Settings", href: "/settings", icon: Settings }]
      : []),
    ...(user?.role !== "viewer"
      ? [{ name: "Subscription", href: "/billing", icon: CreditCard }]
      : []),
    ...(user?.role === "super_admin"
      ? [{ name: "Admin", href: "/admin", icon: Shield }]
      : []),
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="space-y-4 p-6">
        <Link href="/" className="flex items-center gap-2 font-heading text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            IO
          </div>
          Inspection OS
        </Link>
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-900">
                {workspace?.name || "Loading..."}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                One default checklist is added automatically to every new
                report.
              </p>
            </div>
          </div>
        </div>

        {trial?.isTrial && (
          <div
            className={cn(
              "rounded-2xl border p-3 shadow-sm",
              trial.isExpired
                ? "border-red-200 bg-red-50"
                : trial.daysRemaining !== null && trial.daysRemaining <= 3
                  ? "border-amber-200 bg-amber-50"
                  : "border-indigo-200 bg-indigo-50"
            )}
          >
            <div className="flex items-center gap-2">
              {trial.isExpired ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              ) : (
                <Clock className="h-4 w-4 shrink-0 text-indigo-600" />
              )}
              <div className="min-w-0">
                {trial.isExpired ? (
                  <p className="text-xs font-semibold text-red-800">
                    Trial expired
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-indigo-800">
                    Free trial — {trial.daysRemaining} day{trial.daysRemaining === 1 ? "" : "s"} left
                  </p>
                )}
                {trial.limits && trial.usage && !trial.isExpired && (
                  <div className="mt-1.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Projects</span>
                      <span className={cn("font-medium", trial.usage.projects >= trial.limits.maxProjects ? "text-amber-600" : "text-slate-700")}>
                        {trial.usage.projects}/{trial.limits.maxProjects}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Captures</span>
                      <span className={cn("font-medium", trial.usage.captures >= trial.limits.maxCaptures ? "text-amber-600" : "text-slate-700")}>
                        {trial.usage.captures}/{trial.limits.maxCaptures}
                      </span>
                    </div>
                  </div>
                )}
                {trial.isExpired && (
                  <Link href="/contact">
                    <span className="mt-1 inline-block text-[11px] font-medium text-red-700 underline cursor-pointer hover:text-red-900">
                      Contact us to upgrade
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-1 px-4 py-4">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
                )}
              >
                <item.icon
                  className={cn("h-4 w-4", isActive ? "text-primary" : "")}
                />
                {item.name}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              <CheckSquare className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Simple report flow
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                Create a report, open it, and start filling the checklist right
                away.
              </p>
            </div>
          </div>
          <Link href="/templates">
            <Button
              size="sm"
              variant="outline"
              className="mt-4 w-full"
              data-testid="button-view-default-checklist"
            >
              View default checklist
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background">
      <div className="hidden h-full w-72 shrink-0 md:block">
        <SidebarContent />
      </div>

      <div className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-sidebar-border bg-background px-4 md:hidden">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold text-primary hover:text-primary/80 transition-colors">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-[10px] text-primary-foreground">
            IO
          </div>
          Inspection OS
        </Link>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              data-testid="button-open-mobile-menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] border-r-0 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      <main className="h-full w-full flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="min-h-full">{children}</div>
        <Footer />
      </main>
    </div>
  );
}
