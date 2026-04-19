import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckSquare, LockKeyhole, Plus, Trash2, Repeat2, Lock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Templates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({ category: "", point: "", isRepeatable: false, spaceType: "" });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["checklist-templates"],
    queryFn: api.getChecklistTemplates,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createChecklistTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] });
      setIsDialogOpen(false);
      setNewItem({ category: "", point: "", isRepeatable: false, spaceType: "" });
      toast({ title: "Checklist item added" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteChecklistTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // Group by category
  const grouped = templates.reduce((acc: Record<string, any[]>, item: any) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const categories = Object.keys(grouped);
  const repeatableCategories = categories.filter((cat) => grouped[cat].some((i: any) => i.isRepeatable));
  const fixedCategories = categories.filter((cat) => !grouped[cat].some((i: any) => i.isRepeatable));

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
              This is your workspace's master checklist. When a report is created, the app duplicates the right points for Bedroom 1, Bedroom 2, Bathroom 1 and other repeated spaces automatically.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Total points</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{templates.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Repeatable categories</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{repeatableCategories.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Fixed categories</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{fixedCategories.length}</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">All Checklist Points</h2>
          <Button onClick={() => setIsDialogOpen(true)} size="sm" className="gap-2" data-testid="button-add-checklist-item">
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading checklist...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
            No checklist items yet. Add your first one above.
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => {
              const items = grouped[category];
              const isRepeatable = items.some((i: any) => i.isRepeatable);
              return (
                <Card key={category} className="overflow-hidden border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50 border-b border-slate-100 py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{category}</CardTitle>
                        <Badge variant="outline" className={isRepeatable ? "text-indigo-700 border-indigo-200 bg-indigo-50" : "text-slate-600 border-slate-200 bg-slate-100"}>
                          {isRepeatable ? <><Repeat2 className="h-3 w-3 mr-1" />Repeatable</> : <><Lock className="h-3 w-3 mr-1" />Fixed</>}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{items.length} points</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                      {items.map((item: any, idx: number) => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 group" data-testid={`checklist-item-${item.id}`}>
                          <div className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center shrink-0 text-[10px] text-slate-400">
                            {idx + 1}
                          </div>
                          <p className="text-sm flex-1">{item.point}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteMutation.mutate(item.id)}
                            data-testid={`button-delete-checklist-${item.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add Item Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Checklist Item</DialogTitle>
              <DialogDescription>Add a new point to your master checklist template.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Input
                  placeholder="e.g. Bedroom, Bathroom, Common Area"
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  data-testid="input-checklist-category"
                />
              </div>
              <div className="grid gap-2">
                <Label>Checklist Point</Label>
                <Input
                  placeholder="e.g. Are all room corners at right angle?"
                  value={newItem.point}
                  onChange={(e) => setNewItem({ ...newItem, point: e.target.value })}
                  data-testid="input-checklist-point"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="repeatable"
                  checked={newItem.isRepeatable}
                  onChange={(e) => setNewItem({ ...newItem, isRepeatable: e.target.checked })}
                  className="w-4 h-4"
                  data-testid="checkbox-repeatable"
                />
                <Label htmlFor="repeatable" className="cursor-pointer">Repeatable (e.g. appears per bedroom/bathroom)</Label>
              </div>
              {newItem.isRepeatable && (
                <div className="grid gap-2">
                  <Label>Space Type</Label>
                  <Input
                    placeholder="e.g. bedroom, bathroom, balcony"
                    value={newItem.spaceType}
                    onChange={(e) => setNewItem({ ...newItem, spaceType: e.target.value })}
                    data-testid="input-space-type"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => createMutation.mutate(newItem)}
                disabled={!newItem.category || !newItem.point || createMutation.isPending}
                data-testid="button-confirm-add-checklist"
              >
                {createMutation.isPending ? "Adding..." : "Add to Checklist"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
