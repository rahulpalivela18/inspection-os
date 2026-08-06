import { Button } from "@/components/ui/button";
import { Mail, Phone, Linkedin, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import { useState } from "react";

const WEB3FORMS_KEY = "bda9b856-d84a-48cc-a2fa-7396dd8dac44";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    data.append("access_key", WEB3FORMS_KEY);
    data.append("subject", "New Inspection OS Contact Form Submission");
    data.append("from_name", "Inspection OS Contact Form");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (json.success) {
        setSubmitted(true);
        form.reset();
      }
    } catch {}
    setSending(false);
  }

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
              <Button variant="outline" className="rounded-xl font-semibold">
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
          className="mb-12 max-w-xl text-center text-lg leading-relaxed text-slate-600"
        >
          Reach out and we'll get you started with Inspection OS.
        </motion.p>

        {/* Contact Cards */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="grid gap-4 md:grid-cols-3 mb-12 w-full max-w-3xl"
        >
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-indigo-500/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">Email</p>
              <a
                href="mailto:rahulpalivela18@gmail.com"
                className="font-heading text-sm font-bold text-slate-900 hover:text-primary truncate block"
              >
                rahulpalivela18@gmail.com
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-indigo-500/10">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Phone</p>
              <a
                href="tel:+916302143004"
                className="font-heading text-sm font-bold text-slate-900 hover:text-primary"
              >
                +91 63021 43004
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-indigo-500/10">
              <Linkedin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">LinkedIn</p>
              <a
                href="https://in.linkedin.com/in/rahul-palivela-4342ba16b"
                target="_blank"
                rel="noopener noreferrer"
                className="font-heading text-sm font-bold text-slate-900 hover:text-primary"
              >
                Rahul Palivela
              </a>
            </div>
          </div>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="w-full max-w-3xl"
        >
          {submitted ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Message sent!</h3>
              <p className="text-sm text-slate-600 mb-4">We'll get back to you within 24 hours.</p>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setSubmitted(false)}
              >
                Send another message
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
            >
              <h3 className="text-lg font-bold text-slate-900">Send us a message</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                  <input
                    name="name"
                    required
                    placeholder="Your name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="you@company.com"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Company</label>
                  <input
                    name="company"
                    placeholder="Company name (optional)"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Message</label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  placeholder="Tell us about your project or question..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none"
                />
              </div>
              <Button
                type="submit"
                disabled={sending}
                className="rounded-xl font-semibold gap-2 w-full"
              >
                {sending ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Send Message
                  </>
                )}
              </Button>
            </form>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-12"
        >
          <Link href="/home">
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
