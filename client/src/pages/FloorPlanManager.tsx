import { useState, useRef } from "react";
import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Map,
  Plus,
  Trash2,
  Eye,
  Loader2,
  ImageUp,
} from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function FloorPlanManager() {
  const [, params] = useRoute("/project/:id/floor-plans");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const projectId = params?.id;

  const { data: floorPlans = [], isLoading } = useQuery({
    queryKey: ["floor-plans", projectId],
    queryFn: () => api.getFloorPlans(projectId!),
    enabled: !!projectId,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !newTitle || !projectId) return;
      const file = selectedFile;
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const img = new Image();
      const dimensions = await new Promise<{ width: number; height: number }>(
        (resolve, reject) => {
          img.onload = () =>
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
          img.onerror = reject;
          img.src = dataUrl;
        },
      );
      return api.createFloorPlan(projectId, {
        title: newTitle,
        imageUrl: dataUrl,
        width: dimensions.width,
        height: dimensions.height,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floor-plans", projectId] });
      setIsUploadOpen(false);
      setNewTitle("");
      setSelectedFile(null);
      setPreviewUrl(null);
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteFloorPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floor-plans", projectId] });
      setDeleteId(null);
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href={`/project/${projectId}`}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              &larr; Back to Project
            </Link>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">
              Floor Plans
            </h1>
          </div>
          <Button onClick={() => setIsUploadOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Floor Plan
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : floorPlans.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Map className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No floor plans yet</p>
            <p className="text-sm mt-1">
              Upload a blueprint or site map to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {floorPlans.map((fp: any) => (
              <Card key={fp.id} className="overflow-hidden">
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  <img
                    src={fp.imageUrl}
                    alt={fp.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{fp.title}</CardTitle>
                </CardHeader>
                <CardContent className="pb-2 text-xs text-slate-500">
                  {fp.width} &times; {fp.height}px &middot;{" "}
                  {new Date(fp.createdAt).toLocaleDateString()}
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      setLocation(`/project/${projectId}/floor-plans/${fp.id}`)
                    }
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => setDeleteId(fp.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Floor Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Ground Floor Layout"
              />
            </div>
            <div>
              <Label htmlFor="file">Image File</Label>
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileSelect}
              />
            </div>
            {previewUrl && (
              <div className="aspect-[4/3] bg-slate-100 rounded-md overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadOpen(false);
                setNewTitle("");
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => uploadMutation.mutate()}
              disabled={!newTitle || !selectedFile || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ImageUp className="h-4 w-4 mr-2" />
              )}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Floor Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this floor plan and all its pins.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
