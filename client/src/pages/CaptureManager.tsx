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
  FileDown,
} from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ensureJpeg } from "@/lib/utils";
import CapturePDF from "@/components/CapturePDF";
import { pdf } from "@react-pdf/renderer";
import { useAuth } from "@/lib/auth";

export default function CaptureManager() {
  const [, params] = useRoute("/project/:id/captures");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [is360Upload, setIs360Upload] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [exportingAll, setExportingAll] = useState(false);
  const { workspace } = useAuth();

  const projectId = params?.id;

  const { data: captures = [], isLoading } = useQuery({
    queryKey: ["captures", projectId],
    queryFn: () => api.getCaptures(projectId!),
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
      return api.createCapture(projectId, {
        title: newTitle,
        imageUrl: dataUrl,
        width: dimensions.width,
        height: dimensions.height,
        is360: is360Upload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["captures", projectId] });
      setIsUploadOpen(false);
      setNewTitle("");
      setSelectedFile(null);
      setPreviewUrl(null);
      setIs360Upload(false);
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCapture(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["captures", projectId] });
      setDeleteId(null);
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  async function handleExportAllPDF() {
    if (!projectId) return;
    setExportingAll(true);
    try {
      const project = await api.getProject(projectId);
      const captureData = await Promise.all(
        captures.map(async (fp: any) => {
          const pins = await api.getHotspots(fp.id);
          const imageUrl = await ensureJpeg(fp.imageUrl);
          return {
            projectTitle: project.title,
            title: fp.title,
            imageUrl,
            imageWidth: fp.width,
            imageHeight: fp.height,
            companyName: workspace?.name,
            companyLogoUrl: workspace?.logoUrl,
            companyAddress: workspace?.address,
            companyEmail: workspace?.email,
            clientName: project.clientName,
            projectAddress: project.address,
            pins: pins.map((p: any) => ({
              id: p.id,
              number: 0,
              label: p.label,
              x: parseFloat(p.x),
              y: parseFloat(p.y),
              severity: p.issueSeverity,
              status: p.issueStatus,
              notes: p.notes,
              hasPhoto: !!p.panoUrl,
            })),
          };
        }),
      );

      const allPins = captureData.flatMap((c) => c.pins);
      const totalHotspots = allPins.length;
      const severityBreakdown = ["Critical", "Major", "Minor", "Info"].map(
        (sev) => ({
          severity: sev,
          count: allPins.filter((p) => (p.severity || "Info") === sev).length,
        }),
      );
      const statusBreakdown = ["Open", "In Progress", "Resolved"].map(
        (st) => ({
          status: st,
          count: allPins.filter((p) => p.status === st).length,
        }),
      );

      const blob = await pdf(
        <CapturePDF
          captures={captureData}
          cover={{
            projectTitle: project.title,
            clientName: project.clientName,
            projectAddress: project.address,
            companyName: workspace?.name,
            companyLogoUrl: workspace?.logoUrl,
            companyAddress: workspace?.address,
            totalCaptures: captureData.length,
            totalHotspots,
            severityBreakdown,
            statusBreakdown,
          }}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title.replace(/\s+/g, "_")}_captures.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExportingAll(false);
    }
  }

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
              Captures
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {captures.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleExportAllPDF} disabled={exportingAll}>
                <FileDown className="h-4 w-4 mr-1.5" />
                {exportingAll ? "Exporting..." : "Export All PDF"}
              </Button>
            )}
            <Button onClick={() => setIsUploadOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Capture
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : captures.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Map className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No captures yet</p>
            <p className="text-sm mt-1">
              Upload any photo or 360° image to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {captures.map((fp: any) => (
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
                      setLocation(`/project/${projectId}/captures/${fp.id}`)
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
            <DialogTitle>Upload Capture</DialogTitle>
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
            <div className="aspect-4/3 bg-slate-100 rounded-md overflow-hidden">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={is360Upload}
              onChange={(e) => setIs360Upload(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">This is a 360° panorama image</span>
          </label>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadOpen(false);
                setNewTitle("");
                setSelectedFile(null);
                setPreviewUrl(null);
                setIs360Upload(false);
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
            <AlertDialogTitle>Delete Capture?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this capture and all its hotspots.
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
