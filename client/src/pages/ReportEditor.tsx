import { useState, useRef, useCallback, useEffect } from "react";
import { Download } from "lucide-react";
import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ReportDimension, ChecklistItem, Issue } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

const openImageInNewTab = (src: string) => {
  window.open(src, "_blank");
};

const buildChecklistWithPreservedResponses = (
  templates: Array<{
    category: string;
    point: string;
    triggerOn?: "yes" | "no";
  }>,
  currentChecklist: ChecklistItem[] = [],
  spaceCounts: { bedrooms: number; bathrooms: number; balconies: number } = {
    bedrooms: 1,
    bathrooms: 1,
    balconies: 1,
  },
): ChecklistItem[] => {
  let runningId = currentChecklist.length + 1;
  const items: ChecklistItem[] = [...currentChecklist];

  const preservedItems = new Map(
    currentChecklist.map((item) => [`${item.category}:::${item.point}`, item]),
  );

  const repeatableCategories = ["bedroom", "bathroom", "balcony"];

  const categorySet = templates.reduce((acc: string[], t) => {
    const c = t.category.toLowerCase().trim();
    const cat = repeatableCategories.includes(c) ? c : t.category;
    if (!acc.includes(cat)) {
      acc.push(cat);
    }
    return acc;
  }, [] as string[]);

  for (const cat of categorySet) {
    const catTemplates = templates.filter((t) => {
      const c = t.category.toLowerCase().trim();
      return repeatableCategories.includes(c) ? c === cat : t.category === cat;
    });

    if (repeatableCategories.includes(cat.toLowerCase())) {
      const count =
        cat === "bedroom"
          ? spaceCounts.bedrooms
          : cat === "bathroom"
            ? spaceCounts.bathrooms
            : spaceCounts.balconies;

      for (let i = 1; i <= count; i++) {
        const spaceLabel = `${cat.charAt(0).toUpperCase() + cat.slice(1)} ${i}`;

        for (const template of catTemplates) {
          const key = `${spaceLabel}:::${template.point}`;
          const existing = preservedItems.get(key);

          if (existing) {
            existing.triggerOn = template.triggerOn ?? "no";
          } else {
            items.push({
              id: `c${runningId++}`,
              category: spaceLabel,
              point: template.point,
              status: null,
              triggerOn: template.triggerOn ?? "no",
            });
          }
        }
      }
    } else {
      for (const template of catTemplates) {
        const key = `${template.category}:::${template.point}`;
        const existing = preservedItems.get(key);

        if (existing) {
          existing.triggerOn = template.triggerOn ?? "no";
        } else {
          items.push({
            id: `c${runningId++}`,
            category: template.category,
            point: template.point,
            status: null,
            triggerOn: template.triggerOn ?? "no",
          });
        }
      }
    }
  }

  return items;
};
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Printer,
  FileText,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Circle,
  X,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  Ruler,
  SquareStack,
  Calculator,
  RefreshCw,
} from "lucide-react";
import { Link, useRoute } from "wouter";
import NotFound from "./not-found";
import { useReactToPrint } from "react-to-print";
import { cn } from "@/lib/utils";
import ReportPreview from "@/pages/ReportPreview";
import IssuesView from "@/components/IssuesView";
import {
  buildDimensionsFromChecklist,
  DEFAULT_DIMENSION_UNIT,
} from "@/lib/defaultChecklist";
import { useAuth } from "@/lib/auth";

