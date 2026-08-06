import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  LayoutDashboard,
  ClipboardCheck,
  FileText,
  MapPinned,
  CheckCircle2,
  Clock,
  TrendingUp,
  BadgeCheck,
  Settings,
} from "lucide-react";
import { Link } from "wouter";
import { animate, motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Footer from "@/components/Footer";
import { useAuth } from "@/lib/auth";

function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.8,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return <div ref={ref}>{display.toLocaleString()}</div>;
}

export default function LandingPage() {
  const { user, isLoading } = useAuth();
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
            {!isLoading &&
              (user ? (
                <>
                  <Link href="/settings">
                    <Button variant="ghost" className="rounded-xl font-semibold">
                      <Settings className="h-4 w-4 mr-1.5" />
                      Settings
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button className="rounded-xl font-semibold">
                      <LayoutDashboard className="h-4 w-4 mr-1.5" />
                      Dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <>
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
                    <Button
                      className="rounded-xl font-semibold"
                      data-testid="button-signup"
                    >
                      Sign Up Free
                    </Button>
                  </Link>
                </>
              ))}
          </div>
        </div>
      </nav>

      <section className="relative flex flex-col items-center justify-center overflow-hidden pt-32 pb-24 text-center px-4">
        <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5 blur-[120px] will-change-transform" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[500px] w-[500px] translate-y-1/2 -translate-x-1/2 rounded-full bg-indigo-500/5 blur-[120px] will-change-transform" />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            Streamline your property inspections
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="max-w-4xl font-heading text-5xl font-black leading-tight tracking-tight text-slate-900 md:text-7xl mb-6"
        >
          Generate inspection reports in{" "}
          <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
            minutes
          </span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-2xl text-xl leading-relaxed text-slate-600 mb-10"
        >
          Add your checklists. Take photos. Mark severity. Export 
          PDFs. Everything you need to run your inspections smoothly.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.6 }}
        >
          <Link href="/register">
            <Button
              size="lg"
              className="h-14 rounded-2xl px-8 text-base font-bold shadow-xl shadow-primary/20"
              data-testid="button-start-report-flow"
            >
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-6 inline-flex items-center gap-2 text-sm text-slate-500"
        >
          <BadgeCheck className="h-4 w-4 text-primary" />
          Trusted by inspection companies across India
        </motion.div>

        <div className="mx-auto mt-24 grid max-w-7xl gap-8 md:grid-cols-3">
          {[
            {
              icon: LayoutDashboard,
              title: "Project Dashboard",
              desc: "Manage all your inspection projects in one place. Search, filter, and track status at a glance.",
              image: "/images/about-projects.png",
            },
            {
              icon: ClipboardCheck,
              title: "Smart Checklists",
              desc: "Custom checklists with severity marking, photo attachments, and auto-generated reports.",
              image: "/images/about-checklist.png",
            },
            {
              icon: FileText,
              title: "Professional Reports",
              desc: "Export beautiful PDF reports with inspection data, dimensions, issues, and site images.",
              image: "/images/about-report.png",
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.15, duration: 0.6 }}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-indigo-500/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-heading text-xl font-bold text-slate-900">
                {feature.title}
              </h3>
              <p className="mb-6 text-sm leading-relaxed text-slate-600">
                {feature.desc}
              </p>
              <div className="flex items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-2">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="max-h-48 w-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 + 3 * 0.15, duration: 0.6 }}
          className="mx-auto mt-8 w-full max-w-7xl"
        >
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-indigo-500/10">
              <MapPinned className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-heading text-2xl font-bold text-slate-900">
              Visual Hotspot Mapping
            </h3>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
              Pin defects directly on 360° photos with severity levels and
              status tracking. Visual inspection reporting made precise.
            </p>
          </div>
          <video
            src="https://storage.googleapis.com/reportgen-images-rahul/hotspot-demo-1785183126989.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="aspect-video w-full rounded-2xl object-cover shadow-2xl shadow-primary/10"
          >
            Your browser does not support the video tag.
          </video>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mx-auto mt-16 flex flex-col items-center gap-4"
        >
          <p className="text-sm font-medium text-slate-500">
            Want to see a finished report?
          </p>
          <a href="/pdfs/InspectionOS_Sample.pdf" target="_blank" download>
            <Button variant="outline" className="rounded-xl gap-2">
              <FileText className="h-4 w-4" />
              Download Sample PDF
            </Button>
          </a>
        </motion.div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-y border-slate-200 bg-white py-16 px-4">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {[
            { number: "724", label: "Defects Tracked" },
            { number: "15", label: "Projects Completed" },
            { number: "371", label: "Site Captures" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.6 }}
              className="text-center"
            >
              <div className="text-5xl font-black text-slate-900 md:text-6xl">
                <Counter value={parseInt(stat.number, 10)} />
              </div>
              <div className="mt-2 text-sm font-medium uppercase tracking-wider text-slate-500">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Before / After ── */}
      <section className="py-20 px-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 flex max-w-7xl items-center justify-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            Why Inspection OS?
          </div>
        </motion.div>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <motion.div
            initial={{ x: -40, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col items-center rounded-2xl border border-red-200 bg-red-50 p-10 text-center"
          >
            <Clock className="mb-4 h-10 w-10 text-red-400" />
            <div className="text-sm font-bold uppercase tracking-wider text-red-400 mb-2">
              Before Inspection OS
            </div>
            <div className="text-4xl font-black text-red-500">3 days</div>
            <div className="mt-2 text-sm text-red-400">per inspection report</div>
          </motion.div>

          <motion.div
            initial={{ x: 40, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="flex flex-col items-center rounded-2xl border border-green-200 bg-green-50 p-10 text-center"
          >
            <TrendingUp className="mb-4 h-10 w-10 text-green-500" />
            <div className="text-sm font-bold uppercase tracking-wider text-green-500 mb-2">
              After Inspection OS
            </div>
            <div className="text-4xl font-black text-green-600">3 hours</div>
            <div className="mt-2 text-sm text-green-500">per inspection report</div>
          </motion.div>
        </div>
      </section>

      <section className="relative py-24 md:py-32 px-4">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-950/5 to-slate-900/5" />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-6 flex max-w-7xl items-center justify-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            Pricing
          </div>
        </motion.div>

        <motion.h2
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="mx-auto max-w-3xl text-center font-heading text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl mb-4"
        >
          Simple, transparent{" "}
          <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
            pricing
          </span>
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mx-auto mb-16 max-w-2xl text-center text-lg leading-relaxed text-slate-600"
        >
          One workspace. Unlimited viewers. Pay only for your inspectors.
        </motion.p>

        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
          {[
            {
              name: "Starter",
              price: "5,000",
              desc: "Best for small teams getting started",
              popular: false,
              features: [
                "Up to 2 inspectors",
                "Unlimited viewers",
                "Custom checklists",
                "Photo attachments",
                "PDF report export",
                "Email support",
              ],
            },
            {
              name: "Pro",
              price: "8,000",
              desc: "Best for growing inspection teams",
              popular: true,
              features: [
                "Up to 9 inspectors",
                "Unlimited viewers",
                "Everything in Starter",
                "Priority support",
                "Advanced reporting",
                "Team management",
              ],
            },
            {
              name: "Enterprise",
              price: "15,000",
              desc: "Best for large organisations",
              popular: false,
              features: [
                "Unlimited inspectors",
                "Unlimited viewers",
                "Everything in Pro",
                "Dedicated support",
                "Custom integrations",
                "SLA guarantee",
              ],
            },
          ].map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.15, duration: 0.6 }}
              className={`relative flex flex-col rounded-2xl border-2 bg-white p-8 shadow-sm transition-all duration-300 ${
                plan.popular
                  ? "border-primary shadow-xl shadow-primary/10 scale-105 lg:scale-110"
                  : "border-slate-200 hover:border-primary/40 hover:shadow-lg"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-indigo-600 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="mb-6 text-center">
                <h3 className="mb-1 font-heading text-xl font-bold text-slate-900">
                  {plan.name}
                </h3>
                <p className="text-sm text-slate-500">{plan.desc}</p>
              </div>

              <div className="mb-8 text-center">
                <span className="text-5xl font-black text-slate-900">
                  ₹{plan.price}
                </span>
                <span className="text-base font-medium text-slate-500">
                  /month
                </span>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-3 text-sm text-slate-700"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link href="/register">
                <Button
                  className={`w-full rounded-xl font-bold ${
                    plan.popular && "shadow-lg shadow-primary/30"
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  Start Free Trial
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mx-auto mt-16 max-w-2xl rounded-2xl border border-slate-200 bg-white/50 p-6 text-center backdrop-blur-sm"
        >
          <p className="text-sm leading-relaxed text-slate-600">
            One subscription per company/workspace. No per-user billing
            complexity. <br className="hidden sm:inline" />
            Best for small teams. Easy to upgrade later.
          </p>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
