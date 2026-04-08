import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, ShieldCheck, LockKeyhole, CopyCheck, Layers3, Building2 } from "lucide-react";

type ChecklistLibraryItem = {
  id: string;
  name: string;
  scope: string;
  categories: number;
  points: number;
  owner: string;
  updatedAt: string;
};

const initialLibraries: ChecklistLibraryItem[] = [
  {
    id: "cl-1",
    name: "Structural Handover Checklist",
    scope: "Residential towers · QA walkthrough",
    categories: 8,
    points: 64,
    owner: "Admin",
    updatedAt: "Updated today",
  },
  {
    id: "cl-2",
    name: "Waterproofing Audit Checklist",
    scope: "Wet areas · Terrace · Podium",
    categories: 5,
    points: 38,
    owner: "Admin",
    updatedAt: "Updated 2 days ago",
  },
  {
    id: "cl-3",
    name: "Unit Snag Inspection",
    scope: "Interior finish and services",
    categories: 6,
    points: 52,
    owner: "Admin",
    updatedAt: "Updated this week",
  },
];

export default function Templates() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [libraries, setLibraries] = useState<ChecklistLibraryItem[]>(initialLibraries);
  const [formData, setFormData] = useState({
    name: "",
    scope: "",
    categories: "",
    points: "",
  });

  const totals = useMemo(() => {
    return libraries.reduce(
      (acc, item) => {
        acc.categories += item.categories;
        acc.points += item.points;
        return acc;
      },
      { categories: 0, points: 0 }
    );
  }, [libraries]);

  const handleCreate = () => {
    if (!formData.name || !formData.scope) return;

    setLibraries([
      {
        id: Date.now().toString(),
        name: formData.name,
        scope: formData.scope,
        categories: Number(formData.categories) || 0,
        points: Number(formData.points) || 0,
        owner: "Admin",
        updatedAt: "Just now",
      },
      ...libraries,
    ]);

    setFormData({ name: "", scope: "", categories: "", points: "" });
    setIsCreateOpen(false);
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-700">
              <LockKeyhole className="h-3.5 w-3.5" /> Confidential company assets
            </div>
            <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-slate-900">Checklist Library</h1>
            <p className="mt-2 max-w-3xl text-slate-500 text-base md:text-lg">
              Private checklist templates for one company workspace. These templates are managed once, then copied into reports so client-specific inspection logic stays protected.
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20" data-testid="button-create-private-checklist">
            <Plus className="mr-2 h-4 w-4" /> New Private Checklist
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-dashed bg-white/80">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-[0.22em]">Company</CardDescription>
              <CardTitle className="text-xl">Metropolis QA</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-dashed bg-white/80">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-[0.22em]">Libraries</CardDescription>
              <CardTitle className="text-xl">{libraries.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-dashed bg-white/80">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-[0.22em]">Categories</CardDescription>
              <CardTitle className="text-xl">{totals.categories}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-dashed bg-white/80">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-[0.22em]">Checklist points</CardDescription>
              <CardTitle className="text-xl">{totals.points}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-6 md:grid-cols-2">
            {libraries.map((library) => (
              <Card key={library.id} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 bg-white">
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl tracking-tight">{library.name}</CardTitle>
                      <CardDescription className="mt-2 text-sm leading-relaxed">{library.scope}</CardDescription>
                    </div>
                    <Badge variant="outline" className="rounded-full border-indigo-200 bg-indigo-50 text-indigo-700">
                      Private
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Categories</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">{library.categories}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Points</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">{library.points}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span>Managed by</span>
                      <span className="font-semibold text-slate-900">{library.owner}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Last activity</span>
                      <span className="font-semibold text-slate-900">{library.updatedAt}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="flex-1" data-testid={`button-review-library-${library.id}`}>
                      Review Structure
                    </Button>
                    <Button className="flex-1 bg-slate-900 hover:bg-slate-800" data-testid={`button-use-library-${library.id}`}>
                      Use in Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" /> Access Rules
                </CardTitle>
                <CardDescription>How confidentiality should work in Phase 1.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/80 p-4">
                  <Building2 className="h-4 w-4 mt-0.5 text-indigo-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Company-scoped only</p>
                    <p className="mt-1">One client cannot see another client’s checklist templates.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/80 p-4">
                  <LockKeyhole className="h-4 w-4 mt-0.5 text-indigo-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Admin-managed library</p>
                    <p className="mt-1">Only the company admin should create or edit checklist templates.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/80 p-4">
                  <CopyCheck className="h-4 w-4 mt-0.5 text-indigo-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Copy into reports</p>
                    <p className="mt-1">When a report starts, the checklist is copied so old reports never change later.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Layers3 className="h-5 w-5 text-slate-700" /> Next backend milestone
                </CardTitle>
                <CardDescription>Needed to make this truly secure beyond the prototype.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <p>• real login</p>
                <p>• company-based data ownership</p>
                <p>• role-based permissions</p>
                <p>• private checklist storage in database</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Create Private Checklist</DialogTitle>
              <DialogDescription>Set up a company-only checklist library for a client workflow.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="checklist-name">Checklist name</Label>
                <Input id="checklist-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Residential QA Handover" data-testid="input-checklist-name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="checklist-scope">Scope</Label>
                <Textarea id="checklist-scope" value={formData.scope} onChange={(e) => setFormData({ ...formData, scope: e.target.value })} placeholder="What kind of inspection this checklist covers" className="resize-none" data-testid="textarea-checklist-scope" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="checklist-categories">Categories</Label>
                  <Input id="checklist-categories" value={formData.categories} onChange={(e) => setFormData({ ...formData, categories: e.target.value })} placeholder="8" data-testid="input-checklist-categories" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="checklist-points">Checklist points</Label>
                  <Input id="checklist-points" value={formData.points} onChange={(e) => setFormData({ ...formData, points: e.target.value })} placeholder="60" data-testid="input-checklist-points" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} data-testid="button-cancel-checklist-create">Cancel</Button>
              <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700" data-testid="button-save-checklist-create">Create Private Checklist</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
