import { useState } from "react";
import Layout from "@/components/Layout";
import { useStore, type ChecklistItem } from "@/lib/store";
import { buildChecklistFromCounts, DEFAULT_SPACE_COUNTS, type ReportSpaceCounts } from "@/lib/defaultChecklist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, Calendar, ArrowLeft, ArrowRight, Clock, User, Settings } from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import { format } from "date-fns";
import NotFound from "./not-found";

const normalizeSpaceCounts = (spaceCounts?: Partial<ReportSpaceCounts>): ReportSpaceCounts => ({
  bedrooms: Math.max(0, Number(spaceCounts?.bedrooms) || 0),
  bathrooms: Math.max(0, Number(spaceCounts?.bathrooms) || 0),
  balconies: Math.max(0, Number(spaceCounts?.balconies) || 0),
});

const buildChecklistWithPreservedResponses = (
  currentChecklist: ChecklistItem[] = [],
  spaceCounts: ReportSpaceCounts
): ChecklistItem[] => {
  const preservedItems = new Map(
    currentChecklist.map((item) => [`${item.category}:::${item.point}`, item])
  );

  return buildChecklistFromCounts(spaceCounts).map((item) => {
    const existingItem = preservedItems.get(`${item.category}:::${item.point}`);

    if (!existingItem) {
      return item;
    }

    return {
      ...item,
      status: existingItem.status,
      severity: existingItem.status === "N" ? existingItem.severity ?? null : null,
      image: existingItem.status === "N" ? existingItem.image : undefined,
    };
  });
};

