import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CloudDownload,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import {
  downloadProjectForOffline,
  getOfflinePackage,
  clearOfflinePackage,
  formatBytes,
  type OfflinePackage,
  type PrefetchProgress,
} from "@/lib/prefetch";
import { useToast } from "@/hooks/use-toast";

// Per-project "Make Available Offline" — downloads the project's data +
// image bytes (see lib/prefetch.ts) so field work survives dead zones.
export function OfflineDownloadButton({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [pkg, setPkg] = useState<OfflinePackage | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<PrefetchProgress | null>(null);

  useEffect(() => {
    getOfflinePackage(projectId).then(setPkg);
  }, [projectId]);

  const handleDownload = async () => {
    setBusy(true);
    setProgress({ phase: "data", done: 0, total: 1 });
    try {
      const result = await downloadProjectForOffline(projectId, setProgress);
      setPkg(result);
      toast({
        title: "Available offline",
        description:
          result.imageCount > 0
            ? `${result.imageCount} photos (${formatBytes(result.imageBytes)}) saved on this device.`
            : "Project data saved. No photos found in this project yet.",
      });
    } catch {
      toast({
        title: "Download failed",
        description: "Couldn't finish the offline package. Try again on WiFi.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const handleRemove = async () => {
    await clearOfflinePackage(projectId);
    setPkg(null);
  };

  if (busy && progress) {
    const pct =
      progress.phase === "done"
        ? 100
        : progress.total > 0
          ? Math.round((progress.done / progress.total) * 100)
          : 0;
    return (
      <Button size="lg" variant="outline" disabled className="w-full sm:w-auto">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {progress.phase === "data"
          ? "Saving project data…"
          : `Saving photos… ${pct}%`}
      </Button>
    );
  }

  if (pkg) {
    const ageDays = Math.floor((Date.now() - pkg.downloadedAt) / 86400000);
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Available offline • {formatBytes(pkg.imageBytes)}
          {ageDays > 0 ? ` • ${ageDays}d ago` : " • today"}
          {pkg.errors > 0 ? ` • ${pkg.errors} skipped` : ""}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            className="flex-1"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Update
          </Button>
          <Button size="sm" variant="ghost" onClick={handleRemove}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      size="lg"
      variant="outline"
      onClick={handleDownload}
      className="w-full sm:w-auto"
      data-testid="button-offline-download"
    >
      <CloudDownload className="mr-2 h-4 w-4" /> Make Available Offline
    </Button>
  );
}
