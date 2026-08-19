export const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  super_admin: {
    label: "Super Admin",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  admin: { label: "Admin", color: "bg-red-100 text-red-700 border-red-200" },
  inspector: {
    label: "Inspector",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  viewer: {
    label: "Viewer",
    color: "bg-slate-100 text-slate-600 border-slate-200",
  },
};
