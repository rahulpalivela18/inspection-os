import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FolderOpen,
  ShieldCheck,
  Settings,
  Menu,
  Building2,
  LockKeyhole,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/dashboard", icon: FolderOpen },
    { name: "Checklist Library", href: "/templates", icon: ShieldCheck },
    { name: "Settings", href: "#", icon: Settings, disabled: true },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 font-heading font-bold text-2xl text-primary">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            R
          </div>
          ReportGen
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-600 font-bold">Private workspace</p>
              <h3 className="text-sm font-semibold text-slate-900 truncate">Metropolis QA Workspace</h3>
              <p className="text-xs text-slate-500 mt-1">Admin access · Company-only checklist library</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href && !item.disabled;

          const content = (
            <div
              onClick={() => {
                if (!item.disabled) setIsMobileOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                item.disabled
                  ? "opacity-50 cursor-not-allowed text-muted-foreground"
                  : "cursor-pointer " +
                      (isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground")
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "")} />
              {item.name}
            </div>
          );

          if (item.disabled) {
            return <div key={item.name}>{content}</div>;
          }

          return (
            <Link key={item.name} href={item.href}>
              {content}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              <LockKeyhole className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900">Confidential by design</h4>
              <p className="text-xs text-slate-500 mt-1">Templates stay inside one company workspace and are copied into each report.</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="w-full mt-4" data-testid="button-open-checklist-library">
            Checklist access policy
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <div className="hidden md:block w-72 h-full shrink-0">
        <SidebarContent />
      </div>

      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-background border-b border-sidebar-border px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-2 font-heading font-bold text-lg text-primary">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-[10px]">
            R
          </div>
          ReportGen
        </div>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" data-testid="button-open-mobile-menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[300px] border-r-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 h-full overflow-y-auto w-full pt-14 md:pt-0">
        <div className="min-h-full">{children}</div>
      </main>
    </div>
  );
}
