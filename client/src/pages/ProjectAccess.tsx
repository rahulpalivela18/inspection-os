import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ArrowLeft, User } from "lucide-react";
import { Link, useRoute } from "wouter";
import { ProjectTabs } from "@/components/ProjectTabs";
import { useAuth } from "@/lib/auth";
import { isAdminRole } from "@/lib/utils";
import ProjectAccessManager from "@/components/ProjectAccessManager";
import NotFound from "./not-found";

export default function ProjectAccess() {
  const { user } = useAuth();
  const [match, params] = useRoute("/project/:id/team");

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ["project", params?.id],
    queryFn: () => api.getProject(params!.id),
    enabled: !!params?.id,
  });

  if (!match || !params) return <NotFound />;
  if (loadingProject)
    return (
      <Layout>
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Loading...
        </div>
      </Layout>
    );
  if (!project) return <NotFound />;

  return (
    <Layout>
      <div className="flex flex-col min-h-full">
        <div className="bg-white border-b border-border py-6 md:py-8 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="mr-1 h-4 w-4" /> All Projects
              </Link>
              <ProjectTabs
                projectId={params.id}
                active="team"
                admin={isAdminRole(user?.role)}
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {project.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-muted-foreground text-sm">
                  <span className="flex items-center gap-1 shrink-0">
                    <User className="h-4 w-4" /> {project.clientName}
                  </span>
                  <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="shrink-0">{project.address}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-muted/10 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <ProjectAccessManager projectId={params.id} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
