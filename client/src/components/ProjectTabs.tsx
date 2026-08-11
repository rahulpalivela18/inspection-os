import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Camera, FileText, Users } from "lucide-react";

interface ProjectTabsProps {
  projectId: string;
  active: "captures" | "reports" | "team";
  admin?: boolean;
}

export function ProjectTabs({
  projectId,
  active,
  admin = false,
}: ProjectTabsProps) {
  const tabs = [
    {
      key: "captures" as const,
      label: "Captures",
      icon: Camera,
      href: `/project/${projectId}/captures`,
    },
    {
      key: "reports" as const,
      label: "Reports",
      icon: FileText,
      href: `/project/${projectId}/reports`,
    },
    ...(admin
      ? [
          {
            key: "team" as const,
            label: "Access",
            icon: Users,
            href: `/project/${projectId}/team`,
          },
        ]
      : []),
  ];

  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-1">
      {tabs.map((tab) => (
        <Link key={tab.key} href={tab.href}>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-semibold transition-colors cursor-pointer select-none",
              active === tab.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
