import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 font-heading text-lg font-bold text-slate-900">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
            R
          </div>
          ReportGen
        </div>

        <nav className="flex items-center gap-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <Link
            href="/contact"
            className="hover:text-primary transition-colors"
          >
            Contact
          </Link>
          <Link href="/login" className="hover:text-primary transition-colors">
            Login
          </Link>
        </nav>

        <p className="text-xs text-slate-400">
          &copy; {new Date().getFullYear()} ReportGen. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
