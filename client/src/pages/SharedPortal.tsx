import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { FileText, Camera, ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

function severityColor(s?: string) {
  switch (s) {
    case "MAJOR": return "bg-red-100 text-red-700 border-red-200";
    case "MINOR": return "bg-orange-100 text-orange-700 border-orange-200";
    case "COSMETIC": return "bg-blue-100 text-blue-700 border-blue-200";
    default: return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function statusIcon(s?: string) {
  switch (s) {
    case "Resolved": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "In Progress": return <Clock className="h-4 w-4 text-amber-600" />;
    default: return <AlertCircle className="h-4 w-4 text-red-600" />;
  }
}

function captureSeverityColor(s?: string) {
  switch (s) {
    case "Major": return "bg-red-100 text-red-700 border-red-200";
    case "Cosmetic": return "bg-orange-100 text-orange-700 border-orange-200";
    case "Minor": return "bg-green-100 text-green-700 border-green-200";
    default: return "bg-blue-100 text-blue-700 border-blue-200";
  }
}

export default function SharedPortal() {
  const [, params] = useRoute("/shared/:token");
  const token = params?.token;
  const [tab, setTab] = useState<"reports" | "captures">("reports");
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [viewCapture, setViewCapture] = useState<any>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["shared", token],
    queryFn: () => api.getSharedProject(token!),
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Link Expired or Invalid</h1>
          <p className="text-sm text-slate-500">This share link is no longer available.</p>
        </div>
      </div>
    );
  }

  const { project, reports, captures } = data;
  const allChecklist = reports.flatMap((r: any) => r.checklist ?? []);
  const failedItems = allChecklist.filter((c: any) => (c.triggerOn === "yes" ? c.status === "Y" : c.status === "N") && c.severity);
  const allResolvedIds = new Set(
    reports.flatMap((r: any) => (r.progressLogs ?? []).flatMap((log: any) => log.resolvedChecklistItemIds ?? []))
  );
  const resolvedCount = failedItems.filter((c: any) => allResolvedIds.has(c.id)).length;
  const progressPct = failedItems.length > 0 ? Math.round((resolvedCount / failedItems.length) * 100) : 0;

  const sevBreakdown = ["MAJOR", "MINOR", "COSMETIC"].map((s) => ({
    label: s,
    count: failedItems.filter((c: any) => c.severity === s).length,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {project.clientName && <span>{project.clientName} · </span>}
            {project.address}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Expires {new Date(data.expiresAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-6 w-fit">
          <button
            onClick={() => setTab("reports")}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors", tab === "reports" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700")}
          >
            <FileText className="h-4 w-4" /> Reports ({reports.length})
          </button>
          <button
            onClick={() => setTab("captures")}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors", tab === "captures" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700")}
          >
            <Camera className="h-4 w-4" /> Captures ({captures.length})
          </button>
        </div>

        {/* Reports Tab */}
        {tab === "reports" && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border p-4">
                <p className="text-2xl font-bold text-slate-900">{failedItems.length}</p>
                <p className="text-xs text-slate-500 mt-1">Total Issues</p>
              </div>
              <div className="bg-white rounded-xl border p-4">
                <p className="text-2xl font-bold text-green-600">{progressPct}%</p>
                <p className="text-xs text-slate-500 mt-1">Resolved</p>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                  <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
              <div className="bg-white rounded-xl border p-4">
                <div className="flex gap-3">
                  {sevBreakdown.map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="text-lg font-bold text-slate-900">{s.count}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{s.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-1">By Severity</p>
              </div>
            </div>

            {/* Report List */}
            <div className="space-y-3">
              {reports.map((report: any) => {
                const reportChecklist = report.checklist ?? [];
                const reportFailed = reportChecklist.filter((c: any) => (c.triggerOn === "yes" ? c.status === "Y" : c.status === "N") && c.severity);
                const reportResolvedIds = new Set(
                  (report.progressLogs ?? []).flatMap((log: any) => log.resolvedChecklistItemIds ?? [])
                );
                const reportResolved = reportFailed.filter((c: any) => reportResolvedIds.has(c.id)).length;
                const reportPct = reportFailed.length > 0 ? Math.round((reportResolved / reportFailed.length) * 100) : 0;
                const isExpanded = expandedReport === report.id;
                return (
                  <div key={report.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                      onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{report.title}</p>
                          <p className="text-xs text-slate-400">{report.author} · {report.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">{reportPct}%</p>
                          <p className="text-[10px] text-slate-400">{reportResolved}/{reportFailed.length} resolved</p>
                        </div>
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="border-t px-4 pb-4">
                        {/* Issues */}
                        {reportFailed.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Issues</p>
                            <div className="space-y-2">
                              {reportFailed.map((item: any) => (
                                <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50">
                                  {statusIcon(item.resolved ? "Resolved" : item.status)}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm text-slate-800 truncate">{item.point}</p>
                                      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border", severityColor(item.severity))}>
                                        {item.severity}
                                      </span>
                                      {allResolvedIds.has(item.id) && <span className="text-[10px] text-green-600 font-medium">Resolved</span>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Progress Log */}
                        {report.progressLogs?.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Progress Log</p>
                            <div className="space-y-3">
                              {report.progressLogs.map((log: any) => (
                                <div key={log.id} className="border-l-2 border-primary/20 pl-3 py-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-xs font-semibold text-slate-700">{log.author}</p>
                                    <p className="text-[10px] text-slate-400">{log.date}</p>
                                  </div>
                                  {log.notes && <p className="text-xs text-slate-600">{log.notes}</p>}
                                  {log.resolvedChecklistItemIds?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {log.resolvedChecklistItemIds.map((id: string) => {
                                        const item = report.checklist?.find((c: any) => c.id === id);
                                        return item ? (
                                          <span key={id} className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full border border-green-200">
                                            ✓ {item.point}
                                          </span>
                                        ) : null;
                                      })}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Captures Tab */}
        {tab === "captures" && (
          <div>
            {viewCapture ? (
              <div>
                <button
                  onClick={() => setViewCapture(null)}
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
                >
                  ← Back to captures
                </button>
                <h2 className="text-lg font-bold text-slate-900 mb-4">{viewCapture.title}</h2>
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="relative overflow-auto max-h-[70vh] flex justify-center">
                    <div className="relative inline-block">
                      <img
                        src={viewCapture.imageUrl}
                        alt={viewCapture.title}
                        style={{ width: viewCapture.width, height: viewCapture.height, maxWidth: "none" }}
                        className="block"
                      />
                      {viewCapture.hotspots?.map((h: any, i: number) => (
                        <div
                          key={h.id}
                          className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-[10px] font-bold text-white"
                          style={{
                            left: `${parseFloat(h.x) * 100}%`,
                            top: `${parseFloat(h.y) * 100}%`,
                            backgroundColor: h.issueSeverity === "Major" ? "#dc2626" : h.issueSeverity === "Cosmetic" ? "#f97316" : h.issueSeverity === "Minor" ? "#22c55e" : "#3b82f6",
                          }}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {viewCapture.hotspots?.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Observations</p>
                    {viewCapture.hotspots.map((h: any, i: number) => {
                      const dotColor = h.issueSeverity === "Major" ? "#dc2626" : h.issueSeverity === "Cosmetic" ? "#f97316" : h.issueSeverity === "Minor" ? "#22c55e" : "#3b82f6";
                      return (
                        <div key={h.id} className="bg-white rounded-lg border p-3 flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: dotColor }}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-slate-800">{h.label}</p>
                              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border", captureSeverityColor(h.issueSeverity))}>
                                {h.issueSeverity || "Info"}
                              </span>
                              {h.issueStatus && (
                                <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", h.issueStatus === "Resolved" ? "bg-green-50 text-green-700" : h.issueStatus === "In Progress" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>
                                  {h.issueStatus}
                                </span>
                              )}
                            </div>
                            {h.notes && <p className="text-xs text-slate-500 mt-1">{h.notes}</p>}
                            {h.panoUrl && (
                              <img src={h.panoUrl} alt="Evidence" className="mt-2 rounded border max-h-40 object-contain" />
                            )}
                            {h.resolvedPhoto && (
                              <div className="mt-2">
                                <p className="text-[10px] text-green-600 font-medium mb-1">Resolved Photo</p>
                                <img src={h.resolvedPhoto} alt="Resolved" className="rounded border max-h-40 object-contain" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {captures.map((cap: any) => (
                  <button
                    key={cap.id}
                    onClick={() => setViewCapture(cap)}
                    className="bg-white rounded-xl border shadow-sm overflow-hidden text-left hover:shadow-md transition-shadow group"
                  >
                    <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                      <img
                        src={cap.imageUrl}
                        alt={cap.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                      {cap.hotspots?.length > 0 && (
                        <div className="absolute top-2 right-2 bg-slate-900/70 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                          {cap.hotspots.length} {cap.hotspots.length === 1 ? "observation" : "observations"}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-slate-900">{cap.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {cap.width} &times; {cap.height}px &middot;{" "}
                        {new Date(cap.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
