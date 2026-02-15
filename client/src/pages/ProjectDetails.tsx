import { useState } from "react";
import Layout from "@/components/Layout";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Calendar, ArrowLeft, ArrowRight, Clock, User } from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import { format } from "date-fns";
import NotFound from "./not-found";

export default function ProjectDetails() {
  const [match, params] = useRoute("/project/:id");
  const [, setLocation] = useLocation();
  const { getProject, getProjectReports, addReport } = useStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReport, setNewReport] = useState({
    title: "",
    author: "",
    status: "Draft" as const,
    date: format(new Date(), "yyyy-MM-dd"),
  });

  if (!match || !params) return <NotFound />;

  const project = getProject(params.id);
  
  if (!project) return <NotFound />;

  const reports = getProjectReports(project.id);

  const handleCreateReport = () => {
    if (!newReport.title || !newReport.author) return;
    
    addReport({
      ...newReport,
      projectId: project.id,
    });
    setIsDialogOpen(false);
    setNewReport({ 
      title: "", 
      author: "", 
      status: "Draft", 
      date: format(new Date(), "yyyy-MM-dd") 
    });
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
        <div className="bg-white border-b border-border py-8 px-8">
          <div className="max-w-7xl mx-auto">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Projects
            </Link>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{project.title}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground text-sm">
                  <span className="flex items-center gap-1"><User className="h-4 w-4" /> {project.clientName}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span>{project.address}</span>
                </div>
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="shadow-lg shadow-primary/20">
                    <Plus className="mr-2 h-4 w-4" /> New Report
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Report</DialogTitle>
                    <DialogDescription>Start a new inspection report for this project.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Report Title</Label>
                      <Input 
                        id="title" 
                        placeholder="e.g. Initial Site Survey" 
                        value={newReport.title}
                        onChange={(e) => setNewReport({...newReport, title: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="author">Author</Label>
                        <Input 
                          id="author" 
                          placeholder="Your Name" 
                          value={newReport.author}
                          onChange={(e) => setNewReport({...newReport, author: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="date">Date</Label>
                        <Input 
                          id="date" 
                          type="date"
                          value={newReport.date}
                          onChange={(e) => setNewReport({...newReport, date: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={newReport.status} 
                        onValueChange={(val: any) => setNewReport({...newReport, status: val})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Review">Review</SelectItem>
                          <SelectItem value="Final">Final</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateReport}>Create Report</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="flex-1 bg-muted/10 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Reports ({reports.length})</h2>
            </div>

            {reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-xl bg-white">
                <div className="bg-muted p-4 rounded-full mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No reports yet</h3>
                <p className="text-muted-foreground max-w-xs mt-2 mb-6">
                  Create your first report to start documenting issues.
                </p>
                <Button variant="outline" onClick={() => setIsDialogOpen(true)}>Create Report</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {reports.map((report) => (
                  <Card 
                    key={report.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => setLocation(`/report/${report.id}`)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center p-6 gap-4">
                      <div className="flex-shrink-0 bg-primary/10 p-3 rounded-lg text-primary">
                        <FileText className="h-6 w-6" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                            {report.title}
                          </h3>
                          <Badge variant="outline" className={`${getStatusColor(report.status)} border-0 font-medium`}>
                            {report.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" /> {report.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {report.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Created {format(new Date(report.createdAt), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>

                      <div className="flex-shrink-0 flex items-center">
                        <Button variant="ghost" className="group-hover:translate-x-1 transition-transform">
                          Open Report <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
