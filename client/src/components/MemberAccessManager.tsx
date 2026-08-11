import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Lock, Globe, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MemberAccessManagerProps {
  member: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY_MATRIX: any[] = [];

export default function MemberAccessManager({
  member,
  open,
  onOpenChange,
}: MemberAccessManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: matrix = EMPTY_MATRIX, isFetching } = useQuery({
    queryKey: ["team-access"],
    queryFn: api.getTeamAccess,
    enabled: open,
  });

  const restrictedProjects = matrix.filter((p: any) => p.restricted);
  const serverAssignedIds = restrictedProjects
    .filter((p: any) => (p.memberIds ?? []).includes(member?.id))
    .map((p: any) => p.id);

  const [checked, setChecked] = useState<string[]>([]);

  useEffect(() => {
    setChecked(serverAssignedIds);
  }, [open, member?.id, matrix]);

  const dirty =
    checked.length !== serverAssignedIds.length ||
    checked.some((id) => !serverAssignedIds.includes(id)) ||
    serverAssignedIds.some((id) => !checked.includes(id));

  const saveMutation = useMutation({
    mutationFn: () => api.setMemberProjects(member?.id, checked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-access"] });
      queryClient.invalidateQueries({ queryKey: ["project-members"] });
      toast({ title: "Access updated", description: `${member?.name}'s project access was saved.` });
      onOpenChange(false);
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Projects</DialogTitle>
          <DialogDescription>
            Choose which restricted projects {member?.name || "this member"} can
            access. Open projects are visible to everyone, so they aren't
            assignable.
          </DialogDescription>
        </DialogHeader>

        {isFetching ? (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-[45vh] overflow-y-auto bg-white">
            {matrix.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No projects in this workspace yet.
              </p>
            )}
            {matrix.map((project: any) => {
              const isRestricted = project.restricted === true;
              const isChecked = checked.includes(project.id);
              return (
                <label
                  key={project.id}
                  className={`flex items-center gap-3 px-3 py-2.5 ${
                    isRestricted ? "cursor-pointer" : "opacity-60"
                  }`}
                >
                  <Checkbox
                    checked={isRestricted ? isChecked : true}
                    disabled={!isRestricted || saveMutation.isPending}
                    onCheckedChange={(v: boolean) =>
                      setChecked((prev) =>
                        v
                          ? [...prev, project.id]
                          : prev.filter((id) => id !== project.id),
                      )
                    }
                    data-testid={`checkbox-project-${project.id}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{project.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {isRestricted ? "Restricted" : "Open to everyone"}
                    </p>
                  </div>
                  {isRestricted ? (
                    <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  )}
                </label>
              );
            })}
          </div>
        )}

        {!isFetching && restrictedProjects.length === 0 && matrix.length > 0 && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            No restricted projects yet. To make a project restricted, open its
            Access tab and turn off "Open to all team members".
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-member-access"
          >
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!dirty || saveMutation.isPending}
            data-testid="button-save-member-access"
          >
            {saveMutation.isPending ? "Saving..." : "Save Access"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