export default function ReportEditor() {
  const [match, params] = useRoute("/report/:id");
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team"],
    queryFn: () => api.getTeam(),
  });
  const queryClient = useQueryClient();
  const { workspace } = useAuth();
  const [viewMode, setViewMode] = useState<
    "checklist" | "dimensions" | "issues" | "preview"
  >("checklist");
  const [isSyncConfirmOpen, setIsSyncConfirmOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    note: string;
    location: string;
    responsibleEngineer: string;
    severity: "Low" | "Medium" | "High" | "Critical";
    status: "Open" | "In Progress" | "Resolved";
    images: string[];
  }>({
    title: "",
    note: "",
    location: "",
    responsibleEngineer: "",
    severity: "Low",
    status: "Open",
    images: [],
  });
  const componentRef = useRef<HTMLDivElement>(null);

  const {
    data: report,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["report", params?.id],
    queryFn: () => api.getReport(params!.id),
    enabled: !!params?.id,
  });

  const { data: project } = useQuery({
    queryKey: ["project", report?.projectId],
    queryFn: () => api.getProject(report!.projectId),
    enabled: !!report?.projectId,
  });

  const { data: checklistTemplates = [], refetch: refetchTemplates } = useQuery(
    {
      queryKey: ["checklistTemplates"],
      queryFn: () => api.getChecklistTemplates(),
      staleTime: 0,
    },
  );

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.updateReport(params!.id, data),
    onSuccess: (updated: any) => {
      queryClient.setQueryData(["report", params?.id], updated);
    },
  });

  // Debounced save for frequent updates
  const saveReport = useCallback(
    (data: any) => {
      saveMutation.mutate(data);
    },
    [saveMutation],
  );

  const handleSync = async () => {
    const freshReport = await refetch();
    const freshTemplates = await refetchTemplates();
    const updatedReport = freshReport.data;
    const updatedTemplates = freshTemplates.data ?? [];
    if (!updatedReport) return;

    // Build fresh from templates - removes deleted points
    const freshChecklist = buildChecklistWithPreservedResponses(
      updatedTemplates,
      [],
      updatedReport.spaceCounts ?? { bedrooms: 1, bathrooms: 1, balconies: 1 },
    );

    // But try to preserve responses for items that exist in both
    const preserved = buildChecklistWithPreservedResponses(
      updatedTemplates,
      updatedReport.checklist ?? [],
      updatedReport.spaceCounts ?? { bedrooms: 1, bathrooms: 1, balconies: 1 },
    );

    // Use fresh but preserve status/severity/image from existing
    const syncedChecklist = freshChecklist.map((item) => {
      const existing = preserved.find(
        (p) => p.category === item.category && p.point === item.point,
      );
      if (existing) {
        return {
          ...item,
          status: existing.status,
          severity: existing.severity,
          image: existing.image,
        };
      }
      return item;
    });

    saveReport({ ...updatedReport, checklist: syncedChecklist });
    setIsSyncConfirmOpen(false);
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "Inspection Report",
  });

  const openNewIssueSheet = () => {
    setEditingIssue(null);
    setFormData({
      title: "",
      note: "",
      location: "",
      responsibleEngineer: report.author,
      severity: "Low",
      status: "Open",
      images: [],
    });
    setIsSheetOpen(true);
  };

  const openEditIssueSheet = (issue: Issue) => {
    setEditingIssue(issue);
    setFormData({
      title: issue.title,
      note: issue.note,
      location: issue.location,
      responsibleEngineer: issue.responsibleEngineer,
      severity: issue.severity,
      status: issue.status,
      images: issue.images,
    });
    setIsSheetOpen(true);
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || formData.images.length >= 3) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData({
        ...formData,
        images: [...formData.images, ev.target?.result as string],
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleSaveIssue = () => {
    if (!formData.title || !formData.note || formData.images.length === 0)
      return;

    const currentIssues = report.issues ?? [];
    if (editingIssue) {
      const updatedIssues = currentIssues.map((issue: Issue) =>
        issue.id === editingIssue.id ? { ...issue, ...formData } : issue,
      );
      saveReport({ ...report, issues: updatedIssues });
    } else {
      const newIssue: Issue = {
        ...formData,
        id: `issue-${Date.now()}`,
        reportId: report.id,
        createdAt: new Date().toISOString(),
      };
      saveReport({ ...report, issues: [...currentIssues, newIssue] });
    }
    setIsSheetOpen(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "High":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "Medium":
        return "text-amber-600 bg-amber-50 border-amber-200";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  if (!match || !params) return <NotFound />;
  if (isLoading)
    return (
      <Layout>
        <div className="flex items-center justify-center h-full text-muted-foreground p-8">
          Loading report...
        </div>
      </Layout>
    );
  if (!report) return <NotFound />;

  const dimensionUnit = report.dimensionUnit ?? DEFAULT_DIMENSION_UNIT;
  const dimensionRows = buildDimensionsFromChecklist(
    report.checklist ?? [],
    report.dimensions ?? [],
    dimensionUnit,
  );
  const measuredDimensionRows = dimensionRows.filter(
    (d) => Number(d.length) > 0 && Number(d.width) > 0,
  );

  const getAreaInSquareFeet = (d: ReportDimension) => {
    const l = Number(d.length),
      w = Number(d.width);
    if (!Number.isFinite(l) || !Number.isFinite(w) || l <= 0 || w <= 0)
      return 0;
    return d.unit === "m" ? l * w * 10.7639 : l * w;
  };

  const formatArea = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return "—";
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: value >= 100 ? 0 : 2,
    }).format(value);
  };

  const totalAreaSqFt = measuredDimensionRows.reduce(
    (sum, d) => sum + getAreaInSquareFeet(d),
    0,
  );
  const totalAreaSqM = totalAreaSqFt / 10.7639;

  const updateDimensionField = (
    dimensionId: string,
    field: keyof ReportDimension,
    value: string,
  ) => {
    const next = dimensionRows.map((d) =>
      d.id === dimensionId ? { ...d, [field]: value } : d,
    );
    saveReport({ ...report, dimensions: next });
  };

  const updateDefaultUnit = (nextUnit: "ft" | "m") => {
    const next = dimensionRows.map((d) => ({ ...d, unit: nextUnit }));
    saveReport({ ...report, dimensionUnit: nextUnit, dimensions: next });
  };

  const updateChecklistItem = (
    itemId: string,
    updates: Partial<ChecklistItem>,
  ) => {
    const next = report.checklist?.map((c: ChecklistItem) =>
      c.id === itemId ? { ...c, ...updates } : c,
    );
    saveReport({ ...report, checklist: next });
  };

  const categories: string[] = Array.from(
    new Set((report.checklist ?? []).map((c: ChecklistItem) => c.category)),
  );
  const spaceNameMap = new Map(
    dimensionRows.map((d) => [d.space, d.spaceName || d.space]),
  );

  return (
    <Layout>
      <div className="flex h-screen flex-col bg-background">
        {/* Header Toolbar */}
        <div className="border-b border-border bg-white px-4 md:px-6 py-3 flex flex-col lg:flex-row items-start lg:items-center justify-between shrink-0 gap-4 z-10">
          <div className="flex items-center gap-2 md:gap-4 w-full lg:w-auto">
            <Link href={`/project/${report.projectId}`}>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground shrink-0 h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-base md:text-xl font-bold text-foreground flex items-center gap-2 truncate">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">{report.title}</span>
              </h1>
              <p className="text-[10px] md:text-xs text-muted-foreground">
                {
                  (report.checklist ?? []).filter(
                    (c: ChecklistItem) => c.status === "N",
                  ).length
                }{" "}
                Failures • {report.status}
                {saveMutation.isPending && " • Saving..."}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
            <div className="bg-muted p-1 rounded-lg flex items-center shrink-0 w-full sm:w-auto">
              {(["checklist", "dimensions", "issues", "preview"] as const).map(
                (mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    data-testid={`button-tab-${mode}`}
                    className={cn(
                      "flex-1 sm:flex-none px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-md transition-all capitalize",
                      viewMode === mode
                        ? "bg-white text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    {mode === "issues" && (report.issues?.length ?? 0) > 0 && (
                      <span className="ml-1.5 bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {report.issues.length}
                      </span>
                    )}
                  </button>
                ),
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSyncConfirmOpen(true)}
              className="h-9 md:h-10 text-xs md:text-sm px-3 md:px-4"
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Sync
            </Button>

            <AlertDialog
              open={isSyncConfirmOpen}
              onOpenChange={setIsSyncConfirmOpen}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sync Checklist?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {report.status === "Final" ? (
                      <span className="text-amber-600 font-semibold">
                        ⚠️ This report is Final - syncing may cause data loss!
                      </span>
                    ) : (
                      "This will update your checklist from templates."
                    )}
                    New points will be added, deleted points will be removed,
                    but your existing responses (Yes/No, photos, severity) will
                    be preserved.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSync}>
                    Sync Now
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePrint()}
              className="h-9 md:h-10 text-xs md:text-sm px-3 md:px-4"
            >
              <Printer className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Export PDF
            </Button>
            <Button
              size="sm"
              onClick={openNewIssueSheet}
              disabled={viewMode === "preview"}
              className="h-9 md:h-10 text-xs md:text-sm px-3 md:px-4"
            >
              <Plus className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Add Issue
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-muted/10">
          {viewMode === "preview" ? (
            <div className="h-full overflow-y-auto p-4 md:p-8 bg-slate-200/50 flex justify-center print:p-0 print:bg-white print:overflow-visible">
              <div
                ref={componentRef}
                className="bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] p-0 print:shadow-none print:m-0 print:max-w-none origin-top transition-transform sm:scale-100"
              >
                <div className="sm:hidden text-center py-4 bg-amber-50 text-amber-800 text-xs font-medium border-b border-amber-100 print:hidden">
                  Note: Preview layout is optimized for Desktop/A4 Print.
                </div>
                {project && (
                  <ReportPreview
                    report={report}
                    project={project}
                    companyProfile={{
                      name: workspace?.name || "",
                      logoUrl: workspace?.logoUrl,
                      address: workspace?.address,
                      email: workspace?.email,
                    }}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="h-full p-4 md:p-8 overflow-y-auto">
              <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
                {viewMode === "dimensions" ? (
                  <DimensionsView
                    dimensionUnit={dimensionUnit}
                    dimensionRows={dimensionRows}
                    measuredDimensionRows={measuredDimensionRows}
                    totalAreaSqFt={totalAreaSqFt}
                    totalAreaSqM={totalAreaSqM}
                    formatArea={formatArea}
                    updateDimensionField={updateDimensionField}
                    updateDefaultUnit={updateDefaultUnit}
                  />
                ) : viewMode === "issues" ? (
                  <IssuesView
                    report={report}
                    openEditIssueSheet={openEditIssueSheet}
                    saveReport={saveReport}
                  />
                ) : (
                  <ChecklistView
                    report={report}
                    categories={categories}
                    spaceNameMap={spaceNameMap}
                    updateChecklistItem={updateChecklistItem}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dialogs and Sheets */}
        <AlertDialog
          open={isSyncConfirmOpen}
          onOpenChange={setIsSyncConfirmOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sync Checklist?</AlertDialogTitle>
              <AlertDialogDescription>
                {report.status === "Final" ? (
                  <span className="text-amber-600 font-semibold">
                    ⚠️ This report is Final - syncing may cause data loss!
                  </span>
                ) : (
                  "This will update your checklist from templates."
                )}
                New points will be added, deleted points will be removed, but
                your existing responses (Yes/No, photos, severity) will be
                preserved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSync}>
                Sync Now
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                {editingIssue ? "Edit Issue" : "Add New Issue"}
              </SheetTitle>
              <SheetDescription>
                {editingIssue
                  ? "Update issue details below."
                  : "Fill in the details to report a new issue."}
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="issue-title">Title</Label>
                <Input
                  id="issue-title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Brief issue title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="issue-note">Note</Label>
                <Textarea
                  id="issue-note"
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  placeholder="Describe the issue in detail"
                  className="min-h-25"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="issue-location">Location</Label>
                <Input
                  id="issue-location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Where is this issue located?"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="issue-engineer">Responsible Engineer</Label>
                <Select
                  value={formData.responsibleEngineer}
                  onValueChange={(val: string) =>
                    setFormData({ ...formData, responsibleEngineer: val })
                  }
                >
                  <SelectTrigger id="issue-engineer">
                    <SelectValue placeholder="Select engineer" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member: any) => (
                      <SelectItem key={member.id} value={member.name}>
                        {member.name}
                      </SelectItem>
                    ))}
                    {teamMembers.length === 0 && (
                      <div className="px-2 py-1.5 text-xs text-slate-400">
                        No team members found
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <Input
                  value={formData.responsibleEngineer}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      responsibleEngineer: e.target.value,
                    })
                  }
                  placeholder="Or type custom name"
                  className="mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="issue-severity">Severity</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(val: any) =>
                      setFormData({ ...formData, severity: val })
                    }
                  >
                    <SelectTrigger id="issue-severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="issue-status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val: any) =>
                      setFormData({ ...formData, status: val })
                    }
                  >
                    <SelectTrigger id="issue-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Images (max 3)</Label>
                <input
                  type="file"
                  accept="image/*"
                  id="issue-file-upload"
                  className="hidden"
                  onChange={handleAddImage}
                />
                <Label
                  htmlFor="issue-file-upload"
                  className="inline-flex items-center gap-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors w-full sm:w-auto justify-center"
                >
                  <ImageIcon className="h-3.5 w-3.5" /> Upload Image
                </Label>
                <div className="flex gap-2 flex-wrap mt-2">
                  {formData.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative h-16 w-16 rounded border overflow-hidden group"
                    >
                      <img
                        src={img}
                        alt="Issue"
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-100 md:opacity-0 md:group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveImage(idx);
                          }}
                        >
                          <X className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button variant="outline">Cancel</Button>
              </SheetClose>
              <Button
                onClick={handleSaveIssue}
                disabled={
                  !formData.title ||
                  !formData.note ||
                  formData.images.length === 0
                }
              >
                {editingIssue ? "Update Issue" : "Save Issue"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </Layout>
  );
}

