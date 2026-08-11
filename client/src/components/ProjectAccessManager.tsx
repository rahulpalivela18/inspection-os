import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { isAdminRole } from "@/lib/utils";

interface ProjectAccessManagerProps {
  projectId: string;
}

export default function ProjectAccessManager({
  projectId,
}: ProjectAccessManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team"],
    queryFn: () => api.getTeam(),
    enabled: isAdmin,
  });

  const { data: membersData } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: () => api.getProjectMembers(projectId),
    enabled: isAdmin,
  });
  const projectMembers = membersData?.members ?? [];
  const projectRestricted = membersData?.restricted === true;

  const [memberOpenToAll, setMemberOpenToAll] = useState<boolean | null>(null);
  const [memberSelection, setMemberSelection] = useState<string[] | null>(null);

  const serverMemberIds = projectMembers.map((m: any) => m.id);
  const openToAll = memberOpenToAll ?? !projectRestricted;
  const selectedIds = memberSelection ?? serverMemberIds;
  const accessDirty = memberOpenToAll !== null || memberSelection !== null;
  const adminOnly = !openToAll && selectedIds.length === 0;

  useEffect(() => {
    setMemberOpenToAll(null);
    setMemberSelection(null);
  }, [projectId]);

  const saveMembersMutation = useMutation({
    mutationFn: () =>
      api.setProjectMembers(projectId, {
        restricted: !openToAll,
        userIds: openToAll ? [] : selectedIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
      setMemberOpenToAll(null);
      setMemberSelection(null);
      toast({ title: "Access settings saved" });
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const assignableMembers = teamMembers.filter(
    (m: any) => m.role !== "admin" && m.role !== "super_admin",
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Users className="h-4 w-4" /> Team Access
        </CardTitle>
          <CardDescription>
            Open projects are visible to every team member. Turn this off to
            restrict it to the members you assign below (or to admins only if
            you assign no one).
          </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 cursor-pointer bg-white">
          <Checkbox
            checked={openToAll}
            onCheckedChange={(v: boolean) => {
              setMemberOpenToAll(v);
              setMemberSelection(v ? [] : serverMemberIds);
            }}
            data-testid="checkbox-project-open-to-all"
          />
          <div>
            <p className="text-sm font-medium">Open to all team members</p>
                      <p className="text-xs text-muted-foreground">
                        When checked, no one is locked out. When unchecked, only
                        the assigned members below can access it — or just you,
                        if none are assigned.
                      </p>
          </div>
        </label>

        <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 bg-white">
          {assignableMembers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No other team members yet. Add them from the Team page.
            </p>
          )}
          {assignableMembers.map((member: any) => (
            <label
              key={member.id}
              className={`flex items-center justify-between gap-3 px-3 py-2.5 ${
                openToAll ? "opacity-50" : "cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Checkbox
                  checked={openToAll ? false : selectedIds.includes(member.id)}
                  disabled={openToAll}
                  onCheckedChange={(v: boolean) => {
                    setMemberOpenToAll(false);
                    setMemberSelection((prev) => {
                      const base = prev ?? serverMemberIds;
                      return v
                        ? Array.from(new Set([...base, member.id]))
                        : base.filter((id) => id !== member.id);
                    });
                  }}
                  data-testid={`checkbox-member-${member.id}`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {member.email}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-xs text-slate-400">
                {member.role}
              </span>
            </label>
          ))}
          <p className="text-[11px] text-muted-foreground px-3 py-2 bg-slate-50">
            Admins always have access to every project.
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => saveMembersMutation.mutate()}
            disabled={!accessDirty || saveMembersMutation.isPending}
            data-testid="button-save-members"
          >
            {saveMembersMutation.isPending ? "Saving..." : "Save Access"}
          </Button>
        </div>
        {adminOnly && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            No members assigned — only you (and other admins) will be able to
            see this project.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
