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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  Loader2,
} from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

function statusColor(status: string) {
  switch (status) {
    case "Draft":
      return "bg-slate-100 text-slate-600";
    case "Sent":
      return "bg-blue-100 text-blue-700";
    case "Accepted":
      return "bg-green-100 text-green-700";
    case "Rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function Quotations() {
  const [, params] = useRoute("/project/:id/quotations");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const projectId = params?.id;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.getProject(projectId!),
    enabled: !!projectId,
  });

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ["quotations", projectId],
    queryFn: () => api.getQuotations(projectId!),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createQuotation(projectId!, { title: newTitle || "Quotation" }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotations", projectId] });
      setIsDialogOpen(false);
      setNewTitle("");
      setLocation(`/quotation/${data.id}`);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations", projectId] });
    },
  });

  return (
    <Layout>
      <div className="mx-auto max-w-4xl p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(`/project/${projectId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Quotations</h1>
              <p className="text-sm text-slate-500">
                {project?.title} — {project?.clientName}
              </p>
            </div>
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
              No quotations yet for this project.
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
            {quotations.map((q: any) => (
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
                        Created {new Date(q.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(q.status)}`}
                    >
                      {q.status}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(q.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                <Label>Quotation Title</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Repair Estimate — Phase 1"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
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
      </div>
    </Layout>
  );
}
