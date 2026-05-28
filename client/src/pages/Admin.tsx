import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pdf } from "@react-pdf/renderer";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import ReceiptPDF from "@/components/ReceiptPDF";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Receipt,
  Save,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PLAN_DETAILS: Record<string, { label: string; price: string }> = {
  starter: { label: "Starter", price: "₹5,000/month" },
  pro: { label: "Pro", price: "₹8,000/month" },
  enterprise: { label: "Enterprise", price: "₹15,000/month" },
};

const PLAN_ORDER = ["starter", "pro", "enterprise"];

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState("starter");
  const [editStatus, setEditStatus] = useState("inactive");
  const [pdfLoading, setPdfLoading] = useState(false);

  const { data: workspaces = [] } = useQuery({
    queryKey: ["admin", "workspaces"],
    queryFn: api.getAdminWorkspaces,
  });

  const { data: adminInvoices = [] } = useQuery({
    queryKey: ["admin", "invoices"],
    queryFn: api.getAdminInvoices,
  });

  const selectedWs = workspaces.find((w: any) => w.id === selectedId) || null;

  const hasMonthReceipt = (wsId: string, plan: string) => {
    const now = new Date();
    return adminInvoices.some((i: any) => {
      if (i.workspaceId !== wsId || i.plan !== plan) return false;
      const d = new Date(i.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  };

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updateWorkspace({
        targetWorkspaceId: selectedId,
        plan: editPlan,
        planStatus: editStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "invoices"] });
      toast({ title: "Plan Updated", description: "Workspace billing saved." });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleSelect = (id: string) => {
    const ws = workspaces.find((w: any) => w.id === id);
    if (ws) {
      setSelectedId(id);
      setEditPlan(ws.plan || "starter");
      setEditStatus(ws.planStatus || "inactive");
    }
  };

  const handleGenerateReceipt = useCallback(async () => {
    if (!selectedWs || editStatus !== "active") return;
    setPdfLoading(true);
    try {
      const existing = adminInvoices.find(
        (i: any) => i.workspaceId === selectedWs.id && i.plan === editPlan
      );
      let receiptNumber: string;
      if (existing) {
        receiptNumber = existing.receiptNumber;
      } else {
        const newInvoice = await api.createInvoice({
          workspaceId: selectedWs.id,
          plan: editPlan,
          amount: PLAN_DETAILS[editPlan]?.price || "",
        });
        receiptNumber = newInvoice.receiptNumber;
        queryClient.invalidateQueries({ queryKey: ["admin", "invoices"] });
      }
      const blob = await pdf(
        <ReceiptPDF
          workspaceName={selectedWs.name}
          workspaceEmail={selectedWs.email || ""}
          workspaceAddress={selectedWs.address || ""}
          workspaceId={selectedWs.id}
          plan={editPlan}
          receiptNumber={receiptNumber}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${receiptNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Error", description: "Failed to generate receipt PDF", variant: "destructive" });
    } finally {
      setPdfLoading(false);
    }
  }, [selectedWs, editPlan, adminInvoices]);

  if (user?.role !== "super_admin") {
    return (
      <Layout>
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
          <p className="text-sm text-slate-500">Access denied.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage workspaces, plans, and billing.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Workspace list */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> Workspaces
              </CardTitle>
              <CardDescription>
                {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y rounded-lg border">
                {workspaces.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No workspaces found.
                  </p>
                )}
                {workspaces.map((ws: any) => (
                  <button
                    key={ws.id}
                    onClick={() => handleSelect(ws.id)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                      selectedId === ws.id ? "bg-indigo-50/50" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {ws.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {ws.email || "No email"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {ws.planStatus === "active" ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 text-[10px]"
                        >
                          {PLAN_DETAILS[ws.plan]?.label || "Starter"}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                        >
                          Inactive
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Plan editor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="h-4 w-4 text-primary" /> Plan Settings
              </CardTitle>
              <CardDescription>
                {selectedWs
                  ? `Editing: ${selectedWs.name}`
                  : "Select a workspace"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedWs ? (
                <>
                  <div className="space-y-2">
                    <Label className="font-semibold text-xs">Plan</Label>
                    <Select value={editPlan} onValueChange={setEditPlan}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLAN_ORDER.map((key) => (
                          <SelectItem key={key} value={key}>
                            {PLAN_DETAILS[key].label} — {PLAN_DETAILS[key].price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold text-xs">Status</Label>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                            Active — Paid
                          </span>
                        </SelectItem>
                        <SelectItem value="inactive">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            Inactive — Unpaid
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={() => updateMutation.mutate()}
                    disabled={updateMutation.isPending || (editPlan === selectedWs.plan && editStatus === selectedWs.planStatus)}
                    className="w-full gap-2"
                    size="sm"
                  >
                    <Save className="h-4 w-4" />
                    {updateMutation.isPending ? "Saving..." : "Save Plan"}
                  </Button>

                  {editStatus === "active" && (
                    <Button
                      variant="outline"
                      onClick={handleGenerateReceipt}
                      disabled={pdfLoading}
                      className="w-full gap-2"
                      size="sm"
                    >
                      <Receipt className="h-4 w-4" />
                      {pdfLoading ? "Generating..." : hasMonthReceipt(selectedWs.id, editPlan) ? "Download Receipt" : "Generate Receipt"}
                    </Button>
                  )}

                  <div
                    className={`rounded-lg border px-3 py-2 text-xs ${
                      editStatus === "active"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-amber-50 border-amber-200 text-amber-700"
                    }`}
                  >
                    {editStatus === "active"
                      ? `${selectedWs.name} is on the ${PLAN_DETAILS[editPlan].label} plan.`
                      : `${selectedWs.name} is inactive. Set to Active after payment.`}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400 text-center py-6">
                  Select a workspace from the list to manage its plan.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        </div>

        {/* Invoice History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4 text-primary" /> Recent Receipts
            </CardTitle>
            <CardDescription>
              {adminInvoices.length} receipt{adminInvoices.length !== 1 ? "s" : ""} generated
            </CardDescription>
          </CardHeader>
          <CardContent>
            {adminInvoices.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No receipts generated yet.</p>
            ) : (
              <div className="divide-y rounded-lg border text-sm">
                {adminInvoices.map((inv: any) => {
                  const ws = workspaces.find((w: any) => w.id === inv.workspaceId);
                  return (
                    <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 truncate">{ws?.name || "Unknown"}</p>
                        <p className="text-xs text-slate-500">{inv.receiptNumber}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="font-medium text-slate-900">{inv.amount}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(inv.createdAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </Layout>
  );
}
