import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Zap, FileText, LayoutDashboard, CheckCircle2, Star, Users } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-white selection:bg-primary/10">
      {/* Navigation */}
      <nav className="border-b bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-2 font-heading font-bold text-2xl text-primary"
          >
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              R
            </div>
            <span className="tracking-tight text-slate-900">ReportGen</span>
          </motion.div>
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3"
          >
            <Link href="/dashboard">
              <Button variant="ghost" className="font-medium text-slate-600">Login</Button>
            </Link>
            <Link href="/dashboard">
              <Button className="font-semibold shadow-md">Get Started</Button>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 animate-pulse" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-8 border border-primary/20">
              <Zap className="w-3.5 h-3.5 fill-primary" /> The Industry Standard for Engineers
            </div>
          </motion.div>

          <motion.h1 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-6xl md:text-8xl font-black font-heading tracking-tight text-slate-900 mb-8 leading-[1.05]"
          >
            Generate <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Professional</span> <br /> Reports Fast
          </motion.h1>

          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Stop wasting hours on manual formatting. Document findings, attach evidence, and export boardroom-ready PDF reports with our intelligent platform.
          </motion.p>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            <Link href="/dashboard">
              <Button size="lg" className="h-16 px-10 text-lg font-bold shadow-2xl shadow-primary/25 rounded-2xl hover:scale-105 transition-transform">
                Go to Dashboard <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-16 px-10 text-lg font-semibold rounded-2xl border-2 hover:bg-slate-50 transition-all">
              See a Demo Report
            </Button>
          </motion.div>

          {/* Social Proof */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-8 text-slate-400 font-medium grayscale"
          >
            <span className="flex items-center gap-1"><Users className="w-5 h-5" /> Trusted by 500+ Engineering Firms</span>
            <span className="flex items-center gap-1"><Star className="w-5 h-5 fill-slate-400" /> 4.9/5 Average Rating</span>
          </motion.div>

          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-24 relative max-w-6xl mx-auto"
          >
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/80 to-transparent z-10" />
            <div className="rounded-[2.5rem] border-8 border-slate-900 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden bg-slate-900 group">
              <img 
                src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2070&auto=format&fit=crop" 
                alt="Product Dashboard Preview" 
                className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 bg-slate-50 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-slate-900 mb-6">Engineered for Efficiency</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">We built the tools we wished we had during field inspections. Everything you need, nothing you don't.</p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-10"
          >
            {[
              {
                icon: <LayoutDashboard className="w-7 h-7" />,
                title: "Unified Dashboard",
                desc: "Manage all your projects, clients, and historical reports from a single, intuitive interface.",
                color: "indigo"
              },
              {
                icon: <Zap className="w-7 h-7" />,
                title: "Live PDF Export",
                desc: "What you see is what you get. Our preview system ensures your reports look perfect every time.",
                color: "amber"
              },
              {
                icon: <CheckCircle2 className="w-7 h-7" />,
                title: "Evidence Tracking",
                desc: "Attach photos, notes, and severity levels to every finding to provide undeniable proof.",
                color: "emerald"
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                variants={itemVariants}
                className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-inner ${
                  feature.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                  feature.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                  'bg-emerald-50 text-emerald-600'
                }`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed text-lg">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-12 border-b border-slate-100">
            <div className="flex items-center gap-2 font-heading font-bold text-2xl text-primary">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm shadow-md">
                R
              </div>
              <span className="text-slate-900">ReportGen</span>
            </div>
            <div className="flex gap-10 text-slate-500 font-medium">
              <Link href="/dashboard" className="hover:text-primary transition-colors">Features</Link>
              <Link href="/dashboard" className="hover:text-primary transition-colors">Pricing</Link>
              <Link href="/dashboard" className="hover:text-primary transition-colors">Support</Link>
            </div>
          </div>
          <div className="pt-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-slate-400 text-sm">© 2026 ReportGen. Built for the future of engineering.</p>
            <div className="flex gap-6 grayscale opacity-50">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">ISO 9001 Certified</span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">SOC2 Type II</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
