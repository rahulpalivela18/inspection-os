import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  ClipboardCheck,
  Cloud,
  Database,
  FileText,
  FolderOpen,
  Gauge,
  Layers,
  MapPinned,
  Receipt,
  Server,
  Share2,
  Timer,
  Users,
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";

const workflow = [
  {
    icon: ClipboardCheck,
    title: "Build the checklist",
    desc: "Start from a reusable template or write your own. Group items by area, set severity levels, and reuse it on every report.",
  },
  {
    icon: Camera,
    title: "Capture on site",
    desc: "Upload photos and 360° panoramas from the field, organized by room, floor, or inspection zone.",
  },
  {
    icon: MapPinned,
    title: "Mark severity",
    desc: "Pin defects as hotspots directly on the image, each with a severity level, note, and resolution status.",
  },
  {
    icon: FileText,
    title: "Export the report",
    desc: "Generate a client-ready PDF with inspection data, dimensions, issues, and images, rendered in the browser.",
  },
  {
    icon: Share2,
    title: "Share securely",
    desc: "Send a tokenized, expiring, read-only link so clients can review the report without an account.",
  },
];

const features = [
  {
    icon: Layers,
    title: "Multi-tenant workspaces",
    desc: "Every company is an isolated workspace with its own data, team, and branding.",
  },
  {
    icon: ClipboardCheck,
    title: "Reusable checklists",
    desc: "Templated inspection flows with severity marking and photo attachments.",
  },
  {
    icon: MapPinned,
    title: "360° hotspot mapping",
    desc: "Pin defects on panoramas and photos with severity and resolution status.",
  },
  {
    icon: Users,
    title: "Roles and permissions",
    desc: "Separate access for admins, inspectors, and read-only viewers.",
  },
  {
    icon: Receipt,
    title: "Quotations and invoices",
    desc: "Line-item client quotes with rates and tax, exported to PDF.",
  },
  {
    icon: FolderOpen,
    title: "Client share portal",
    desc: "Expiring, read-only links so clients can view reports without signing up.",
  },
];

const stack = [
  {
    icon: Gauge,
    title: "Client",
    desc: "React 19 SPA built with Vite, wouter, and TanStack Query.",
  },
  {
    icon: Server,
    title: "Server",
    desc: "Express 5 JSON API with session auth and role-based middleware.",
  },
  {
    icon: Database,
    title: "Data",
    desc: "PostgreSQL with Drizzle ORM behind one shared, type-safe schema.",
  },
  {
    icon: Cloud,
    title: "Storage",
    desc: "Google Cloud Storage for site photos and 360° captures.",
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-primary/10">
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/home">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex cursor-pointer items-center gap-2 font-heading text-2xl font-bold text-primary"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                IO
              </div>
              <span className="tracking-tight text-slate-900">Inspection OS</span>
            </motion.div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button
                variant="ghost"
                className="rounded-xl font-semibold"
                data-testid="button-login"
              >
                Log In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="rounded-xl px-3 font-semibold sm:px-4">
                Get Started<span className="hidden sm:inline"> Free</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative flex flex-col items-center justify-center overflow-hidden px-4 pt-28 pb-16 text-center">
        <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5 blur-[120px] will-change-transform" />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            About Inspection OS
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="max-w-4xl font-heading text-5xl font-black leading-tight tracking-tight text-slate-900 md:text-6xl mb-6"
        >
          Inspection reports in{" "}
          <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
            minutes, not days
          </span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-2xl text-lg leading-relaxed text-slate-600"
        >
          Inspection OS is a workspace for property and building inspection
          teams. It replaces scattered photos, spreadsheets, and document
          templates with one focused flow: checklist, capture, mark severity,
          export, share.
        </motion.p>
      </section>

      <section className="px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2"
        >
          <div className="flex flex-col items-center rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
            <Timer className="mb-4 h-10 w-10 text-red-400" />
            <div className="mb-2 text-sm font-bold uppercase tracking-wider text-red-400">
              The old way
            </div>
            <div className="text-4xl font-black text-red-500">3 days</div>
            <div className="mt-2 text-sm text-red-400">per inspection report</div>
          </div>

          <div className="flex flex-col items-center rounded-2xl border border-green-200 bg-green-50 p-10 text-center">
            <Gauge className="mb-4 h-10 w-10 text-green-500" />
            <div className="mb-2 text-sm font-bold uppercase tracking-wider text-green-500">
              With Inspection OS
            </div>
            <div className="text-4xl font-black text-green-600">3 hours</div>
            <div className="mt-2 text-sm text-green-500">
              per inspection report
            </div>
          </div>
        </motion.div>
      </section>

      <section className="px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-6 flex justify-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                How it works
              </div>
            </motion.div>
            <motion.h2
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="font-heading text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl"
            >
              One workflow,{" "}
              <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                start to share
              </span>
            </motion.h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {workflow.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.5 }}
                className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-indigo-500/10">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-heading text-3xl font-black text-slate-100 transition-colors group-hover:text-primary/20">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mb-2 font-heading text-base font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-6 flex justify-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                What's inside
              </div>
            </motion.div>
            <motion.h2
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="font-heading text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl"
            >
              Everything an inspection team{" "}
              <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                needs
              </span>
            </motion.h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-indigo-500/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-heading text-lg font-bold text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-6 flex justify-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                Under the hood
              </div>
            </motion.div>
            <motion.h2
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="font-heading text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl"
            >
              A single,{" "}
              <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                type-safe stack
              </span>
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-4 text-lg leading-relaxed text-slate-600"
            >
              One deployable monolith and one shared schema across client and
              server, so the API contract cannot silently drift.
            </motion.p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stack.map((layer, i) => (
              <motion.div
                key={layer.title}
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-indigo-500/10">
                  <layer.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-heading text-lg font-bold text-slate-900">
                  {layer.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  {layer.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-gradient-to-br from-primary/5 via-white to-indigo-500/5 p-10 text-center shadow-sm md:p-14"
        >
          <h2 className="font-heading text-3xl font-black leading-tight tracking-tight text-slate-900 md:text-4xl">
            Start your next inspection here
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
            Create a workspace in minutes and take a report from the site to the
            client in one sitting.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button
                size="lg"
                className="h-14 rounded-2xl px-8 text-base font-bold shadow-xl shadow-primary/20"
              >
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="h-14 rounded-2xl px-8 text-base font-bold"
              >
                Talk to us
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-12 flex justify-center"
        >
          <Link href="/home">
            <Button variant="outline" className="gap-2 rounded-xl">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
