import { useState } from "react";
import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  FileText,
  Loader2,
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function Quotations() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ["quotations-all"],
    queryFn: () => api.getAllQuotations(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.getProjects(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createQuotation({
        projectId: selectedProjectId || null,
        title: newTitle || "Quotation",
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotations-all"] });
      setIsDialogOpen(false);
      setNewTitle("");
      setSelectedProjectId("");
      setLocation(`/quotation/${data.id}`);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations-all"] });
    },
  });

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return null;
    const p = projects.find((proj: any) => proj.id === projectId);
    return p?.title || null;
  };

  return (
    <Layout>
      <div className="mx-auto max-w-4xl p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Quotations</h1>
            <p className="text-sm text-slate-500">
              Manage inspection quotations
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Quotation
          </Button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : quotations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 mb-3">
              No quotations yet. Create your first inspection quotation.
            </p>
            <Button
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create First Quotation
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {quotations.map((q: any) => {
              const projectName = getProjectName(q.projectId);
              return (
                <Card
                  key={q.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => setLocation(`/quotation/${q.id}`)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                        <FileText className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {q.title}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {projectName
                            ? `${projectName} — `
                            : ""}
                          Created{" "}
                          {new Date(q.createdAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTargetId(q.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* New Quotation Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New Quotation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label>Quotation Title *</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 2 BHK Inspection Quote"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label>Project (optional)</Label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">No project — quick quotation</option>
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.title} — {p.clientName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!newTitle.trim() || createMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Plus className="h-4 w-4 mr-1.5" />
                )}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={deleteTargetId !== null}
          onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}
          title="Delete Quotation"
          description="This will permanently delete this quotation and all its line items. This cannot be undone."
          onConfirm={() => {
            if (deleteTargetId) {
              deleteMutation.mutate(deleteTargetId);
              setDeleteTargetId(null);
            }
          }}
          loading={deleteMutation.isPending}
        />
      </div>
    </Layout>
  );
}
