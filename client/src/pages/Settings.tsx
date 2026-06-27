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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Save,
  Image as ImageIcon,
  LogOut,
  Users,
  UserPlus,
  Trash2,
  Shield,
  Eye,
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
  const { user, workspace, refreshWorkspace, logout } = useAuth();
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

        {/* Team Members — only visible to admin / super_admin */}
        {isAdmin && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Team Members
                </CardTitle>
                <CardDescription className="mt-1">
                  Manage who has access to your workspace. Add members here —
                  they should not register separately.
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
            {/* Add member form */}
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
                    <Label htmlFor="member-password">Temporary Password</Label>
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
                    <Label htmlFor="member-role">Role</Label>
                    <Select
                      value={newMember.role}
                      onValueChange={(v) =>
                        setNewMember((m) => ({ ...m, role: v }))
                      }
                    >
                      <SelectTrigger
                        id="member-role"
                        data-testid="select-member-role"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          Admin — full access
                        </SelectItem>
                        <SelectItem value="inspector">
                          Inspector — create & edit reports
                        </SelectItem>
                        <SelectItem value="viewer">
                          Viewer — read only
                        </SelectItem>
                      </SelectContent>
                    </Select>
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
                    {addMemberMutation.isPending ? "Adding..." : "Add to Team"}
                  </Button>
                </div>
              </div>
            )}

            {/* Members list */}
            <div className="divide-y rounded-lg border overflow-hidden">
              {team.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No members yet.
                </p>
              )}
              {team.map((member: any) => {
                const roleInfo = ROLE_LABELS[member.role] || ROLE_LABELS.viewer;
                const isSelf = member.id === user?.id;
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between px-4 py-3 bg-white"
                    data-testid={`row-member-${member.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-indigo-700">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.name}{" "}
                          {isSelf && (
                            <span className="text-xs text-muted-foreground font-normal">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${roleInfo.color}`}
                      >
                        {roleInfo.label}
                      </span>
                      {isAdmin && !isSelf && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-red-500"
                              data-testid={`button-remove-member-${member.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Remove {member.name}?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                They will immediately lose access to this
                                workspace and all its data. This cannot be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() =>
                                  removeMemberMutation.mutate(member.id)
                                }
                                data-testid={`button-confirm-remove-${member.id}`}
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              <strong>Important:</strong> Only add people from your own company
              here. Each person added gets full access to all your workspace
              data (projects, reports, templates). Never share login credentials
              — give each person their own account.
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </Layout>
  );
}
