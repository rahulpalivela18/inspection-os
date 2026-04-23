// Shared types used across the app
export type ChecklistItem = {
  id: string;
  category: string;
  point: string;
  status: "Y" | "N" | null;
  failOn?: "Y" | "N";
  severity?: "MAJOR" | "MINOR" | "COSMETIC" | null;
  image?: string;
};

export type DimensionUnit = "ft" | "m";

export type ReportDimension = {
  id: string;
  space: string;
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

export type Report = {
  id: string;
  projectId: string;
  workspaceId: string;
  title: string;
  status: "Draft" | "Review" | "Final";
  author: string;
  date: string;
  createdAt: string;
  inspectionType?: string;
  dimensionUnit?: DimensionUnit;
  spaceCounts?: { bedrooms: number; bathrooms: number; balconies: number };
  dimensions?: ReportDimension[];
  checklist?: ChecklistItem[];
};
