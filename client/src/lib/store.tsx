import { useState, createContext, useContext, useEffect, ReactNode } from "react";
import { format } from "date-fns";

// Types
export type Project = {
  id: string;
  title: string;
  description: string;
  clientName: string;
  address: string;
  createdAt: string;
};

export type Report = {
  id: string;
  projectId: string;
  title: string;
  status: "Draft" | "Review" | "Final";
  author: string;
  date: string;
  createdAt: string;
};

export type Issue = {
  id: string;
  reportId: string;
  title: string;
  description: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "Resolved" | "Closed";
  location: string;
  photoUrl?: string;
};

// Mock Data
const MOCK_PROJECTS: Project[] = [
  {
    id: "p1",
    title: "Downtown Office Complex",
    description: "Structural inspection of the main tower and parking garage.",
    clientName: "Metropolis Real Estate",
    address: "101 Main St, Cityville",
    createdAt: new Date().toISOString(),
  },
  {
    id: "p2",
    title: "Riverside Apartments",
    description: "Annual safety audit and fire compliance check.",
    clientName: "Riverside Management",
    address: "450 River Rd, Waterton",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

const MOCK_REPORTS: Report[] = [
  {
    id: "r1",
    projectId: "p1",
    title: "Q1 Structural Assessment",
    status: "Draft",
    author: "Jane Engineer",
    date: format(new Date(), "yyyy-MM-dd"),
    createdAt: new Date().toISOString(),
  },
  {
    id: "r2",
    projectId: "p1",
    title: "Parking Garage Initial Survey",
    status: "Final",
    author: "John Doe",
    date: "2024-01-15",
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
];

const MOCK_ISSUES: Issue[] = [
  {
    id: "i1",
    reportId: "r1",
    title: "Hairline Crack in Column A4",
    description: "Observed vertical hairline crack extending 20cm. No immediate structural threat but requires monitoring.",
    severity: "Low",
    status: "Open",
    location: "Basement Level 2",
    photoUrl: "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&q=80&w=300",
  },
  {
    id: "i2",
    reportId: "r1",
    title: "Water Seepage near Elevator Shaft",
    description: "Active water leak detected after heavy rainfall. Potential membrane failure.",
    severity: "High",
    status: "Open",
    location: "Roof Access",
    photoUrl: "https://images.unsplash.com/photo-1621255530704-58a5996b1b5e?auto=format&fit=crop&q=80&w=300",
  },
];

// Context
type StoreContextType = {
  projects: Project[];
  reports: Report[];
  issues: Issue[];
  addProject: (project: Omit<Project, "id" | "createdAt">) => void;
  addReport: (report: Omit<Report, "id" | "createdAt">) => void;
  addIssue: (issue: Omit<Issue, "id">) => void;
  updateIssue: (issue: Issue) => void;
  deleteIssue: (id: string) => void;
  getProject: (id: string) => Project | undefined;
  getReport: (id: string) => Report | undefined;
  getProjectReports: (projectId: string) => Report[];
  getReportIssues: (reportId: string) => Issue[];
};

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [issues, setIssues] = useState<Issue[]>(MOCK_ISSUES);

  const addProject = (project: Omit<Project, "id" | "createdAt">) => {
    const newProject = {
      ...project,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    setProjects([newProject, ...projects]);
  };

  const addReport = (report: Omit<Report, "id" | "createdAt">) => {
    const newReport = {
      ...report,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    setReports([newReport, ...reports]);
  };

  const addIssue = (issue: Omit<Issue, "id">) => {
    const newIssue = {
      ...issue,
      id: Math.random().toString(36).substr(2, 9),
    };
    setIssues([...issues, newIssue]);
  };

  const updateIssue = (updatedIssue: Issue) => {
    setIssues(issues.map((i) => (i.id === updatedIssue.id ? updatedIssue : i)));
  };

  const deleteIssue = (id: string) => {
    setIssues(issues.filter((i) => i.id !== id));
  };

  const getProject = (id: string) => projects.find((p) => p.id === id);
  const getReport = (id: string) => reports.find((r) => r.id === id);
  const getProjectReports = (projectId: string) => reports.filter((r) => r.projectId === projectId);
  const getReportIssues = (reportId: string) => issues.filter((i) => i.reportId === reportId);

  return (
    <StoreContext.Provider
      value={{
        projects,
        reports,
        issues,
        addProject,
        addReport,
        addIssue,
        updateIssue,
        deleteIssue,
        getProject,
        getReport,
        getProjectReports,
        getReportIssues,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
