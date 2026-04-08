import Layout from "@/components/Layout";
import {
  CHECKLIST_CATEGORY_TEMPLATES,
  DEFAULT_CHECKLIST_NAME,
  DEFAULT_SPACE_COUNTS,
  buildChecklistFromCounts,
} from "@/lib/defaultChecklist";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckSquare, CopyCheck, LockKeyhole, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const sampleChecklist = buildChecklistFromCounts(DEFAULT_SPACE_COUNTS);
const repeatableCategories = CHECKLIST_CATEGORY_TEMPLATES.filter((section) => section.repeatable);
const fixedCategories = CHECKLIST_CATEGORY_TEMPLATES.filter((section) => !section.repeatable);

export default function Templates() {
  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-700">
            <LockKeyhole className="h-3.5 w-3.5" /> Admin setup only
          </div>
          <div className="max-w-3xl">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Master Checklist</h1>
            <p className="mt-2 text-base text-slate-500 md:text-lg">
              This is the client’s master checklist. When a report is created, the app duplicates the right points for Bedroom 1, Bedroom 2, Bathroom 1 and other repeated spaces automatically.
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
                    Instead of storing Bedroom and Bathroom only once, this master checklist knows which points belong to each category type and duplicates them based on the report’s room counts.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="rounded-full border-indigo-200 bg-indigo-50 text-indigo-700">
                  One smart checklist
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Sample points</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{sampleChecklist.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Repeatable sections</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{repeatableCategories.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Always included</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{fixedCategories.length}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-slate-500">Repeatable category rules</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {repeatableCategories.map((category) => (
                    <div key={category.key} className="rounded-2xl border border-slate-100 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <CheckSquare className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{category.label}</p>
                            <p className="text-sm text-slate-500">{category.points.length} points per instance</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-700">
                          Repeatable
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm text-slate-500">
                        Example: if the report has 3 {category.label.toLowerCase()}s, the checklist becomes {category.label} 1, {category.label} 2, and {category.label} 3.
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-slate-500">Fixed sections</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {fixedCategories.map((category) => (
                    <div key={category.key} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4">
                      <div>
                        <p className="font-semibold text-slate-900">{category.label}</p>
                        <p className="text-sm text-slate-500">{category.points.length} points added once per report</p>
                      </div>
                      <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-700">
                        Fixed
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
                  <p className="font-semibold text-slate-900">1. Enter report details</p>
                  <p className="mt-1">Add the title, author, date, and how many bedrooms, bathrooms, and balconies exist in that unit.</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                  <p className="font-semibold text-slate-900">2. Checklist is generated automatically</p>
                  <p className="mt-1">If you enter 3 bedrooms and 2 bathrooms, the report opens with Bedroom 1, Bedroom 2, Bedroom 3, Bathroom 1, and Bathroom 2 already populated.</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                  <p className="font-semibold text-slate-900">3. Fill and export</p>
                  <p className="mt-1">Mark YES or NO, add severity and photos when needed, then export the report PDF.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Default sample setup</CardTitle>
                <CardDescription>This is the starting setup used for a fresh report form.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p>Bedrooms: <span className="font-semibold text-slate-900">{DEFAULT_SPACE_COUNTS.bedrooms}</span></p>
                  <p>Bathrooms: <span className="font-semibold text-slate-900">{DEFAULT_SPACE_COUNTS.bathrooms}</span></p>
                  <p>Balconies: <span className="font-semibold text-slate-900">{DEFAULT_SPACE_COUNTS.balconies}</span></p>
                </div>
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
