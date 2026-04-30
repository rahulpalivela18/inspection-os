import type { Project, Report } from "@/lib/store";
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
}

export default function ReportPreview({
  report,
  project,
  companyProfile,
}: ReportPreviewProps) {
  const theme = {
    text: "text-indigo-600",
    bg: "bg-indigo-50",
    badge: "bg-indigo-100 text-indigo-700",
    blob: "bg-indigo-50/50",
  };

  const clientDisplayName = project.clientName?.trim() || project.title;
  const inspectionType = report.inspectionType?.trim() || "Home Inspection";
  const hasPageLogo = Boolean(project.logoUrl);
  const pageLogoWrapClass =
    "absolute right-6 top-6 md:right-[15mm] md:top-[15mm]";
  const pageLogoImageClass =
    "h-10 w-auto max-w-[120px] object-contain md:h-12 md:max-w-[140px]";
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

  const totalAreaSqFt = measuredDimensions.reduce(
    (sum, d) => sum + getAreaInSquareFeet(d.length, d.width, d.unit),
    0,
  );
  const totalAreaSqM = totalAreaSqFt / 10.7639;

  return (
    <div className="font-sans text-sm text-slate-900 leading-normal bg-white print:p-0 w-full max-w-[210mm] print:max-w-full print:w-full mx-auto overflow-hidden print:overflow-visible">
      {/* Cover Page */}
      <div className="min-h-[297mm] print:min-h-0 flex flex-col p-6 md:p-[20mm] bg-white break-after-page relative overflow-hidden print:overflow-visible border-b print:border-0">
        <div
          className={cn(
            "absolute top-0 right-0 w-1/2 h-1/2 -rotate-12 translate-x-1/4 -translate-y-1/4 rounded-full blur-3xl -z-10 print:hidden",
            theme.blob,
          )}
        />
        {hasPageLogo && (
          <div className={pageLogoWrapClass}>
            <img
              src={project.logoUrl}
              alt={`${project.title} logo`}
              className={pageLogoImageClass}
            />
          </div>
        )}

        <div className="mb-16 pr-24 md:mb-24 md:pr-[160px]">
          <div
            className={cn(
              "max-w-2xl text-3xl font-extrabold tracking-tight md:text-5xl",
              theme.text,
            )}
          >
            {companyProfile.name}
          </div>
        </div>

        <div className="mt-auto">
          <div className="space-y-4 mb-8 md:mb-12">
            <span
              className={cn(
                "inline-block px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-full",
                theme.badge,
              )}
            >
              {inspectionType}
            </span>
            <h1 className="text-4xl md:text-5xl font-black font-heading leading-tight md:leading-none tracking-tight text-slate-900">
              {report.title}
            </h1>
            <p className="text-xl text-slate-500 font-medium">
              {project.title}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Client
                </h3>
                <p className="text-lg md:text-xl font-bold">
                  {clientDisplayName}
                </p>
                <p className="text-sm md:text-base text-slate-500">
                  {project.address}
                </p>
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Project Site
                </h3>
                <p className="text-base md:text-lg font-semibold">
                  {project.description}
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Report Date
                </h3>
                <p className="text-lg md:text-xl font-bold">
                  {report.date
                    ? format(new Date(report.date), "MMMM d, yyyy")
                    : "N/A"}
                </p>
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Prepared By
                </h3>
                <p className="text-lg md:text-xl font-bold">{report.author}</p>
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Inspection Type
                </h3>
                <p className="text-base md:text-lg font-semibold">
                  {inspectionType}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center text-slate-400 text-[10px] font-medium gap-2">
          <span>REPORT ID: {report.id.toUpperCase()}</span>
          <span>CONFIDENTIAL</span>
        </div>
      </div>

      {/* Findings Section */}
      <div className="flex flex-col relative print:min-h-0 break-before-page">
        {hasPageLogo && (
          <div className={pageLogoWrapClass}>
            <img
              src={project.logoUrl}
              alt="Client Logo"
              className={pageLogoImageClass}
            />
          </div>
        )}

        <div className="p-6 md:p-[15mm] bg-white flex-1">
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

          {measuredDimensions.length > 0 && (
            <div className="mb-12 break-inside-avoid-page">
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
                            {dimension.space}
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
          )}

          {failedChecklistItems.map((item, index) => (
            <div
              key={item.id}
              className="break-before-page border-t border-slate-100 bg-white p-6 md:p-[15mm] relative"
            >
              {hasPageLogo && (
                <div className={pageLogoWrapClass}>
                  <img
                    src={project.logoUrl}
                    alt="Client Logo"
                    className={pageLogoImageClass}
                  />
                </div>
              )}
              <div className="mx-auto flex min-h-[255mm] max-w-[180mm] flex-col">
                <div className="mb-5 border-b border-slate-100 pb-4 pr-24 md:pr-[160px]">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                    Failed checklist item
                  </p>
                  <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h3 className="text-2xl font-black tracking-tight text-slate-900">
                      Observation {index + 1}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <span className={cn("rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest", item.status === "Y" ? "border-green-200 bg-green-100 text-green-700" : "border-yellow-200 bg-yellow-100 text-yellow-700")}>
                        {item.status === "Y" ? "YES" : "NO"}
                      </span>
                      {item.severity && (
                        <span
                          className={cn(
                            "rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                            item.severity === "MAJOR"
                              ? "border-red-200 bg-red-50 text-red-700"
                              : item.severity === "MINOR"
                                ? "border-orange-200 bg-orange-50 text-orange-700"
                                : "border-blue-200 bg-blue-50 text-blue-700",
                          )}
                        >
                          {item.severity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-5">
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.point}
                        className="h-[132mm] w-full object-contain bg-white"
                      />
                    ) : (
                      <div className="flex h-[132mm] items-center justify-center px-8 text-center text-sm font-medium text-slate-400">
                        No photo was attached for this failed checklist point.
                      </div>
                    )}
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                      Checklist point
                    </p>
                    <p className="mt-3 text-xl font-bold leading-snug text-slate-900">
                      {item.point}
                    </p>
                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                          Category
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {item.category}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                          Inspection type
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {inspectionType}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {failedChecklistItems.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
              <p className="text-slate-300 font-bold italic">
                No failed findings documented.
              </p>
            </div>
          )}

          {/* Issues Section - Same structure as reference */}
          {report.issues && report.issues.length > 0 && (
            <div className="p-[15mm] bg-white min-h-[297mm]">
              <div className="border-b-2 border-slate-900 pb-4 mb-8 flex justify-between items-center">
                <h2 className="text-2xl font-black uppercase tracking-tight">Issue Reports</h2>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Section 02 / Issues</span>
              </div>
        
              <div className="space-y-12">
                {report.issues.map((issue: any, index) => (
                  <div key={issue.id} className="break-inside-avoid border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white mb-8">
                    <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <span className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-black">
                          {index + 1}
                        </span>
                        <h3 className="font-bold text-xl tracking-tight text-slate-900">{issue.title}</h3>
                      </div>
                      <div className="flex gap-2">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                          issue.severity === "Critical" ? "bg-red-500 text-white border-red-600" :
                          issue.severity === "High" ? "bg-orange-500 text-white border-orange-600" :
                          issue.severity === "Medium" ? "bg-amber-100 text-amber-800 border-amber-200" :
                          "bg-slate-100 text-slate-800 border-slate-200"
                        )}>
                          {issue.severity}
                        </span>
                      </div>
                    </div>
                 
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Observations & Notes</h4>
                              <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">{issue.note}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</h4>
                                <p className="text-sm font-bold text-indigo-600">{issue.location}</p>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsible Engineer</h4>
                                <p className="text-sm font-bold">{issue.responsibleEngineer}</p>
                            </div>
                          </div>
                        </div>
                  
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Visual Evidence</h4>
                          <div className={cn(
                            "grid gap-3",
                            issue.images?.length === 1 ? "grid-cols-1" : "grid-cols-2"
                          )}>
                            {issue.images?.map((img: string, idx: number) => (
                              <div key={idx} className={cn(
                                "bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm flex items-center justify-center p-2",
                                idx === 0 && issue.images.length === 3 ? "col-span-2 aspect-[16/9]" : "aspect-square"
                              )}>
                                <img 
                                  src={img} 
                                  className="max-w-full max-h-full object-contain" 
                                  alt={`Issue ${index + 1} - Photo ${idx + 1}`} 
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-slate-100 bg-white p-6 text-center md:p-[15mm]">
          <div className="flex flex-col items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 md:flex-row md:text-[10px]">
            <span>End of Report</span>
            <span>
              Report generated by ReportGen © {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
