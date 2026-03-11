import { Project, Report, Issue, useStore } from "@/lib/store";
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

  return (
    <div className="font-sans text-sm text-slate-900 leading-normal bg-white print:p-0 w-full overflow-x-hidden">
      {/* Cover Page */}
      <div className="min-h-[296mm] flex flex-col p-6 md:p-[20mm] bg-white break-after-page relative overflow-hidden border-b print:border-0">
        <div className={cn("absolute top-0 right-0 w-1/2 h-1/2 -rotate-12 translate-x-1/4 -translate-y-1/4 rounded-full blur-3xl -z-10", theme.blob)} />
        
        <div className="flex justify-between items-start mb-12 md:mb-24">
          <div className={cn("text-3xl md:text-4xl font-extrabold tracking-tighter", theme.text)}>ReportGen</div>
          {project.logoUrl && (
            <div className="w-20 h-20 md:w-32 md:h-32 p-2 md:p-4 border border-slate-100 rounded-xl md:rounded-2xl bg-white shadow-sm flex items-center justify-center overflow-hidden">
              <img 
                src={project.logoUrl} 
                alt="Client Logo" 
                className="max-w-full max-h-full object-contain" 
              />
            </div>
          )}
        </div>

        <div className="mt-auto">
          <div className="space-y-4 mb-12 md:mb-20">
            <span className={cn("inline-block px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-full", theme.badge)}>
              Inspection Report
            </span>
            <h1 className="text-4xl md:text-6xl font-black font-heading leading-tight md:leading-none tracking-tight text-slate-900">
              {report.title}
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 font-medium">
              {project.title}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 border-t border-slate-100 pt-8 md:pt-12">
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
            </div>
          </div>
        </div>

        <div className="mt-12 md:mt-24 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center text-slate-400 text-[10px] font-medium gap-2">
          <span>REPORT ID: {report.id.toUpperCase()}</span>
          <span>CONFIDENTIAL</span>
        </div>
      </div>

      {/* Findings Section */}
      <div className="flex flex-col min-h-[297mm] relative">
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
          
          <div className="space-y-8 md:space-y-12">
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
        <div className="p-6 md:p-[15mm] text-center border-t border-slate-100 bg-white">
          <div className="flex flex-col md:flex-row justify-between items-center text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest gap-2">
            <span>End of Report</span>
            <span>ReportGen System v1.0</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
