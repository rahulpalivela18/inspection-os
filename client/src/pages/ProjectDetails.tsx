import { useState } from "react";
import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  buildDimensionsFromChecklist,
  DEFAULT_DIMENSION_UNIT,
  DEFAULT_SPACE_COUNTS,
  type ReportSpaceCounts,
} from "@/lib/defaultChecklist";
import type { ChecklistItem } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  FileText,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Clock,
  User,
  Settings,
  Trash2,
} from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import NotFound from "./not-found";

const normalizeSpaceCounts = (
  spaceCounts?: Partial<ReportSpaceCounts>,
): ReportSpaceCounts => ({
  bedrooms: Math.max(0, Number(spaceCounts?.bedrooms) || 0),
  bathrooms: Math.max(0, Number(spaceCounts?.bathrooms) || 0),
  balconies: Math.max(0, Number(spaceCounts?.balconies) || 0),
});

const buildChecklistFromTemplates = (
  templates: Array<{
    category: string;
    point: string;
    triggerOn?: "yes" | "no";
  }>,
): ChecklistItem[] => {
  let runningId = 1;
  const items: ChecklistItem[] = [];

  const categories = Array.from(new Set(templates.map((t) => t.category)));

  for (const category of categories) {
    const categoryTemplates = templates.filter((t) => t.category === category);

    for (const template of categoryTemplates) {
      items.push({
        id: `c${runningId++}`,
        category: category,
        point: template.point,
        status: null,
        triggerOn: template.triggerOn ?? "no",
      });
    }
  }

  return items;
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
  const items: ChecklistItem[] = [];

  const preservedItems = new Map(
    currentChecklist.map((item) => [`${item.category}:::${item.point}`, item]),
  );

  const repeatableCategories = ["bedroom", "bathroom", "balcony"];

  const categories = Array.from(
    new Set(
      templates.map((t) => {
        const cat = t.category.toLowerCase().trim();
        return repeatableCategories.includes(cat) ? cat : t.category;
      }),
    ),
  );

  for (const cat of categories) {
    const catTemplates = templates.filter((t) => {
      const tCat = t.category.toLowerCase().trim();
      return repeatableCategories.includes(tCat)
        ? tCat === cat
        : t.category === cat;
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
            items.push({ ...existing, triggerOn: template.triggerOn ?? "no" });
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
          items.push({ ...existing, triggerOn: template.triggerOn ?? "no" });
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

const getStatusColor = (status: string) => {
  switch (status) {
    case "Final":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Review":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
};

export default function ProjectDetails() {
  const [match, params] = useRoute("/project/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isEditReportOpen, setIsEditReportOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<any>(null);
  const [editInspectionTypeInput, setEditInspectionTypeInput] = useState("");
  const [reportToDelete, setReportToDelete] = useState<any>(null);
  const [editProjectData, setEditProjectData] = useState<any>(null);

  const [newReport, setNewReport] = useState({
    title: "",
    author: "",
    inspectionType: ["Home Inspection"],
    status: "Draft" as const,
    date: format(new Date(), "yyyy-MM-dd"),
    spaceCounts: { ...DEFAULT_SPACE_COUNTS },
  });
  const [inspectionTypeInput, setInspectionTypeInput] = useState("");

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ["project", params?.id],
    queryFn: () => api.getProject(params!.id),
    enabled: !!params?.id,
  });

  const { data: checklistTemplates = [] } = useQuery({
    queryKey: ["checklistTemplates"],
    queryFn: () => api.getChecklistTemplates(),
    staleTime: 0,
  });

  const { data: reports = [], isLoading: loadingReports } = useQuery({
    queryKey: ["reports", params?.id],
    queryFn: () => api.getReports(params!.id),
    enabled: !!params?.id,
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data: any) => api.updateProject(params!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsEditProjectOpen(false);
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const createReportMutation = useMutation({
    mutationFn: (data: any) => api.createReport(params!.id, data),
    onSuccess: (report: any) => {
      queryClient.invalidateQueries({ queryKey: ["reports", params?.id] });
      setIsDialogOpen(false);
      setNewReport({
        title: "",
        author: "",
        inspectionType: ["Home Inspection"],
        status: "Draft",
        date: format(new Date(), "yyyy-MM-dd"),
        spaceCounts: { ...DEFAULT_SPACE_COUNTS },
      });
      setInspectionTypeInput("");
      setLocation(`/report/${report.id}`);
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const updateReportMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateReport(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["report"] });
      setIsEditReportOpen(false);
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const deleteReportMutation = useMutation({
    mutationFn: (id: string) => api.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", params?.id] });
      setReportToDelete(null);
      toast({ title: "Report deleted successfully" });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
       variant: "destructive",
       }),
   });

  const updateSpaceCount = (key: keyof ReportSpaceCounts, value: string) => {
    const nextValue = Math.max(0, Number(value) || 0);
    setNewReport({
      ...newReport,
      spaceCounts: { ...newReport.spaceCounts, [key]: nextValue },
    });
  };

  const handleUpdateProject = () => {
    if (!editProjectData?.title) return;
    updateProjectMutation.mutate(editProjectData);
  };

  const openEditReport = (report: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingReport({
      ...report,
      inspectionType: Array.isArray(report.inspectionType)
        ? report.inspectionType
        : [report.inspectionType || "Home Inspection"],
      spaceCounts: normalizeSpaceCounts(
        report.spaceCounts ?? DEFAULT_SPACE_COUNTS,
      ),
    });
    setIsEditReportOpen(true);
  };

  const handleUpdateReport = () => {
    if (!editingReport?.title) return;
    const nextSpaceCounts = normalizeSpaceCounts(
      editingReport.spaceCounts ?? DEFAULT_SPACE_COUNTS,
    );
    const nextChecklist = buildChecklistWithPreservedResponses(
      checklistTemplates,
      editingReport.checklist,
      nextSpaceCounts,
    );
    const nextDimensionUnit =
      editingReport.dimensionUnit ?? DEFAULT_DIMENSION_UNIT;
    const nextDimensions = buildDimensionsFromChecklist(
      nextChecklist,
      editingReport.dimensions ?? [],
      nextDimensionUnit,
    );

    updateReportMutation.mutate({
      id: editingReport.id,
      data: {
        ...editingReport,
        inspectionType:
          Array.isArray(editingReport.inspectionType) ? editingReport.inspectionType : [editingReport.inspectionType || "Home Inspection"],
        spaceCounts: nextSpaceCounts,
        dimensionUnit: nextDimensionUnit,
        dimensions: nextDimensions,
        checklist: nextChecklist,
      },
    });
  };

  const handleCreateReport = () => {
    if (
      !newReport.title ||
      !newReport.author ||
      checklistTemplates.length === 0
    )
      return;
    const checklist = buildChecklistFromTemplates(checklistTemplates);
    createReportMutation.mutate({
      ...newReport,
      checklist,
      dimensionUnit: DEFAULT_DIMENSION_UNIT,
      dimensions: buildDimensionsFromChecklist(
        checklist,
        [],
        DEFAULT_DIMENSION_UNIT,
      ),
    });
  };

  if (!match || !params) return <NotFound />;
  if (loadingProject)
    return (
      <Layout>
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Loading...
        </div>
      </Layout>
    );
  if (!project) return <NotFound />;

  const checklistPreviewCount =
    checklistTemplates.length > 0
      ? buildChecklistFromTemplates(checklistTemplates).length
      : 0;

  return (
    <Layout>
      <div className="flex flex-col min-h-full">
        {/* Project Header */}
        <div className="bg-white border-b border-border py-6 md:py-8 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Projects
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {project.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-muted-foreground text-sm">
                  <span className="flex items-center gap-1 shrink-0">
                    <User className="h-4 w-4" /> {project.clientName}
                  </span>
                  <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="shrink-0">{project.address}</span>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto mt-4 text-primary font-semibold hover:no-underline flex items-center gap-1"
                  onClick={() => {
                    setEditProjectData({
                      title: project.title,
                      clientName: project.clientName,
                      address: project.address,
                      description: project.description,
                    });
                    setIsEditProjectOpen(true);
                  }}
                >
                  <Settings className="w-3.5 h-3.5" /> Edit Project Details
                </Button>
              </div>
              <div className="flex flex-col gap-3 shrink-0">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      className="w-full sm:w-auto shadow-lg shadow-primary/20"
                      data-testid="button-create-report"
                    >
                      <Plus className="mr-2 h-4 w-4" /> New Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-[640px]">
                    <div className="flex max-h-[92vh] flex-col">
                      <DialogHeader className="border-b border-slate-100 px-4 py-4 text-left sm:px-6 sm:py-5">
                        <DialogTitle>Create New Report</DialogTitle>
                        <DialogDescription>
                          Start a new inspection report for this project.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                        <div className="grid gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="title">Report Title</Label>
                            <Input
                              id="title"
                              placeholder="e.g. Initial Site Survey"
                              value={newReport.title}
                              onChange={(e) =>
                                setNewReport({
                                  ...newReport,
                                  title: e.target.value,
                                })
                              }
                              data-testid="input-report-title"
                            />
                          </div>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                              <Label htmlFor="author">Author</Label>
                              <Input
                                id="author"
                                placeholder="Your Name"
                                value={newReport.author}
                                onChange={(e) =>
                                  setNewReport({
                                    ...newReport,
                                    author: e.target.value,
                                  })
                                }
                                data-testid="input-report-author"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="inspection-type">
                                Type of inspection
                              </Label>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {newReport.inspectionType.map(
                                  (type: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-full text-sm"
                                    >
                                      {type}
                                      <button
                                        type="button"
                                        className="text-slate-400 hover:text-red-500"
                                        onClick={() =>
                                          setNewReport({
                                            ...newReport,
                                            inspectionType:
                                              newReport.inspectionType.filter(
                                                (_: any, i: number) =>
                                                  i !== idx,
                                              ),
                                          })
                                        }
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ),
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  id="inspection-type"
                                  placeholder="e.g. Home Inspection"
                                  value={inspectionTypeInput}
                                  onChange={(e) =>
                                    setInspectionTypeInput(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (
                                      e.key === "Enter" &&
                                      inspectionTypeInput.trim()
                                    ) {
                                      e.preventDefault();
                                      setNewReport({
                                        ...newReport,
                                        inspectionType: [
                                          ...newReport.inspectionType,
                                          inspectionTypeInput.trim(),
                                        ],
                                      });
                                      setInspectionTypeInput("");
                                    }
                                  }}
                                  data-testid="input-report-inspection-type"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => {
                                    if (inspectionTypeInput.trim()) {
                                      setNewReport({
                                        ...newReport,
                                        inspectionType: [
                                          ...newReport.inspectionType,
                                          inspectionTypeInput.trim(),
                                        ],
                                      });
                                      setInspectionTypeInput("");
                                    }
                                  }}
                                >
                                  Add
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                              id="date"
                              type="date"
                              value={newReport.date}
                              onChange={(e) =>
                                setNewReport({
                                  ...newReport,
                                  date: e.target.value,
                                })
                              }
                              data-testid="input-report-date"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                              value={newReport.status}
                              onValueChange={(val: any) =>
                                setNewReport({ ...newReport, status: val })
                              }
                            >
                              <SelectTrigger data-testid="select-report-status">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Draft">Draft</SelectItem>
                                <SelectItem value="Review">Review</SelectItem>
                                <SelectItem value="Final">Final</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <p className="text-sm font-semibold text-slate-900">
                                Repeatable spaces
                              </p>
                              <div
                                className="rounded-full bg-slate-100 px-3 py-1 text-center text-xs font-semibold text-slate-600"
                                data-testid="text-generated-points"
                              >
                                {checklistPreviewCount} points total
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                              <div className="grid gap-2">
                                <Label htmlFor="bedrooms">Bedrooms</Label>
                                <Input
                                  id="bedrooms"
                                  type="number"
                                  min="0"
                                  value={newReport.spaceCounts.bedrooms}
                                  onChange={(e) =>
                                    updateSpaceCount("bedrooms", e.target.value)
                                  }
                                  data-testid="input-bedroom-count"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="bathrooms">Bathrooms</Label>
                                <Input
                                  id="bathrooms"
                                  type="number"
                                  min="0"
                                  value={newReport.spaceCounts.bathrooms}
                                  onChange={(e) =>
                                    updateSpaceCount(
                                      "bathrooms",
                                      e.target.value,
                                    )
                                  }
                                  data-testid="input-bathroom-count"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="balconies">Balconies</Label>
                                <Input
                                  id="balconies"
                                  type="number"
                                  min="0"
                                  value={newReport.spaceCounts.balconies}
                                  onChange={(e) =>
                                    updateSpaceCount(
                                      "balconies",
                                      e.target.value,
                                    )
                                  }
                                  data-testid="input-balcony-count"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="border-t border-slate-100 bg-white px-4 py-4 sm:px-6">
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto"
                          onClick={() => setIsDialogOpen(false)}
                          data-testid="button-cancel-report-create"
                        >
                          Cancel
                        </Button>
                        <Button
                          className="w-full sm:w-auto"
                          onClick={handleCreateReport}
                          disabled={createReportMutation.isPending}
                          data-testid="button-confirm-report-create"
                        >
                          {createReportMutation.isPending
                            ? "Creating..."
                            : "Create Report"}
                        </Button>
                      </DialogFooter>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="flex-1 bg-muted/10 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold md:text-xl">
                Reports ({reports.length})
              </h2>
            </div>
            {loadingReports ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading reports...
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center border-2 border-dashed border-border rounded-xl bg-white px-4">
                <div className="bg-muted p-4 rounded-full mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No reports yet</h3>
                <p className="text-muted-foreground max-w-xs mt-2 mb-6">
                  Create your first report to get started.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(true)}
                  data-testid="button-create-first-report"
                >
                  Create Report
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:gap-4">
                {reports.map((report: any) => (
                  <Card
                    key={report.id}
                    className="hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => setLocation(`/report/${report.id}`)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center p-4 md:p-6 gap-3 md:gap-4">
                      <div className="flex-shrink-0 bg-primary/10 p-2 md:p-3 rounded-lg text-primary w-fit">
                        <FileText className="h-5 w-5 md:h-6 md:w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                          <h3 className="text-base md:text-lg font-semibold truncate group-hover:text-primary transition-colors">
                            {report.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(report.status)} border-0 font-medium text-[10px] md:text-xs`}
                          >
                            {report.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] md:text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" /> {report.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {report.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(report.createdAt), "MMM d")}
                          </span>
                        </div>
                        {report.spaceCounts && (
                          <div
                            className="mt-3 flex flex-wrap gap-2"
                            data-testid={`text-space-summary-${report.id}`}
                          >
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                              {report.spaceCounts.bedrooms} Bedroom
                              {report.spaceCounts.bedrooms === 1 ? "" : "s"}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                              {report.spaceCounts.bathrooms} Bathroom
                              {report.spaceCounts.bathrooms === 1 ? "" : "s"}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                              {report.spaceCounts.balconies}{" "}
                              {report.spaceCounts.balconies === 1
                                ? "Balcony"
                                : "Balconies"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex flex-col md:flex-row items-center md:border-l md:pl-4 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full md:w-auto"
                          onClick={(e: any) => openEditReport(report, e)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="group-hover:translate-x-1 transition-transform w-full md:w-auto justify-between md:justify-start"
                          onClick={(e: any) => {
                            e.stopPropagation();
                            setLocation(`/report/${report.id}`);
                          }}
                        >
                          Open <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full md:w-auto text-destructive hover:text-destructive"
                          onClick={(e: any) => {
                            e.stopPropagation();
                            setReportToDelete(report);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Edit Project Dialog */}
        <Dialog open={isEditProjectOpen} onOpenChange={setIsEditProjectOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Project Details</DialogTitle>
              <DialogDescription>
                Update the project and client information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Project Title</Label>
                <Input
                  value={editProjectData?.title || ""}
                  onChange={(e) =>
                    setEditProjectData({
                      ...editProjectData,
                      title: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Client Name</Label>
                <Input
                  value={editProjectData?.clientName || ""}
                  onChange={(e) =>
                    setEditProjectData({
                      ...editProjectData,
                      clientName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Address</Label>
                <Input
                  value={editProjectData?.address || ""}
                  onChange={(e) =>
                    setEditProjectData({
                      ...editProjectData,
                      address: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={editProjectData?.description || ""}
                  onChange={(e) =>
                    setEditProjectData({
                      ...editProjectData,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditProjectOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateProject}
                disabled={updateProjectMutation.isPending}
              >
                {updateProjectMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Report Dialog */}
        {editingReport && (
          <Dialog open={isEditReportOpen} onOpenChange={setIsEditReportOpen}>
            <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-[500px]">
              <div className="flex max-h-[92vh] flex-col">
                <DialogHeader className="px-4 py-4 sm:px-6 sm:py-5">
                  <DialogTitle>Edit Report</DialogTitle>
                  <DialogDescription>
                    Update the report details and space counts.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                <div className="grid gap-2">
                  <Label>Report Title</Label>
                  <Input
                    value={editingReport.title}
                    onChange={(e) =>
                      setEditingReport({
                        ...editingReport,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Author</Label>
                  <Input
                    value={editingReport.author}
                    onChange={(e) =>
                      setEditingReport({
                        ...editingReport,
                        author: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Inspection Type</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(editingReport.inspectionType || []).map(
                      (type: string, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-full text-sm"
                        >
                          {type}
                          <button
                            type="button"
                            className="text-slate-400 hover:text-red-500"
                            onClick={() =>
                              setEditingReport({
                                ...editingReport,
                                inspectionType:
                                  editingReport.inspectionType.filter(
                                    (_: any, i: number) => i !== idx,
                                  ),
                              })
                            }
                          >
                            ×
                          </button>
                        </span>
                      ),
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Dampness Inspection"
                      value={editInspectionTypeInput}
                      onChange={(e) =>
                        setEditInspectionTypeInput(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          editInspectionTypeInput.trim()
                        ) {
                          e.preventDefault();
                          setEditingReport({
                            ...editingReport,
                            inspectionType: [
                              ...(editingReport.inspectionType || []),
                              editInspectionTypeInput.trim(),
                            ],
                          });
                          setEditInspectionTypeInput("");
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (editInspectionTypeInput.trim()) {
                          setEditingReport({
                            ...editingReport,
                            inspectionType: [
                              ...(editingReport.inspectionType || []),
                              editInspectionTypeInput.trim(),
                            ],
                          });
                          setEditInspectionTypeInput("");
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={editingReport.status}
                    onValueChange={(val) =>
                      setEditingReport({ ...editingReport, status: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Review">Review</SelectItem>
                      <SelectItem value="Final">Final</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={editingReport.date}
                    onChange={(e) =>
                      setEditingReport({
                        ...editingReport,
                        date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-sm font-semibold mb-3">
                    Repeatable Spaces
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {(["bedrooms", "bathrooms", "balconies"] as const).map(
                      (key) => (
                        <div key={key} className="grid gap-1">
                          <Label className="capitalize text-xs">{key}</Label>
                          <Input
                            type="number"
                            min="0"
                            value={editingReport.spaceCounts?.[key] ?? 0}
                            onChange={(e) =>
                              setEditingReport({
                                ...editingReport,
                                spaceCounts: {
                                  ...editingReport.spaceCounts,
                                  [key]: Math.max(
                                    0,
                                    Number(e.target.value) || 0,
                                  ),
                                },
                              })
                            }
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter className="border-t px-4 py-4 sm:px-6">
                <Button
                  variant="outline"
                  onClick={() => setIsEditReportOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateReport}
                  disabled={updateReportMutation.isPending}
                >
                  {updateReportMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              </DialogFooter>
            </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Report Dialog */}
        <Dialog
          open={!!reportToDelete}
          onOpenChange={() => setReportToDelete(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Report</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{reportToDelete?.title}"? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReportToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteReportMutation.mutate(reportToDelete?.id)}
                disabled={deleteReportMutation.isPending}
              >
                {deleteReportMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
