import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, CheckSquare, Building2, FileText, LockKeyhole } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

const features = [
  {
    icon: <CheckSquare className="h-6 w-6" />,
    title: "One checklist, every time",
    desc: "Whenever a new report is created, the same checklist is already included automatically.",
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: "Simple inspection flow",
    desc: "Open the report, mark YES or NO, add severity and photo when something fails, then export the PDF.",
  },
  {
    icon: <Building2 className="h-6 w-6" />,
    title: "Private to one company",
    desc: "The checklist belongs to that client workspace only and is not shared with anyone else.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white selection:bg-primary/10">
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-2 font-heading text-2xl font-bold text-primary">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              R
            </div>
            <span className="tracking-tight text-slate-900">ReportGen</span>
          </motion.div>
          <Link href="/dashboard">
            <Button className="rounded-xl font-semibold shadow-md" data-testid="button-enter-workspace">
              Enter Workspace
            </Button>
          </Link>
        </div>
      </nav>

      <section className="relative pb-24 pt-24">
        <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[500px] w-[500px] translate-y-1/2 -translate-x-1/2 rounded-full bg-indigo-500/5 blur-[120px]" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
          <div>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary md:text-xs">
                <LockKeyhole className="h-3.5 w-3.5" /> Simple by default
              </div>
            </motion.div>

            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="mb-8 font-heading text-5xl font-black leading-[1.02] tracking-tight text-slate-900 md:text-7xl"
            >
              Every new report opens with the <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">same checklist already inside</span>.
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="max-w-3xl text-lg leading-relaxed text-slate-600 md:text-2xl"
            >
              No checklist selection, no extra setup for inspectors. Just create a report, fill the checklist, add photo evidence for NO items, and export a professional PDF.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.6 }}
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
            >
              <Link href="/dashboard">
                <Button size="lg" className="h-14 rounded-2xl px-8 text-base font-bold shadow-2xl shadow-primary/20" data-testid="button-start-report-flow">
                  Open Workspace <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/templates">
                <Button size="lg" variant="outline" className="h-14 rounded-2xl border-2 px-8 text-base font-semibold" data-testid="button-view-master-checklist">
                  View Master Checklist
                </Button>
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.8 }} className="mt-10 flex flex-wrap items-center gap-6 text-sm font-medium text-slate-500 md:text-base">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Auto-loaded checklist</span>
              <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Report-first workflow</span>
              <span className="flex items-center gap-2"><LockKeyhole className="h-4 w-4" /> Private client data</span>
            </motion.div>
          </div>

          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35, duration: 0.7 }}>
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_-24px_rgba(15,23,42,0.18)]">
              <div className="border-b border-slate-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-600">How it works</p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">One clean report flow</h2>
                <p className="mt-2 text-sm text-slate-600">This keeps the product aligned with what your client actually asked for.</p>
              </div>
              <div className="space-y-4 p-6">
                {features.map((feature) => (
                  <div key={feature.title} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-500">{feature.desc}</p>
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
