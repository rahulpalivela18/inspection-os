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
  IndianRupee,
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
  const [calcRateId, setCalcRateId] = useState<string>("");
  const [calcQty, setCalcQty] = useState("1");

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

  const { data: rates = [] } = useQuery({
    queryKey: ["workspace-rates"],
    queryFn: () => api.getWorkspaceRates(),
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

  const handleQuickAddRate = (rate: any, qty: number = 1) => {
    addItemMutation.mutate({
      label: rate.label,
      description: null,
      estimatedCost: rate.rate,
      quantity: qty,
      unit: rate.unit,
      order: items.length,
    });
  };

  const handleExportPDF = async () => {
    if (!quotation || !workspace) return;
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

  const handleShareWhatsApp = () => {
    const client = quotation.clientName || "Client";
    const projectTitle = project?.title || "";
    const totalFormatted = `₹${total.toLocaleString("en-IN")}`;
    const text = `Hi ${client},\n\nHere's your inspection quotation from ${workspace?.name || "ReportGen"}:\n\n*${quotation.title}*\nProject: ${projectTitle}\nTotal: ${totalFormatted}\nValid for: ${quotation.validityDays || 30} days\n\nPlease review and let us know if you have any questions.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleShareEmail = () => {
    const client = quotation.clientName || "Client";
    const projectTitle = project?.title || "";
    const totalFormatted = `₹${total.toLocaleString("en-IN")}`;
    const subject = encodeURIComponent(`${quotation.title} — Inspection Quotation`);
    const body = encodeURIComponent(
      `Hi ${client},\n\nHere's your inspection quotation from ${workspace?.name || "ReportGen"}:\n\n${quotation.title}\nProject: ${projectTitle}\nTotal: ${totalFormatted}\nValid for: ${quotation.validityDays || 30} days\n\nPlease review and let us know if you have any questions.\n\nRegards,\n${workspace?.name || ""}`
    );
    window.open(`mailto:${quotation.clientEmail || ""}?subject=${subject}&body=${body}`, "_blank");
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
              onClick={() => setLocation("/quotations")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {quotation.title}
              </h1>
              {project ? (
                <p className="text-sm text-slate-500">
                  {project.title} — {project.clientName}
                </p>
              ) : (
                <p className="text-sm text-slate-500">Quick quotation</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              className="h-8 w-8 p-0"
              title="Share via WhatsApp"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareEmail}
              className="h-8 w-8 p-0"
              title="Share via Email"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </Button>
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
            {rates.length > 0 && (
              <div className="mb-4 p-4 rounded-lg border border-indigo-200 bg-indigo-50/50">
                <p className="text-xs font-semibold text-indigo-700 mb-3 flex items-center gap-1.5">
                  <IndianRupee className="h-3.5 w-3.5" /> Rate Calculator
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {rates.map((r: any) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setCalcRateId(r.id);
                        setCalcQty("1");
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        calcRateId === r.id
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                      }`}
                    >
                      {r.label}
                      <span className={calcRateId === r.id ? "text-indigo-200" : "text-indigo-500"}>
                        ₹{Number(r.rate).toLocaleString("en-IN")}/{r.unit}
                      </span>
                    </button>
                  ))}
                </div>
                {calcRateId && (
                  <div className="flex items-end gap-3 pt-2 border-t border-indigo-100">
                    <div className="space-y-1 flex-1 max-w-[140px]">
                      <Label className="text-[11px] text-slate-500">Quantity</Label>
                      <Input
                        type="number"
                        value={calcQty}
                        onChange={(e) => setCalcQty(e.target.value)}
                        className="h-8 text-sm bg-white"
                        min="1"
                      />
                    </div>
                    <div className="text-sm text-slate-500 pb-2">=</div>
                    <div className="text-sm font-bold text-indigo-700 pb-2">
                      ₹{(() => {
                        const rate = rates.find((r: any) => r.id === calcRateId);
                        if (!rate) return "0";
                        return (Number(rate.rate) * (parseInt(calcQty) || 1)).toLocaleString("en-IN");
                      })()}
                    </div>
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
                      disabled={addItemMutation.isPending}
                      onClick={() => {
                        const rate = rates.find((r: any) => r.id === calcRateId);
                        if (!rate) return;
                        handleQuickAddRate(rate, parseInt(calcQty) || 1);
                        setCalcRateId("");
                        setCalcQty("1");
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add
                    </Button>
                  </div>
                )}
              </div>
            )}

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
    taxRate: quotation.taxRate || "",
    validityDays: quotation.validityDays ?? 30,
    notes: quotation.notes || "",
  });

  const hasChanges =
    form.title !== (quotation.title || "") ||
    form.taxRate !== (quotation.taxRate || "") ||
    form.validityDays !== (quotation.validityDays ?? 30) ||
    form.notes !== (quotation.notes || "");

  const handleSave = () => {
    updateMutation.mutate({
      title: form.title,
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
