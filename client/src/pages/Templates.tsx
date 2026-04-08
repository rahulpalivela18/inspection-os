import Layout from "@/components/Layout";
import { DEFAULT_CHECKLIST, DEFAULT_CHECKLIST_NAME } from "@/lib/defaultChecklist";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckSquare, CopyCheck, LockKeyhole, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const categoryMap = DEFAULT_CHECKLIST.reduce<Record<string, number>>((acc, item) => {
  acc[item.category] = (acc[item.category] || 0) + 1;
  return acc;
}, {});

const categories = Object.entries(categoryMap);

export default function Templates() {
  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-700">
            <LockKeyhole className="h-3.5 w-3.5" /> Admin setup only
          </div>
          <div className="max-w-3xl">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Default Checklist</h1>
            <p className="mt-2 text-base text-slate-500 md:text-lg">
              This is the one master checklist for this client. Inspectors do not choose from multiple checklists. Every new report gets this checklist automatically.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-2xl tracking-tight text-slate-900">{DEFAULT_CHECKLIST_NAME}</CardTitle>
                  <CardDescription className="mt-2 max-w-2xl text-sm leading-relaxed">
                    The checklist your client already shared. It acts as the default structure for all new inspection reports in this workspace.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="rounded-full border-indigo-200 bg-indigo-50 text-indigo-700">
                  One default checklist
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Checklist points</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{DEFAULT_CHECKLIST.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Categories</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{categories.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Used in reports</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">Always</p>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-slate-500">Checklist sections</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {categories.map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <CheckSquare className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{category}</p>
                          <p className="text-sm text-slate-500">{count} inspection points</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-700">
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <CopyCheck className="h-5 w-5 text-indigo-600" /> What happens when you create a report
                </CardTitle>
                <CardDescription>Simple flow for the inspector.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                  <p className="font-semibold text-slate-900">1. Create report</p>
                  <p className="mt-1">Only enter report details like title, author, and date.</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                  <p className="font-semibold text-slate-900">2. Checklist appears automatically</p>
                  <p className="mt-1">There is no checklist selection screen and no multiple-choice template step.</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                  <p className="font-semibold text-slate-900">3. Fill and export</p>
                  <p className="mt-1">Mark YES or NO, add severity and photos when needed, then export the report PDF.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Why this page still exists</CardTitle>
                <CardDescription>This page is just the setup view for the master checklist.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                <p>
                  It is not part of the inspector's everyday flow. It simply shows the default checklist that gets copied into every new report.
                </p>
                <Link href="/dashboard">
                  <Button className="w-full bg-slate-900 hover:bg-slate-800" data-testid="button-back-to-report-flow">
                    Back to report flow <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
