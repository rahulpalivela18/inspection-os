import { Button } from "@/components/ui/button";
import { Mail, Phone, Linkedin, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";

export default function Contact() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-primary/10">
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex cursor-pointer items-center gap-2 font-heading text-2xl font-bold text-primary"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                R
              </div>
              <span className="tracking-tight text-slate-900">ReportGen</span>
            </motion.div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button
                variant="outline"
                className="rounded-xl font-semibold"
              >
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative flex flex-col items-center justify-center px-4 py-24">
        <div className="pointer-events-none absolute right-1/4 top-1/4 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[150px] will-change-transform" />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            Get in touch
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="max-w-3xl text-center font-heading text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl mb-4"
        >
          Let's set up your{" "}
          <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
            workspace
          </span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-16 max-w-xl text-center text-lg leading-relaxed text-slate-600"
        >
          Reach out and we'll get you started with ReportGen.
        </motion.p>

        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="grid gap-6 md:grid-cols-2"
        >
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-indigo-500/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Email</p>
              <a
                href="mailto:rahulpalivela18@gmail.com"
                className="font-heading text-lg font-bold text-slate-900 hover:text-primary"
              >
                rahulpalivela18@gmail.com
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-indigo-500/10">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Phone</p>
              <a
                href="tel:+916302143004"
                className="font-heading text-lg font-bold text-slate-900 hover:text-primary"
              >
                +91 63021 43004
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-indigo-500/10">
              <Linkedin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">LinkedIn</p>
              <a
                href="https://in.linkedin.com/in/rahul-palivela-4342ba16b"
                target="_blank"
                rel="noopener noreferrer"
                className="font-heading text-lg font-bold text-slate-900 hover:text-primary"
              >
                Rahul Palivela
              </a>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-12"
        >
          <Link href="/">
            <Button variant="outline" className="rounded-xl gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
