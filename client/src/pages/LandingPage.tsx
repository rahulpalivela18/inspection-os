import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, CheckSquare, Building2, FileText, LockKeyhole } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 selection:bg-primary/10">
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-2 font-heading text-2xl font-bold text-primary">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              R
            </div>
            <span className="tracking-tight text-slate-900">ReportGen</span>
          </motion.div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="outline" className="rounded-xl font-semibold" data-testid="button-login">
                Log In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="rounded-xl font-semibold shadow-md" data-testid="button-register">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative flex flex-col items-center justify-center pt-32 pb-24 text-center px-4">
        <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[500px] w-[500px] translate-y-1/2 -translate-x-1/2 rounded-full bg-indigo-500/5 blur-[120px]" />

        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            Easy app for Construction Teams
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="max-w-4xl font-heading text-5xl font-black leading-tight tracking-tight text-slate-900 md:text-7xl mb-6"
        >
          Generate inspection reports in <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">minutes</span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-2xl text-xl leading-relaxed text-slate-600 mb-10"
        >
          Add your checklists. Take photos. Mark severity. Export beautiful PDFs. 
          Everything you need to run your inspections smoothly.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link href="/dashboard">
            <Button size="lg" className="h-14 rounded-2xl px-8 text-base font-bold shadow-xl shadow-primary/20" data-testid="button-start-report-flow">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.6, duration: 0.8 }} 
          className="mt-24 w-full max-w-5xl rounded-[2rem] border-4 border-white bg-white/50 p-2 shadow-2xl backdrop-blur-sm"
        >
          <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-100 relative">
            <img 
              src="/images/dashboard-mockup.png" 
              alt="Dashboard Preview" 
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>
      </section>
    </div>
  );
}
