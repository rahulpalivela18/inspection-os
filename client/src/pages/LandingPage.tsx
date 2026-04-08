import { Button } from "@/components/ui/button";
import { ArrowRight, LockKeyhole, ShieldCheck, Building2, CheckCircle2, FileText, Users } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

const features = [
  {
    icon: <Building2 className="w-6 h-6" />,
    title: "Private company workspaces",
    desc: "Every client gets their own workspace, projects, reports, and checklist library.",
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Confidential checklist templates",
    desc: "Inspection points stay inside one company and are never shared across other clients.",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Reusable report workflows",
    desc: "Templates are copied into each report so historical inspections stay unchanged.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white selection:bg-primary/10 overflow-x-hidden">
      <nav className="border-b bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-2 font-heading font-bold text-2xl text-primary">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              R
            </div>
            <span className="tracking-tight text-slate-900">ReportGen</span>
          </motion.div>
          <div className="flex items-center gap-3">
            <Link href="/templates">
              <Button variant="ghost" className="font-medium text-slate-600" data-testid="button-open-checklist-library-from-landing">
                Checklist Library
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="font-semibold shadow-md rounded-xl" data-testid="button-enter-workspace">
                Enter Workspace
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-24 pb-24">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative grid lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
          <div>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] md:text-xs font-bold uppercase tracking-widest mb-8 border border-primary/20">
                <LockKeyhole className="w-3.5 h-3.5" /> Phase 1 · Private workspace foundation
              </div>
            </motion.div>

            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="text-5xl md:text-7xl font-black font-heading tracking-tight text-slate-900 mb-8 leading-[1.02]"
            >
              Build a <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">confidential</span> inspection workspace for every client.
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-lg md:text-2xl text-slate-600 max-w-3xl leading-relaxed"
            >
              ReportGen is evolving into a company-based inspection platform where checklist templates stay private, reports stay structured, and field teams can work from one secure operating flow.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center gap-4 mt-10"
            >
              <Link href="/dashboard">
                <Button size="lg" className="h-14 px-8 text-base font-bold shadow-2xl shadow-primary/20 rounded-2xl" data-testid="button-start-phase-one">
                  Open Phase 1 Workspace <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/templates">
                <Button size="lg" variant="outline" className="h-14 px-8 text-base font-semibold rounded-2xl border-2" data-testid="button-review-private-library">
                  Review Private Library
                </Button>
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.8 }} className="mt-10 flex flex-wrap items-center gap-6 text-slate-500 font-medium text-sm md:text-base">
              <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Company-scoped workspaces</span>
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Private checklist templates</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Report-ready inspection flows</span>
            </motion.div>
          </div>

          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35, duration: 0.7 }}>
            <div className="rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_-24px_rgba(15,23,42,0.18)] overflow-hidden">
              <div className="border-b border-slate-100 p-6 bg-gradient-to-br from-indigo-50 via-white to-slate-50">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-600">Phase 1 priority</p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">Private company workspace</h2>
                <p className="mt-2 text-sm text-slate-600">The foundation for confidential checklist templates, project-level reports, and team access later.</p>
              </div>
              <div className="p-6 space-y-4">
                {features.map((feature) => (
                  <div key={feature.title} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{feature.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