export default function ProjectDetails() {
  const [match, params] = useRoute("/project/:id");
  const [, setLocation] = useLocation();
  const { getProject, getProjectReports, addReport, updateProject, updateReport } = useStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isEditReportOpen, setIsEditReportOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<any>(null);
  const [logoPreview, setLogoPreview] = useState("");

  const [editProjectData, setEditProjectData] = useState<any>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setEditProjectData({...editProjectData, logoUrl: base64});
      setLogoPreview(base64);
    };
    reader.readAsDataURL(file);
  };
  const [newReport, setNewReport] = useState({
    title: "",
    author: "",
    status: "Draft" as const,
    date: format(new Date(), "yyyy-MM-dd"),
    spaceCounts: DEFAULT_SPACE_COUNTS,
  });
  const [hasInitializedEditData, setHasInitializedEditData] = useState(false);

  if (!match || !params) return <NotFound />;

  const project = getProject(params.id);
  
  if (!project) return <NotFound />;

  // Initializing edit state if not already set
  if (!hasInitializedEditData && project) {
    setEditProjectData({
      title: project.title,
      clientName: project.clientName,
      address: project.address,
      description: project.description,
      logoUrl: project.logoUrl || "",
    });
    setHasInitializedEditData(true);
  }

  const reports = getProjectReports(project.id);
  const checklistPreviewCount = buildChecklistFromCounts(newReport.spaceCounts).length;

  const updateSpaceCount = (key: keyof typeof newReport.spaceCounts, value: string) => {
    const nextValue = Math.max(0, Number(value) || 0);
    setNewReport({
      ...newReport,
      spaceCounts: {
        ...newReport.spaceCounts,
        [key]: nextValue,
      },
    });
  };

  const handleUpdateProject = () => {
    if (!editProjectData.title) return;
    updateProject({ ...project, ...editProjectData });
    setIsEditProjectOpen(false);
  };

  const openEditReport = (report: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingReport({
      ...report,
      spaceCounts: normalizeSpaceCounts(report.spaceCounts ?? DEFAULT_SPACE_COUNTS),
    });
    setIsEditReportOpen(true);
  };

  const handleUpdateReport = () => {
    if (!editingReport.title) return;

    const nextSpaceCounts = normalizeSpaceCounts(editingReport.spaceCounts ?? DEFAULT_SPACE_COUNTS);
    const nextChecklist = buildChecklistWithPreservedResponses(editingReport.checklist, nextSpaceCounts);

    updateReport({
      ...editingReport,
      spaceCounts: nextSpaceCounts,
      checklist: nextChecklist,
    });
    setIsEditReportOpen(false);
  };

  const handleCreateReport = () => {
    if (!newReport.title || !newReport.author) return;
    
    const createdReport = addReport({
      ...newReport,
      projectId: project.id,
    });
    setIsDialogOpen(false);
    setNewReport({ 
      title: "", 
      author: "", 
      status: "Draft", 
      date: format(new Date(), "yyyy-MM-dd"),
      spaceCounts: { ...DEFAULT_SPACE_COUNTS },
    });
    setLocation(`/report/${createdReport.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Final": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Review": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-full">
        {/* Project Header */}
        <div className="bg-white border-b border-border py-6 md:py-8 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Projects
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{project.title}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-muted-foreground text-sm">
                  <span className="flex items-center gap-1 shrink-0"><User className="h-4 w-4" /> {project.clientName}</span>
                  <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="shrink-0">{project.address}</span>
                </div>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 h-auto mt-4 text-primary font-semibold hover:no-underline flex items-center gap-1"
                  onClick={() => setIsEditProjectOpen(true)}
                >
                  <Settings className="w-3.5 h-3.5" /> Edit Project Details
                </Button>
              </div>
              
              <div className="flex flex-col gap-3 shrink-0">
                {project.logoUrl && (
                  <div className="w-16 h-16 rounded-lg border bg-white p-2 self-end hidden sm:flex items-center justify-center overflow-hidden">
                    <img src={project.logoUrl} alt="Client Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/20" data-testid="button-create-report">
                      <Plus className="mr-2 h-4 w-4" /> New Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-[640px]">
                    <div className="flex max-h-[92vh] flex-col">
                      <DialogHeader className="border-b border-slate-100 px-4 py-4 text-left sm:px-6 sm:py-5">
                        <DialogTitle>Create New Report</DialogTitle>
                        <DialogDescription>Start a new inspection report for this project. The default checklist will be added automatically.</DialogDescription>
                      </DialogHeader>

                      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-slate-600">
                          <p className="font-semibold text-slate-900">What happens next</p>
                          <p className="mt-1">Choose how many repeatable spaces this report has. We will create Bedroom 1, Bedroom 2, Bathroom 1 and similar sections automatically, each with the correct checklist points.</p>
                        </div>

                        <div className="grid gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="title">Report Title</Label>
                            <Input 
                              id="title" 
                              placeholder="e.g. Initial Site Survey" 
                              value={newReport.title}
                              onChange={(e) => setNewReport({...newReport, title: e.target.value})}
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
                                onChange={(e) => setNewReport({...newReport, author: e.target.value})}
                                data-testid="input-report-author"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="date">Date</Label>
                              <Input 
                                id="date" 
                                type="date"
                                value={newReport.date}
                                onChange={(e) => setNewReport({...newReport, date: e.target.value})}
                                data-testid="input-report-date"
                              />
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select 
                              value={newReport.status} 
                              onValueChange={(val: any) => setNewReport({...newReport, status: val})}
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
                              <div>
                                <p className="text-sm font-semibold text-slate-900">Repeatable spaces</p>
                                <p className="mt-1 text-xs text-slate-500">We will duplicate the right checklist points for each room instance.</p>
                              </div>
                              <div className="rounded-full bg-slate-100 px-3 py-1 text-center text-xs font-semibold text-slate-600" data-testid="text-generated-points">
                                {checklistPreviewCount} checklist points
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
                                  onChange={(e) => updateSpaceCount("bedrooms", e.target.value)}
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
                                  onChange={(e) => updateSpaceCount("bathrooms", e.target.value)}
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
                                  onChange={(e) => updateSpaceCount("balconies", e.target.value)}
                                  data-testid="input-balcony-count"
                                />
                              </div>
                            </div>
                            <p className="mt-3 text-xs text-slate-500">Common Area and External Area are still added once automatically.</p>
                          </div>
                        </div>
                      </div>

                      <DialogFooter className="border-t border-slate-100 bg-white px-4 py-4 sm:px-6">
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel-report-create">Cancel</Button>
                        <Button className="w-full sm:w-auto" onClick={handleCreateReport} data-testid="button-confirm-report-create">Create Report</Button>
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
              <h2 className="text-lg font-semibold md:text-xl">Reports ({reports.length})</h2>
            </div>

            <div className="mb-6 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-600">Simple flow</p>
              <h3 className="mt-2 text-base font-semibold text-slate-900">Every new report already includes the default checklist</h3>
              <p className="mt-1 text-sm text-slate-500">There is no separate checklist selection step for the inspector. Create the report and start filling it immediately.</p>
            </div>

            {reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center border-2 border-dashed border-border rounded-xl bg-white px-4">
                <div className="bg-muted p-4 rounded-full mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No reports yet</h3>
                <p className="text-muted-foreground max-w-xs mt-2 mb-6">
                  Create your first report and the default checklist will be added automatically.
                </p>
                <Button variant="outline" onClick={() => setIsDialogOpen(true)} data-testid="button-create-first-report">Create Report</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:gap-4">
                {reports.map((report) => (
                  <Card 
                    key={report.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => setLocation(`/report/${report.id}`)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center p-4 md:p-6 gap-3 md:gap-4">
                      <div className="flex-shrink-0 bg-primary/10 p-2 md:p-3 rounded-lg text-primary w-fit md:w-auto">
                        <FileText className="h-5 w-5 md:h-6 md:w-6" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                          <h3 className="text-base md:text-lg font-semibold truncate group-hover:text-primary transition-colors">
                            {report.title}
                          </h3>
                          <Badge variant="outline" className={`${getStatusColor(report.status)} border-0 font-medium text-[10px] md:text-xs`}>
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
                            <Clock className="h-3 w-3" /> <span className="hidden xs:inline">Created </span>{format(new Date(report.createdAt), "MMM d")}
                          </span>
                        </div>
                        {report.spaceCounts && (
                          <div className="mt-3 flex flex-wrap gap-2" data-testid={`text-space-summary-${report.id}`}>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                              {report.spaceCounts.bedrooms} Bedroom{report.spaceCounts.bedrooms === 1 ? "" : "s"}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                              {report.spaceCounts.bathrooms} Bathroom{report.spaceCounts.bathrooms === 1 ? "" : "s"}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                              {report.spaceCounts.balconies} Balcony{report.spaceCounts.balconies === 1 ? "" : "ies"}
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
                        <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform w-full md:w-auto justify-between md:justify-start">
                          Open <ArrowRight className="ml-2 h-4 w-4" />
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
              <DialogDescription>Update the project and client information.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Project Title</Label>
                <Input 
                  id="edit-title" 
                  value={editProjectData?.title || ""}
                  onChange={(e) => setEditProjectData({...editProjectData, title: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-client">Client Name</Label>
                <Input 
                  id="edit-client" 
                  value={editProjectData?.clientName || ""}
                  onChange={(e) => setEditProjectData({...editProjectData, clientName: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input 
                  id="edit-address" 
                  value={editProjectData?.address || ""}
                  onChange={(e) => setEditProjectData({...editProjectData, address: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-logo">Logo</Label>
                <Input 
                  id="edit-logo" 
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
                {(logoPreview || editProjectData?.logoUrl) && (
                  <div className="w-full h-20 border rounded bg-slate-100 p-2 flex items-center justify-center overflow-hidden">
                    <img src={logoPreview || editProjectData?.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea 
                  id="edit-description" 
                  value={editProjectData?.description || ""}
                  onChange={(e) => setEditProjectData({...editProjectData, description: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditProjectOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateProject}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Report Dialog */}
        <Dialog open={isEditReportOpen} onOpenChange={setIsEditReportOpen}>
          <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-[640px]">
            <div className="flex max-h-[92vh] flex-col">
              <DialogHeader className="border-b border-slate-100 px-4 py-4 text-left sm:px-6 sm:py-5">
                <DialogTitle>Edit Report Details</DialogTitle>
                <DialogDescription>
                  You can update room counts later. Existing checklist answers stay matched wherever the room and point still exist.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-report-title">Report Title</Label>
                    <Input 
                      id="edit-report-title" 
                      value={editingReport?.title || ""}
                      onChange={(e) => setEditingReport({...editingReport, title: e.target.value})}
                      data-testid="input-edit-report-title"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-report-author">Author</Label>
                      <Input 
                        id="edit-report-author" 
                        value={editingReport?.author || ""}
                        onChange={(e) => setEditingReport({...editingReport, author: e.target.value})}
                        data-testid="input-edit-report-author"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-report-status">Status</Label>
                      <Select 
                        value={editingReport?.status || "Draft"} 
                        onValueChange={(val: any) => setEditingReport({...editingReport, status: val})}
                      >
                        <SelectTrigger data-testid="select-edit-report-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Review">Review</SelectItem>
                          <SelectItem value="Final">Final</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Repeatable spaces</p>
                      <p className="mt-1 text-xs text-slate-500">Add or reduce rooms even after report creation. The checklist updates when you save.</p>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-center text-xs font-semibold text-slate-600" data-testid="text-edit-generated-points">
                      {buildChecklistFromCounts(editingReport?.spaceCounts ?? DEFAULT_SPACE_COUNTS).length} checklist points
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-report-bedrooms">Bedrooms</Label>
                      <Input
                        id="edit-report-bedrooms"
                        type="number"
                        min="0"
                        value={editingReport?.spaceCounts?.bedrooms ?? 0}
                        onChange={(e) => setEditingReport({
                          ...editingReport,
                          spaceCounts: {
                            ...normalizeSpaceCounts(editingReport?.spaceCounts),
                            bedrooms: Math.max(0, Number(e.target.value) || 0),
                          },
                        })}
                        data-testid="input-edit-bedroom-count"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-report-bathrooms">Bathrooms</Label>
                      <Input
                        id="edit-report-bathrooms"
                        type="number"
                        min="0"
                        value={editingReport?.spaceCounts?.bathrooms ?? 0}
                        onChange={(e) => setEditingReport({
                          ...editingReport,
                          spaceCounts: {
                            ...normalizeSpaceCounts(editingReport?.spaceCounts),
                            bathrooms: Math.max(0, Number(e.target.value) || 0),
                          },
                        })}
                        data-testid="input-edit-bathroom-count"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-report-balconies">Balconies</Label>
                      <Input
                        id="edit-report-balconies"
                        type="number"
                        min="0"
                        value={editingReport?.spaceCounts?.balconies ?? 0}
                        onChange={(e) => setEditingReport({
                          ...editingReport,
                          spaceCounts: {
                            ...normalizeSpaceCounts(editingReport?.spaceCounts),
                            balconies: Math.max(0, Number(e.target.value) || 0),
                          },
                        })}
                        data-testid="input-edit-balcony-count"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="border-t border-slate-100 bg-white px-4 py-4 sm:px-6">
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsEditReportOpen(false)} data-testid="button-cancel-report-edit">Cancel</Button>
                <Button className="w-full sm:w-auto" onClick={handleUpdateReport} data-testid="button-save-report-edit">Save Changes</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
