export const PUBLIC_PATHS = ["/", "/login", "/register", "/contact"];

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(handler: () => void) {
  onUnauthorized = handler;
}

// Typed API helpers
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 401) {
    onUnauthorized?.();
    const body = await res.json().catch(() => ({ message: "Unauthorized" }));
    throw new Error(body.message || "Unauthorized");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(body.message || "Request failed");
  }
  return res.json();
}

export const api = {
  // Auth
  me: () => request<{ user: any; workspace: any }>("/api/auth/me"),
  login: (email: string, password: string) =>
    request<{ user: any; workspace: any }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (data: {
    name: string;
    email: string;
    password: string;
    companyName: string;
  }) =>
    request<{ user: any; workspace: any }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  logout: () => request("/api/auth/logout", { method: "POST" }),

  // Self-service profile
  updateUser: (data: {
    name?: string;
    phone?: string | null;
    avatarUrl?: string | null;
  }) =>
    request<any>("/api/user", { method: "PATCH", body: JSON.stringify(data) }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<any>("/api/user/password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Workspace
  updateWorkspace: (data: any) =>
    request("/api/workspace", { method: "PATCH", body: JSON.stringify(data) }),

  // Admin (super_admin only)
  getAdminWorkspaces: () => request<any[]>("/api/admin/workspaces"),
  createInvoice: (data: {
    workspaceId: string;
    plan: string;
    amount: string;
  }) =>
    request<any>("/api/admin/invoices", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getAdminInvoices: () => request<any[]>("/api/admin/invoices"),

  // Workspace invoices (authenticated users)
  getWorkspaceInvoices: () => request<any[]>("/api/workspace/invoices"),

  // Checklist templates
  getChecklistTemplates: (type?: string) =>
    request<any[]>(
      type
        ? `/api/checklist-templates?type=${encodeURIComponent(type)}`
        : "/api/checklist-templates",
    ),
  createChecklistTemplate: (data: any) =>
    request<any>("/api/checklist-templates", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateChecklistTemplate: (id: string, data: any) =>
    request<any>(`/api/checklist-templates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteChecklistTemplate: (id: string) =>
    request(`/api/checklist-templates/${id}`, { method: "DELETE" }),

  // Dashboard
  getDashboardStats: () => request<any>("/api/dashboard/stats"),

  // Projects
  getProjects: () => request<any[]>("/api/projects"),
  getProject: (id: string) => request<any>(`/api/projects/${id}`),
  createProject: (data: any) =>
    request<any>("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProject: (id: string, data: any) =>
    request<any>(`/api/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteProject: (id: string) =>
    request(`/api/projects/${id}`, { method: "DELETE" }),

  // Project membership (per-project access, admin only)
  getProjectMembers: (projectId: string) =>
    request<{ restricted: boolean; members: any[] }>(
      `/api/projects/${projectId}/members`,
    ),
  setProjectMembers: (
    projectId: string,
    data: { restricted: boolean; userIds: string[] },
  ) =>
    request<any>(`/api/projects/${projectId}/members`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Team
  getTeam: () => request<any[]>("/api/team"),
  addTeamMember: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) =>
    request<any>("/api/team", { method: "POST", body: JSON.stringify(data) }),
  removeTeamMember: (id: string) =>
    request(`/api/team/${id}`, { method: "DELETE" }),
  getTeamAccess: () =>
    request<
      { id: string; name: string; restricted: boolean; memberIds: string[] }[]
    >("/api/team/access"),
  setMemberProjects: (userId: string, projectIds: string[]) =>
    request<any>(`/api/team/members/${userId}/access`, {
      method: "PUT",
      body: JSON.stringify({ projectIds }),
    }),

  // Reports
  getReports: (projectId: string) =>
    request<any[]>(`/api/projects/${projectId}/reports`),
  getReport: (id: string) => request<any>(`/api/reports/${id}`),
  createReport: (projectId: string, data: any) =>
    request<any>(`/api/projects/${projectId}/reports`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateReport: (id: string, data: any) =>
    request<any>(`/api/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteReport: (id: string) =>
    request(`/api/reports/${id}`, { method: "DELETE" }),

  // Captures
  getCaptures: (
    projectId: string,
    filters?: { visitId?: string; tagValueIds?: string[] },
  ) => {
    const params = new URLSearchParams();
    if (filters?.visitId) params.set("visitId", filters.visitId);
    if (filters?.tagValueIds?.length)
      params.set("tagValueIds", filters.tagValueIds.join(","));
    const qs = params.toString();
    return request<any[]>(
      `/api/projects/${projectId}/captures${qs ? `?${qs}` : ""}`,
    );
  },
  getCapture: (id: string) => request<any>(`/api/captures/${id}`),
  createCapture: (projectId: string, data: any) =>
    request<any>(`/api/projects/${projectId}/captures`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCapture: (id: string, data: any) =>
    request<any>(`/api/captures/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteCapture: (id: string) =>
    request(`/api/captures/${id}`, { method: "DELETE" }),
  setCaptureTags: (id: string, tagValueIds: string[]) =>
    request<any[]>(`/api/captures/${id}/tags`, {
      method: "PATCH",
      body: JSON.stringify({ tagValueIds }),
    }),
  bulkTagCaptures: (
    projectId: string,
    captureIds: string[],
    tagValueIds: string[],
  ) =>
    request(`/api/projects/${projectId}/captures/bulk-tag`, {
      method: "POST",
      body: JSON.stringify({ captureIds, tagValueIds }),
    }),

  // Tag Values (Block/Floor/Flat/Amenity vocabulary)
  getTagValues: (projectId: string, category?: string) =>
    request<any[]>(
      `/api/projects/${projectId}/tag-values${category ? `?category=${category}` : ""}`,
    ),
  createTagValue: (
    projectId: string,
    data: { category: string; value: string },
  ) =>
    request<any>(`/api/projects/${projectId}/tag-values`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getDefaultAmenities: () => request<string[]>("/api/amenities/defaults"),

  // Visits (named inspection rounds)
  getVisits: (projectId: string) =>
    request<any[]>(`/api/projects/${projectId}/visits`),
  getCurrentVisit: (projectId: string) =>
    request<any>(`/api/projects/${projectId}/visits/current`),
  createVisit: (projectId: string, title: string) =>
    request<any>(`/api/projects/${projectId}/visits`, {
      method: "POST",
      body: JSON.stringify({ title }),
    }),
  activateVisit: (projectId: string, visitId: string) =>
    request<any>(`/api/projects/${projectId}/visits/${visitId}/activate`, {
      method: "POST",
    }),

  // Hotspots
  getHotspots: (captureId: string) =>
    request<any[]>(`/api/captures/${captureId}/hotspots`),
  createHotspot: (captureId: string, data: any) =>
    request<any>(`/api/captures/${captureId}/hotspots`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateHotspot: (id: string, data: any) =>
    request<any>(`/api/hotspots/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteHotspot: (id: string) =>
    request(`/api/hotspots/${id}`, { method: "DELETE" }),

  // Progress Logs
  getProgressLogs: (reportId: string) =>
    request<any[]>(`/api/reports/${reportId}/progress-logs`),
  createProgressLog: (reportId: string, data: any) =>
    request<any>(`/api/reports/${reportId}/progress-logs`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProgressLog: (id: string, data: any) =>
    request<any>(`/api/progress-logs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteProgressLog: (id: string) =>
    request(`/api/progress-logs/${id}`, { method: "DELETE" }),

  // Share Links
  getShareLinks: (projectId: string) =>
    request<any[]>(`/api/projects/${projectId}/share-links`),
  createShareLink: (projectId: string, expiresInDays?: number) =>
    request<any>(`/api/projects/${projectId}/share-links`, {
      method: "POST",
      body: JSON.stringify({ expiresInDays }),
    }),
  deleteShareLink: (id: string) =>
    request(`/api/share-links/${id}`, { method: "DELETE" }),
  getSharedProject: (token: string) => request<any>(`/api/shared/${token}`),

  // Quotations
  getAllQuotations: () => request<any[]>("/api/quotations"),
  getQuotations: (projectId: string) =>
    request<any[]>(`/api/projects/${projectId}/quotations`),
  createQuotation: (data: any) =>
    request<any>("/api/quotations", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getQuotation: (id: string) => request<any>(`/api/quotations/${id}`),
  updateQuotation: (id: string, data: any) =>
    request<any>(`/api/quotations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteQuotation: (id: string) =>
    request(`/api/quotations/${id}`, { method: "DELETE" }),

  // Quotation Items
  getQuotationItems: (quotationId: string) =>
    request<any[]>(`/api/quotations/${quotationId}/items`),
  createQuotationItem: (quotationId: string, data: any) =>
    request<any>(`/api/quotations/${quotationId}/items`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateQuotationItem: (id: string, data: any) =>
    request<any>(`/api/quotation-items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteQuotationItem: (id: string) =>
    request(`/api/quotation-items/${id}`, { method: "DELETE" }),

  // Workspace Rates
  getWorkspaceRates: () => request<any[]>("/api/workspace/rates"),
  createWorkspaceRate: (data: any) =>
    request<any>("/api/workspace/rates", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateWorkspaceRate: (id: string, data: any) =>
    request<any>(`/api/workspace/rates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteWorkspaceRate: (id: string) =>
    request(`/api/workspace/rates/${id}`, { method: "DELETE" }),
};
