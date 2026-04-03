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

export type ChecklistItem = {
  id: string;
  category: string;
  point: string;
  status: "Y" | "N" | null;
  image?: string;
};

export type Report = {
  id: string;
  projectId: string;
  title: string;
  status: "Draft" | "Review" | "Final";
  author: string;
  date: string;
  createdAt: string;
  templateId?: string;
  checklist?: ChecklistItem[];
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

export type IssueTemplate = {
  id: string;
  name: string;
  category: string;
  title: string;
  note: string;
  location: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  isCustom?: boolean;
};

export type ReportTemplate = {
  id: string;
  name: string;
  description: string;
  layout: "standard" | "detailed" | "compact";
  includeLogoOnEveryPage: boolean;
  includeSignature: boolean;
  colorScheme: "indigo" | "blue" | "slate";
  isDefault?: boolean;
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
    checklist: [
      { id: "c1", category: "BALCONY", point: "Flooring (Tiles): Are all the room corners in right angle?", status: "N", image: "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&q=80&w=300" },
      { id: "c2", category: "BALCONY", point: "Flooring (Tiles): Are the Butt filling grooves uniform?", status: "Y" },
      { id: "c3", category: "BALCONY", point: "Flooring (Tiles): Any colour & shade variation observed in floor tiles", status: "Y" },
      { id: "c4", category: "BALCONY", point: "Flooring (Tiles): Hollowness or debonding observed in floor tiles after fixing", status: null },
      { id: "c5", category: "BATHROOM", point: "Flooring (Tiles): Are all the room corners in right angle?", status: null },
      { id: "c6", category: "BATHROOM", point: "Flooring (Tiles): Are the Butt filling grooves uniform?", status: null },
      { id: "c7", category: "BEDROOM", point: "Are all the room corners in right angle?", status: null },
      { id: "c8", category: "BEDROOM", point: "Are the Butt filling grooves uniform?", status: null },
      { id: "c9", category: "Common area", point: "Electrical Work: Are fan regulators working smoothly in all directions", status: null },
      { id: "c10", category: "EXTERNAL AREA", point: "Modular Kitchen & Kitchen Platform: Is the functioning of the modular furniture doors satisfactory", status: null },
    ]
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

let ISSUE_TEMPLATES: IssueTemplate[] = [
  {
    id: "t1",
    name: "Bedroom",
    category: "Living Spaces",
    title: "Bedroom Wall/Ceiling Damage",
    note: "Inspect walls for cracks, water damage, or moisture. Check ceiling for signs of leaks or sagging. Note any paint peeling or discoloration.",
    location: "Master Bedroom",
    severity: "Medium",
  },
  {
    id: "t2",
    name: "Bathroom",
    category: "Wet Areas",
    title: "Bathroom Water Damage/Mold",
    note: "Check for water stains, mold growth, and ventilation issues. Inspect grout and caulking around tubs/showers. Test for dampness in walls.",
    location: "Main Bathroom",
    severity: "High",
  },
  {
    id: "t3",
    name: "Kitchen",
    category: "Living Spaces",
    title: "Kitchen Cabinet/Counter Issue",
    note: "Inspect cabinet integrity, water damage under sink. Check countertop condition and seals. Look for signs of pest damage.",
    location: "Kitchen",
    severity: "Medium",
  },
  {
    id: "t4",
    name: "Foundation",
    category: "Structural",
    title: "Foundation Crack/Settlement",
    note: "Document crack width, length, and pattern. Check for signs of active movement. Note location relative to structural elements.",
    location: "Foundation",
    severity: "High",
  },
  {
    id: "t5",
    name: "Roof",
    category: "Structural",
    title: "Roof Shingle/Leak Issue",
    note: "Inspect for missing, damaged, or curling shingles. Look for signs of water penetration. Check flashing and chimney seals.",
    location: "Roof",
    severity: "High",
  },
  {
    id: "t6",
    name: "HVAC",
    category: "Mechanical",
    title: "HVAC System Maintenance",
    note: "Check unit age and condition. Inspect filter cleanliness. Listen for unusual noises. Test temperature output.",
    location: "Mechanical Room",
    severity: "Low",
  },
  {
    id: "t7",
    name: "Balcony - Flooring",
    category: "Balcony/Exterior",
    title: "Balcony Tile Flooring Defects",
    note: "Check tile corners for right angles. Inspect grout uniformity, color/shade consistency. Look for hollowness, debonding, cracks, or damage. Verify joint uniformity, gaps sealing, slope, offsets, and proper spacer removal.",
    location: "Balcony",
    severity: "Medium",
  },
  {
    id: "t8",
    name: "Balcony - Doors",
    category: "Balcony/Exterior",
    title: "Balcony Door Frame & Hardware Issues",
    note: "Inspect frames/shutters for bends, cracks, warpage. Test smooth operation without noise or gaps. Check for sideways movement when locked. Verify coating integrity, fittings cleanliness, glass condition, frame alignment, sealants, wall damage.",
    location: "Balcony",
    severity: "Medium",
  },
  {
    id: "t9",
    name: "Balcony - Wall Finish",
    category: "Balcony/Exterior",
    title: "Balcony Wall & Ceiling Finish Problems",
    note: "Check for wall/ceiling dampness, uniform paint shade. Look for air bubbles, scratches, peeling, cracks, or damage. Verify surface finish uniformity, electrical cutout sealing, absence of undulations. Inspect corner/edge finish and water leakage signs.",
    location: "Balcony",
    severity: "Medium",
  },
  {
    id: "t10",
    name: "Balcony - Handrails",
    category: "Balcony/Exterior",
    title: "Balcony Handrails & Grills Safety Issues",
    note: "Verify horizontal level alignment (FFL). Check vertical/horizontal junction finish, proper C/C spacing, painting condition. Inspect for corrosion, end caps, fastener caps, rail verticality, anchorage support, and height compliance (1.2m per standards).",
    location: "Balcony",
    severity: "High",
  },
  {
    id: "t11",
    name: "Balcony - Electrical",
    category: "Balcony/Exterior",
    title: "Balcony Electrical & Switches Issues",
    note: "Verify no gaps between switch plate and wall/tile. Check smooth switch operation and functionality. Inspect switch board alignment/level, plate damage/cracks/stains, and proper installation.",
    location: "Balcony",
    severity: "Medium",
  },
  {
    id: "t12",
    name: "Living Room",
    category: "Living Spaces",
    title: "Living Room Interior Condition",
    note: "Inspect walls, ceilings, and flooring. Check for cracks, water damage, stains, or discoloration. Verify window seals, door operation, and trim integrity. Look for signs of pest activity or structural movement.",
    location: "Living Room",
    severity: "Medium",
  },
  {
    id: "t13",
    name: "Windows",
    category: "Exterior/Openings",
    title: "Window Frame & Seal Defects",
    note: "Check frame integrity for cracks, rot, or warping. Inspect weatherstripping, caulking, and sealants. Test smooth operation of windows. Look for condensation, fogging, or glass damage. Verify proper drainage.",
    location: "Windows",
    severity: "Medium",
  },
  {
    id: "t14",
    name: "Siding",
    category: "Exterior",
    title: "Siding Damage & Weathering",
    note: "Inspect siding for cracks, missing pieces, warping, or separation. Check for rot, mold, or pest damage. Verify flashing around penetrations. Look for paint peeling or fading. Assess structural integrity.",
    location: "Exterior",
    severity: "Medium",
  },
  {
    id: "t15",
    name: "Gutters & Downspouts",
    category: "Exterior",
    title: "Gutter System Defects",
    note: "Check for rust, holes, dents, or separation from fascia. Inspect downspout connections and drainage. Look for debris buildup, improper pitch, or sagging. Verify proper water flow away from foundation.",
    location: "Gutters/Roof Edge",
    severity: "Medium",
  },
  {
    id: "t16",
    name: "Plumbing Fixtures",
    category: "Wet Areas",
    title: "Plumbing Fixture & Leak Issues",
    note: "Test all faucets, fixtures, and valves for proper function and leaks. Check for water stains, corrosion, or deterioration. Inspect caulking around tubs/sinks. Look for signs of hidden water damage or mineral deposits.",
    location: "Bathrooms/Kitchen",
    severity: "High",
  },
  {
    id: "t17",
    name: "Electrical Panel",
    category: "Mechanical",
    title: "Electrical Panel Safety Issues",
    note: "Inspect panel for rust, corrosion, or visible damage. Verify proper labeling of breakers. Check for exposed wires or improper connections. Look for signs of overheating, burning, or hazards. Test breaker operation.",
    location: "Electrical Room/Basement",
    severity: "Critical",
  },
  {
    id: "t18",
    name: "HVAC Ductwork",
    category: "Mechanical",
    title: "HVAC Duct & Air Flow Issues",
    note: "Inspect visible ductwork for leaks, holes, or disconnections. Check for proper insulation and support. Look for blockages or restrictions. Verify return air paths are clear. Assess duct routing and dampers.",
    location: "Mechanical/Attic/Crawl Space",
    severity: "Medium",
  },
  {
    id: "t19",
    name: "Basement",
    category: "Structural",
    title: "Basement Moisture & Foundation Issues",
    note: "Check for water intrusion, staining, or efflorescence on foundation. Inspect floor for cracks, settling, or moisture. Look for mold or mildew. Verify proper drainage and sump pump functionality. Check wall condition.",
    location: "Basement",
    severity: "High",
  },
  {
    id: "t20",
    name: "Attic Ventilation",
    category: "Structural",
    title: "Attic Ventilation & Insulation",
    note: "Verify adequate ventilation (intake and exhaust). Check insulation for settling, inadequate coverage, or moisture damage. Look for signs of moisture, mold, or pest activity. Inspect structural supports and rafter integrity.",
    location: "Attic",
    severity: "Medium",
  },
];

// Context
type StoreContextType = {
  projects: Project[];
  reports: Report[];
  issues: Issue[];
  issueTemplates: IssueTemplate[];
  reportTemplates: ReportTemplate[];
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
  getIssueTemplate: (id: string) => IssueTemplate | undefined;
  addIssueTemplate: (template: Omit<IssueTemplate, "id" | "isCustom">) => void;
  updateIssueTemplate: (template: IssueTemplate) => void;
  deleteIssueTemplate: (id: string) => void;
  addReportTemplate: (template: ReportTemplate) => void;
  updateReportTemplate: (id: string, updates: Partial<ReportTemplate>) => void;
  deleteReportTemplate: (id: string) => void;
};

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [issues, setIssues] = useState<Issue[]>(MOCK_ISSUES);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([
    {
      id: "t-default-1",
      name: "Client A Branded",
      description: "Standard layout with blue scheme and signature block",
      layout: "standard",
      includeLogoOnEveryPage: true,
      includeSignature: true,
      colorScheme: "blue"
    }
  ]);

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
  const getIssueTemplate = (id: string) => ISSUE_TEMPLATES.find((t) => t.id === id);

  const addIssueTemplate = (template: Omit<IssueTemplate, "id" | "isCustom">) => {
    const newTemplate: IssueTemplate = {
      ...template,
      id: Math.random().toString(36).substr(2, 9),
      isCustom: true,
    };
    ISSUE_TEMPLATES = [...ISSUE_TEMPLATES, newTemplate];
  };

  const updateIssueTemplate = (template: IssueTemplate) => {
    ISSUE_TEMPLATES = ISSUE_TEMPLATES.map((t) => (t.id === template.id ? template : t));
  };

  const deleteIssueTemplate = (id: string) => {
    ISSUE_TEMPLATES = ISSUE_TEMPLATES.filter((t) => t.id !== id);
  };

  const addReportTemplate = (template: ReportTemplate) => {
    setReportTemplates([...reportTemplates, template]);
  };

  const updateReportTemplate = (id: string, updates: Partial<ReportTemplate>) => {
    setReportTemplates(reportTemplates.map((t) => t.id === id ? {...t, ...updates} : t));
  };

  const deleteReportTemplate = (id: string) => {
    setReportTemplates(reportTemplates.filter((t) => t.id !== id));
  };

  return (
    <StoreContext.Provider
      value={{
        projects,
        reports,
        issues,
        issueTemplates: ISSUE_TEMPLATES,
        reportTemplates,
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
        getIssueTemplate,
        addIssueTemplate,
        updateIssueTemplate,
        deleteIssueTemplate,
        addReportTemplate,
        updateReportTemplate,
        deleteReportTemplate,
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
