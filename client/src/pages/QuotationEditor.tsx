import { useState, useEffect } from "react";
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
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Download,
  Save,
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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    label: "",
    description: "",
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

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateQuotation(quotationId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotation", quotationId] });
      toast({ title: "Saved" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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

  const handleSubmitNewItem = () => {
    if (!newItemForm.label.trim()) return;
    addItemMutation.mutate({
      label: newItemForm.label.trim(),
      description: newItemForm.description.trim() || null,
      estimatedCost: newItemForm.estimatedCost || "0",
      quantity: parseInt(newItemForm.quantity) || 1,
      unit: newItemForm.unit || "nos",
      order: items.length,
    });
    setNewItemForm({
      label: "",
      description: "",
      estimatedCost: "",
      quantity: "1",
      unit: "nos",
    });
    setShowAddItem(false);
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

        <ClientDetailsCard quotation={quotation} updateMutation={updateMutation} />
        <PropertyDetailsCard quotation={quotation} updateMutation={updateMutation} />
        <QuotationSettingsCard quotation={quotation} updateMutation={updateMutation} />

        {/* Line Items */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Line Items ({items.length})
            </CardTitle>
            <Button
              size="sm"
              onClick={() => {
                setNewItemForm({
                  label: "",
                  description: "",
                  estimatedCost: "",
                  quantity: "1",
                  unit: "nos",
                });
                setShowAddItem(true);
              }}
              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                No items yet. Click "Add Item" to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-semibold text-slate-500">
                      <th className="pb-2 pr-2 w-8">#</th>
                      <th className="pb-2 pr-2">Description</th>
                      <th className="pb-2 pr-2 w-16">Qty</th>
                      <th className="pb-2 pr-2 w-16">Unit</th>
                      <th className="pb-2 pr-2 w-28 text-right">Rate (₹)</th>
                      <th className="pb-2 w-28 text-right">Amount</th>
                      <th className="pb-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any, i: number) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        index={i}
                        updateItemMutation={updateItemMutation}
                        onDelete={() => setDeleteConfirmId(item.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

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
                placeholder="e.g. 2 BHK Flat Inspection"
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
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Rate (₹)</Label>
                <Input
                  type="number"
                  value={newItemForm.estimatedCost}
                  onChange={(e) => setNewItemForm((f) => ({ ...f, estimatedCost: e.target.value }))}
                  placeholder="0"
                />
              </div>
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

/* ── Saveable Section Card ──────────────────────────────────────────────── */

function SaveableCard({
  title,
  children,
  hasChanges,
  saving,
  onSave,
}: {
  title: string;
  children: React.ReactNode;
  hasChanges: boolean;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-slate-700">
          {title}
        </CardTitle>
        <Button
          size="sm"
          onClick={onSave}
          disabled={!hasChanges || saving}
          className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
          ) : (
            <Save className="h-3.5 w-3.5 mr-1" />
          )}
          Save
        </Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/* ── Client Details ─────────────────────────────────────────────────────── */

function ClientDetailsCard({
  quotation,
  updateMutation,
}: {
  quotation: any;
  updateMutation: any;
}) {
  const [form, setForm] = useState({
    clientName: quotation.clientName || "",
    clientPhone: quotation.clientPhone || "",
    clientEmail: quotation.clientEmail || "",
  });

  const hasChanges =
    form.clientName !== (quotation.clientName || "") ||
    form.clientPhone !== (quotation.clientPhone || "") ||
    form.clientEmail !== (quotation.clientEmail || "");

  const handleSave = () => {
    updateMutation.mutate({
      clientName: form.clientName || null,
      clientPhone: form.clientPhone || null,
      clientEmail: form.clientEmail || null,
    });
  };

  return (
    <SaveableCard
      title="Client Details"
      hasChanges={hasChanges}
      saving={updateMutation.isPending}
      onSave={handleSave}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs">Client Name</Label>
          <Input
            value={form.clientName}
            onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
            className="h-9"
            placeholder="e.g. Rajesh Kumar"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Phone</Label>
          <Input
            value={form.clientPhone}
            onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))}
            className="h-9"
            placeholder="e.g. 9876543210"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Email</Label>
          <Input
            value={form.clientEmail}
            onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
            className="h-9"
            placeholder="e.g. rajesh@email.com"
          />
        </div>
      </div>
    </SaveableCard>
  );
}

/* ── Property Details ───────────────────────────────────────────────────── */

function PropertyDetailsCard({
  quotation,
  updateMutation,
}: {
  quotation: any;
  updateMutation: any;
}) {
  const [form, setForm] = useState({
    propertyAddress: quotation.propertyAddress || "",
    propertyType: quotation.propertyType || "",
    bedrooms: quotation.bedrooms || "",
    bathrooms: quotation.bathrooms || "",
    areaSqFt: quotation.areaSqFt || "",
  });

  const hasChanges =
    form.propertyAddress !== (quotation.propertyAddress || "") ||
    form.propertyType !== (quotation.propertyType || "") ||
    form.bedrooms !== (quotation.bedrooms || "") ||
    form.bathrooms !== (quotation.bathrooms || "") ||
    form.areaSqFt !== (quotation.areaSqFt || "");

  const handleSave = () => {
    updateMutation.mutate({
      propertyAddress: form.propertyAddress || null,
      propertyType: form.propertyType || null,
      bedrooms: form.bedrooms || null,
      bathrooms: form.bathrooms || null,
      areaSqFt: form.areaSqFt || null,
    });
  };

  return (
    <SaveableCard
      title="Property Details"
      hasChanges={hasChanges}
      saving={updateMutation.isPending}
      onSave={handleSave}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1 md:col-span-2">
          <Label className="text-xs">Address</Label>
          <Input
            value={form.propertyAddress}
            onChange={(e) => setForm((f) => ({ ...f, propertyAddress: e.target.value }))}
            className="h-9"
            placeholder="e.g. Flat 402, Sunshine Heights, Andheri West, Mumbai"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Property Type</Label>
          <Input
            value={form.propertyType}
            onChange={(e) => setForm((f) => ({ ...f, propertyType: e.target.value }))}
            className="h-9"
            placeholder="e.g. 2 BHK Apartment"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Bedrooms</Label>
          <Input
            value={form.bedrooms}
            onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))}
            className="h-9"
            placeholder="e.g. 2"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Bathrooms</Label>
          <Input
            value={form.bathrooms}
            onChange={(e) => setForm((f) => ({ ...f, bathrooms: e.target.value }))}
            className="h-9"
            placeholder="e.g. 2"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Area (sq ft)</Label>
          <Input
            value={form.areaSqFt}
            onChange={(e) => setForm((f) => ({ ...f, areaSqFt: e.target.value }))}
            className="h-9"
            placeholder="e.g. 1200"
          />
        </div>
      </div>
    </SaveableCard>
  );
}

/* ── Quotation Settings ─────────────────────────────────────────────────── */

function QuotationSettingsCard({
  quotation,
  updateMutation,
}: {
  quotation: any;
  updateMutation: any;
}) {
  const [form, setForm] = useState({
    title: quotation.title || "",
    status: quotation.status || "Draft",
    taxRate: quotation.taxRate || "",
    validityDays: quotation.validityDays ?? 30,
    notes: quotation.notes || "",
  });

  const hasChanges =
    form.title !== (quotation.title || "") ||
    form.status !== (quotation.status || "Draft") ||
    form.taxRate !== (quotation.taxRate || "") ||
    form.validityDays !== (quotation.validityDays ?? 30) ||
    form.notes !== (quotation.notes || "");

  const handleSave = () => {
    updateMutation.mutate({
      title: form.title,
      status: form.status,
      taxRate: form.taxRate || "0",
      validityDays: form.validityDays,
      notes: form.notes || null,
    });
  };

  return (
    <SaveableCard
      title="Quotation Settings"
      hasChanges={hasChanges}
      saving={updateMutation.isPending}
      onSave={handleSave}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Input
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="h-9"
              placeholder="Draft"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tax Rate (%)</Label>
            <Input
              type="number"
              value={form.taxRate}
              onChange={(e) => setForm((f) => ({ ...f, taxRate: e.target.value }))}
              className="h-9"
              placeholder="0"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Valid for (days)</Label>
            <Input
              type="number"
              value={form.validityDays}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  validityDays: parseInt(e.target.value) || 30,
                }))
              }
              className="h-9"
              placeholder="30"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Notes & Terms</Label>
          <Textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
            placeholder="Payment terms, warranty info, etc."
          />
        </div>
      </div>
    </SaveableCard>
  );
}

