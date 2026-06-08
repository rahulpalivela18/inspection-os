import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  LockKeyhole,
  Plus,
  Trash2,
  X,
  Pencil,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Templates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [newChecklistType, setNewChecklistType] = useState("");
  const [selectedType, setSelectedType] = useState<string>("Home Inspection");
  const PREDEFINED_TYPES = ["Home Inspection", "Dampness Inspection"];
  const PREDEFINED_CATEGORIES_BY_TYPE: Record<string, string[]> = {
    "Home Inspection": [
      "Bedroom",
      "Bathroom",
      "Balcony",
      "Common Area",
      "External Area",
    ],
    "Dampness Inspection": [
      "External Walls",
      "Bathroom",
      "Utility Area",
      "Terrace/Roof",
      "Water Tank",
      "Appliances",
    ],
  };
  const PREDEFINED_CATEGORIES =
    PREDEFINED_CATEGORIES_BY_TYPE[selectedType] || [];
  const [newItem, setNewItem] = useState({
    category: "",
    point: "",
    bulkPoints: "",
    triggerOn: "no" as "yes" | "no",
    isCustomCategory: false,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingTrigger, setEditingTrigger] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Fetch all templates once to discover available types for the dropdown
  const { data: allTemplates = [] } = useQuery({
    queryKey: ["checklist-templates", "all"],
    queryFn: () => api.getChecklistTemplates(),
    staleTime: Infinity,
  });

  // Fetch only the selected type for the displayed list
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["checklist-templates", selectedType],
    queryFn: () => api.getChecklistTemplates(selectedType),
    staleTime: Infinity,
  });

  const customTypes = Array.from(
    new Set(allTemplates.map((t: any) => t.checklistType).filter(Boolean)),
  ).filter((t) => !PREDEFINED_TYPES.includes(t));
  const allTypes = [...PREDEFINED_TYPES, ...customTypes].sort((a, b) => {
    const aIdx = PREDEFINED_TYPES.indexOf(a);
    const bIdx = PREDEFINED_TYPES.indexOf(b);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.localeCompare(b);
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createChecklistTemplate(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] }),
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateChecklistTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] });
      setEditingId(null);
      toast({ title: "Point updated" });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteChecklistTemplate(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] }),
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const handleAddSubmit = async () => {
    const lines = newItem.bulkPoints.trim()
      ? newItem.bulkPoints
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
      : newItem.point.trim()
        ? [newItem.point.trim()]
        : [];
    if (!lines.length) return;

    const maxOrder = templates.reduce(
      (max, t) => Math.max(max, t.order || 0),
      0,
    );
    let order = maxOrder + 1;
    for (const line of lines) {
      await createMutation.mutateAsync({
        checklistType: selectedType,
        category: newItem.category,
        point: line,
        triggerOn: newItem.triggerOn,
        order: order,
      });
      order++;
    }
    toast({
      title:
        lines.length === 1 ? "Point added" : `${lines.length} points added`,
    });
    setIsDialogOpen(false);
    setNewItem({
      category: "",
      point: "",
      bulkPoints: "",
      triggerOn: "no",
      isCustomCategory: false,
    });
  };

  const startEdit = (item: any) => {
    setEditingItem({ ...item });
    setEditDialogOpen(true);
  };

  const commitEdit = () => {
    if (!editingItem?.point?.trim()) return;
    updateMutation.mutate({
      id: editingItem.id,
      data: {
        point: editingItem.point.trim(),
        triggerOn: editingItem.triggerOn,
      },
    });
    setEditDialogOpen(false);
  };

  const setTriggerOn = (item: any, val: string) => {
    updateMutation.mutate({ id: item.id, data: { triggerOn: val } });
  };

  const grouped = templates.reduce(
    (acc: Record<string, any[]>, item: any) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {},
  );
  const categories = Object.keys(grouped).sort((a, b) => {
    const aIdx = PREDEFINED_CATEGORIES.indexOf(a);
    const bIdx = PREDEFINED_CATEGORIES.indexOf(b);
    const aIsPredef = aIdx !== -1;
    const bIsPredef = bIdx !== -1;

    if (aIsPredef && bIsPredef) return aIdx - bIdx;
    if (aIsPredef && !bIsPredef) return -1;
    if (!aIsPredef && bIsPredef) return 1;
    return a.localeCompare(b);
  });
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >(
    categories.reduce(
      (acc, cat) => ({ ...acc, [cat]: true }),
      {} as Record<string, boolean>,
    ),
  );

  const toggleCategory = (cat: string) =>
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const bulkLineCount = newItem.bulkPoints
    .split("\n")
    .filter((l) => l.trim()).length;
  const canSubmit =
    !!newItem.category &&
    (!!newItem.point.trim() || bulkLineCount > 0) &&
    !createMutation.isPending;

  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-700">
            <LockKeyhole className="h-3.5 w-3.5" /> Admin setup only
          </div>
          <div className="max-w-3xl">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              {selectedType} Checklist
            </h1>
            <p className="mt-2 text-base text-slate-500 md:text-lg">
              Define inspection points for {selectedType}. Click any point to
              edit it. Use bulk-add to paste many points at once.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={selectedType}
            onValueChange={(val) => {
              if (val === "__new__") {
                setIsTypeDialogOpen(true);
              } else {
                setSelectedType(val);
              }
            }}
          >
            <SelectTrigger className="w-64 font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
              <SelectItem value="__new__" className="text-blue-600 font-medium">
                + Add New Type
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
              Total points
            </p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              {templates.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
              Categories
            </p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              {categories.length}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">
            All Checklist Points
          </h2>
          <Button
            onClick={() => setIsDialogOpen(true)}
            size="sm"
            className="gap-2"
            data-testid="button-add-checklist-item"
          >
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading checklist...
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
            No checklist items for {selectedType}. Add your first one above.
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => {
              const items = grouped[category];
              return (
                <Card
                  key={category}
                  className="overflow-hidden border-slate-200 shadow-sm"
                >
                  <CardHeader
                    className="bg-slate-50 border-b border-slate-100 py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => toggleCategory(category)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {expandedCategories[category] ? (
                          <ChevronDown className="h-4 w-4 text-slate-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-500" />
                        )}
                        <CardTitle className="text-base">{category}</CardTitle>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {items.length} points
                      </span>
                    </div>
                  </CardHeader>
                  {expandedCategories[category] && (
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-100">
                        {items.map((item: any, idx: number) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/70 group"
                            data-testid={`checklist-item-${item.id}`}
                          >
                            <div className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center shrink-0 text-[10px] text-slate-400 font-medium">
                              {idx + 1}
                            </div>

                            <p
                              className="text-sm flex-1"
                              data-testid={`text-point-${item.id}`}
                            >
                              {item.point}
                            </p>

                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${item.triggerOn === "yes" ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-100 text-slate-500"}`}
                            >
                              {item.triggerOn === "yes" ? "YES" : "NO"}
                            </span>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEdit(item);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    data-testid={`button-delete-checklist-${item.id}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Checkpoint?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "
                                      <strong>{item.point}</strong>"? This will
                                      be removed from all new reports. Existing
                                      reports keep this point unless you sync.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        deleteMutation.mutate(item.id)
                                      }
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Add Item Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-135">
            <DialogHeader>
              <DialogTitle>Add Checklist Point(s)</DialogTitle>
              <DialogDescription>
                Add one point or paste many at once — one per line.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5 py-2">
              <div className="grid gap-2">
                <Label>Trigger On</Label>
                <Select
                  value={newItem.triggerOn}
                  onValueChange={(val) =>
                    setNewItem({ ...newItem, triggerOn: val as "yes" | "no" })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">
                      Show in PDF if answered <b>No</b> (default)
                    </SelectItem>
                    <SelectItem value="yes">
                      Show in PDF if answered <b>Yes</b>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Label>Category</Label>
                <Select
                  value={
                    newItem.isCustomCategory
                      ? "custom"
                      : PREDEFINED_CATEGORIES.includes(newItem.category)
                        ? newItem.category
                        : ""
                  }
                  onValueChange={(val) => {
                    if (val === "custom") {
                      setNewItem({
                        ...newItem,
                        isCustomCategory: true,
                        category: "",
                      });
                    } else {
                      setNewItem({
                        ...newItem,
                        isCustomCategory: false,
                        category: val,
                      });
                    }
                  }}
                >
                  <SelectTrigger
                    data-testid="select-category"
                    className="w-full"
                  >
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">+ Custom Category</SelectItem>
                  </SelectContent>
                </Select>
                {newItem.isCustomCategory && (
                  <Input
                    placeholder="Enter custom category name"
                    className="mt-2"
                    value={newItem.category}
                    onChange={(e) =>
                      setNewItem({ ...newItem, category: e.target.value })
                    }
                    data-testid="input-custom-category"
                  />
                )}
              </div>

              <div className="grid gap-2">
                <Label>Single Point</Label>
                <Input
                  placeholder="e.g. Are all room corners at right angle?"
                  value={newItem.point}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      point: e.target.value,
                      bulkPoints: "",
                    })
                  }
                  disabled={!!newItem.bulkPoints.trim()}
                  data-testid="input-checklist-point"
                />
              </div>

              <div className="relative flex items-center gap-3">
                <div className="flex-1 border-t border-slate-200" />
                <span className="text-xs font-medium text-slate-400 shrink-0">
                  OR paste many at once
                </span>
                <div className="flex-1 border-t border-slate-200" />
              </div>

              <div className="grid gap-2">
                <Label>
                  Bulk Add{" "}
                  <span className="text-slate-400 font-normal">
                    (one point per line)
                  </span>
                </Label>
                <Textarea
                  placeholder={
                    "Wall paint is uniform and crack-free\nFloor tiles are intact and level\nCeiling is smooth without water marks\n...paste all your points here"
                  }
                  value={newItem.bulkPoints}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      bulkPoints: e.target.value,
                      point: "",
                    })
                  }
                  className="min-h-37.5 font-mono text-sm"
                  data-testid="textarea-bulk-points"
                />
                {bulkLineCount > 0 && (
                  <p className="text-xs text-indigo-600 font-medium">
                    {bulkLineCount} points will be added
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddSubmit}
                disabled={!canSubmit}
                data-testid="button-confirm-add-checklist"
              >
                {createMutation.isPending
                  ? "Adding..."
                  : bulkLineCount > 0
                    ? `Add ${bulkLineCount} Points`
                    : "Add to Checklist"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Item Dialog */}
        <Dialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setEditingItem(null);
          }}
        >
          <DialogContent className="sm:max-w-135">
            <DialogHeader>
              <DialogTitle>Edit Checklist Point</DialogTitle>
              <DialogDescription>
                Update the point description and when it triggers PDF display.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5 py-2">
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input
                  value={editingItem?.point || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, point: e.target.value })
                  }
                  data-testid="input-edit-point"
                />
              </div>
              <div className="grid gap-2">
                <Label>Trigger On</Label>
                <Select
                  value={editingItem?.triggerOn || "no"}
                  onValueChange={(val) =>
                    setEditingItem({ ...editingItem, triggerOn: val })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">
                      Show in PDF if answered <b>No</b> (default)
                    </SelectItem>
                    <SelectItem value="yes">
                      Show in PDF if answered <b>Yes</b>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditingItem(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={commitEdit}
                disabled={updateMutation.isPending}
                data-testid="button-confirm-edit"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Checklist Type Dialog */}
        <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Checklist Type</DialogTitle>
              <DialogDescription>
                Create a new inspection type (e.g., Home Inspection, Dampness
                Inspection, Commercial Inspection)
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="new-type">Type Name</Label>
              <Input
                id="new-type"
                value={newChecklistType}
                onChange={(e) => setNewChecklistType(e.target.value)}
                placeholder="e.g., Dampness Inspection"
                className="mt-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newChecklistType.trim()) {
                    setSelectedType(newChecklistType.trim());
                    setNewChecklistType("");
                    setIsTypeDialogOpen(false);
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsTypeDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (newChecklistType.trim()) {
                    setSelectedType(newChecklistType.trim());
                    setNewChecklistType("");
                    setIsTypeDialogOpen(false);
                  }
                }}
                disabled={!newChecklistType.trim()}
              >
                Create Type
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
