import { useState, createContext, useContext, ReactNode } from "react";
import { format } from "date-fns";

// Types
export type Project = {
  id: string;
  title: string;
  description: string;
  clientName: string;
  address: string;
  logoUrl?: string;
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
  note: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "Resolved" | "Closed";
  location: string;
  responsibleEngineer: string;
  images: string[];
};

// Mock Data
const MOCK_PROJECTS: Project[] = [
  {
    id: "p1",
    title: "Downtown Office Complex",
    description: "Structural inspection of the main tower and parking garage.",
    clientName: "Metropolis Real Estate",
    address: "101 Main St, Cityville",
    logoUrl: "https://images.unsplash.com/photo-1599305090748-3663ae578a49?auto=format&fit=crop&q=80&w=100",
    createdAt: new Date().toISOString(),
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
];

const MOCK_ISSUES: Issue[] = [
  {
    id: "i1",
    reportId: "r1",
    title: "Hairline Crack in Column A4",
    note: "Observed vertical hairline crack extending 20cm. Requires monitoring.",
    severity: "Low",
    status: "Open",
    location: "Basement Level 2",
    responsibleEngineer: "Jane Engineer",
    images: ["https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&q=80&w=300"],
  },
];

// Context
type StoreContextType = {
  projects: Project[];
  reports: Report[];
  issues: Issue[];
  addProject: (project: Omit<Project, "id" | "createdAt">) => void;
  updateProject: (project: Project) => void;
  addReport: (report: Omit<Report, "id" | "createdAt">) => void;
  updateReport: (report: Report) => void;
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

  const updateProject = (updatedProject: Project) => {
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const addReport = (report: Omit<Report, "id" | "createdAt">) => {
    const newReport = {
      ...report,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    setReports([newReport, ...reports]);
  };

  const updateReport = (updatedReport: Report) => {
    setReports(reports.map(r => r.id === updatedReport.id ? updatedReport : r));
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
        updateProject,
        addReport,
        updateReport,
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
