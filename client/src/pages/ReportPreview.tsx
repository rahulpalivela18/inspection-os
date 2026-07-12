import type { Project, Report, ProgressLog, ChecklistItem } from "@/lib/store";
import {
  buildDimensionsFromChecklist,
  DEFAULT_DIMENSION_UNIT,
} from "@/lib/defaultChecklist";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CompanyProfile {
  name: string;
  logoUrl?: string;
  address?: string;
  email?: string;
}

interface ReportPreviewProps {
  report: Report;
  project: Project;
  companyProfile: CompanyProfile;
  progressLogs?: ProgressLog[];
  pdfMode?: "initial" | "progress" | "completion";
}

export default function ReportPreview({
  report,
  project,
  companyProfile,
  progressLogs = [],
  pdfMode = "initial",
}: ReportPreviewProps) {
  const theme = {
    text: "text-indigo-600",
    bg: "bg-indigo-50",
    badge: "bg-indigo-100 text-indigo-700",
    blob: "bg-indigo-50/50",
  };

  const clientDisplayName = project.clientName?.trim() || project.title;
  const inspectionTypes = Array.isArray(report.inspectionType)
    ? report.inspectionType
    : [report.inspectionType || "Home Inspection"];
  const inspectionType = inspectionTypes.join(", ");
  const hasPageLogo = Boolean(companyProfile.logoUrl);
  const pageLogoWrapClass =
    "absolute right-6 top-6 md:right-[15mm] md:top-[15mm]";
  const pageLogoImageClass =
    "h-10 w-auto max-w-[120px] object-contain md:h-12 md:max-w-[140px]";

  const PageLogo = () =>
    hasPageLogo ? (
      <div className={pageLogoWrapClass}>
        <img
          src={companyProfile.logoUrl}
          alt={`${companyProfile.name} logo`}
          className={pageLogoImageClass}
        />
      </div>
    ) : null;
  const dimensionUnit = report.dimensionUnit ?? DEFAULT_DIMENSION_UNIT;
  const dimensions = buildDimensionsFromChecklist(
    report.checklist ?? [],
    report.dimensions ?? [],
    dimensionUnit,
  );
  const measuredDimensions = dimensions.filter(
    (d) => Number(d.length) > 0 && Number(d.width) > 0,
  );
  // Show checklist items in PDF if their status matches their triggerOn value (default to 'no')
  const failedChecklistItems = (report.checklist ?? []).filter((item) => {
    const trigger = item.triggerOn ?? "no";
    return (
      (trigger === "no" && item.status === "N") ||
      (trigger === "yes" && item.status === "Y")
    );
  });
  const majorFailuresCount = failedChecklistItems.filter(
    (item) => item.severity === "MAJOR",
  ).length;
  const photoEvidenceCount = failedChecklistItems.filter(
    (item) => item.image,
  ).length;

  const getAreaInSquareFeet = (
    length: string,
    width: string,
    unit: "ft" | "m",
  ) => {
    const l = Number(length),
      w = Number(width);
    if (!Number.isFinite(l) || !Number.isFinite(w) || l <= 0 || w <= 0)
      return 0;
    return unit === "m" ? l * w * 10.7639 : l * w;
  };

  const formatArea = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: value >= 100 ? 0 : 2,
    }).format(value);

  const spaceNameMap = new Map(
    dimensions.map((d) => [d.space, d.spaceName || d.space]),
  );
  const totalAreaSqFt = measuredDimensions.reduce(
    (sum, d) => sum + getAreaInSquareFeet(d.length, d.width, d.unit),
    0,
  );
  const totalAreaSqM = totalAreaSqFt / 10.7639;

  const checklistSeverityBreakdown = (
    [
      { label: "MAJOR", count: failedChecklistItems.filter((i) => i.severity === "MAJOR").length },
      { label: "MINOR", count: failedChecklistItems.filter((i) => i.severity === "MINOR").length },
      { label: "COSMETIC", count: failedChecklistItems.filter((i) => i.severity === "COSMETIC").length },
    ] as { label: string; count: number }[]
  ).filter((b) => b.count > 0);

  const checklistCategoryMap = new Map<string, number>();
  failedChecklistItems.forEach((item) => {
    const cat = spaceNameMap.get(item.category) || item.category;
    checklistCategoryMap.set(cat, (checklistCategoryMap.get(cat) || 0) + 1);
  });
  const checklistCategories = Array.from(checklistCategoryMap.entries()).map(
    ([category, count]) => ({ category, count }),
  );

  const issues = report.issues ?? [];
  const issueSeverityBreakdown = (
    [
      { label: "Critical", count: issues.filter((i) => i.severity === "Critical").length },
      { label: "High", count: issues.filter((i) => i.severity === "High").length },
      { label: "Medium", count: issues.filter((i) => i.severity === "Medium").length },
      { label: "Low", count: issues.filter((i) => i.severity === "Low").length },
    ] as { label: string; count: number }[]
  ).filter((b) => b.count > 0);

  const issueStatusBreakdown = (
    [
      { label: "Open", count: issues.filter((i) => i.status === "Open").length },
      { label: "In Progress", count: issues.filter((i) => i.status === "In Progress").length },
      { label: "Resolved", count: issues.filter((i) => i.status === "Resolved").length },
    ] as { label: string; count: number }[]
  ).filter((b) => b.count > 0);

  function PDFPage({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
      <div
        className={`relative overflow-hidden isolate bg-white break-after-page ${className}`}
        style={{
          width: "210mm",
          height: "297mm",
          contain: "layout paint",
        }}
      >
        {children}
      </div>
    );
  }

  const Watermark = () => (
    <div
      className="absolute inset-0 pointer-events-none select-none z-0"
      style={{ contain: "paint", overflow: "hidden" }}
      aria-hidden="true"
    >
      {[
        [20, 12], [20, 55],
        [80, 12], [80, 55],
      ].map(([left, top], i) => (
        <span
          key={i}
          className="absolute font-black text-slate-300 uppercase tracking-widest whitespace-nowrap"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            transform: "translate(-50%, -50%) rotate(-45deg)",
            fontSize: 20,
            opacity: 0.22,
          }}
        >
          {companyProfile.name}
        </span>
      ))}
    </div>
  );

  return (
    <div className="font-sans text-sm text-slate-900 leading-normal bg-white print:p-0 w-full max-w-[210mm] print:max-w-full print:w-full mx-auto overflow-hidden print:overflow-visible">
      {/* Cover Page */}
      <PDFPage className="p-8 md:p-[25mm] flex flex-col">
        <Watermark />
        <div
          className={cn(
            "absolute top-0 right-0 w-1/2 h-1/2 -rotate-12 translate-x-1/4 -translate-y-1/4 rounded-full blur-3xl -z-10 print:hidden",
            theme.blob,
          )}
        />
        <PageLogo />

        <div className="mt-8 mb-12 md:mb-16">
          <div
            className={cn(
              "text-4xl font-extrabold tracking-tight md:text-6xl",
              theme.text,
            )}
          >
            {companyProfile.name}
          </div>
          <div className="mt-2 h-1 w-20 rounded-full bg-slate-200" />
        </div>

        <div className="mt-auto">
          <div className="mb-12 md:mb-16 space-y-6">
            <div className="flex flex-wrap gap-2">
              {inspectionTypes.map((type: string, idx: number) => (
                <span
                  key={idx}
                  className={cn(
                    "inline-block px-4 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-full shadow-sm",
                    theme.badge,
                  )}
                >
                  {type}
                </span>
              ))}
            </div>
            <h1 className="text-5xl md:text-7xl font-black font-heading leading-[1.1] tracking-tight text-slate-900">
              {report.title}
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 font-medium">
              {project.title}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t-2 border-slate-900 pt-8">
            <div className="space-y-8">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                  Client
                </h3>
                <p className="text-xl md:text-2xl font-black text-slate-900">
                  {clientDisplayName}
                </p>
                {project.address && (
                  <p className="mt-1 text-sm md:text-base text-slate-500">
                    {project.address}
                  </p>
                )}
              </div>
              {project.description && (
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                    Project Description
                  </h3>
                  <p className="text-base md:text-lg text-slate-700 font-medium leading-relaxed">
                    {project.description}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-8">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                  Report Date
                </h3>
                <p className="text-xl md:text-2xl font-black text-slate-900">
                  {report.date
                    ? format(new Date(report.date), "MMMM d, yyyy")
                    : "N/A"}
                </p>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                  Prepared By
                </h3>
                <p className="text-xl md:text-2xl font-black text-slate-900">
                  {report.author}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center text-slate-400 text-[10px] font-bold tracking-widest gap-2">
          <span>REPORT ID: {report.id.toUpperCase()}</span>
          <span>CONFIDENTIAL</span>
        </div>
      </PDFPage>

      {/* Dimensions & Area Summary - Before Findings */}
      {measuredDimensions.length > 0 && (
        <PDFPage className="p-6 md:p-[15mm]">
          <Watermark />
          <div className="mb-12">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-2 text-slate-900">
              Dimensions & Area Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className={cn("rounded-2xl border p-4", theme.bg)}>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Total Measured
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {formatArea(totalAreaSqFt)} sq ft
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 bg-white">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Metric Equivalent
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {formatArea(totalAreaSqM)} sq m
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 bg-white">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Spaces Measured
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {measuredDimensions.length}
                </p>
              </div>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1.3fr_0.8fr_0.9fr_0.9fr_1fr] bg-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span>Space</span>
                <span>Unit</span>
                <span>Length</span>
                <span>Width</span>
                <span>Area</span>
              </div>
              <div className="divide-y divide-slate-100">
                {measuredDimensions.map((dimension) => {
                  const areaSqFt = getAreaInSquareFeet(
                    dimension.length,
                    dimension.width,
                    dimension.unit,
                  );
                  return (
                    <div
                      key={dimension.id}
                      className="grid grid-cols-[1.3fr_0.8fr_0.9fr_0.9fr_1fr] gap-2 px-4 py-3 text-sm text-slate-700 break-inside-avoid"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {dimension.spaceName || dimension.space}
                        </p>
                        {dimension.notes && (
                          <p className="mt-1 text-xs text-slate-500">
                            {dimension.notes}
                          </p>
                        )}
                      </div>
                      <span>{dimension.unit === "ft" ? "ft" : "m"}</span>
                      <span>{dimension.length}</span>
                      <span>{dimension.width}</span>
                      <span className="font-semibold text-slate-900">
                        {formatArea(areaSqFt)} sq ft
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </PDFPage>
      )}

      {/* Findings Section */}
      <PDFPage className="p-6 md:p-[15mm] flex flex-col">
        <Watermark />
        <PageLogo />

        <div className="flex-1">
          <div className="border-b-2 border-slate-900 pb-4 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mt-12 md:mt-0">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">
              Inspection Findings
            </h2>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              Section 01 / Technical Observations
            </span>
          </div>

          <div className="mb-12">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-2 text-slate-900 break-after-avoid">
              Checklist Exceptions
            </h3>
            {failedChecklistItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div className={cn("rounded-2xl border p-4", theme.bg)}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Failed Points
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {failedChecklistItems.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 bg-white">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Major Severity
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {majorFailuresCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 bg-white">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Photos Attached
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {photoEvidenceCount}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-medium text-emerald-800 break-inside-avoid-page">
                No failed checklist points were recorded for this inspection.
              </div>
            )}
          </div>
        </div>
      </PDFPage>

      {/* Checklist Summary — before individual items */}
      {failedChecklistItems.length > 0 && (
        <PDFPage className="p-6 md:p-[15mm] flex flex-col">
          <Watermark />
          <PageLogo />
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start mt-12 md:mt-0">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
                Summary &nbsp;·&nbsp; Checklist
              </p>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-tight mt-1">
                Checklist Summary
              </h2>
            </div>
          </div>

          {/* Severity breakdown */}
          {checklistSeverityBreakdown.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
                Severity Breakdown
              </h3>
              {checklistSeverityBreakdown.map((b) => {
                const total = failedChecklistItems.length;
                const pct = total > 0 ? (b.count / total) * 100 : 0;
                const barColor =
                  b.label === "MAJOR"
                    ? "bg-red-500"
                    : b.label === "MINOR"
                      ? "bg-orange-500"
                      : "bg-blue-500";
                return (
                  <div key={b.label} className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-slate-700 w-20 shrink-0">
                      {b.label}
                    </span>
                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-900 w-8 text-right">
                      {b.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Category breakdown */}
          {checklistCategories.length > 0 && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
                By Category
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-2 bg-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span>Category</span>
                  <span className="text-right">Failed</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {checklistCategories.map(({ category, count }) => (
                    <div
                      key={category}
                      className="grid grid-cols-2 px-4 py-2.5 text-sm text-slate-700"
                    >
                      <span className="font-semibold text-slate-900">
                        {category}
                      </span>
                      <span className="text-right font-bold text-indigo-600">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </PDFPage>
      )}

      {/* Failed Checklist Items — one per page, spread layout */}
      {failedChecklistItems.map((item, index) => (
        <PDFPage key={item.id} className="p-6 md:p-[15mm]">
          <Watermark />
          <PageLogo />

          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start mt-12 md:mt-0">
            <div className="flex-1 pr-6">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
                Failed Checklist Item &nbsp;·&nbsp; Observation {index + 1} of {failedChecklistItems.length}
              </p>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-tight mt-1">
                {item.point}
              </h2>
            </div>
            <div className="flex gap-2 shrink-0">
              <span className="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest border-amber-200 bg-amber-50 text-amber-700">
                Flagged
              </span>
              {item.severity && (
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                    item.severity === "MAJOR"
                      ? "border-red-200 bg-red-100 text-red-700"
                      : item.severity === "MINOR"
                        ? "border-orange-200 bg-orange-100 text-orange-700"
                        : "border-blue-200 bg-blue-100 text-blue-700",
                  )}
                >
                  {item.severity}
                </span>
              )}
            </div>
          </div>

          {/* Meta */}
          <div
            className="mb-6 pb-5 border-b border-slate-100"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Category
              </p>
              <p className="text-sm font-bold text-slate-800">
                {spaceNameMap.get(item.category) || item.category}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Inspection Type
              </p>
              <p className="text-sm font-bold text-slate-800">{inspectionType}</p>
            </div>
          </div>

          {/* Image — fixed height, full width, never overflows */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
              Photo Evidence
            </p>
            <div
              className="w-full rounded-2xl border border-slate-200 overflow-hidden bg-slate-50"
              style={{ height: "155mm" }}
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.point}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-medium text-slate-400">
                  No photo was attached for this checklist point.
                </div>
              )}
            </div>
          </div>
        </PDFPage>
      ))}

      {/* Issues Summary — before individual items */}
      {issues.length > 0 && (
        <PDFPage className="p-6 md:p-[15mm] flex flex-col">
          <Watermark />
          <PageLogo />
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start mt-12 md:mt-0">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
                Summary &nbsp;·&nbsp; Issues
              </p>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-tight mt-1">
                Issues Summary
              </h2>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={cn("rounded-2xl border p-4", theme.bg)}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Total Issues
              </p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {issues.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 bg-white">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Critical
              </p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {issues.filter((i) => i.severity === "Critical").length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 bg-white">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Open
              </p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {issues.filter((i) => i.status === "Open").length}
              </p>
            </div>
          </div>

          {/* Severity breakdown */}
          {issueSeverityBreakdown.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
                Severity Breakdown
              </h3>
              {issueSeverityBreakdown.map((b) => {
                const total = issues.length;
                const pct = total > 0 ? (b.count / total) * 100 : 0;
                const barColor =
                  b.label === "Critical"
                    ? "bg-red-500"
                    : b.label === "High"
                      ? "bg-orange-500"
                      : b.label === "Medium"
                        ? "bg-amber-500"
                        : "bg-slate-400";
                return (
                  <div key={b.label} className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-slate-700 w-20 shrink-0">
                      {b.label}
                    </span>
                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-900 w-8 text-right">
                      {b.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Status breakdown */}
          {issueStatusBreakdown.length > 0 && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
                Status Breakdown
              </h3>
              <div className="flex flex-wrap gap-2">
                {issueStatusBreakdown.map((b) => {
                  const colors =
                    b.label === "Open"
                      ? "bg-red-100 text-red-700 border-red-200"
                      : b.label === "In Progress"
                        ? "bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-emerald-100 text-emerald-700 border-emerald-200";
                  return (
                    <span
                      key={b.label}
                      className={`rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-widest ${colors}`}
                    >
                      {b.label}: {b.count}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </PDFPage>
      )}

      {/* Issues Section — one per page, spread layout */}
      {report.issues &&
        report.issues.map((issue: any, index: number) => (
          <PDFPage key={issue.id} className="p-6 md:p-[15mm]">
            <Watermark />
            <PageLogo />

            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-center mt-12 md:mt-0">
              <div className="flex items-center gap-3">
                <span className="bg-indigo-600 text-white w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
                    Issue {index + 1} of {report.issues!.length}
                  </p>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
                    {issue.title}
                  </h2>
                </div>
              </div>
              <span
                className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shrink-0",
                  issue.severity === "Critical"
                    ? "bg-red-100 text-red-700 border-red-200"
                    : issue.severity === "High"
                      ? "bg-orange-100 text-orange-700 border-orange-200"
                      : issue.severity === "Medium"
                        ? "bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-slate-100 text-slate-600 border-slate-200",
                )}
              >
                {issue.severity}
              </span>
            </div>

            {/* Notes */}
            <div className="mb-5 pb-5 border-b border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Observations & Notes
              </h4>
              <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                {issue.note}
              </p>
            </div>

            {/* Meta */}
            <div
              className="mb-6 pb-5 border-b border-slate-100"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Location
                </h4>
                <p className="text-sm font-bold text-indigo-600">
                  {issue.location}
                </p>
              </div>
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Responsible Engineer
                </h4>
                <p className="text-sm font-bold text-slate-800">
                  {issue.responsibleEngineer}
                </p>
              </div>
            </div>

            {/* Images — fixed mm heights so they never overflow */}
            {issue.images && issue.images.length > 0 && (
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Visual Evidence
                </h4>

                {/* 1 image — full width, tall */}
                {issue.images.length === 1 && (
                  <div
                    className="w-full rounded-2xl border border-slate-200 overflow-hidden bg-slate-50"
                    style={{ height: "148mm" }}
                  >
                    <img
                      src={issue.images[0]}
                      className="w-full h-full object-cover"
                      alt="Issue photo 1"
                    />
                  </div>
                )}

                {/* 2 images — side by side, full width */}
                {issue.images.length === 2 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                    }}
                  >
                    {issue.images.map((img: string, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50"
                        style={{ height: "130mm" }}
                      >
                        <img
                          src={img}
                          className="w-full h-full object-cover"
                          alt={`Issue photo ${idx + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* 3 images — first full width, then two side by side */}
                {issue.images.length === 3 && (
                  <div
                    style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}
                  >
                    <div
                      className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50"
                      style={{ height: "88mm", gridColumn: "1 / -1" }}
                    >
                      <img
                        src={issue.images[0]}
                        className="w-full h-full object-cover"
                        alt="Issue photo 1"
                      />
                    </div>
                    <div
                      className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50"
                      style={{ height: "72mm" }}
                    >
                      <img
                        src={issue.images[1]}
                        className="w-full h-full object-cover"
                        alt="Issue photo 2"
                      />
                    </div>
                    <div
                      className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50"
                      style={{ height: "72mm" }}
                    >
                      <img
                        src={issue.images[2]}
                        className="w-full h-full object-cover"
                        alt="Issue photo 3"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </PDFPage>
        ))}

      {/* ─── Progress / Completion Pages ──────────────────────────────────── */}
      {pdfMode !== "initial" && progressLogs.length > 0 && (() => {
        const allResolvedIds = new Set(
          progressLogs.flatMap((log) => log.resolvedChecklistItemIds ?? []),
        );
        const resolvedItems = failedChecklistItems.filter((c) => allResolvedIds.has(c.id));
        const unresolvedItems = failedChecklistItems.filter((c) => !allResolvedIds.has(c.id));
        const totalFailed = failedChecklistItems.length;
        const resolvedCount = resolvedItems.length;
        const progressPct = totalFailed > 0 ? Math.round((resolvedCount / totalFailed) * 100) : 0;

        // Build after photos map: latest photos per resolved item
        const afterPhotosMap: Record<string, string[]> = {};
        for (const log of progressLogs) {
          if (log.afterPhotos) {
            for (const [itemId, photos] of Object.entries(log.afterPhotos)) {
              if (Array.isArray(photos) && photos.length > 0) {
                afterPhotosMap[itemId] = photos;
              }
            }
          }
        }

        return (
          <>
            {/* ── Summary Page ───────────────────────────────────────────── */}
            <PDFPage className="p-6 md:p-[15mm] flex flex-col">
              <Watermark />
              <PageLogo />
              <div className="flex-1 mt-12 md:mt-0">
                <div className="border-b-2 border-slate-900 pb-4 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">
                    {pdfMode === "completion" ? "Completion Summary" : "Progress Status"}
                  </h2>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    {pdfMode === "completion" ? "Final Report" : `As of ${progressLogs[progressLogs.length - 1]?.date || "N/A"}`}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className={cn("rounded-2xl border p-4", theme.bg)}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Items</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{totalFailed}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resolved</p>
                    <p className="mt-2 text-2xl font-black text-emerald-700">{resolvedCount}</p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Remaining</p>
                    <p className="mt-2 text-2xl font-black text-amber-700">{unresolvedItems.length}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-700">Overall Progress</span>
                    <span className="text-sm font-black text-indigo-600">{progressPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-4">
                    <div className="bg-indigo-600 h-4 rounded-full" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>

                {/* Resolved Items */}
                {resolvedItems.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 mb-3">
                      Resolved Items ({resolvedItems.length})
                    </h3>
                    <div className="border border-emerald-200 rounded-xl overflow-hidden">
                      <div className="divide-y divide-emerald-100">
                        {resolvedItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50/50">
                            <span className="text-emerald-600 text-xs">✓</span>
                            <span className="text-sm font-medium text-slate-800 flex-1">{item.point}</span>
                            <span className="text-[10px] text-slate-400">{spaceNameMap.get(item.category) || item.category}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Remaining Items */}
                {unresolvedItems.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-amber-600 mb-3">
                      Remaining Items ({unresolvedItems.length})
                    </h3>
                    <div className="border border-amber-200 rounded-xl overflow-hidden">
                      <div className="divide-y divide-amber-100">
                        {unresolvedItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 bg-amber-50/50">
                            <span className="text-amber-600 text-xs">○</span>
                            <span className="text-sm font-medium text-slate-800 flex-1">{item.point}</span>
                            {item.severity && (
                              <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                item.severity === "MAJOR" ? "bg-red-100 text-red-600" :
                                item.severity === "MINOR" ? "bg-orange-100 text-orange-600" :
                                "bg-blue-100 text-blue-600",
                              )}>
                                {item.severity}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </PDFPage>

            {/* ── Individual Log Entry Pages ─────────────────────────────── */}
            {progressLogs.map((log, logIdx) => {
              const logResolvedItems = failedChecklistItems.filter(
                (c) => log.resolvedChecklistItemIds?.includes(c.id),
              );

              return (
                <PDFPage key={log.id} className="p-6 md:p-[15mm]">
                  <Watermark />
                  <PageLogo />

                  {/* Header */}
                  <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start mt-12 md:mt-0">
                    <div className="flex-1 pr-6">
                      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
                        Progress Log &nbsp;·&nbsp; Entry {logIdx + 1} of {progressLogs.length}
                      </p>
                      <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-tight mt-1">
                        {log.author}'s Visit
                      </h2>
                    </div>
                    <span className="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest border-indigo-200 bg-indigo-50 text-indigo-700 shrink-0">
                      {log.date}
                    </span>
                  </div>

                  {/* Notes */}
                  {log.notes && (
                    <div className="mb-6 pb-5 border-b border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Visit Notes
                      </h4>
                      <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                        {log.notes}
                      </p>
                    </div>
                  )}

                  {/* Resolved Items with Before/After */}
                  {logResolvedItems.length > 0 ? (
                    <div className="space-y-6">
                      {logResolvedItems.map((item) => {
                        const itemAfterPhotos = log.afterPhotos?.[item.id] ?? [];
                        return (
                          <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden break-inside-avoid">
                            {/* Item header */}
                            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                              <div>
                                <span className="text-sm font-bold text-slate-800">{item.point}</span>
                                <span className="text-[10px] text-slate-400 ml-2">
                                  {spaceNameMap.get(item.category) || item.category} · {item.severity}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                ✓ RESOLVED
                              </span>
                            </div>

                            {/* Before photo - full width, large */}
                            <div>
                              <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Before</span>
                              </div>
                              <div className="w-full bg-slate-50" style={{ height: "100mm" }}>
                                {item.image ? (
                                  <img src={item.image} alt="Before" className="w-full h-full object-contain" />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                    No before photo
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* After photos - full width, large */}
                            <div>
                              <div className="px-3 py-1.5 bg-emerald-50 border-b border-emerald-100">
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">
                                  After {itemAfterPhotos.length > 1 && `(${itemAfterPhotos.length} photos)`}
                                </span>
                              </div>
                              {itemAfterPhotos.length === 0 ? (
                                <div className="w-full bg-emerald-50/30 flex items-center justify-center" style={{ height: "100mm" }}>
                                  <span className="text-xs text-slate-400">No after photo</span>
                                </div>
                              ) : itemAfterPhotos.length === 1 ? (
                                <div className="w-full bg-emerald-50/30" style={{ height: "100mm" }}>
                                  <img src={itemAfterPhotos[0]} alt="After" className="w-full h-full object-contain" />
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-0.5 bg-slate-100 p-0.5">
                                  {itemAfterPhotos.map((photo, pIdx) => (
                                    <div key={pIdx} className="bg-emerald-50/30" style={{ height: "80mm" }}>
                                      <img src={photo} alt={`After ${pIdx + 1}`} className="w-full h-full object-contain" />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-500">
                      No items resolved during this visit.
                    </div>
                  )}
                </PDFPage>
              );
            })}

            {/* ── Sign-off Page — Completion mode only ──────────────────── */}
            {pdfMode === "completion" && (
              <PDFPage className="p-6 md:p-[15mm] flex flex-col">
                <Watermark />
                <PageLogo />
                <div className="flex-1 flex flex-col justify-center mt-12 md:mt-0">
                  <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6">
                      <span className="text-4xl text-emerald-600">✓</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2">
                      {unresolvedItems.length === 0 ? "All Items Resolved" : "Report Complete"}
                    </h2>
                    <p className="text-slate-500 text-lg">
                      {unresolvedItems.length === 0
                        ? "All identified issues have been addressed and verified."
                        : `${resolvedCount} of ${totalFailed} items resolved. ${unresolvedItems.length} items remaining.`}
                    </p>
                  </div>

                  <div className="border-t-2 border-slate-900 pt-8 mt-auto">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                          Inspector Signature
                        </p>
                        <div className="border-b border-slate-300 mb-2 pb-8" />
                        <p className="text-sm font-bold text-slate-700">{report.author}</p>
                        <p className="text-xs text-slate-400">{report.date}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                          Client Acknowledgment
                        </p>
                        <div className="border-b border-slate-300 mb-2 pb-8" />
                        <p className="text-sm font-bold text-slate-700">{project.clientName}</p>
                        <p className="text-xs text-slate-400">Date: _______________</p>
                      </div>
                    </div>
                  </div>
                </div>
              </PDFPage>
            )}
          </>
        );
      })()}

      {/* Footer */}
      <div className="border-t border-slate-100 bg-white p-6 text-center md:p-[15mm]">
        <div className="flex flex-col items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 md:flex-row md:text-[10px]">
          <span>End of Report</span>
          <span>
            Report generated by ReportGen ©️ {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </div>
  );
}
