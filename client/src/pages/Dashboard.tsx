import { useState } from "react";
import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  MapPin,
  Calendar,
  ArrowRight,
  FolderKanban,
  BarChart3,
  Trash2,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [newProject, setNewProject] = useState({
    title: "",
    clientName: "",
    address: "",
    description: "",
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: api.getProjects,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsDialogOpen(false);
      setNewProject({
        title: "",
        clientName: "",
        address: "",
        description: "",
      });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setProjectToDelete(null);
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const handleCreateProject = () => {
    if (!newProject.title) return;
    createMutation.mutate(newProject);
  };

  const filteredProjects = projects.filter(
    (p: any) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Projects
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="w-full sm:w-auto shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                  data-testid="button-new-project"
                >
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
                      onChange={(e) =>
                        setNewProject({ ...newProject, title: e.target.value })
                      }
                      data-testid="input-project-title"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="client">Client Name</Label>
                    <Input
                      id="client"
                      placeholder="e.g. Acme Corp"
                      value={newProject.clientName}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          clientName: e.target.value,
                        })
                      }
                      data-testid="input-client-name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Location / Address</Label>
                    <Input
                      id="address"
                      placeholder="123 Main St..."
                      value={newProject.address}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          address: e.target.value,
                        })
                      }
                      data-testid="input-project-address"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief scope of work..."
                      value={newProject.description}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          description: e.target.value,
                        })
                      }
                      data-testid="input-project-description"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateProject}
                    disabled={createMutation.isPending}
                    data-testid="button-create-project"
                  >
                    {createMutation.isPending
                      ? "Creating..."
                      : "Create Project"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/50 backdrop-blur-sm border-dashed">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-wider">
                Active Projects
              </CardDescription>
              <CardTitle className="text-2xl" data-testid="stat-projects">
                {projects.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white/50 backdrop-blur-sm border-dashed">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-wider">
                Total Reports
              </CardDescription>
              <CardTitle className="text-2xl" data-testid="stat-reports">
                —
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white/50 backdrop-blur-sm border-dashed">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-wider">
                Pending Review
              </CardDescription>
              <CardTitle className="text-2xl">—</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white/50 backdrop-blur-sm border-dashed">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-wider">
                Completed
              </CardDescription>
              <CardTitle className="text-2xl">—</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10 bg-white w-full shadow-sm"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-projects"
          />
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">
            Loading projects...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-xl bg-muted/30">
            <div className="bg-muted p-4 rounded-full mb-4">
              <FolderKanban className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No projects found</h3>
            <p className="text-muted-foreground max-w-xs mt-2 mb-6">
              Get started by creating your first project to track inspections
              and reports.
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              data-testid="button-create-first-project"
            >
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project: any) => (
              <Card
                key={project.id}
                className="group hover:shadow-xl transition-all duration-300 border-border/60 hover:border-primary/50 cursor-pointer overflow-hidden relative bg-white"
                onClick={() => setLocation(`/project/${project.id}`)}
                data-testid={`card-project-${project.id}`}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <CardTitle className="line-clamp-1 text-xl group-hover:text-primary transition-colors pr-2">
                      {project.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 -mt-1 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToDelete(project.id);
                        }}
                        data-testid={`button-delete-project-${project.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
                    <span className="text-primary">Client:</span>{" "}
                    {project.clientName}
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete Project
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Are you sure you want to delete this project? This will also
              delete all reports associated with it.
              <br />
              <br />
              <span className="font-semibold text-slate-900">
                This action cannot be undone.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setProjectToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                projectToDelete && deleteMutation.mutate(projectToDelete)
              }
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-project"
            >
              {deleteMutation.isPending ? "Deleting..." : "Yes, delete project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
