import { useState, useRef, useMemo } from "react";
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
import {
  MapIcon,
  Plus,
  Trash2,
  Loader2,
  ImageUp,
  FileDown,
  AlertTriangle,
  AlertCircle,
  CircleDot,
  CheckCircle2,
  Hash,
  Layers,
  Search,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ensureJpeg } from "@/lib/utils";
import CapturePDF from "@/components/CapturePDF";
import { pdf } from "@react-pdf/renderer";
import { useAuth } from "@/lib/auth";

import {
  SEVERITY_COLORS,
  STATUS_COLORS,
  StackedBar,
  IssueBreakdownCard,
  ResolutionStatusCard,
  AreaSummaryTable,
} from "@/components/analytics/SharedAnalytics";

const PAGE_SIZE = 8;

export default function CaptureManager() {
  const { user, workspace } = useAuth();
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

  /* ── Filters ── */
  const [areaFilter, setAreaFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const projectId = params?.id;

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.getProject(projectId!),
    enabled: !!projectId,
  });

  const { data: captures = [], isLoading } = useQuery({
    queryKey: ["captures", projectId],
    queryFn: () => api.getCaptures(projectId!),
    enabled: !!projectId,
  });

  const { data: captureHotspots = [] } = useQuery({
    queryKey: ["allHotspots", projectId],
    queryFn: async () => {
      return Promise.all(
        captures.map(async (cap: any) => {
          const hotspots = await api.getHotspots(cap.id);
          return { capture: cap, hotspots };
        })
      );
    },
    enabled: !!projectId && captures.length > 0,
  });

  const hotspotsLoaded =
    captureHotspots.length === captures.length && captures.length > 0;

  /* ── Overall (unfiltered) project totals — power the KPI + analytics cards ── */
  const allPins = captureHotspots.flatMap((c) => c.hotspots);
  const overall = {
    major: allPins.filter((h: any) => h.issueSeverity === "Major").length,
    minor: allPins.filter((h: any) => h.issueSeverity === "Minor").length,
    cosmetic: allPins.filter((h: any) => h.issueSeverity === "Cosmetic").length,
    resolved: allPins.filter((h: any) => h.issueStatus === "Resolved").length,
    open: allPins.filter((h: any) => h.issueStatus === "Open").length,
    inProgress: allPins.filter((h: any) => h.issueStatus === "In Progress")
      .length,
    total: allPins.length,
  };
  const pct = (n: number) =>
    overall.total > 0 ? ((n / overall.total) * 100).toFixed(1) : "0.0";

  const uniqueAreas = Array.from(new Set(captures.map((c: any) => c.title)));

  const issueBreakdown = [
    { label: "Major", count: overall.major, color: SEVERITY_COLORS.Major },
    { label: "Minor", count: overall.minor, color: SEVERITY_COLORS.Minor },
    {
      label: "Cosmetic",
      count: overall.cosmetic,
      color: SEVERITY_COLORS.Cosmetic,
    },
  ];
  const resolutionBreakdown = [
    { label: "Open", count: overall.open, color: STATUS_COLORS.Open },
    {
      label: "Resolved",
      count: overall.resolved,
      color: STATUS_COLORS.Resolved,
    },
    {
      label: "In Progress",
      count: overall.inProgress,
      color: STATUS_COLORS["In Progress"],
    },
  ];
  const resolutionTotal = overall.open + overall.resolved + overall.inProgress;

  /* ── Filtered Area-Wise Defect Summary ── */
  const hotspotMatches = (h: any) => {
    if (severityFilter !== "all" && h.issueSeverity !== severityFilter)
      return false;
    if (statusFilter !== "all" && h.issueStatus !== statusFilter) return false;
    return true;
  };

  const areaSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        major: number;
        minor: number;
        cosmetic: number;
        resolved: number;
        total: number;
      }
    >();
    for (const { capture, hotspots } of captureHotspots) {
      if (areaFilter !== "all" && capture.title !== areaFilter) continue;
      if (
        search &&
        !capture.title.toLowerCase().includes(search.toLowerCase())
      )
        continue;
      const filtered = hotspots.filter(hotspotMatches);
      const existing =
        map.get(capture.title) ?? {
          major: 0,
          minor: 0,
          cosmetic: 0,
          resolved: 0,
          total: 0,
        };
      map.set(capture.title, {
        major:
          existing.major +
          filtered.filter((h: any) => h.issueSeverity === "Major").length,
        minor:
          existing.minor +
          filtered.filter((h: any) => h.issueSeverity === "Minor").length,
        cosmetic:
          existing.cosmetic +
          filtered.filter((h: any) => h.issueSeverity === "Cosmetic").length,
        resolved:
          existing.resolved +
          filtered.filter((h: any) => h.issueStatus === "Resolved").length,
        total: existing.total + filtered.length,
      });
    }
    return Array.from(map.entries())
      .map(([area, stats]) => ({ area, ...stats }))
      .filter((a) => a.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [captureHotspots, areaFilter, severityFilter, statusFilter, search]);

  const areaTotals = areaSummary.reduce(
    (acc, a) => ({
      major: acc.major + a.major,
      minor: acc.minor + a.minor,
      cosmetic: acc.cosmetic + a.cosmetic,
      resolved: acc.resolved + a.resolved,
      total: acc.total + a.total,
    }),
    { major: 0, minor: 0, cosmetic: 0, resolved: 0, total: 0 }
  );

  const totalPages = Math.max(1, Math.ceil(areaSummary.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedAreas = areaSummary.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  /* ── Filtered recent captures ── */
  const filteredCaptures = useMemo(() => {
    return [...captures]
      .filter((c: any) => areaFilter === "all" || c.title === areaFilter)
      .filter(
        (c: any) =>
          !search || c.title.toLowerCase().includes(search.toLowerCase())
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [captures, areaFilter, search]);

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
        }
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
      const projectData = await api.getProject(projectId);
      const logoUrl = workspace?.logoUrl
        ? await ensureJpeg(workspace.logoUrl)
        : undefined;
      const captureData = await Promise.all(
        captures.map(async (fp: any) => {
          const pins = await api.getHotspots(fp.id);
          const imageUrl = await ensureJpeg(fp.imageUrl);
          return {
            projectTitle: projectData.title,
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
            clientName: projectData.clientName,
            projectAddress: projectData.address,
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
        })
      );
      const allPdfPins = captureData.flatMap((c) => c.pins);
      const totalHotspots = allPdfPins.length;
      const severityBreakdown = ["Major", "Cosmetic", "Minor", "Info"].map(
        (sev) => ({
          severity: sev,
          count: allPdfPins.filter((p) => (p.severity || "Info") === sev)
            .length,
        })
      );
      const statusBreakdown = ["Open", "In Progress", "Resolved"].map((st) => ({
        status: st,
        count: allPdfPins.filter((p) => p.status === st).length,
      }));
      const blob = await pdf(
        <CapturePDF
          captures={captureData}
          cover={{
            projectTitle: projectData.title,
            clientName: projectData.clientName,
            projectAddress: projectData.address,
            companyName: workspace?.name,
            companyLogoUrl: logoUrl,
            companyAddress: workspace?.address,
            companyPhone: workspace?.phone,
            totalCaptures: captureData.length,
            totalHotspots,
            severityBreakdown,
            statusBreakdown,
          }}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectData.title.replace(/\s+/g, "_")}_captures.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({
        title: "Export failed",
        description: err.message,
        variant: "destructive",
      });
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

  const kpiCards = [
    {
      label: "Total Issues",
      value: overall.total,
      icon: Hash,
      color: "text-slate-600",
      bg: "bg-slate-100",
      valueColor: "text-slate-900",
      subtitle: `Across ${uniqueAreas.length} ${
        uniqueAreas.length === 1 ? "area" : "areas"
      }`,
    },
    {
      label: "Major Issues",
      value: overall.major,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
      valueColor: "text-red-600",
      subtitle: `${pct(overall.major)}% of total`,
    },
    {
      label: "Minor Issues",
      value: overall.minor,
      icon: AlertCircle,
      color: "text-amber-500",
      bg: "bg-amber-50",
      valueColor: "text-amber-600",
      subtitle: `${pct(overall.minor)}% of total`,
    },
    {
      label: "Cosmetic Issues",
      value: overall.cosmetic,
      icon: CircleDot,
      color: "text-blue-500",
      bg: "bg-blue-50",
      valueColor: "text-blue-600",
      subtitle: `${pct(overall.cosmetic)}% of total`,
    },
    {
      label: "Resolved Issues",
      value: overall.resolved,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      valueColor: "text-emerald-600",
      subtitle: `${pct(overall.resolved)}% of total`,
    },
  ];

  const selectCls =
    "h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none cursor-pointer hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <Layout>
      <div className="p-6 lg:p-8 space-y-6 max-w-[1440px] mx-auto">
        {/* ── Back link ── */}
        <button
          onClick={() => setLocation(`/project/${projectId}`)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project
        </button>

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Captures
            </h1>
            <div className="flex items-center gap-2 flex-wrap text-sm text-slate-500 mt-2">
              <span className="font-semibold text-slate-700">
                {project?.title ?? "Loading project..."}
              </span>
              <span className="w-[3px] h-[3px] rounded-full bg-slate-400" />
              <span>
                {overall.total} {overall.total === 1 ? "Issue" : "Issues"}
              </span>
              <span className="w-[3px] h-[3px] rounded-full bg-slate-400" />
              <span>
                {uniqueAreas.length}{" "}
                {uniqueAreas.length === 1 ? "Area" : "Areas"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {captures.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAllPDF}
                disabled={exportingAll}
                className="h-9"
              >
                <FileDown className="h-4 w-4 mr-1.5" />
                {exportingAll ? "Exporting..." : "Export PDF"}
              </Button>
            )}
            {user?.role !== "viewer" && (
              <Button
                size="sm"
                onClick={() => setIsUploadOpen(true)}
                className="h-9 bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                New Capture
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
            <MapIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No captures yet</p>
            <p className="text-sm mt-1">
              Upload any photo or 360° image to get started
            </p>
          </div>
        ) : (
          <>
            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
              {kpiCards.map((kpi) => (
                <div
                  key={kpi.label}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${kpi.bg} mb-3.5`}
                  >
                    <kpi.icon className={`h-[18px] w-[18px] ${kpi.color}`} />
                  </div>
                  <p
                    className={`text-3xl lg:text-[2rem] font-extrabold tabular-nums leading-none ${kpi.valueColor}`}
                  >
                    {kpi.value}
                  </p>
                  <p className="text-[13px] font-semibold text-slate-600 mt-2.5">
                    {kpi.label}
                  </p>
                  <p className="text-[11.5px] text-slate-400 mt-1">
                    {kpi.subtitle}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Analytics ── */}
            {hotspotsLoaded && overall.total > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IssueBreakdownCard
                  items={issueBreakdown}
                  totalCount={overall.total}
                />
                <ResolutionStatusCard
                  segments={resolutionBreakdown}
                  resolvedCount={overall.resolved}
                  totalCount={resolutionTotal}
                />
              </div>
            )}

            {/* ── Filters + Area Wise Defect Summary ── */}
            {hotspotsLoaded && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Filter bar */}
                <div className="flex flex-wrap items-center gap-2.5 px-5 py-4 border-b border-slate-100">
                  <select
                    className={selectCls}
                    value={areaFilter}
                    onChange={(e) => {
                      setAreaFilter(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">All Areas</option>
                    {uniqueAreas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  <select
                    className={selectCls}
                    value={severityFilter}
                    onChange={(e) => {
                      setSeverityFilter(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">All Issue Types</option>
                    <option value="Major">Major</option>
                    <option value="Minor">Minor</option>
                    <option value="Cosmetic">Cosmetic</option>
                  </select>
                  <select
                    className={selectCls}
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search area or issue..."
                      className="w-full h-9 rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <p className="px-6 pt-5 pb-1 text-[15px] font-bold text-slate-900">
                  Area Wise Defect Summary
                </p>

                <AreaSummaryTable
                  areas={pagedAreas}
                  totals={areaTotals}
                  totalCount={areaSummary.length}
                  page={safePage}
                  totalPages={totalPages}
                  safePage={safePage}
                  onPageChange={setPage}
                />
              </div>
            )}

            {/* ── Recent Captures ── */}
            <div>
              <p className="text-[15px] font-bold text-slate-900 mb-4">
                Recent Captures
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {filteredCaptures.map((fp: any) => {
                  const capTotal =
                    captureHotspots.find((c: any) => c.capture.id === fp.id)
                      ?.hotspots.length ?? 0;
                  return (
                    <div
                      key={fp.id}
                      onClick={() =>
                        setLocation(
                          `/project/${projectId}/captures/${fp.id}`
                        )
                      }
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group cursor-pointer"
                    >
                      <div className="aspect-[16/11] bg-slate-100 relative overflow-hidden">
                        <img
                          src={fp.imageUrl}
                          alt={fp.title}
                          className="w-full h-full object-cover"
                        />
                        {user?.role !== "viewer" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(fp.id);
                            }}
                            className="absolute top-2 right-2 h-7 w-7 grid place-items-center rounded-lg bg-white/90 text-red-600 shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="px-3.5 pt-3 pb-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-slate-900 text-[13.5px] leading-snug">
                            {fp.title}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {capTotal} {capTotal === 1 ? "hotspot" : "hotspots"}
                        </p>
                        <p className="text-[11.5px] text-slate-400 mt-2 flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {fp.createdAt
                            ? new Date(fp.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )
                            : "—"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
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
              <span className="text-sm text-slate-700">
                This is a 360° panorama image
              </span>
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
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
