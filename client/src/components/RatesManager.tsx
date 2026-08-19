import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";

const UNIT_OPTIONS = ["flat", "per sq ft", "per sq m", "per visit", "per hour"];

const emptyRate = { label: "", rate: "", unit: "flat" };

export default function RatesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: rates = [] } = useQuery({
    queryKey: ["workspace-rates"],
    queryFn: () => api.getWorkspaceRates(),
  });
  const [rateForm, setRateForm] = useState(emptyRate);
  const [editRateId, setEditRateId] = useState<string | null>(null);
  const [editRateForm, setEditRateForm] = useState(emptyRate);
  const [deleteRateId, setDeleteRateId] = useState<string | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["workspace-rates"] });

  const createRateMutation = useMutation({
    mutationFn: () => api.createWorkspaceRate(rateForm),
    onSuccess: () => {
      invalidate();
      setRateForm(emptyRate);
      toast({ title: "Rate Added" });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateRateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateWorkspaceRate(id, data),
    onSuccess: () => {
      invalidate();
      setEditRateId(null);
      toast({ title: "Rate Updated" });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteRateMutation = useMutation({
    mutationFn: (id: string) => api.deleteWorkspaceRate(id),
    onSuccess: () => {
      invalidate();
      toast({ title: "Rate Deleted" });
    },
  });

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_110px_130px_auto]">
        <Input
          value={rateForm.label}
          onChange={(e) => setRateForm((f) => ({ ...f, label: e.target.value }))}
          placeholder="e.g. 2 BHK Inspection"
          className="h-9"
          data-testid="input-rate-label"
        />
        <Input
          type="number"
          value={rateForm.rate}
          onChange={(e) => setRateForm((f) => ({ ...f, rate: e.target.value }))}
          placeholder="Rate ₹"
          className="h-9"
          data-testid="input-rate-amount"
        />
        <select
          value={rateForm.unit}
          onChange={(e) => setRateForm((f) => ({ ...f, unit: e.target.value }))}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
          data-testid="input-rate-unit"
        >
          {UNIT_OPTIONS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          className="h-9 gap-1.5"
          onClick={() => createRateMutation.mutate()}
          disabled={
            !rateForm.label.trim() || !rateForm.rate || createRateMutation.isPending
          }
          data-testid="button-add-rate"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>

      <div className="divide-y rounded-lg border overflow-hidden">
        {rates.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No rates defined yet. Add your first rate above.
          </p>
        )}
        {rates.map((r: any) =>
          editRateId === r.id ? (
            <div key={r.id} className="flex items-center gap-2 px-4 py-2 bg-white">
              <Input
                value={editRateForm.label}
                onChange={(e) =>
                  setEditRateForm((f) => ({ ...f, label: e.target.value }))
                }
                className="h-8 flex-1"
              />
              <Input
                type="number"
                value={editRateForm.rate}
                onChange={(e) =>
                  setEditRateForm((f) => ({ ...f, rate: e.target.value }))
                }
                className="h-8 w-24"
              />
              <select
                value={editRateForm.unit}
                onChange={(e) =>
                  setEditRateForm((f) => ({ ...f, unit: e.target.value }))
                }
                className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                className="h-8"
                onClick={() =>
                  updateRateMutation.mutate({ id: r.id, data: editRateForm })
                }
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8"
                onClick={() => setEditRateId(null)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div
              key={r.id}
              className="flex items-center justify-between px-4 py-3 bg-white"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-900">
                  {r.label}
                </span>
                <span className="text-sm text-indigo-600 font-semibold">
                  ₹{Number(r.rate).toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                  {r.unit}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                  onClick={() => {
                    setEditRateId(r.id);
                    setEditRateForm({ label: r.label, rate: r.rate, unit: r.unit });
                  }}
                  data-testid={`button-edit-rate-${r.id}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                  onClick={() => setDeleteRateId(r.id)}
                  data-testid={`button-delete-rate-${r.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ),
        )}
      </div>

      <ConfirmDialog
        open={deleteRateId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteRateId(null);
        }}
        title="Delete Rate"
        description="This will permanently remove this rate from your shared pricing list."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteRateId) {
            deleteRateMutation.mutate(deleteRateId);
            setDeleteRateId(null);
          }
        }}
        loading={deleteRateMutation.isPending}
      />
    </div>
  );
}
