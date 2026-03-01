import { useState } from "react";
import Layout from "@/components/Layout";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, MapPin, Calendar, ArrowRight, FolderKanban, Image as ImageIcon, BarChart3 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { projects, addProject, reports } = useStore();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // New Project Form State
  const [newProject, setNewProject] = useState({
    title: "",
    clientName: "",
    address: "",
    description: "",
    logoUrl: "",
  });

  const handleCreateProject = () => {
    if (!newProject.title) return;
    
    addProject(newProject);
    setIsDialogOpen(false);
    setNewProject({ title: "", clientName: "", address: "", description: "", logoUrl: "" });
  };

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your inspections and client reports.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="outline" className="hidden sm:flex">
                View Landing
              </Button>
            </Link>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
                  <Plus className="mr-2 h-4 w-4" /> New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new inspection project.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Project Title</Label>
                    <Input 
                      id="title" 
                      placeholder="e.g. Skyline Tower Inspection" 
                      value={newProject.title}
                      onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="client">Client Name</Label>
                    <Input 
                      id="client" 
                      placeholder="e.g. Acme Corp" 
                      value={newProject.clientName}
                      onChange={(e) => setNewProject({...newProject, clientName: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Location / Address</Label>
                    <Input 
                      id="address" 
                      placeholder="123 Main St..." 
                      value={newProject.address}
                      onChange={(e) => setNewProject({...newProject, address: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="logoUrl">Client Logo URL</Label>
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="logoUrl" 
                        className="pl-9"
                        placeholder="https://..." 
                        value={newProject.logoUrl}
                        onChange={(e) => setNewProject({...newProject, logoUrl: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Brief scope of work..." 
                      value={newProject.description}
                      onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateProject}>Create Project</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/50 backdrop-blur-sm border-dashed">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-wider">Active Projects</CardDescription>
              <CardTitle className="text-2xl">{projects.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white/50 backdrop-blur-sm border-dashed">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-wider">Total Reports</CardDescription>
              <CardTitle className="text-2xl">{reports.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white/50 backdrop-blur-sm border-dashed">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-wider">Pending Review</CardDescription>
              <CardTitle className="text-2xl">{reports.filter(r => r.status === "Review").length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white/50 backdrop-blur-sm border-dashed">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-wider">Completed</CardDescription>
              <CardTitle className="text-2xl">{reports.filter(r => r.status === "Final").length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-10 bg-white w-full shadow-sm" 
            placeholder="Search projects..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-xl bg-muted/30">
            <div className="bg-muted p-4 rounded-full mb-4">
              <FolderKanban className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No projects found</h3>
            <p className="text-muted-foreground max-w-xs mt-2 mb-6">
              Get started by creating your first project to track inspections and reports.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>Create Project</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project: any) => (
              <Card 
                key={project.id} 
                className="group hover:shadow-xl transition-all duration-300 border-border/60 hover:border-primary/50 cursor-pointer overflow-hidden relative bg-white"
                onClick={() => setLocation(`/project/${project.id}`)}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="line-clamp-1 text-xl group-hover:text-primary transition-colors">
                      {project.title}
                    </CardTitle>
                    {project.logoUrl && (
                      <div className="w-10 h-10 rounded-lg border bg-white overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-sm">
                        <img src={project.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" /> {project.address}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {project.description}
                  </p>
                  <div className="flex items-center gap-2 mt-4 text-[10px] uppercase font-bold text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md w-fit tracking-wider">
                    <span className="text-primary">Client:</span> {project.clientName}
                  </div>
                </CardContent>
                <CardFooter className="pt-3 border-t bg-muted/10 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(project.createdAt))} ago
                  </span>
                  <div className="flex items-center text-xs font-bold text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                    Open Project <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
