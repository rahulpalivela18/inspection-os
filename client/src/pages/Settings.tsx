import { useState } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  Save,
  Image as ImageIcon,
  LogOut,
  Users,
  UserPlus,
  Trash2,
  Shield,
  Plus,
  IndianRupee,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
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
import { Badge } from "@/components/ui/badge";
import ConfirmDialog from "@/components/ConfirmDialog";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  super_admin: {
    label: "Super Admin",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  admin: { label: "Admin", color: "bg-red-100 text-red-700 border-red-200" },
  inspector: {
    label: "Inspector",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  viewer: {
    label: "Viewer",
    color: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Settings() {
  const { user, workspace, refreshWorkspace, refreshTrial, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [profile, setProfile] = useState({
    name: workspace?.name || "",
    email: workspace?.email || "",
    phone: workspace?.phone || "",
    address: workspace?.address || "",
    logoUrl: workspace?.logoUrl || "",
    taxRate: (workspace as any)?.taxRate || "18",
  });
  const [logoPreview, setLogoPreview] = useState(workspace?.logoUrl || "");

  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    password: "",
    role: "inspector",
  });
  const [memberTouched, setMemberTouched] = useState({
    name: false,
    email: false,
    password: false,
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const [showAddRate, setShowAddRate] = useState(false);
  const [rateForm, setRateForm] = useState({ label: "", rate: "", unit: "flat" });
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editRateForm, setEditRateForm] = useState({ label: "", rate: "", unit: "flat" });
  const [deleteRateId, setDeleteRateId] = useState<string | null>(null);

  const memberErrors = {
    name:
      memberTouched.name && newMember.name.trim().length < 1
        ? "Name is required."
        : "",
    email:
      memberTouched.email && !isValidEmail(newMember.email)
        ? "Valid email required."
        : "",
    password:
      memberTouched.password && newMember.password.length < 6
        ? "Min 6 characters."
        : "",
  };

  const saveMutation = useMutation({
    mutationFn: () => api.updateWorkspace(profile),
    onSuccess: (data: any) => {
      refreshWorkspace(data);
      toast({
        title: "Settings Saved",
        description: "Your company profile has been updated.",
      });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const { data: team = [] } = useQuery({
    queryKey: ["team"],
    queryFn: api.getTeam,
    enabled: isAdmin,
  });

  const addMemberMutation = useMutation({
    mutationFn: () => api.addTeamMember(newMember as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      refreshTrial();
      setNewMember({ name: "", email: "", password: "", role: "inspector" });
      setMemberTouched({ name: false, email: false, password: false });
      setShowAddForm(false);
      toast({
        title: "Member Added",
        description: "They can now log in with their credentials.",
      });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (id: string) => api.removeTeamMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      toast({ title: "Member Removed" });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  // ── Workspace Rates ────────────────────────────────────────────────────────

  const { data: rates = [] } = useQuery({
    queryKey: ["workspace-rates"],
    queryFn: () => api.getWorkspaceRates(),
    enabled: isAdmin,
  });

  const addRateMutation = useMutation({
    mutationFn: () => api.createWorkspaceRate(rateForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-rates"] });
      setRateForm({ label: "", rate: "", unit: "flat" });
      setShowAddRate(false);
      toast({ title: "Rate Added" });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateRateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateWorkspaceRate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-rates"] });
      setEditingRateId(null);
      toast({ title: "Rate Updated" });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteRateMutation = useMutation({
    mutationFn: (id: string) => api.deleteWorkspaceRate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-rates"] });
      toast({ title: "Rate Deleted" });
    },
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setProfile({ ...profile, logoUrl: base64 });
      setLogoPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const handleAddMember = () => {
    setMemberTouched({ name: true, email: true, password: true });
    const valid =
      newMember.name.trim().length >= 1 &&
      isValidEmail(newMember.email) &&
      newMember.password.length >= 6;
    if (!valid) return;
    addMemberMutation.mutate();
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your workspace and company profile.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>

        {/* Company Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Company Profile
            </CardTitle>
            <CardDescription>
              This information will be displayed on the cover page and footer of
              all generated PDF reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="companyName" className="font-semibold">
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  placeholder="Company Name"
                  disabled={!isAdmin}
                  data-testid="input-company-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone" className="font-semibold">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  placeholder="+91 123 456 7890"
                  disabled={!isAdmin}
                  data-testid="input-company-phone"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="taxRate" className="font-semibold">
                  Default Tax Rate (%)
                </Label>
                <Input
                  id="taxRate"
                  type="number"
                  value={profile.taxRate}
                  onChange={(e) =>
                    setProfile({ ...profile, taxRate: e.target.value })
                  }
                  placeholder="18"
                  disabled={!isAdmin}
                  data-testid="input-tax-rate"
                />
                <p className="text-xs text-muted-foreground">
                  GST rate applied by default to new quotations.
                </p>
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="address" className="font-semibold">
                  Business Address
                </Label>
                <Input
                  id="address"
                  value={profile.address}
                  onChange={(e) =>
                    setProfile({ ...profile, address: e.target.value })
                  }
                  placeholder="123 Main St, City, State, ZIP"
                  disabled={!isAdmin}
                  data-testid="input-company-address"
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label className="font-semibold">Company Logo</Label>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 shrink-0 overflow-hidden">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="cursor-pointer max-w-sm"
                      disabled={!isAdmin}
                      data-testid="input-company-logo"
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload a square PNG or JPG. This will appear on your
                      report headers and PDF covers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {isAdmin && (
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="gap-2"
                  data-testid="button-save-settings"
                >
                  <Save className="h-4 w-4" />{" "}
                  {saveMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Team Members
                </CardTitle>
                <CardDescription className="mt-1">
                  Manage who has access to this workspace.
                </CardDescription>
              </div>
              {isAdmin && (
                <Button
                  size="sm"
                  className="gap-2 shrink-0"
                  onClick={() => setShowAddForm((v) => !v)}
                  data-testid="button-add-member"
                >
                  <UserPlus className="h-4 w-4" />
                  {showAddForm ? "Cancel" : "Add Member"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin && showAddForm && (
              <div className="border rounded-lg p-4 bg-slate-50 space-y-4">
                <p className="text-sm font-medium text-slate-700">
                  New Team Member
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="member-name">Full Name</Label>
                    <Input
                      id="member-name"
                      placeholder="Jane Doe"
                      value={newMember.name}
                      onChange={(e) =>
                        setNewMember((m) => ({ ...m, name: e.target.value }))
                      }
                      onBlur={() =>
                        setMemberTouched((t) => ({ ...t, name: true }))
                      }
                      className={memberErrors.name ? "border-red-400" : ""}
                      data-testid="input-member-name"
                    />
                    {memberErrors.name && (
                      <p className="text-xs text-red-500">
                        {memberErrors.name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="member-email">Email</Label>
                    <Input
                      id="member-email"
                      type="email"
                      placeholder="jane@company.com"
                      value={newMember.email}
                      onChange={(e) =>
                        setNewMember((m) => ({ ...m, email: e.target.value }))
                      }
                      onBlur={() =>
                        setMemberTouched((t) => ({ ...t, email: true }))
                      }
                      className={memberErrors.email ? "border-red-400" : ""}
                      data-testid="input-member-email"
                    />
                    {memberErrors.email && (
                      <p className="text-xs text-red-500">
                        {memberErrors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="member-password">Password</Label>
                    <Input
                      id="member-password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={newMember.password}
                      onChange={(e) =>
                        setNewMember((m) => ({
                          ...m,
                          password: e.target.value,
                        }))
                      }
                      onBlur={() =>
                        setMemberTouched((t) => ({ ...t, password: true }))
                      }
                      className={memberErrors.password ? "border-red-400" : ""}
                      data-testid="input-member-password"
                    />
                    {memberErrors.password && (
                      <p className="text-xs text-red-500">
                        {memberErrors.password}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>Role</Label>
                    <div className="flex h-9 items-center rounded-md border border-input bg-transparent px-3 text-sm">
                      <Shield className="h-4 w-4 text-slate-400 mr-2" />
                      Inspector
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      New members are added as Inspectors.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddMember}
                    disabled={addMemberMutation.isPending}
                    className="gap-2"
                    data-testid="button-confirm-add-member"
                  >
                    <UserPlus className="h-4 w-4" />
                    {addMemberMutation.isPending ? "Adding..." : "Add Member"}
                  </Button>
                </div>
              </div>
            )}

            <div className="divide-y rounded-lg border overflow-hidden">
              {(team as any[]).map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between px-4 py-3 bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {m.name?.charAt(0) || m.email?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {m.name || "Unnamed"}
                      </p>
                      <p className="text-xs text-slate-500">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium ${
                        ROLE_LABELS[m.role]?.color || ""
                      }`}
                    >
                      {ROLE_LABELS[m.role]?.label || m.role}
                    </Badge>
                    {m.role !== "super_admin" && isAdmin && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                            data-testid={`button-remove-member-${m.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will revoke their access. They won't be able to
                              log in anymore.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() =>
                                removeMemberMutation.mutate(m.id)
                              }
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              <strong>Important:</strong> Only add people from your own company
              here. Each person added gets full access to all your workspace
              data (projects, reports, templates). Never share login credentials
              — give each person their own account.
            </div>
          </CardContent>
        </Card>

        {/* Pricing Rates */}
        {isAdmin && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-primary" /> Pricing
                </CardTitle>
                <CardDescription className="mt-1">
                  Define your inspection rates. These will appear in the Rate
                  Calculator when creating quotations.
                </CardDescription>
              </div>
              <Button
                size="sm"
                className="gap-2 shrink-0"
                onClick={() => setShowAddRate((v) => !v)}
              >
                <Plus className="h-4 w-4" />
                {showAddRate ? "Cancel" : "Add Rate"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showAddRate && (
              <div className="border rounded-lg p-4 bg-slate-50 space-y-4">
                <p className="text-sm font-medium text-slate-700">New Rate</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <Label>Label *</Label>
                    <Input
                      placeholder="e.g. 2 BHK Inspection"
                      value={rateForm.label}
                      onChange={(e) =>
                        setRateForm((f) => ({ ...f, label: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Rate (₹) *</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={rateForm.rate}
                      onChange={(e) =>
                        setRateForm((f) => ({ ...f, rate: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Unit</Label>
                    <select
                      value={rateForm.unit}
                      onChange={(e) =>
                        setRateForm((f) => ({ ...f, unit: e.target.value }))
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="flat">Flat</option>
                      <option value="per sq ft">Per sq ft</option>
                      <option value="per sq m">Per sq m</option>
                      <option value="per visit">Per visit</option>
                      <option value="per hour">Per hour</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => addRateMutation.mutate()}
                    disabled={!rateForm.label.trim() || !rateForm.rate || addRateMutation.isPending}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Rate
                  </Button>
                </div>
              </div>
            )}

            <div className="divide-y rounded-lg border overflow-hidden">
              {rates.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No rates defined yet. Add your inspection rates above.
                </p>
              )}
              {rates.map((r: any) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-4 py-3 bg-white"
                >
                  {editingRateId === r.id ? (
                    <div className="flex items-center gap-3 flex-1">
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
                        className="flex h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                      >
                        <option value="flat">Flat</option>
                        <option value="per sq ft">Per sq ft</option>
                        <option value="per sq m">Per sq m</option>
                        <option value="per visit">Per visit</option>
                        <option value="per hour">Per hour</option>
                      </select>
                      <Button
                        size="sm"
                        className="h-8"
                        onClick={() =>
                          updateRateMutation.mutate({
                            id: r.id,
                            data: editRateForm,
                          })
                        }
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8"
                        onClick={() => setEditingRateId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
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
                            setEditingRateId(r.id);
                            setEditRateForm({
                              label: r.label,
                              rate: r.rate,
                              unit: r.unit,
                            });
                          }}
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                            <path d="m15 5 4 4"/>
                          </svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                          onClick={() => setDeleteRateId(r.id)}
                        >
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
        )}

        <ConfirmDialog
          open={deleteRateId !== null}
          onOpenChange={(open) => { if (!open) setDeleteRateId(null); }}
          title="Delete Rate"
          description="This will permanently remove this rate from your pricing list."
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
    </Layout>
  );
}
