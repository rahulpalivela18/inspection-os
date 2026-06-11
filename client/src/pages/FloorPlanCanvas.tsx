import { useState, useRef, useCallback } from "react";
import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Trash2,
  Eye,
  Camera,
  Link2,
  Move,
  ZoomIn,
  ZoomOut,
  Loader2,
  X,
  FileDown,
} from "lucide-react";
import { useRoute, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import FloorPlanPDF from "@/components/FloorPlanPDF";
import { pdf } from "@react-pdf/renderer";
import QRCode from "qrcode";
import PanoViewer from "@/components/PanoViewer";

interface PinDraft {
  x: number;
  y: number;
  label: string;
  notes: string;
  panoDataUrl: string | null;
  panoFile: File | null;
  issueId: string;
  issueTitle: string;
  issueStatus: string;
  issueSeverity: string;
}

const emptyDraft = (): PinDraft => ({
  x: 0,
  y: 0,
  label: "",
  notes: "",
  panoDataUrl: null,
  panoFile: null,
  issueId: "",
  issueTitle: "",
  issueStatus: "",
  issueSeverity: "",
});

export default function FloorPlanCanvas() {
  const [, params] = useRoute("/project/:projectId/floor-plans/:floorPlanId");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const panoInputRef = useRef<HTMLInputElement>(null);

  const projectId = params?.projectId;
  const floorPlanId = params?.floorPlanId;

  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [editingPinId, setEditingPinId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PinDraft>(emptyDraft());
  const [deletePinId, setDeletePinId] = useState<string | null>(null);
  const [viewingPanoId, setViewingPanoId] = useState<string | null>(null);
  const [showIssueSearch, setShowIssueSearch] = useState(false);

  const { data: floorPlan, isLoading: loadingPlan } = useQuery({
    queryKey: ["floor-plan", floorPlanId],
    queryFn: () => api.getFloorPlan(floorPlanId!),
    enabled: !!floorPlanId,
  });

  const { data: pins = [], isLoading: loadingPins } = useQuery({
    queryKey: ["pins", floorPlanId],
    queryFn: () => api.getPins(floorPlanId!),
    enabled: !!floorPlanId,
  });

  const { data: allIssues = [], isLoading: loadingIssues } = useQuery({
    queryKey: ["project-issues", projectId],
    queryFn: async () => {
      const summaries: any[] = await api.getReports(projectId!);
      const full = await Promise.all(
        summaries.map((r: any) => api.getReport(r.id)),
      );
      return full.flatMap((r: any) =>
        (r.issues || []).map((i: any) => ({
          ...i,
          reportTitle: r.title,
          reportId: r.id,
        })),
      );
    },
    enabled: showIssueSearch && !!projectId,
  });

  const createPinMutation = useMutation({
    mutationFn: async () => {
      if (!floorPlanId) return;
      const body: any = {
        x: draft.x.toString(),
        y: draft.y.toString(),
        label: draft.label,
        notes: draft.notes || undefined,
      };
      if (draft.issueId) {
        body.issueId = draft.issueId;
        body.issueTitle = draft.issueTitle || undefined;
        body.issueStatus = draft.issueStatus || undefined;
        body.issueSeverity = draft.issueSeverity || undefined;
      }
      if (draft.panoDataUrl) {
        body.panoUrl = draft.panoDataUrl;
      }
      return api.createPin(floorPlanId, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pins", floorPlanId] });
      closePinDialog();
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updatePinMutation = useMutation({
    mutationFn: async () => {
      if (!editingPinId) return;
      const body: any = {
        label: draft.label,
        notes: draft.notes || undefined,
      };
      if (draft.panoDataUrl) {
        body.panoUrl = draft.panoDataUrl;
      }
      if (draft.issueId) {
        body.issueId = draft.issueId;
        body.issueTitle = draft.issueTitle || undefined;
        body.issueStatus = draft.issueStatus || undefined;
        body.issueSeverity = draft.issueSeverity || undefined;
      } else {
        body.issueId = null;
        body.issueTitle = null;
        body.issueStatus = null;
        body.issueSeverity = null;
      }
      return api.updatePin(editingPinId, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pins", floorPlanId] });
      closePinDialog();
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deletePinMutation = useMutation({
    mutationFn: (id: string) => api.deletePin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pins", floorPlanId] });
      setDeletePinId(null);
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  function closePinDialog() {
    setPinDialogOpen(false);
    setEditingPinId(null);
    setDraft(emptyDraft());
    setShowIssueSearch(false);
  }

  const DRAG_THRESHOLD = 5;

  function handleCanvasPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragStart.current = { x: e.clientX, y: e.clientY };
  }

  function handleCanvasPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      setIsPanning(true);
      setPanX((px) => px + dx);
      setPanY((py) => py + dy);
      dragStart.current = { x: e.clientX, y: e.clientY };
    }
  }

  function handleCanvasPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const wasPanning = isPanning;
    setIsPanning(false);
    dragStart.current = null;

    if (wasPanning) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !floorPlan) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    setDraft({ ...emptyDraft(), x, y });
    setPinDialogOpen(true);
  }

  function handlePinClick(e: React.MouseEvent, pin: any) {
    e.stopPropagation();
    setEditingPinId(pin.id);
    setDraft({
      x: parseFloat(pin.x),
      y: parseFloat(pin.y),
      label: pin.label,
      notes: pin.notes || "",
      panoDataUrl: null,
      panoFile: null,
      issueId: pin.issueId || "",
      issueTitle: pin.issueTitle || "",
      issueStatus: pin.issueStatus || "",
      issueSeverity: pin.issueSeverity || "",
    });
    setPinDialogOpen(true);
  }

  const handlePanoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDraft((prev) => ({ ...prev, panoDataUrl: reader.result as string, panoFile: file }));
    };
    reader.readAsDataURL(file);
  }, []);

  function zoomIn() {
    setScale((s) => Math.min(s * 1.3, 5));
  }
  function zoomOut() {
    setScale((s) => Math.max(s / 1.3, 0.3));
  }
  function resetView() {
    setScale(1);
    setPanX(0);
    setPanY(0);
  }

  function selectIssue(issue: any) {
    setDraft((prev) => ({
      ...prev,
      issueId: issue.id,
      issueTitle: issue.title || "",
      issueStatus: issue.status || "",
      issueSeverity: issue.severity || "",
    }));
    setShowIssueSearch(false);
  }

  const [exporting, setExporting] = useState(false);

  async function handleExportPDF() {
    if (!floorPlan || !projectId) return;
    setExporting(true);
    try {
      const pinsWithQR = await Promise.all(
        pins.map(async (pin: any) => ({
          id: pin.id,
          label: pin.label,
          x: parseFloat(pin.x),
          y: parseFloat(pin.y),
          panoUrl: pin.panoUrl,
          issueTitle: pin.issueTitle,
          issueStatus: pin.issueStatus,
          issueSeverity: pin.issueSeverity,
          notes: pin.notes,
          qrDataUrl: pin.panoUrl
            ? await QRCode.toDataURL(
                `${window.location.origin}/pano/${pin.id}`,
                { width: 120, margin: 1, color: { dark: "#1e293b", light: "#ffffff" } },
              )
            : undefined,
        })),
      );

      const project = await api.getProject(projectId);

      const blob = await pdf(
        <FloorPlanPDF
          projectTitle={project.title}
          floorPlanTitle={floorPlan.title}
          floorPlanImageUrl={floorPlan.imageUrl}
          pins={pinsWithQR}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${floorPlan.title.replace(/\s+/g, "_")}_report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }

  const viewingPin = viewingPanoId
    ? pins.find((p: any) => p.id === viewingPanoId)
    : null;

  if (loadingPlan) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between px-6 py-3 border-b bg-white shrink-0">
          <div>
            <Link
              href={`/project/${projectId}/floor-plans`}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              &larr; All Floor Plans
            </Link>
            <h1 className="text-lg font-bold text-slate-800">
              {floorPlan?.title || "Floor Plan"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{pins.length} pins</span>
            <Button variant="outline" size="sm" onClick={resetView}>
              <Move className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-slate-500 w-10 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={exporting}
            >
              <FileDown className="h-3.5 w-3.5 mr-1" />
              {exporting ? "Exporting..." : "Export PDF"}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-slate-200 relative">
          <div
            ref={containerRef}
            className="w-full h-full relative overflow-hidden touch-none"
            style={{ cursor: isPanning ? "grabbing" : "crosshair" }}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerLeave={() => { setIsPanning(false); dragStart.current = null; }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
                transformOrigin: "center center",
              }}
            >
              {floorPlan && (
                <img
                  src={floorPlan.imageUrl}
                  alt={floorPlan.title}
                  className="max-w-none"
                  style={{
                    width: floorPlan.width,
                    height: floorPlan.height,
                    maxWidth: "none",
                  }}
                  draggable={false}
                />
              )}

              {pins.map((pin: any) => (
                <button
                  key={pin.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer bg-transparent border-none p-0"
                  style={{ left: `${parseFloat(pin.x) * 100}%`, top: `${parseFloat(pin.y) * 100}%` }}
                  onClick={(e) => handlePinClick(e, pin)}
                  type="button"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-transform group-hover:scale-110">
                      <MapPin className="h-4 w-4 text-white fill-white" />
                    </div>
                    <span className="mt-0.5 px-1.5 py-0.5 bg-white/90 rounded text-[10px] font-medium text-slate-700 shadow whitespace-nowrap">
                      {pin.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={pinDialogOpen} onOpenChange={(open) => !open && closePinDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPinId ? "Edit Pin" : "New Pin"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-50 rounded-md px-3 py-2">
              <MapPin className="h-3.5 w-3.5" />
              Position: {(draft.x * 100).toFixed(1)}% &times;{" "}
              {(draft.y * 100).toFixed(1)}%
            </div>
            <div>
              <Label htmlFor="pin-label">Label</Label>
              <Input
                id="pin-label"
                value={draft.label}
                onChange={(e) => setDraft((p) => ({ ...p, label: e.target.value }))}
                placeholder="e.g. Crack in SW corner wall"
              />
            </div>
            <div>
              <Label htmlFor="pin-notes">Notes (optional)</Label>
              <Textarea
                id="pin-notes"
                value={draft.notes}
                onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))}
                rows={2}
              />
            </div>
            <div>
              <Label>360 Photo (optional)</Label>
              <div className="mt-1">
                <input
                  ref={panoInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handlePanoSelect}
                />
                {draft.panoDataUrl ? (
                  <div className="relative aspect-[2/1] bg-slate-100 rounded-md overflow-hidden">
                    <img
                      src={draft.panoDataUrl}
                      alt="360 preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
                      onClick={() =>
                        setDraft((p) => ({ ...p, panoDataUrl: null, panoFile: null }))
                      }
                    >
                      <X className="h-3.5 w-3.5 text-white" />
                    </button>
                  </div>
                ) : editingPinId && !draft.panoDataUrl ? (
                  <p className="text-xs text-slate-400 mb-1">
                    {pins.find((p: any) => p.id === editingPinId)?.panoUrl
                      ? "360 photo already attached"
                      : "No 360 photo attached"}
                  </p>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1"
                  onClick={() => panoInputRef.current?.click()}
                >
                  <Camera className="h-3.5 w-3.5 mr-1.5" />
                  {draft.panoDataUrl ? "Replace Photo" : "Select 360 Photo"}
                </Button>
              </div>
            </div>
            <div>
              <Label>Link Issue (optional)</Label>
              {draft.issueId ? (
                <div className="flex items-center justify-between mt-1 bg-slate-50 rounded-md px-3 py-2">
                  <div className="text-sm">
                    <span className="font-medium">{draft.issueTitle}</span>
                    <span className="text-xs text-slate-400 ml-2">
                      {draft.issueStatus} &middot; {draft.issueSeverity}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="text-red-400 hover:text-red-600"
                    onClick={() =>
                      setDraft((p) => ({
                        ...p,
                        issueId: "",
                        issueTitle: "",
                        issueStatus: "",
                        issueSeverity: "",
                      }))
                    }
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1"
                  onClick={() => setShowIssueSearch(!showIssueSearch)}
                >
                  <Link2 className="h-3.5 w-3.5 mr-1.5" />
                  Link to Issue
                </Button>
              )}
              {showIssueSearch && (
                <div className="mt-2 max-h-32 overflow-y-auto border rounded-md divide-y">
                  {loadingIssues && (
                    <p className="text-xs text-slate-400 p-2">Loading issues...</p>
                  )}
                  {!loadingIssues && allIssues.length === 0 && (
                    <p className="text-xs text-slate-400 p-2">No issues found in this project</p>
                  )}
                  {allIssues.map((issue: any) => (
                    <button
                      key={issue.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                      onClick={() => selectIssue(issue)}
                    >
                      <span className="font-medium">{issue.title}</span>
                      <span className="text-xs text-slate-400 ml-2">
                        {issue.status} &middot; {issue.severity}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editingPinId && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 mr-auto"
                onClick={() => {
                  closePinDialog();
                  setDeletePinId(editingPinId);
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            )}
            <div className="flex gap-2">
              {editingPinId &&
                pins.find((p: any) => p.id === editingPinId)?.panoUrl && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewingPanoId(editingPinId);
                      closePinDialog();
                    }}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    View 360
                  </Button>
                )}
              <Button variant="outline" onClick={closePinDialog}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  editingPinId
                    ? updatePinMutation.mutate()
                    : createPinMutation.mutate()
                }
                disabled={
                  !draft.label ||
                  (editingPinId ? updatePinMutation.isPending : createPinMutation.isPending)
                }
              >
                {editingPinId ? "Save" : "Add Pin"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletePinId}
        onOpenChange={() => setDeletePinId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pin?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this pin from the floor plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => deletePinId && deletePinMutation.mutate(deletePinId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {viewingPin && viewingPin.panoUrl && (
        <PanoViewer
          pin={viewingPin}
          onClose={() => setViewingPanoId(null)}
          open={!!viewingPanoId}
        />
      )}
    </Layout>
  );
}
