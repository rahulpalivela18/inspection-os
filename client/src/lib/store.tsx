// Shared types used across the app
export type ChecklistItem = {
  id: string;
  category: string;
  point: string;
  status: "Y" | "N" | null;
  severity?: "MAJOR" | "MINOR" | "COSMETIC" | null;
  image?: string;
  /**
   * Determines which answer triggers this point as an issue in the PDF.
   * 'no' (default): Show in PDF if answered 'No'.
   * 'yes': Show in PDF if answered 'Yes'.
   */
  triggerOn?: "yes" | "no";
};

export type DimensionUnit = "ft" | "m";

export type ReportDimension = {
  id: string;
  space: string;
  spaceName?: string;
  length: string;
  width: string;
  unit: DimensionUnit;
  notes?: string;
};

export type Project = {
  id: string;
  workspaceId: string;
  title: string;
  clientName: string;
  address?: string;
  description?: string;
  logoUrl?: string;
  createdAt: string;
};

export type Issue = {
  id: string;
  reportId: string;
  title: string;
  note: string;
  location: string;
  responsibleEngineer: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "In Progress" | "Resolved";
  images: string[];
  createdAt?: string;
};

export type Report = {
  id: string;
  projectId: string;
  workspaceId: string;
  title: string;
  status: "Draft" | "Review" | "Final";
  author: string;
  date: string;
  createdAt: string;
  inspectionType?: string[];
  dimensionUnit?: DimensionUnit;
  spaceCounts?: { bedrooms: number; bathrooms: number; balconies: number };
  dimensions?: ReportDimension[];
  checklist?: ChecklistItem[];
  issues?: Issue[];
};
