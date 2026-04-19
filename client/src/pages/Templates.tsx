import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LockKeyhole, Plus, Trash2, Repeat2, Lock, Pencil, Check, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SPACE_TYPE_OPTIONS = [
  { value: "none", label: "Does not repeat (Fixed)" },
  { value: "bedroom", label: "Bedroom — repeats per bedroom" },
  { value: "bathroom", label: "Bathroom — repeats per bathroom" },
  { value: "balcony", label: "Balcony — repeats per balcony" },
];

function spaceTypeLabel(spaceType: string | null | undefined, isRepeatable: boolean) {
  if (!isRepeatable || !spaceType) return null;
  const map: Record<string, string> = { bedroom: "Per Bedroom", bathroom: "Per Bathroom", balcony: "Per Balcony" };
  return map[spaceType] ?? `Per ${spaceType}`;
}

export default function Templates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    category: "",
    point: "",
    spaceTypeOption: "none",
    bulkPoints: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["checklist-templates"],
    queryFn: api.getChecklistTemplates,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createChecklistTemplate(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["checklist-templates"] }),
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateChecklistTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] });
      setEditingId(null);
      toast({ title: "Point updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteChecklistTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["checklist-templates"] }),
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleAddSubmit = async () => {
    const isRepeatable = newItem.spaceTypeOption !== "none";
    const spaceType = isRepeatable ? newItem.spaceTypeOption : null;
    const lines = newItem.bulkPoints.trim()
      ? newItem.bulkPoints.split("\n").map((l) => l.trim()).filter(Boolean)
      : newItem.point.trim()
        ? [newItem.point.trim()]
        : [];

    if (!lines.length) return;

    for (const line of lines) {
      await createMutation.mutateAsync({
        category: newItem.category,
        point: line,
        isRepeatable,
        spaceType,
      });
    }
    toast({ title: lines.length === 1 ? "Point added" : `${lines.length} points added` });
    setIsDialogOpen(false);
    setNewItem({ category: "", point: "", spaceTypeOption: "none", bulkPoints: "" });
  };

  const startEdit = (item: any) => { setEditingId(item.id); setEditValue(item.point); };
  const commitEdit = (item: any) => {
    if (!editValue.trim() || editValue.trim() === item.point) { setEditingId(null); return; }
    updateMutation.mutate({ id: item.id, data: { point: editValue.trim() } });
  };

  const grouped = templates.reduce((acc: Record<string, any[]>, item: any) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
  const categories = Object.keys(grouped);
  const categoryOptions = categories;
  const bulkLineCount = newItem.bulkPoints.split("\n").filter((l) => l.trim()).length;
  const canSubmit = !!newItem.category && (!!newItem.point.trim() || bulkLineCount > 0) && !createMutation.isPending;

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
              Define your inspection points here. Points added for Bedroom will appear for <em>every</em> bedroom in a report. Same for bathrooms and balconies.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Total points</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{templates.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Categories</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{categories.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Repeating categories</p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              {categories.filter((c) => grouped[c].some((i: any) => i.isRepeatable)).length}
            </p>
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
              const firstItem = items[0];
              const repeatLabel = spaceTypeLabel(firstItem?.spaceType, firstItem?.isRepeatable);
              return (
                <Card key={category} className="overflow-hidden border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50 border-b border-slate-100 py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{category}</CardTitle>
                        {repeatLabel ? (
                          <Badge variant="outline" className="text-indigo-700 border-indigo-200 bg-indigo-50">
                            <Repeat2 className="h-3 w-3 mr-1" />{repeatLabel}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-600 border-slate-200 bg-slate-100">
                            <Lock className="h-3 w-3 mr-1" />Fixed
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{items.length} points</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                      {items.map((item: any, idx: number) => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/70 group" data-testid={`checklist-item-${item.id}`}>
                          <div className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center shrink-0 text-[10px] text-slate-400 font-medium">
                            {idx + 1}
                          </div>

                          {editingId === item.id ? (
                            <div className="flex flex-1 items-center gap-2">
                              <Input
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") commitEdit(item); if (e.key === "Escape") setEditingId(null); }}
                                className="h-8 text-sm flex-1"
                                data-testid={`input-edit-point-${item.id}`}
                              />
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:bg-green-50 shrink-0" onClick={() => commitEdit(item)} disabled={updateMutation.isPending} data-testid={`button-save-edit-${item.id}`}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 shrink-0" onClick={() => setEditingId(null)} data-testid={`button-cancel-edit-${item.id}`}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm flex-1 cursor-pointer hover:text-indigo-700 transition-colors" onClick={() => startEdit(item)} title="Click to edit" data-testid={`text-point-${item.id}`}>
                                {item.point}
                              </p>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => startEdit(item)} data-testid={`button-edit-checklist-${item.id}`}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => deleteMutation.mutate(item.id)} data-testid={`button-delete-checklist-${item.id}`}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </>
                          )}
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
          <DialogContent className="sm:max-w-[540px]">
            <DialogHeader>
              <DialogTitle>Add Checklist Point(s)</DialogTitle>
              <DialogDescription>
                Add one point or paste many at once — one per line.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5 py-2">

              {/* Category */}
              <div className="grid gap-2">
                <Label>Category</Label>
                {categoryOptions.length > 0 ? (
                  <div className="flex gap-2 items-center">
                    <Select
                      value={categoryOptions.includes(newItem.category) ? newItem.category : ""}
                      onValueChange={(val) => setNewItem({ ...newItem, category: val })}
                    >
                      <SelectTrigger data-testid="select-category-existing" className="flex-1">
                        <SelectValue placeholder="Choose existing…" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-slate-400 shrink-0">or</span>
                    <Input
                      placeholder="New category name"
                      className="flex-1"
                      value={categoryOptions.includes(newItem.category) ? "" : newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      data-testid="input-checklist-category"
                    />
                  </div>
                ) : (
                  <Input
                    placeholder="e.g. Bedroom, Common Area, Kitchen"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    data-testid="input-checklist-category"
                  />
                )}
              </div>

              {/* Repeats for */}
              <div className="grid gap-2">
                <Label>Repeats for</Label>
                <Select value={newItem.spaceTypeOption} onValueChange={(val) => setNewItem({ ...newItem, spaceTypeOption: val })} data-testid="select-space-type">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPACE_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  {newItem.spaceTypeOption === "none"
                    ? "This point will appear once in the report."
                    : `This point will appear once per ${newItem.spaceTypeOption} in the report.`}
                </p>
              </div>

              {/* Single point */}
              <div className="grid gap-2">
                <Label>Single Point</Label>
                <Input
                  placeholder="e.g. Are all room corners at right angle?"
                  value={newItem.point}
                  onChange={(e) => setNewItem({ ...newItem, point: e.target.value, bulkPoints: "" })}
                  disabled={!!newItem.bulkPoints.trim()}
                  data-testid="input-checklist-point"
                />
              </div>

              <div className="relative flex items-center gap-3">
                <div className="flex-1 border-t border-slate-200" />
                <span className="text-xs font-medium text-slate-400 shrink-0">OR paste many at once</span>
                <div className="flex-1 border-t border-slate-200" />
              </div>

              {/* Bulk add */}
              <div className="grid gap-2">
                <Label>Bulk Add <span className="text-slate-400 font-normal">(one point per line)</span></Label>
                <Textarea
                  placeholder={"Wall paint is uniform and crack-free\nFloor tiles are intact and level\nCeiling is smooth without water marks\n...paste all your points here"}
                  value={newItem.bulkPoints}
                  onChange={(e) => setNewItem({ ...newItem, bulkPoints: e.target.value, point: "" })}
                  className="min-h-[150px] font-mono text-sm"
                  data-testid="textarea-bulk-points"
                />
                {bulkLineCount > 0 && (
                  <p className="text-xs text-indigo-600 font-medium">{bulkLineCount} points will be added</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddSubmit} disabled={!canSubmit} data-testid="button-confirm-add-checklist">
                {createMutation.isPending
                  ? "Adding..."
                  : bulkLineCount > 0
                    ? `Add ${bulkLineCount} Points`
                    : "Add to Checklist"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
