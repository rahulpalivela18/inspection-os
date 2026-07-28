import { useState } from "react";
import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Download,
} from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import QuotationPDF from "@/components/QuotationPDF";
import ConfirmDialog from "@/components/ConfirmDialog";
import { pdf } from "@react-pdf/renderer";

export default function QuotationEditor() {
  const [, params] = useRoute("/quotation/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { workspace } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    label: "",
    description: "",
    severity: "Minor",
    estimatedCost: "",
    quantity: "1",
    unit: "nos",
  });

  const quotationId = params?.id;

  const { data: quotation, isLoading } = useQuery({
    queryKey: ["quotation", quotationId],
    queryFn: () => api.getQuotation(quotationId!),
    enabled: !!quotationId,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["quotation-items", quotationId],
    queryFn: () => api.getQuotationItems(quotationId!),
    enabled: !!quotationId,
  });

  const { data: project } = useQuery({
    queryKey: ["project", quotation?.projectId],
    queryFn: () => api.getProject(quotation!.projectId),
    enabled: !!quotation?.projectId,
  });

  const { data: captures = [] } = useQuery({
    queryKey: ["captures", quotation?.projectId],
    queryFn: () => api.getCaptures(quotation!.projectId),
    enabled: !!quotation?.projectId,
  });

  const { data: allHotspots = [] } = useQuery({
    queryKey: ["allHotspots-for-quotation", quotation?.projectId],
    queryFn: async () => {
      const results = await Promise.all(
        captures.map(async (cap: any) => {
          const hotspots = await api.getHotspots(cap.id);
          return { capture: cap, hotspots };
        }),
      );
      return results;
    },
    enabled: !!quotation?.projectId && captures.length > 0,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateQuotation(quotationId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotation", quotationId] });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: (data: any) => api.createQuotationItem(quotationId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotation-items", quotationId] });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateQuotationItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotation-items", quotationId] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => api.deleteQuotationItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotation-items", quotationId] });
    },
  });

  const handleAddManualItem = () => {
    setNewItemForm({
      label: "",
      description: "",
      severity: "Minor",
      estimatedCost: "",
      quantity: "1",
      unit: "nos",
    });
    setShowAddItem(true);
  };

  const handleSubmitNewItem = () => {
    if (!newItemForm.label.trim()) return;
    addItemMutation.mutate({
      label: newItemForm.label.trim(),
      description: newItemForm.description.trim() || null,
      severity: newItemForm.severity || null,
      estimatedCost: newItemForm.estimatedCost || "0",
      quantity: parseInt(newItemForm.quantity) || 1,
      unit: newItemForm.unit || "nos",
      isManual: true,
      order: items.length,
    });
    setShowAddItem(false);
  };

  const handleImportHotspot = (hotspot: any, capture: any) => {
    const alreadyImported = items.some(
      (item: any) => item.hotspotId === hotspot.id,
    );
    if (alreadyImported) return;
    addItemMutation.mutate({
      hotspotId: hotspot.id,
      captureId: capture.id,
      label: hotspot.label,
      description: hotspot.notes || "",
      severity: hotspot.issueSeverity || null,
      estimatedCost: 0,
      quantity: 1,
      unit: "nos",
      isManual: false,
      order: items.length,
    });
  };

  const handleImportAll = () => {
    const existingHotspotIds = new Set(
      items.filter((i: any) => i.hotspotId).map((i: any) => i.hotspotId),
    );
    let count = 0;
    allHotspots.forEach(({ capture, hotspots }) => {
      hotspots.forEach((h: any) => {
        if (!existingHotspotIds.has(h.id)) {
          addItemMutation.mutate({
            hotspotId: h.id,
            captureId: capture.id,
            label: h.label,
            description: h.notes || "",
            severity: h.issueSeverity || null,
            estimatedCost: 0,
            quantity: 1,
            unit: "nos",
            isManual: false,
            order: items.length + count,
          });
          count++;
        }
      });
    });
    setShowImport(false);
    if (count > 0) {
      toast({ title: `Imported ${count} hotspot(s)` });
    }
  };

  const handleExportPDF = async () => {
    if (!quotation || !project || !workspace) return;
    setExporting(true);
    try {
      const blob = await pdf(
        <QuotationPDF
          quotation={quotation}
          items={items}
          project={project}
          workspace={workspace}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${quotation.title.replace(/\s+/g, "_")}_quotation.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const subtotal = items.reduce(
    (sum: number, item: any) =>
      sum + (Number(item.estimatedCost) || 0) * (item.quantity || 1),
    0,
  );
  const taxRate = Number(quotation?.taxRate) || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      </Layout>
    );
  }

  if (!quotation) {
    return (
      <Layout>
        <div className="p-8 text-center text-slate-500">Quotation not found.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(`/project/${quotation.projectId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {quotation.title}
              </h1>
              <p className="text-sm text-slate-500">
                {project?.title} — {project?.clientName}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-1.5" />
            {exporting ? "Exporting..." : "Export PDF"}
          </Button>
        </div>

        {/* Quotation Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Quotation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Title</Label>
                <Input
                  value={quotation.title}
                  onChange={(e) =>
                    updateMutation.mutate({ title: e.target.value })
                  }
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select
                  value={quotation.status}
                  onValueChange={(v) => updateMutation.mutate({ status: v })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Sent">Sent</SelectItem>
                    <SelectItem value="Accepted">Accepted</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tax Rate (%)</Label>
                <Input
                  type="number"
                  value={quotation.taxRate || ""}
                  onChange={(e) =>
                    updateMutation.mutate({ taxRate: e.target.value })
                  }
                  className="h-9"
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valid for (days)</Label>
                <Input
                  type="number"
                  value={quotation.validityDays || ""}
                  onChange={(e) =>
                    updateMutation.mutate({
                      validityDays: parseInt(e.target.value) || 30,
                    })
                  }
                  className="h-9"
                  placeholder="30"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes & Terms</Label>
              <Textarea
                value={quotation.notes || ""}
                onChange={(e) =>
                  updateMutation.mutate({ notes: e.target.value })
                }
                rows={3}
                placeholder="Payment terms, warranty info, etc."
              />
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Line Items ({items.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImport(!showImport)}
                className="h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Import Hotspots
              </Button>
              <Button
                size="sm"
                onClick={handleAddManualItem}
                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Import Panel */}
            {showImport && (
              <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-indigo-900">
                    Import hotspots from captures
                  </p>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleImportAll}
                    className="h-7 text-xs"
                  >
                    Import All
                  </Button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {allHotspots.length === 0 && (
                    <p className="text-xs text-indigo-600">
                      No captures or hotspots found for this project.
                    </p>
                  )}
                  {allHotspots.map(({ capture, hotspots }) =>
                    hotspots.map((h: any) => {
                      const imported = items.some(
                        (i: any) => i.hotspotId === h.id,
                      );
                      return (
                        <div
                          key={h.id}
                          className={`flex items-center justify-between rounded-md border p-2 text-xs ${
                            imported
                              ? "border-green-200 bg-green-50 opacity-60"
                              : "border-white bg-white"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{h.label}</span>
                            <span className="ml-2 text-slate-400">
                              ({capture.title})
                            </span>
                            {h.issueSeverity && (
                              <span className="ml-2 text-slate-400">
                                {h.issueSeverity}
                              </span>
                            )}
                          </div>
                          {!imported && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleImportHotspot(h, capture)}
                              className="h-6 text-xs"
                            >
                              Add
                            </Button>
                          )}
                          {imported && (
                            <span className="text-xs text-green-600">
                              Imported
                            </span>
                          )}
                        </div>
                      );
                    }),
                  )}
                </div>
              </div>
            )}

            {/* Items Table */}
            {items.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                No items yet. Add manually or import from hotspots.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-semibold text-slate-500">
                      <th className="pb-2 pr-2 w-8">#</th>
                      <th className="pb-2 pr-2">Description</th>
                      <th className="pb-2 pr-2 w-24">Severity</th>
                      <th className="pb-2 pr-2 w-16">Qty</th>
                      <th className="pb-2 pr-2 w-16">Unit</th>
                      <th className="pb-2 pr-2 w-28 text-right">Rate (₹)</th>
                      <th className="pb-2 w-28 text-right">Amount</th>
                      <th className="pb-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any, i: number) => {
                      const amount =
                        (Number(item.estimatedCost) || 0) * (item.quantity || 1);
                      return (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100"
                        >
                          <td className="py-2 pr-2 text-slate-400 text-xs">
                            {i + 1}
                          </td>
                          <td className="py-2 pr-2">
                            <Input
                              value={item.label}
                              onChange={(e) =>
                                updateItemMutation.mutate({
                                  id: item.id,
                                  data: { label: e.target.value },
                                })
                              }
                              className="h-8 text-sm border-0 shadow-none bg-transparent px-0 focus-visible:ring-0"
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <Select
                              value={item.severity || ""}
                              onValueChange={(v) =>
                                updateItemMutation.mutate({
                                  id: item.id,
                                  data: { severity: v || null },
                                })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs border-0 shadow-none">
                                <SelectValue placeholder="-" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Major">Major</SelectItem>
                                <SelectItem value="Minor">Minor</SelectItem>
                                <SelectItem value="Cosmetic">Cosmetic</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-2 pr-2">
                            <Input
                              type="number"
                              value={item.quantity || 1}
                              onChange={(e) =>
                                updateItemMutation.mutate({
                                  id: item.id,
                                  data: { quantity: parseInt(e.target.value) || 1 },
                                })
                              }
                              className="h-8 text-xs w-14"
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <Input
                              value={item.unit || "nos"}
                              onChange={(e) =>
                                updateItemMutation.mutate({
                                  id: item.id,
                                  data: { unit: e.target.value },
                                })
                              }
                              className="h-8 text-xs w-14"
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <Input
                              type="number"
                              value={item.estimatedCost || ""}
                              onChange={(e) =>
                                updateItemMutation.mutate({
                                  id: item.id,
                                  data: { estimatedCost: e.target.value },
                                })
                              }
                              className="h-8 text-xs text-right"
                              placeholder="0"
                            />
                          </td>
                          <td className="py-2 text-right font-medium text-slate-700">
                            ₹{amount.toLocaleString("en-IN")}
                          </td>
                          <td className="py-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals */}
            {items.length > 0 && (
              <div className="mt-4 flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium">
                      ₹{subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {taxRate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">GST ({taxRate}%)</span>
                      <span className="font-medium">
                        ₹{taxAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 text-base font-bold">
                    <span className="text-slate-900">Total</span>
                    <span className="text-indigo-600">
                      ₹{total.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}
        title="Delete Item?"
        description="This will remove the item from this quotation."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteConfirmId) deleteItemMutation.mutate(deleteConfirmId);
          setDeleteConfirmId(null);
        }}
        loading={deleteItemMutation.isPending}
      />

      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Line Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Description *</Label>
              <Input
                value={newItemForm.label}
                onChange={(e) => setNewItemForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Ceiling crack repair"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea
                value={newItemForm.description}
                onChange={(e) => setNewItemForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Additional details..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Severity</Label>
                <Select
                  value={newItemForm.severity}
                  onValueChange={(v) => setNewItemForm((f) => ({ ...f, severity: v }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Major">Major</SelectItem>
                    <SelectItem value="Minor">Minor</SelectItem>
                    <SelectItem value="Cosmetic">Cosmetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Rate (₹)</Label>
                <Input
                  type="number"
                  value={newItemForm.estimatedCost}
                  onChange={(e) => setNewItemForm((f) => ({ ...f, estimatedCost: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={newItemForm.quantity}
                  onChange={(e) => setNewItemForm((f) => ({ ...f, quantity: e.target.value }))}
                  placeholder="1"
                />
              </div>
              <div className="space-y-1">
                <Label>Unit</Label>
                <Input
                  value={newItemForm.unit}
                  onChange={(e) => setNewItemForm((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="nos"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItem(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitNewItem}
              disabled={!newItemForm.label.trim() || addItemMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {addItemMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Plus className="h-4 w-4 mr-1.5" />
              )}
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