// ─── Checklist View ───────────────────────────────────────────────────────────

function ChecklistView({
  report,
  categories,
  spaceNameMap,
  updateChecklistItem,
}: {
  report: any;
  categories: string[];
  spaceNameMap: Map<string, string>;
  updateChecklistItem: (id: string, updates: Partial<ChecklistItem>) => void;
}) {
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >(
    categories.reduce(
      (acc, cat, idx) => ({ ...acc, [cat]: idx === 0 }),
      {} as Record<string, boolean>,
    ),
  );

  const toggleCategory = (cat: string) =>
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const checklist: ChecklistItem[] = report.checklist ?? [];
  const yes = checklist.filter((c) => c.status === "Y").length;
  const no = checklist.filter((c) => c.status === "N").length;
  const pending = checklist.filter((c) => c.status === null).length;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" /> Inspection Checklist
        </h2>
        <div className="text-sm text-muted-foreground bg-white px-3 py-1 rounded-full border shadow-sm">
          {yes} Yes / {no} No / {pending} Pending
        </div>
      </div>

      <div className="flex gap-4 mb-6 p-4 bg-white rounded-xl border shadow-sm">
        <div className="flex flex-col">
          <span className="text-xs text-slate-500 uppercase font-semibold">
            Total Major
          </span>
          <span className="text-xl font-bold text-red-600">
            {
              checklist.filter(
                (c) => c.status === "N" && c.severity === "MAJOR",
              ).length
            }
          </span>
        </div>
        <div className="w-px bg-slate-200"></div>
        <div className="flex flex-col">
          <span className="text-xs text-slate-500 uppercase font-semibold">
            Total Minor
          </span>
          <span className="text-xl font-bold text-orange-500">
            {
              checklist.filter(
                (c) => c.status === "N" && c.severity === "MINOR",
              ).length
            }
          </span>
        </div>
        <div className="w-px bg-slate-200"></div>
        <div className="flex flex-col">
          <span className="text-xs text-slate-500 uppercase font-semibold">
            Total Cosmetic
          </span>
          <span className="text-xl font-bold text-blue-500">
            {
              checklist.filter(
                (c) => c.status === "N" && c.severity === "COSMETIC",
              ).length
            }
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {categories.map((category, catIdx) => (
          <div
            key={category}
            className={catIdx > 0 ? "border-t border-slate-100" : ""}
          >
            <div
              className="bg-slate-50 px-4 py-3 font-semibold text-sm border-b border-slate-100 text-slate-700 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => toggleCategory(category)}
            >
              <div className="flex items-center gap-2">
                {expandedCategories[category] ? (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                )}
                {spaceNameMap.get(category) || category}
              </div>
              <div className="flex gap-2 text-xs font-normal">
                <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  {
                    checklist.filter(
                      (c) => c.category === category && c.status === "Y",
                    ).length
                  }{" "}
                  Yes
                </span>
                <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  {
                    checklist.filter(
                      (c) => c.category === category && c.status === "N",
                    ).length
                  }{" "}
                  No
                </span>
              </div>
            </div>

            {expandedCategories[category] && (
              <div className="divide-y divide-slate-100">
                {checklist
                  .filter((c) => c.category === category)
                  .map((item) => (
                    <ChecklistItemRow
                      key={item.id}
                      item={item}
                      index={checklist.indexOf(item)}
                      update={updateChecklistItem}
                    />
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function ChecklistItemRow({
  item,
  index,
  update,
}: {
  item: ChecklistItem;
  index: number;
  update: (id: string, updates: Partial<ChecklistItem>) => void;
}) {
  const handleYes = () => {
    if (item.status === "Y")
      update(item.id, { status: null, severity: null, image: undefined });
    else update(item.id, { status: "Y", severity: null, image: undefined });
  };

  const handleNo = () => {
    if (item.status === "N")
      update(item.id, { status: null, severity: null, image: undefined });
    else update(item.id, { status: "N" });
  };

  const isTriggerIssue =
    item.triggerOn === "yes" ? item.status === "Y" : item.status === "N";

  const yesColor =
    item.triggerOn === "yes"
      ? item.status === "Y"
        ? "bg-red-500 text-white"
        : "bg-green-500 text-white"
      : item.status === "Y"
        ? "bg-green-500 text-white"
        : "bg-red-500 text-white";

  const noColor =
    item.triggerOn === "yes"
      ? item.status === "N"
        ? "bg-green-500 text-white"
        : "bg-yellow-500 text-white"
      : item.status === "N"
        ? "bg-red-500 text-white"
        : "bg-yellow-500 text-white";

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      update(item.id, { image: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-3 md:p-4 flex flex-col md:flex-row gap-3 md:gap-4 md:items-center hover:bg-slate-50/50 transition-colors">
      <div className="flex-1 flex items-start gap-3">
        <div className="mt-0.5 w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center shrink-0 text-[10px] text-slate-400 font-medium">
          {index + 1}
        </div>
        <p className="text-sm md:text-base font-medium leading-tight">
          {item.point}
        </p>
      </div>

      <div className="flex flex-col gap-2 pl-8 md:pl-0 shrink-0 w-full sm:w-auto mt-2 md:mt-0">
        <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
          <div className="flex bg-slate-100 rounded-lg p-1 border">
            <button
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-md transition-all duration-200",
                item.status === "Y"
                  ? yesColor
                  : "text-slate-500 hover:text-slate-700",
              )}
              onClick={handleYes}
              data-testid={`button-yes-${item.id}`}
            >
              YES
            </button>
            <button
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-md transition-all duration-200",
                item.status === "N"
                  ? noColor
                  : "text-slate-500 hover:text-slate-700",
              )}
              onClick={handleNo}
              data-testid={`button-no-${item.id}`}
            >
              NO
            </button>
          </div>

          {(item.triggerOn === "yes"
            ? item.status === "Y"
            : item.status === "N") && (
            <select
              className="text-xs border rounded-md px-2 py-1.5 bg-white text-slate-700 w-full sm:w-[110px]"
              value={item.severity || "invalid"}
              onChange={(e) =>
                update(item.id, { severity: (e.target.value || null) as any })
              }
              data-testid={`select-severity-${item.id}`}
            >
              <option value="invalid" disabled>
                Severity
              </option>
              <option value="MAJOR">Major</option>
              <option value="MINOR">Minor</option>
              <option value="COSMETIC">Cosmetic</option>
            </select>
          )}
        </div>

        {(item.triggerOn === "yes"
          ? item.status === "Y"
          : item.status === "N") && (
          <div className="flex justify-start md:justify-end">
            {item.image ? (
              <div className="relative h-10 w-14 sm:h-12 sm:w-16 rounded border overflow-hidden group">
                <img
                  src={item.image}
                  alt="Defect"
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-black/50 opacity-100 md:opacity-0 md:group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                  <button
                    type="button"
                    className="p-1 cursor-pointer"
                    onClick={() => openImageInNewTab(item.image!)}
                  >
                    <Download className="h-4 w-4 text-white" />
                  </button>
                  <button
                    type="button"
                    className="p-1 cursor-pointer"
                    onClick={() => update(item.id, { image: undefined })}
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  id={`check-img-${item.id}`}
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
                <label
                  htmlFor={`check-img-${item.id}`}
                  className="flex items-center justify-center gap-1 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors w-full sm:w-auto"
                >
                  <ImageIcon className="h-3.5 w-3.5" /> Add Photo
                </label>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dimensions View ──────────────────────────────────────────────────────────

function DimensionsView({
  dimensionUnit,
  dimensionRows,
  measuredDimensionRows,
  totalAreaSqFt,
  totalAreaSqM,
  formatArea,
  updateDimensionField,
  updateDefaultUnit,
}: any) {
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const debouncedSaveName = useCallback(
    (id: string, value: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        updateDimensionField(id, "spaceName", value);
      }, 300);
    },
    [updateDimensionField],
  );
  return (
    <>
      <div className="rounded-[28px] border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/50 to-slate-50 p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-600">
              <Ruler className="h-3.5 w-3.5" /> Dimensions tab
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
              Area calculator for every report space
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Enter length and width for each room. We calculate total square
              feet instantly.
            </p>
          </div>
          <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:min-w-[220px]">
            <Label htmlFor="report-default-unit">Default unit</Label>
            <Select
              value={dimensionUnit}
              onValueChange={(value: "ft" | "m") => updateDefaultUnit(value)}
            >
              <SelectTrigger
                id="report-default-unit"
                data-testid="select-dimension-default-unit"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ft">Feet</SelectItem>
                <SelectItem value="m">Meters</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Changing this updates all room inputs.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-indigo-100 bg-white/90 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Total area
              </p>
              <p
                className="text-2xl font-bold text-slate-900"
                data-testid="text-total-area-sqft"
              >
                {formatArea(totalAreaSqFt)} sq ft
              </p>
            </div>
          </div>
        </Card>
        <Card className="rounded-3xl border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <SquareStack className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Metric view
              </p>
              <p
                className="text-2xl font-bold text-slate-900"
                data-testid="text-total-area-sqm"
              >
                {formatArea(totalAreaSqM)} sq m
              </p>
            </div>
          </div>
        </Card>
        <Card className="rounded-3xl border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <Ruler className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Measured spaces
              </p>
              <p
                className="text-2xl font-bold text-slate-900"
                data-testid="text-measured-space-count"
              >
                {measuredDimensionRows.length} / {dimensionRows.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {dimensionRows.map((dimension: ReportDimension) => {
          const areaSqFt = (() => {
            const l = Number(dimension.length),
              w = Number(dimension.width);
            if (!Number.isFinite(l) || !Number.isFinite(w) || l <= 0 || w <= 0)
              return 0;
            return dimension.unit === "m" ? l * w * 10.7639 : l * w;
          })();
          const areaSqM = areaSqFt / 10.7639;

          return (
            <Card
              key={dimension.id}
              className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md md:p-6"
              data-testid={`card-dimension-${dimension.id}`}
            >
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
                      Space
                    </p>
                    <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 transition-all">
                      <input
                        className="flex-1 text-xl font-semibold text-slate-900 bg-transparent outline-none"
                        value={
                          draftNames[dimension.id] ??
                          (dimension.spaceName || dimension.space)
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraftNames((prev) => ({
                            ...prev,
                            [dimension.id]: val,
                          }));
                          debouncedSaveName(dimension.id, val);
                        }}
                        data-testid={`text-dimension-space-${dimension.id}`}
                      />
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 shrink-0 text-slate-300"
                      >
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                    </div>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    Input in {dimension.unit === "ft" ? "ft" : "m"}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Length</Label>
                    <Input
                      inputMode="decimal"
                      placeholder={
                        dimension.unit === "ft" ? "e.g. 12.5" : "e.g. 3.8"
                      }
                      value={dimension.length}
                      onChange={(e) =>
                        updateDimensionField(
                          dimension.id,
                          "length",
                          e.target.value,
                        )
                      }
                      data-testid={`input-dimension-length-${dimension.id}`}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Width</Label>
                    <Input
                      inputMode="decimal"
                      placeholder={
                        dimension.unit === "ft" ? "e.g. 10" : "e.g. 3.2"
                      }
                      value={dimension.width}
                      onChange={(e) =>
                        updateDimensionField(
                          dimension.id,
                          "width",
                          e.target.value,
                        )
                      }
                      data-testid={`input-dimension-width-${dimension.id}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="grid gap-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Optional notes about this measurement"
                      className="min-h-[88px]"
                      value={dimension.notes || ""}
                      onChange={(e) =>
                        updateDimensionField(
                          dimension.id,
                          "notes",
                          e.target.value,
                        )
                      }
                      data-testid={`input-dimension-notes-${dimension.id}`}
                    />
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Calculated area
                    </p>
                    <p
                      className="mt-3 text-2xl font-bold text-slate-900"
                      data-testid={`text-dimension-area-sqft-${dimension.id}`}
                    >
                      {formatArea(areaSqFt)} sq ft
                    </p>
                    <p
                      className="mt-1 text-sm text-slate-500"
                      data-testid={`text-dimension-area-sqm-${dimension.id}`}
                    >
                      {formatArea(areaSqM)} sq m
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
