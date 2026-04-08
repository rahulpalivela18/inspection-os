import { Project, Report, Issue, useStore } from "@/lib/store";
import { buildDimensionsFromChecklist, DEFAULT_DIMENSION_UNIT } from "@/lib/defaultChecklist";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ReportPreviewProps {
  report: Report;
  project: Project;
  issues: Issue[];
}

export default function ReportPreview({ report, project, issues }: ReportPreviewProps) {
  const { reportTemplates } = useStore();
  const template = reportTemplates.find(t => t.id === report.templateId) || {
    id: "default",
    name: "Standard",
    description: "",
    layout: "standard",
    includeLogoOnEveryPage: true,
    includeSignature: false,
    colorScheme: "indigo"
  };

  const colors = {
    indigo: {
      text: "text-indigo-600",
      bg: "bg-indigo-50",
      badge: "bg-indigo-100 text-indigo-700",
      blob: "bg-indigo-50/50"
    },
    blue: {
      text: "text-blue-600",
      bg: "bg-blue-50",
      badge: "bg-blue-100 text-blue-700",
      blob: "bg-blue-50/50"
    },
    slate: {
      text: "text-slate-800",
      bg: "bg-slate-100",
      badge: "bg-slate-200 text-slate-800",
      blob: "bg-slate-100/50"
    }
  };

  const theme = colors[template.colorScheme as keyof typeof colors] || colors.indigo;
  const clientDisplayName = project.clientName?.trim() || project.title;
  const inspectionType = report.inspectionType?.trim() || "Home Inspection";
  const dimensionUnit = report.dimensionUnit ?? DEFAULT_DIMENSION_UNIT;
  const dimensions = buildDimensionsFromChecklist(report.checklist ?? [], report.dimensions ?? [], dimensionUnit);
  const measuredDimensions = dimensions.filter((dimension) => Number(dimension.length) > 0 && Number(dimension.width) > 0);

  const getAreaInSquareFeet = (length: string, width: string, unit: "ft" | "m") => {
    const numericLength = Number(length);
    const numericWidth = Number(width);

    if (!Number.isFinite(numericLength) || !Number.isFinite(numericWidth) || numericLength <= 0 || numericWidth <= 0) {
      return 0;
    }

    const area = numericLength * numericWidth;
    return unit === "m" ? area * 10.7639 : area;
  };

  const formatArea = (value: number) => new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);

  const totalAreaSqFt = measuredDimensions.reduce(
    (sum, dimension) => sum + getAreaInSquareFeet(dimension.length, dimension.width, dimension.unit),
    0
  );
  const totalAreaSqM = totalAreaSqFt / 10.7639;

  return (
    <div className="font-sans text-sm text-slate-900 leading-normal bg-white print:p-0 w-full max-w-[210mm] print:max-w-full print:w-full mx-auto overflow-hidden print:overflow-visible">
      {/* Cover Page */}
      <div className="min-h-[297mm] print:min-h-0 flex flex-col p-6 md:p-[20mm] bg-white break-after-page relative overflow-hidden print:overflow-visible border-b print:border-0">
        <div className={cn("absolute top-0 right-0 w-1/2 h-1/2 -rotate-12 translate-x-1/4 -translate-y-1/4 rounded-full blur-3xl -z-10 print:hidden", theme.blob)} />
        
        <div className="mb-12 md:mb-24 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Client</p>
            <div className={cn("max-w-2xl text-3xl font-extrabold tracking-tight md:text-5xl", theme.text)}>{clientDisplayName}</div>
          </div>
          {project.logoUrl && (
            <div className="h-20 w-20 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-sm md:h-32 md:w-32 md:p-4">
              <img 
                src={project.logoUrl} 
                alt={`${project.title} logo`} 
                className="max-h-full max-w-full object-contain" 
              />
            </div>
          )}
        </div>

        <div className="mt-auto">
          <div className="space-y-4 mb-8 md:mb-12">
            <span className={cn("inline-block px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-full", theme.badge)}>
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
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Client</h3>
                <p className="text-lg md:text-xl font-bold">{project.clientName}</p>
                <p className="text-sm md:text-base text-slate-500">{project.address}</p>
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Project Site</h3>
                <p className="text-base md:text-lg font-semibold">{project.description}</p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Report Date</h3>
                <p className="text-lg md:text-xl font-bold">
                  {report.date ? format(new Date(report.date), "MMMM d, yyyy") : "N/A"}
                </p>
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Prepared By</h3>
                <p className="text-lg md:text-xl font-bold">{report.author}</p>
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Inspection Type</h3>
                <p className="text-base md:text-lg font-semibold">{inspectionType}</p>
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
        {/* Logo Header */}
        {project.logoUrl && template.includeLogoOnEveryPage && (
          <div className="absolute top-4 right-4 w-16 h-16 p-2 border border-slate-100 rounded-lg bg-white flex items-center justify-center overflow-hidden shadow-sm">
            <img src={project.logoUrl} alt="Client Logo" className="max-w-full max-h-full object-contain" />
          </div>
        )}
        
        <div className="p-6 md:p-[15mm] bg-white flex-1">
          <div className="border-b-2 border-slate-900 pb-4 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mt-12 md:mt-0">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">Inspection Findings</h2>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Section 01 / Technical Observations</span>
          </div>

          {/* Checklist Summary */}
          {report.checklist && report.checklist.length > 0 && (
            <div className="mb-12">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-2 text-slate-900 break-after-avoid">
                Checklist Summary
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                {Array.from(new Set(report.checklist.map(c => c.category))).map((category, catIdx) => {
                  const categoryItems = report.checklist?.filter(c => c.category === category);
                  if (!categoryItems || categoryItems.length === 0) return null;
                  
                  return (
                    <div key={category} className={cn(catIdx > 0 ? "border-t border-slate-200" : "", "break-inside-avoid-page")}>
                      <div className="bg-slate-100 px-4 py-2 font-bold text-xs uppercase tracking-wider text-slate-700 break-after-avoid">
                        {category}
                      </div>
                      <div className="divide-y divide-slate-100">
                        {categoryItems.map((item, itemIdx) => (
                          <div key={item.id} className="p-3 md:p-4 flex flex-col md:flex-row gap-3 md:items-start bg-white break-inside-avoid">
                            <div className="flex-1 flex gap-3">
                              <span className="text-xs font-bold text-slate-400 mt-0.5 w-5 shrink-0">{itemIdx + 1}.</span>
                              <p className="text-sm font-medium text-slate-800 leading-tight">{item.point}</p>
                            </div>
                            <div className="flex items-center gap-4 pl-8 md:pl-0 shrink-0">
                              {item.status === 'Y' && (
                                <span className="px-3 py-1 bg-green-100 text-green-800 text-[10px] font-black uppercase tracking-widest rounded-md border border-green-200">
                                  YES
                                </span>
                              )}
                              {item.status === 'N' && (
                                <div className="flex flex-col gap-1 items-end">
                                  <span className="px-3 py-1 bg-red-100 text-red-800 text-[10px] font-black uppercase tracking-widest rounded-md border border-red-200">
                                    NO
                                  </span>
                                  {item.severity && (
                                    <span className={cn(
                                      "px-2 py-0.5 text-[8px] font-bold uppercase rounded border",
                                      item.severity === "MAJOR" ? "bg-red-50 text-red-600 border-red-200" :
                                      item.severity === "MINOR" ? "bg-orange-50 text-orange-600 border-orange-200" :
                                      "bg-blue-50 text-blue-600 border-blue-200"
                                    )}>
                                      {item.severity}
                                    </span>
                                  )}
                                </div>
                              )}
                              {item.status === null && (
                                <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-slate-200">
                                  PENDING
                                </span>
                              )}
                              
                              {item.status === 'N' && item.image && (
                                <div className="h-10 w-14 rounded bg-slate-100 border overflow-hidden">
                                  <img src={item.image} alt="Defect" className="w-full h-full object-cover" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {measuredDimensions.length > 0 && (
            <div className="mb-12 break-inside-avoid-page">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-2 text-slate-900">
                Dimensions & Area Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div className={cn("rounded-2xl border p-4", theme.bg)}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Measured</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{formatArea(totalAreaSqFt)} sq ft</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 bg-white">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Metric Equivalent</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{formatArea(totalAreaSqM)} sq m</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 bg-white">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Spaces Measured</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{measuredDimensions.length}</p>
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
                    const areaSqFt = getAreaInSquareFeet(dimension.length, dimension.width, dimension.unit);
                    return (
                      <div key={dimension.id} className="grid grid-cols-[1.3fr_0.8fr_0.9fr_0.9fr_1fr] gap-2 px-4 py-3 text-sm text-slate-700 break-inside-avoid">
                        <div>
                          <p className="font-semibold text-slate-900">{dimension.space}</p>
                          {dimension.notes && <p className="mt-1 text-xs text-slate-500">{dimension.notes}</p>}
                        </div>
                        <span>{dimension.unit === "ft" ? "ft" : "m"}</span>
                        <span>{dimension.length}</span>
                        <span>{dimension.width}</span>
                        <span className="font-semibold text-slate-900">{formatArea(areaSqFt)} sq ft</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-8 md:space-y-12">
            {issues.length > 0 && (
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-2 text-slate-900 break-inside-avoid">
                Detailed Issues Log
              </h3>
            )}
            {issues.map((issue, index) => (
              <div key={issue.id} className="break-inside-avoid border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white mb-8">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <span className="bg-slate-900 text-white w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-black shrink-0">
                      {index + 1}
                    </span>
                    <h3 className="font-bold text-lg md:text-xl tracking-tight text-slate-900">{issue.title}</h3>
                  </div>
                  <div className="flex gap-2">
                    <span className={cn(
                      "px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider border shadow-sm",
                      issue.severity === "Critical" ? "bg-red-500 text-white border-red-600" :
                      issue.severity === "High" ? "bg-orange-500 text-white border-orange-600" :
                      issue.severity === "Medium" ? "bg-amber-100 text-amber-800 border-amber-200" :
                      "bg-slate-100 text-slate-800 border-slate-200"
                    )}>
                      {issue.severity}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 md:p-6">
                  <div className={cn("grid gap-6 md:gap-8", template.layout === "compact" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Observations & Notes</h4>
                        <p className="text-sm md:text-base text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">{issue.note}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div>
                          <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</h4>
                          <p className={cn("text-xs md:text-sm font-bold", theme.text)}>{issue.location}</p>
                        </div>
                        <div>
                          <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsible</h4>
                          <p className="text-xs md:text-sm font-bold">{issue.responsibleEngineer}</p>
                        </div>
                      </div>
                    </div>
                    
                    {issue.images && issue.images.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Visual Evidence</h4>
                        <div className={cn(
                          "grid gap-3",
                          issue.images?.length === 1 ? "grid-cols-1" : "grid-cols-2"
                        )}>
                          {issue.images?.map((img, idx) => (
                            <div key={idx} className={cn(
                              "bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm flex items-center justify-center p-2",
                              issue.images.length === 1 ? "aspect-video" : (idx === 0 && issue.images.length === 3 ? "col-span-2 aspect-[16/9]" : "aspect-square")
                            )}>
                              <img 
                                src={img} 
                                className="max-w-full max-h-full object-contain" 
                                alt={`Finding ${idx + 1}`} 
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {issues.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                <p className="text-slate-300 font-bold italic">No findings documented in this section.</p>
              </div>
            )}
          </div>
        </div>

        {/* Signature Section */}
        {template.includeSignature && (
          <div className="px-6 md:px-[15mm] pb-12 mt-12 bg-white break-inside-avoid">
            <div className="border-t border-slate-200 pt-8 w-64">
              <div className="h-16 mb-2"></div>
              <p className="text-xs font-bold text-slate-900">{report.author}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Inspector / Engineer</p>
            </div>
          </div>
        )}

        {/* Summary Footer */}
        <div className="p-6 text-center border-t border-slate-100 bg-white md:p-[15mm]">
          <div className="flex flex-col items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 md:flex-row md:text-[10px]">
            <span>End of Report</span>
            <span>Report generated by ReportGen © {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
