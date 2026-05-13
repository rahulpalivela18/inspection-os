import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { Receipt, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Billing() {
  const { user, workspace } = useAuth();
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: invoices = [] } = useQuery({
    queryKey: ["workspace", "invoices"],
    queryFn: api.getWorkspaceInvoices,
  });

  const handleDownload = async (inv: any) => {
    setDownloadingId(inv.id);
    try {
      const blob = await pdf(
        <ReceiptPDF
          workspaceName={workspace?.name || ""}
          workspaceEmail={workspace?.email || ""}
          workspaceAddress={workspace?.address || ""}
          workspaceId={workspace?.id || ""}
          plan={inv.plan}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${inv.receiptNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Error", description: "Failed to generate receipt PDF", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Billing
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View your workspace payment history.
          </p>
        </div>

        {workspace?.planStatus === "active" ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" /> Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {workspace?.plan
                      ? workspace.plan.charAt(0).toUpperCase() + workspace.plan.slice(1)
                      : "Starter"}{" "}
                    Plan
                  </p>
                  <p className="text-sm text-slate-500">
                    {workspace?.plan === "starter"
                      ? "Up to 2 inspectors"
                      : workspace?.plan === "pro"
                        ? "Up to 9 inspectors"
                        : "Unlimited inspectors"}
                  </p>
                </div>
                <Badge className="bg-green-50 text-green-700 border-green-200">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-6">
              <p className="text-sm text-amber-600 text-center">
                Your workspace is currently inactive. Contact the platform owner to activate your plan.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4 text-primary" /> Payment History
            </CardTitle>
            <CardDescription>
              {invoices.length} receipt{invoices.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">
                No receipts yet. Payments will appear here once processed.
              </p>
            ) : (
              <div className="divide-y rounded-lg border text-sm">
                {invoices.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">
                        {inv.plan.charAt(0).toUpperCase() + inv.plan.slice(1)} Plan
                      </p>
                      <p className="text-xs text-slate-500">{inv.receiptNumber}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-medium text-slate-900">{inv.amount}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(inv.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-4 shrink-0 gap-1.5"
                      onClick={() => handleDownload(inv)}
                      disabled={downloadingId === inv.id}
                    >
                      {downloadingId === inv.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      PDF
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
