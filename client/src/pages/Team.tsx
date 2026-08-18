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
  Shield,
  Users,
  UserPlus,
  Trash2,
  KeyRound,
  AlertTriangle,
} from "lucide-react";
import MemberAccessManager from "@/components/MemberAccessManager";
import { useToast } from "@/hooks/use-toast";
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
import { ROLE_LABELS } from "@/lib/constants";
import { isValidEmail, isAdminRole, getInitials } from "@/lib/utils";

export default function Team() {
  const { user, refreshTrial } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = isAdminRole(user?.role);

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
  const [accessMember, setAccessMember] = useState<any>(null);

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

  const handleAddMember = () => {
    setMemberTouched({ name: true, email: true, password: true });
    const valid =
      newMember.name.trim().length >= 1 &&
      isValidEmail(newMember.email) &&
      newMember.password.length >= 6;
    if (!valid) return;
    addMemberMutation.mutate();
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-10">
              <div className="flex flex-col items-center text-center gap-3">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
                <p className="text-lg font-medium text-slate-700">
                  You don't have permission to view this page.
                </p>
                <p className="text-sm text-slate-400">
                  Only workspace admins can manage the team.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Team
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage who has access to this workspace.
          </p>
        </div>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Team Members
                </CardTitle>
                <CardDescription className="mt-1">
                  Add or remove people from your workspace.
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
              {(team as any[]).filter((m: any) => m.role !== "super_admin").map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between px-4 py-3 bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {getInitials(m.name, m.email)}
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
                    {m.role !== "admin" && m.role !== "super_admin" && isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 px-2 text-slate-400 hover:text-primary"
                        title="Manage project access"
                        onClick={() => setAccessMember(m)}
                        data-testid={`button-manage-access-${m.id}`}
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline text-xs">Access</span>
                      </Button>
                    )}
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
      </div>

      <MemberAccessManager
        member={accessMember}
        open={!!accessMember}
        onOpenChange={(open) => !open && setAccessMember(null)}
      />
    </Layout>
  );
}
