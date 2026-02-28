import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Zap, FileText, LayoutDashboard } from "lucide-react";
import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-heading font-bold text-2xl text-primary">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              R
            </div>
            ReportGen
          </div>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-indigo-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
            <Zap className="w-3 h-3" /> Professional Inspection Reporting
          </div>
          <h1 className="text-5xl md:text-7xl font-black font-heading tracking-tight text-slate-900 mb-6">
            Generate <span className="text-primary">Stunning</span> Reports <br /> in Minutes
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
            The ultimate tool for engineers and inspectors. Document issues, track findings, and export professional PDF reports with a single click.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/">
              <Button size="lg" className="h-14 px-8 text-lg shadow-xl shadow-primary/20">
                Start Building Now <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg">
              View Sample Report
            </Button>
          </div>

          <div className="mt-20 relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10" />
            <div className="rounded-2xl border bg-slate-50 p-4 shadow-2xl overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2070&auto=format&fit=crop" 
                alt="App Interface" 
                className="rounded-xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-slate-900 mb-4">Everything you need to scale</h2>
            <p className="text-slate-600 max-w-xl mx-auto">Focus on the inspection, we'll handle the formatting. Our tools are designed for speed and professional output.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-6">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Project Management</h3>
              <p className="text-slate-600">Organize your inspections by project and client. Track history and progress effortlessly.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Professional PDFs</h3>
              <p className="text-slate-600">Export industry-standard PDF documents with your branding, high-quality images, and structured findings.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Verified Findings</h3>
              <p className="text-slate-600">Document every issue with up to 3 images, location data, and responsible engineer tracking.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-heading font-bold text-xl text-primary opacity-50">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-[10px]">
              R
            </div>
            ReportGen
          </div>
          <p className="text-slate-400 text-sm">© 2026 ReportGen. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
