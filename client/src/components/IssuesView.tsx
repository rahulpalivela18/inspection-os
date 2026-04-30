import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Ruler, FileText, Trash2 } from "lucide-react";
import type { Issue } from "@/lib/store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface IssuesViewProps {
  report: any;
  openEditIssueSheet: (issue: Issue) => void;
  saveReport: (data: any) => void;
}

export default function IssuesView({
  report,
  openEditIssueSheet,
  saveReport,
}: IssuesViewProps) {
  const issues: Issue[] = report.issues ?? [];
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState<string | null>(null);

  const confirmDelete = (issueId: string) => {
    setIssueToDelete(issueId);
    setDeleteConfirmOpen(true);
  };

  const deleteIssue = () => {
    if (!issueToDelete) return;
    const updatedIssues = issues.filter((i: Issue) => i.id !== issueToDelete);
    saveReport({ ...report, issues: updatedIssues });
    setDeleteConfirmOpen(false);
    setIssueToDelete(null);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "text-red-600 bg-red-50 border-red-200";
      case "High": return "text-orange-600 bg-orange-50 border-orange-200";
      case "Medium": return "text-amber-600 bg-amber-50 border-amber-200";
      default: return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open": return "text-blue-600 bg-blue-50 border-blue-200";
      case "In Progress": return "text-amber-600 bg-amber-50 border-amber-200";
      case "Resolved": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" /> Reported Issues
        </h2>
        <div className="text-sm text-muted-foreground bg-white px-3 py-1 rounded-full border shadow-sm">
          {issues.length} Issue{issues.length !== 1 ? "s" : ""}
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border shadow-sm">
          <AlertTriangle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No issues reported yet</p>
          <p className="text-sm text-slate-400 mt-1">Click "Add Issue" to report a new issue</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {issues.map((issue: Issue) => (
            <Card key={issue.id} className="p-4 md:p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base md:text-lg">{issue.title}</h3>
                    <div className="flex gap-2 shrink-0">
                      <Badge className={getSeverityColor(issue.severity)}>
                        {issue.severity}
                      </Badge>
                      <Badge className={getStatusColor(issue.status)}>
                        {issue.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">{issue.note}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Ruler className="h-3 w-3" /> {issue.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" /> {issue.responsibleEngineer}
                    </span>
                  </div>
                  {issue.images.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {issue.images.map((img: string, idx: number) => (
                        <div key={idx} className="h-16 w-16 rounded border overflow-hidden">
                          <img src={img} alt="Issue" className="object-cover w-full h-full" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex md:flex-col gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditIssueSheet(issue)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => confirmDelete(issue.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Issue?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              issue "{issueToDelete ? issues.find((i: Issue) => i.id === issueToDelete)?.title : ''}" from the report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteConfirmOpen(false); setIssueToDelete(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={deleteIssue} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