/* ── Line Item Row (inline save for items) ──────────────────────────────── */

function ItemRow({
  item,
  index,
  updateItemMutation,
  onDelete,
}: {
  item: any;
  index: number;
  updateItemMutation: any;
  onDelete: () => void;
}) {
  const [local, setLocal] = useState({
    label: item.label,
    quantity: item.quantity || 1,
    unit: item.unit || "nos",
    estimatedCost: item.estimatedCost || "",
  });

  const [dirty, setDirty] = useState(false);

  const handleChange = (field: string, value: any) => {
    setLocal((f) => ({ ...f, [field]: value }));
    setDirty(true);
  };

  const handleBlur = () => {
    if (!dirty) return;
    updateItemMutation.mutate({
      id: item.id,
      data: {
        label: local.label,
        quantity: typeof local.quantity === "string" ? parseInt(local.quantity) || 1 : local.quantity,
        unit: local.unit,
        estimatedCost: local.estimatedCost,
      },
    });
    setDirty(false);
  };

  const amount =
    (Number(local.estimatedCost) || 0) *
    (typeof local.quantity === "string" ? parseInt(local.quantity) || 1 : local.quantity || 1);

  return (
    <tr className="border-b border-slate-100">
      <td className="py-2 pr-2 text-slate-400 text-xs">{index + 1}</td>
      <td className="py-2 pr-2">
        <Input
          value={local.label}
          onChange={(e) => handleChange("label", e.target.value)}
          onBlur={handleBlur}
          className="h-8 text-sm border-0 shadow-none bg-transparent px-0 focus-visible:ring-0"
        />
      </td>
      <td className="py-2 pr-2">
        <Input
          type="number"
          value={local.quantity}
          onChange={(e) => handleChange("quantity", e.target.value)}
          onBlur={handleBlur}
          className="h-8 text-xs w-14"
        />
      </td>
      <td className="py-2 pr-2">
        <Input
          value={local.unit}
          onChange={(e) => handleChange("unit", e.target.value)}
          onBlur={handleBlur}
          className="h-8 text-xs w-14"
        />
      </td>
      <td className="py-2 pr-2">
        <Input
          type="number"
          value={local.estimatedCost}
          onChange={(e) => handleChange("estimatedCost", e.target.value)}
          onBlur={handleBlur}
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
          onClick={onDelete}
          className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </td>
    </tr>
  );
}
