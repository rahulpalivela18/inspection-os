import { Project, Report, Issue } from "@/lib/store";
import { format } from "date-fns";

export default function ReportPreview({ report, project, issues }: { report: Report, project: Project, issues: Issue[] }) {
  return (
    <div className="font-sans text-sm text-slate-900 leading-normal">
      {/* Cover Page (First Slide) */}
      <div className="h-[297mm] flex flex-col p-[20mm] bg-white break-after-page relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-50/50 -rotate-12 translate-x-1/4 -translate-y-1/4 rounded-full blur-3xl -z-10" />
        
        <div className="flex justify-between items-start mb-24">
          <div className="text-4xl font-extrabold tracking-tighter text-indigo-600">ReportGen</div>
          {project.logoUrl && (
            <div className="w-24 h-24 p-2 border rounded-xl bg-white shadow-sm flex items-center justify-center">
              <img src={project.logoUrl} alt="Client Logo" className="w-full h-full object-contain" />
            </div>
          )}
        </div>

        <div className="mt-auto">
          <div className="space-y-4 mb-20">
            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest rounded-full">
              Inspection Report
            </span>
            <h1 className="text-6xl font-black font-heading leading-none tracking-tight text-slate-900">
              {report.title}
            </h1>
            <p className="text-2xl text-slate-500 font-medium">
              {project.title}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 border-t pt-12">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Client</h3>
                <p className="text-xl font-bold">{project.clientName}</p>
                <p className="text-slate-500">{project.address}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Project Site</h3>
                <p className="text-lg font-semibold">{project.description}</p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Report Date</h3>
                <p className="text-xl font-bold">{format(new Date(report.date), "MMMM d, yyyy")}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Prepared By</h3>
                <p className="text-xl font-bold">{report.author}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-24 pt-8 border-t flex justify-between items-center text-slate-400 text-xs font-medium">
          <span>REPORT ID: {report.id.toUpperCase()}</span>
          <span>CONFIDENTIAL</span>
        </div>
      </div>

      {/* Findings Pages */}
      <div className="p-[15mm] bg-white min-h-[297mm]">
        <div className="border-b-2 border-slate-900 pb-4 mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-black uppercase tracking-tight">Inspection Findings</h2>
          <span className="text-slate-400 text-xs font-bold">PAGE 2</span>
        </div>
        
        <div className="space-y-12">
          {issues.map((issue, index) => (
            <div key={issue.id} className="break-inside-avoid border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-black">
                    {index + 1}
                  </span>
                  <h3 className="font-bold text-xl tracking-tight">{issue.title}</h3>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                    issue.severity === "Critical" ? "bg-red-500 text-white border-red-600" :
                    issue.severity === "High" ? "bg-orange-500 text-white border-orange-600" :
                    issue.severity === "Medium" ? "bg-amber-100 text-amber-800 border-amber-200" :
                    "bg-slate-100 text-slate-800 border-slate-200"
                  }`}>
                    {issue.severity}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Observations & Notes</h4>
                      <p className="text-slate-700 leading-relaxed font-medium">{issue.note}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</h4>
                        <p className="text-sm font-bold text-indigo-600">{issue.location}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsible</h4>
                        <p className="text-sm font-bold">{issue.responsibleEngineer}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Visual Evidence</h4>
                    <div className={cn(
                      "grid gap-2",
                      issue.images?.length === 1 ? "grid-cols-1" : 
                      issue.images?.length === 2 ? "grid-cols-2" : "grid-cols-2"
                    )}>
                      {issue.images?.map((img, idx) => (
                        <div key={idx} className={cn(
                          "bg-slate-50 border rounded-lg overflow-hidden h-40 shadow-sm",
                          idx === 0 && issue.images.length === 3 ? "col-span-2 h-48" : ""
                        )}>
                          <img src={img} className="w-full h-full object-cover" alt="Finding" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {issues.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-3xl">
              <p className="text-slate-300 font-bold italic">No findings documented in this section.</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="mt-auto p-[15mm] text-center">
        <div className="border-t pt-8 flex justify-between items-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          <span>End of Report</span>
          <span>ReportGen System v1.0</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}
