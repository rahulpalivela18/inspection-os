import { useState, useRef } from "react";
import Layout from "@/components/Layout";
import { useStore, Issue } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Plus, Printer, FileText, Trash2, 
  AlertTriangle, CheckCircle2, Circle, Camera, MapPin, User, X, Zap
} from "lucide-react";
import { Link, useRoute } from "wouter";
import NotFound from "./not-found";
import { useReactToPrint } from "react-to-print";
import { cn } from "@/lib/utils";
import ReportPreview from "@/pages/ReportPreview";

export default function ReportEditor() {
  const [match, params] = useRoute("/report/:id");
  const { getReport, getReportIssues, addIssue, deleteIssue, updateIssue, getProject, issueTemplates, getIssueTemplate } = useStore();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "Inspection Report",
  });

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    note: string;
    location: string;
    responsibleEngineer: string;
    severity: "Low" | "Medium" | "High" | "Critical";
    status: "Open" | "Resolved" | "Closed";
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

  const [imageUrl, setImageUrl] = useState("");

  if (!match || !params) return <NotFound />;
  const report = getReport(params.id);
  if (!report) return <NotFound />;
  const project = getProject(report.projectId);
  const issues = getReportIssues(report.id);

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
    setImageUrl("");
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
    setImageUrl("");
    setIsSheetOpen(true);
  };

  const handleAddImage = () => {
    if (!imageUrl || formData.images.length >= 3) return;
    setFormData({ ...formData, images: [...formData.images, imageUrl] });
    setImageUrl("");
  };

  const handleRemoveImage = (index: number) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
  };

  const applyTemplate = (templateId: string) => {
    const template = getIssueTemplate(templateId);
    if (template) {
      setFormData({
        ...formData,
        title: template.title,
        note: template.note,
        location: template.location,
        severity: template.severity,
      });
    }
  };

  const handleSaveIssue = () => {
    if (!formData.title || !formData.note || formData.images.length === 0) return;

    if (editingIssue) {
      updateIssue({
        ...editingIssue,
        ...formData,
      });
    } else {
      addIssue({
        ...formData,
        reportId: report.id,
      });
    }
    setIsSheetOpen(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "text-red-600 bg-red-50 border-red-200";
      case "High": return "text-orange-600 bg-orange-50 border-orange-200";
      case "Medium": return "text-amber-600 bg-amber-50 border-amber-200";
      default: return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  return (
    <Layout>
      <div className="flex h-screen flex-col bg-background">
        {/* Header Toolbar */}
        <div className="border-b border-border bg-white px-4 md:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between shrink-0 gap-3 z-10">
          <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
            <Link href={`/project/${report.projectId}`}>
              <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0 h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-base md:text-xl font-bold text-foreground flex items-center gap-2 truncate">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                {report.title}
              </h1>
              <p className="text-[10px] md:text-xs text-muted-foreground">{issues.length} Issues • {report.status}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="bg-muted p-1 rounded-lg flex items-center shrink-0">
              <button 
                onClick={() => setViewMode("edit")}
                className={cn(
                  "px-2 md:px-3 py-1 text-[10px] md:text-sm font-medium rounded-md transition-all",
                  viewMode === "edit" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Editor
              </button>
              <button 
                onClick={() => setViewMode("preview")}
                className={cn(
                  "px-2 md:px-3 py-1 text-[10px] md:text-sm font-medium rounded-md transition-all",
                  viewMode === "preview" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Preview
              </button>
            </div>
            
            <div className="flex items-center gap-1 md:gap-2">
              <Button variant="outline" size="sm" onClick={() => handlePrint()} className="h-8 md:h-10 text-[10px] md:text-sm px-2 md:px-3">
                <Printer className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" /> <span className="hidden xs:inline md:inline">Export</span><span className="xs:hidden">PDF</span>
              </Button>
              <Button size="sm" onClick={openNewIssueSheet} disabled={viewMode === "preview"} className="h-8 md:h-10 text-[10px] md:text-sm px-2 md:px-3">
                <Plus className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" /> <span className="hidden xs:inline md:inline">Issue</span><span className="xs:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-muted/10">
          {viewMode === "edit" ? (
            <div className="h-full p-4 md:p-8 overflow-y-auto">
              <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
                {issues.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center border-2 border-dashed border-border rounded-xl bg-white/50 px-4">
                   <div className="bg-muted p-4 rounded-full mb-4">
                     <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                   </div>
                   <h3 className="text-lg font-medium">No issues recorded</h3>
                   <p className="text-muted-foreground max-w-xs mt-2 mb-6">
                     Start adding issues to your report to track defects and observations. Each issue requires at least one image and a note.
                   </p>
                   <Button onClick={openNewIssueSheet}>Add First Issue</Button>
                 </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {issues.map((issue) => (
                      <Card key={issue.id} className="group overflow-hidden border-border hover:border-primary/50 transition-all hover:shadow-sm bg-white">
                        <div className="flex flex-col md:flex-row">
                          <div className="flex-1 p-4 md:p-6">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className={cn("rounded-sm font-semibold", getSeverityColor(issue.severity))}>
                                  {issue.severity}
                                </Badge>
                                <h3 className="font-semibold text-base md:text-lg">{issue.title}</h3>
                              </div>
                              <div className="flex items-center gap-1 md:gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm" className="h-8 px-2 md:px-3" onClick={() => openEditIssueSheet(issue)}>
                                  Edit
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteIssue(issue.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                              {issue.note}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
                              <span className="bg-secondary px-2 py-1 rounded text-secondary-foreground shrink-0">
                                {issue.location}
                              </span>
                              <span className="flex items-center gap-1 shrink-0">
                                <User className="h-3 w-3" /> {issue.responsibleEngineer}
                              </span>
                              <span className="flex items-center gap-1 shrink-0">
                                {issue.status === "Open" ? <Circle className="h-3 w-3 fill-orange-500 text-orange-500" /> : <CheckCircle2 className="h-3 w-3 fill-green-500 text-green-500" />}
                                {issue.status}
                              </span>
                            </div>
                          </div>
                          
                          {issue.images && issue.images.length > 0 && (
                            <div className="w-full md:w-64 flex gap-1 p-2 bg-slate-50 border-t md:border-t-0 md:border-l overflow-x-auto">
                              {issue.images.map((img, idx) => (
                                <div key={idx} className="flex-shrink-0 w-24 md:flex-1 h-24 md:h-32 bg-white border border-slate-200 rounded overflow-hidden flex items-center justify-center p-1">
                                  <img src={img} alt="Issue" className="max-w-full max-h-full object-contain" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-4 md:p-8 bg-slate-200/50 flex justify-center">
              <div ref={componentRef} className="bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] p-0 print:shadow-none origin-top transition-transform sm:scale-100">
                <div className="sm:hidden text-center py-4 bg-amber-50 text-amber-800 text-xs font-medium border-b border-amber-100">
                  Note: Preview layout is optimized for Desktop/A4 Print.
                </div>
                {project && <ReportPreview report={report} project={project} issues={issues} />}
              </div>
            </div>
          )}
        </div>

        {/* Issue Editor Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>{editingIssue ? "Edit Issue" : "Add New Issue"}</SheetTitle>
              <SheetDescription>
                Note and at least one image are mandatory.
              </SheetDescription>
            </SheetHeader>
            
            {!editingIssue && (
              <div className="mb-6 pb-6 border-b">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-primary" />
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Templates</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {issueTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      onClick={() => applyTemplate(template.id)}
                      className="justify-start text-left h-auto py-2 px-3 font-medium text-xs"
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="issue-title">Issue Title *</Label>
                <Input 
                  id="issue-title" 
                  placeholder="Describe the issue briefly" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select 
                    value={formData.severity} 
                    onValueChange={(val: any) => setFormData({...formData, severity: val})}
                  >
                    <SelectTrigger>
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
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(val: any) => setFormData({...formData, status: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="location" 
                      className="pl-9"
                      placeholder="e.g. Roof" 
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="engineer">Responsible Engineer</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="engineer" 
                      className="pl-9"
                      placeholder="Name" 
                      value={formData.responsibleEngineer}
                      onChange={(e) => setFormData({...formData, responsibleEngineer: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note *</Label>
                <Textarea 
                  id="note" 
                  className="min-h-[100px]"
                  placeholder="Mandatory detailed notes..." 
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Images * (Up to 3)</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      className="pl-9"
                      placeholder="Image URL..." 
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                  </div>
                  <Button type="button" variant="secondary" onClick={handleAddImage} disabled={formData.images.length >= 3 || !imageUrl}>
                    Add
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-slate-100 border border-slate-200 group flex items-center justify-center p-1">
                      <img src={img} alt="Issue" className="max-w-full max-h-full object-contain" />
                      <button 
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {formData.images.length === 0 && (
                    <div className="col-span-3 py-4 text-center border-2 border-dashed rounded-md text-muted-foreground text-xs">
                      At least one image required
                    </div>
                  )}
                </div>
              </div>
            </div>
            <SheetFooter className="mt-8">
              <Button variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleSaveIssue} 
                disabled={!formData.title || !formData.note || formData.images.length === 0}
              >
                Save Issue
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </Layout>
  );
}
