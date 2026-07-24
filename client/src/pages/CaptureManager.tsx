import { useState, useRef } from "react";
import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
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

function DonutChart({ title, data }: { title: string; data: { label: string; count: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const r = 28;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-medium text-slate-600 mb-2">{title}</p>
      <svg width="72" height="72" viewBox="0 0 72 72">
        {total === 0 && (
          <circle cx="36" cy="36" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        )}
        {data.map((d) => {
          if (d.count === 0) return null;
          const pct = d.count / total;
          const dash = pct * circumference;
          const el = (
            <circle
              key={d.label}
              cx="36" cy="36" r={r}
              fill="none"
              stroke={d.color}
              strokeWidth="10"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 36 36)"
            />
          );
          offset += dash;
          return el;
        })}
        <text x="36" y="36" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold fill-slate-900">
          {total}
        </text>
      </svg>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 justify-center">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-[10px] text-slate-500">{d.label} ({d.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CaptureManager() {
  const { user } = useAuth();
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

  // Fetch hotspots for each capture
  const hotspotQueries = useQueries({
    queries: captures.map((cap: any) => ({
      queryKey: ["hotspots", cap.id],
      queryFn: () => api.getHotspots(cap.id),
      enabled: !!cap.id,
    })),
  });

  const hotspotsLoaded = hotspotQueries.every((q) => q.isSuccess);
  const captureHotspots = hotspotQueries.map((q, i) => ({
    capture: captures[i],
    hotspots: q.data ?? [],
  }));

  // Area summary
  const areaSummary = captureHotspots
    .map(({ capture, hotspots }) => ({
      area: capture.title,
      major: hotspots.filter((h: any) => h.issueSeverity === "Major").length,
      minor: hotspots.filter((h: any) => h.issueSeverity === "Minor").length,
      cosmetic: hotspots.filter((h: any) => h.issueSeverity === "Cosmetic").length,
      resolved: hotspots.filter((h: any) => h.issueStatus === "Resolved").length,
      total: hotspots.length,
    }))
    .filter((a) => a.total > 0);

  const allPins = captureHotspots.flatMap((c) => c.hotspots);
  const areaTotals = areaSummary.reduce(
    (acc, a) => ({ major: acc.major + a.major, minor: acc.minor + a.minor, cosmetic: acc.cosmetic + a.cosmetic, resolved: acc.resolved + a.resolved, total: acc.total + a.total }),
    { major: 0, minor: 0, cosmetic: 0, resolved: 0, total: 0 }
  );

  const issueTypes = [
    { label: "Major", count: areaTotals.major, color: "#dc2626" },
    { label: "Minor", count: areaTotals.minor, color: "#22c55e" },
    { label: "Cosmetic", count: areaTotals.cosmetic, color: "#f97316" },
  ];
  const resolutionStatus = [
    { label: "Resolved", count: areaTotals.resolved, color: "#22c55e" },
    { label: "Open", count: allPins.filter((h: any) => h.issueStatus === "Open").length, color: "#dc2626" },
    { label: "In Progress", count: allPins.filter((h: any) => h.issueStatus === "In Progress").length, color: "#f97316" },
  ];

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
      const logoUrl = workspace?.logoUrl ? await ensureJpeg(workspace.logoUrl) : undefined;
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
            totalCaptures: captures.length,
            companyName: workspace?.name,
            companyLogoUrl: logoUrl,
            companyAddress: workspace?.address,
            companyEmail: workspace?.email,
            companyPhone: workspace?.phone,
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
              hasPhoto: !!p.panoUrl || !!p.resolvedPhoto,
              panoUrl: p.panoUrl,
              resolvedPhoto: p.resolvedPhoto,
            })),
          };
        }),
      );

      const allPins = captureData.flatMap((c) => c.pins);
      const totalHotspots = allPins.length;
      const severityBreakdown = ["Major", "Cosmetic", "Minor", "Info"].map(
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
            companyLogoUrl: logoUrl,
            companyAddress: workspace?.address,
            companyPhone: workspace?.phone,
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
            {user?.role !== "viewer" && (
            <Button onClick={() => setIsUploadOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Capture
            </Button>
            )}
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
          <>
            {hotspotsLoaded && areaSummary.length > 0 && (
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <p className="text-sm font-semibold text-slate-900 mb-3">Area Wise Defect Summary</p>
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-slate-500 uppercase">
                          <th className="py-2 pr-4 font-semibold">Area</th>
                          <th className="py-2 px-2 text-center font-semibold">Major</th>
                          <th className="py-2 px-2 text-center font-semibold">Minor</th>
                          <th className="py-2 px-2 text-center font-semibold">Cosmetic</th>
                          <th className="py-2 px-2 text-center font-semibold">Resolved</th>
                          <th className="py-2 pl-2 text-center font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {areaSummary.map((a) => (
                          <tr key={a.area} className="border-b last:border-b-0">
                            <td className="py-2 pr-4 font-medium text-slate-800">{a.area}</td>
                            <td className="py-2 px-2 text-center">{a.major || "—"}</td>
                            <td className="py-2 px-2 text-center">{a.minor || "—"}</td>
                            <td className="py-2 px-2 text-center">{a.cosmetic || "—"}</td>
                            <td className="py-2 px-2 text-center">{a.resolved || "—"}</td>
                            <td className="py-2 pl-2 text-center font-medium">{a.total}</td>
                          </tr>
                        ))}
                        {areaSummary.length > 1 && (
                          <tr className="font-bold text-slate-900">
                            <td className="py-2 pr-4">Total</td>
                            <td className="py-2 px-2 text-center">{areaTotals.major || "—"}</td>
                            <td className="py-2 px-2 text-center">{areaTotals.minor || "—"}</td>
                            <td className="py-2 px-2 text-center">{areaTotals.cosmetic || "—"}</td>
                            <td className="py-2 px-2 text-center">{areaTotals.resolved || "—"}</td>
                            <td className="py-2 pl-2 text-center">{areaTotals.total}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-6 shrink-0 items-start">
                    <DonutChart title="Issue Types" data={issueTypes} />
                    <DonutChart title="Resolution Status" data={resolutionStatus} />
                  </div>
                </div>
              </div>
            )}
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
                  {user?.role !== "viewer" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => setDeleteId(fp.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
          </>
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
