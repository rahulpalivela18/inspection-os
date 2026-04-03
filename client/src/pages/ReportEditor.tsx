import { useState, useRef } from "react";
import Layout from "@/components/Layout";
import { useStore, Issue, IssueTemplate } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Plus, Printer, FileText, Trash2, Settings,
  AlertTriangle, CheckCircle2, Circle, Camera, MapPin, User, X, Zap, Image as ImageIcon, ChevronDown, ChevronRight
} from "lucide-react";
import { Link, useRoute } from "wouter";
import NotFound from "./not-found";
import { useReactToPrint } from "react-to-print";
import { cn } from "@/lib/utils";
import ReportPreview from "@/pages/ReportPreview";

export default function ReportEditor() {
  const [match, params] = useRoute("/report/:id");
  const { getReport, getReportIssues, addIssue, deleteIssue, updateIssue, getProject, issueTemplates, getIssueTemplate, addIssueTemplate, updateIssueTemplate, deleteIssueTemplate, updateReport, reportTemplates } = useStore();
  
  const report = params?.id ? getReport(params.id) : undefined;

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<IssueTemplate | null>(null);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [selectedReportTemplate, setSelectedReportTemplate] = useState<string>(report?.templateId || "");
  const componentRef = useRef<HTMLDivElement>(null);

  const [templateForm, setTemplateForm] = useState<Omit<IssueTemplate, "id" | "isCustom">>({
    name: "",
    category: "",
    title: "",
    note: "",
    location: "",
    severity: "Medium",
  });

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

  if (!match || !params || !report) return <NotFound />;
  
  const project = getProject(report.projectId);
  const issues = getReportIssues(report.id);

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    report.checklist ? 
      Array.from(new Set(report.checklist.map(c => c.category))).reduce((acc, cat, idx) => {
        acc[cat] = idx === 0; // Only expand the first category by default
        return acc;
      }, {} as Record<string, boolean>) 
    : {}
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

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

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || formData.images.length >= 3) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData({ ...formData, images: [...formData.images, base64] });
    };
    reader.readAsDataURL(file);
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

  const handleSaveTemplate = () => {
    if (!templateForm.name || !templateForm.title || !templateForm.note) return;
    
    if (editingTemplate) {
      updateIssueTemplate({
        ...editingTemplate,
        ...templateForm,
      });
    } else {
      addIssueTemplate(templateForm);
    }
    
    setTemplateForm({
      name: "",
      category: "",
      title: "",
      note: "",
      location: "",
      severity: "Medium",
    });
    setEditingTemplate(null);
  };

  const openEditTemplate = (template: IssueTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      category: template.category,
      title: template.title,
      note: template.note,
      location: template.location,
      severity: template.severity,
    });
  };

  const handleDeleteTemplate = (id: string) => {
    deleteIssueTemplate(id);
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
        <div className="border-b border-border bg-white px-4 md:px-6 py-3 flex flex-col lg:flex-row items-start lg:items-center justify-between shrink-0 gap-4 z-10">
          <div className="flex items-center gap-2 md:gap-4 w-full lg:w-auto">
            <Link href={`/project/${report.projectId}`}>
              <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0 h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-base md:text-xl font-bold text-foreground flex items-center gap-2 truncate">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">{report.title}</span>
              </h1>
              <p className="text-[10px] md:text-xs text-muted-foreground">{issues.length} Issues • {report.status}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
            <div className="bg-muted p-1 rounded-lg flex items-center shrink-0 w-full sm:w-auto">
              <button 
                onClick={() => setViewMode("edit")}
                className={cn(
                  "flex-1 sm:flex-none px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-md transition-all",
                  viewMode === "edit" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Editor
              </button>
              <button 
                onClick={() => setViewMode("preview")}
                className={cn(
                  "flex-1 sm:flex-none px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-md transition-all",
                  viewMode === "preview" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Preview
              </button>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={() => handlePrint()} className="h-9 md:h-10 text-xs md:text-sm px-3 md:px-4 flex-1 sm:flex-none">
                <Printer className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> <span className="inline">Export PDF</span>
              </Button>
              <Button size="sm" onClick={openNewIssueSheet} disabled={viewMode === "preview"} className="h-9 md:h-10 text-xs md:text-sm px-3 md:px-4 flex-1 sm:flex-none">
                <Plus className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> <span className="inline">Add Issue</span>
              </Button>
            </div>
          </div>
        </div>

          {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-muted/10">
          {viewMode === "edit" ? (
            <div className="h-full p-4 md:p-8 overflow-y-auto">
              <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
                
                {/* Checklist Section */}
                {report.checklist && report.checklist.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        Inspection Checklist
                      </h2>
                      <div className="text-sm text-muted-foreground bg-white px-3 py-1 rounded-full border shadow-sm">
                        {report.checklist.filter(c => c.status === "Y").length} Pass / {report.checklist.filter(c => c.status === "N").length} Fail / {report.checklist.filter(c => c.status === null).length} Pending
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                      {Array.from(new Set(report.checklist.map(c => c.category))).map((category, catIdx) => (
                        <div key={category} className={catIdx > 0 ? "border-t border-slate-100" : ""}>
                          <div 
                            className="bg-slate-50 px-4 py-3 font-semibold text-sm border-b border-slate-100 text-slate-700 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => toggleCategory(category)}
                          >
                            <div className="flex items-center gap-2">
                              {expandedCategories[category] ? 
                                <ChevronDown className="h-4 w-4 text-slate-500" /> : 
                                <ChevronRight className="h-4 w-4 text-slate-500" />
                              }
                              {category}
                            </div>
                            <div className="flex gap-2 text-xs font-normal">
                              <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                {report.checklist?.filter(c => c.category === category && c.status === "Y").length || 0} Pass
                              </span>
                              <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                {report.checklist?.filter(c => c.category === category && c.status === "N").length || 0} Fail
                              </span>
                            </div>
                          </div>
                          
                          {expandedCategories[category] && (
                            <div className="divide-y divide-slate-100">
                              {report.checklist?.filter(c => c.category === category).map(item => (
                              <div key={item.id} className="p-3 md:p-4 flex flex-col md:flex-row gap-3 md:gap-4 md:items-center hover:bg-slate-50/50 transition-colors">
                                <div className="flex-1 flex items-start gap-3">
                                  <div className="mt-0.5 w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center shrink-0 text-[10px] text-slate-400 font-medium">
                                    {report.checklist?.indexOf(item)! + 1}
                                  </div>
                                  <p className="text-sm md:text-base font-medium leading-tight">{item.point}</p>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2 pl-8 md:pl-0 shrink-0">
                                  <div className="flex bg-slate-100 rounded-lg p-1 border">
                                    <button 
                                      className={cn(
                                        "px-3 py-1 text-xs font-bold rounded-md transition-all duration-200",
                                        item.status === "Y" ? "bg-green-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                                      )}
                                      onClick={() => {
                                        const newStatus = item.status === "Y" ? null : "Y";
                                        const newChecklist = report.checklist?.map(c => c.id === item.id ? {...c, status: newStatus as "Y" | "N" | null} : c);
                                        updateReport({...report, checklist: newChecklist});
                                      }}
                                    >
                                      PASS
                                    </button>
                                    <button 
                                      className={cn(
                                        "px-3 py-1 text-xs font-bold rounded-md transition-all duration-200",
                                        item.status === "N" ? "bg-red-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                                      )}
                                      onClick={() => {
                                        const newStatus = item.status === "N" ? null : "N";
                                        const newChecklist = report.checklist?.map(c => c.id === item.id ? {...c, status: newStatus as "Y" | "N" | null} : c);
                                        updateReport({...report, checklist: newChecklist});
                                      }}
                                    >
                                      FAIL
                                    </button>
                                  </div>
                                  
                                  {item.status === "N" && (
                                    <div className="relative">
                                      {item.image ? (
                                        <div className="relative h-8 w-12 rounded border bg-slate-100 overflow-hidden group">
                                          <img src={item.image} alt="Defect" className="object-cover w-full h-full" />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                                            onClick={() => {
                                              const newChecklist = report.checklist?.map(c => c.id === item.id ? {...c, image: undefined} : c);
                                              updateReport({...report, checklist: newChecklist});
                                            }}
                                          >
                                            <X className="h-3 w-3 text-white" />
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <input 
                                            type="file" 
                                            id={`check-img-${item.id}`} 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (!file) return;
                                              const reader = new FileReader();
                                              reader.onload = (event) => {
                                                const base64 = event.target?.result as string;
                                                const newChecklist = report.checklist?.map(c => c.id === item.id ? {...c, image: base64} : c);
                                                updateReport({...report, checklist: newChecklist});
                                              };
                                              reader.readAsDataURL(file);
                                            }}
                                          />
                                          <label 
                                            htmlFor={`check-img-${item.id}`}
                                            className="flex items-center gap-1 bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200 px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                                          >
                                            <ImageIcon className="h-3 w-3" /> Photo
                                          </label>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    Detailed Issues
                  </h2>
                </div>

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

        {/* Mobile FAB for adding issues */}
        {viewMode === "edit" && (
          <div className="md:hidden fixed bottom-6 right-6 z-40">
            <Button 
              size="icon" 
              className="h-14 w-14 rounded-full shadow-xl shadow-primary/30"
              onClick={openNewIssueSheet}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        )}

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
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Templates</p>
                  </div>
                  <Dialog open={isTemplateManagerOpen} onOpenChange={setIsTemplateManagerOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Settings className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Manage Issue Templates</DialogTitle>
                        <DialogDescription>Create, edit, or delete issue templates to speed up issue creation.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Template Form */}
                        <div className="border rounded-lg p-4 bg-slate-50">
                          <h3 className="font-semibold mb-4">{editingTemplate ? "Edit Template" : "Add New Template"}</h3>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label htmlFor="tpl-name" className="text-xs">Template Name *</Label>
                                <Input id="tpl-name" placeholder="e.g. Bedroom" value={templateForm.name} onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="tpl-category" className="text-xs">Category</Label>
                                <Input id="tpl-category" placeholder="e.g. Living Spaces" value={templateForm.category} onChange={(e) => setTemplateForm({...templateForm, category: e.target.value})} />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="tpl-title" className="text-xs">Issue Title *</Label>
                              <Input id="tpl-title" placeholder="Brief title" value={templateForm.title} onChange={(e) => setTemplateForm({...templateForm, title: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="tpl-note" className="text-xs">Description/Checklist *</Label>
                              <Textarea id="tpl-note" placeholder="Detailed inspection notes..." className="min-h-20 text-xs" value={templateForm.note} onChange={(e) => setTemplateForm({...templateForm, note: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label htmlFor="tpl-location" className="text-xs">Default Location</Label>
                                <Input id="tpl-location" placeholder="e.g. Master Bedroom" value={templateForm.location} onChange={(e) => setTemplateForm({...templateForm, location: e.target.value})} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="tpl-severity" className="text-xs">Default Severity</Label>
                                <Select value={templateForm.severity} onValueChange={(val: any) => setTemplateForm({...templateForm, severity: val})}>
                                  <SelectTrigger className="h-8 text-xs">
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
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button size="sm" onClick={handleSaveTemplate} className="text-xs h-8">
                                {editingTemplate ? "Update" : "Add"} Template
                              </Button>
                              {editingTemplate && (
                                <Button size="sm" variant="outline" onClick={() => {
                                  setEditingTemplate(null);
                                  setTemplateForm({name: "", category: "", title: "", note: "", location: "", severity: "Medium"});
                                }} className="text-xs h-8">
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Templates List */}
                        <div>
                          <h3 className="font-semibold mb-3 text-sm">All Templates ({issueTemplates.length})</h3>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {issueTemplates.map((template) => (
                              <div key={template.id} className={`p-3 rounded border text-xs ${template.isCustom ? "bg-blue-50 border-blue-200" : "bg-white"}`}>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-semibold">{template.name}</p>
                                    <p className="text-muted-foreground text-[10px]">{template.category}</p>
                                    <p className="line-clamp-1 text-muted-foreground mt-1">{template.title}</p>
                                  </div>
                                  <div className="flex gap-1 shrink-0">
                                    {template.isCustom && (
                                      <>
                                        <Button variant="ghost" size="sm" onClick={() => openEditTemplate(template)} className="h-6 px-2 text-xs">
                                          Edit
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template.id)} className="h-6 w-6 p-0 text-destructive">
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTemplateManagerOpen(false)}>Close</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
                  <Input 
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    disabled={formData.images.length >= 3}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground pt-2">{formData.images.length}/3</span>
                </div>
                <p className="text-xs text-muted-foreground">Click to upload photos directly from your device</p>
                
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
