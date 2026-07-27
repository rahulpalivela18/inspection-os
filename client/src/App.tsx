import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import Dashboard from "@/pages/Dashboard";
import ProjectDetails from "@/pages/ProjectDetails";
import ReportEditor from "@/pages/ReportEditor";
import Templates from "@/pages/Templates";
import CaptureManager from "@/pages/CaptureManager";
import CaptureCanvas from "@/pages/CaptureCanvas";
import LandingPage from "@/pages/LandingPage";
import Settings from "@/pages/Settings";
import Admin from "@/pages/Admin";
import Billing from "@/pages/Billing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/not-found";
import SharedPortal from "@/pages/SharedPortal";
import { Loader2 } from "lucide-react";

function ProtectedRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }
  if (!user) return <Redirect to="/login" />;
  return <Component />;
}

function PublicRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }
  if (user) return <Redirect to="/dashboard" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/contact" component={Contact} />
      <Route path="/login">
        <PublicRoute component={Login} />
      </Route>
      <Route path="/register">
        <PublicRoute component={Register} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/templates">
        <ProtectedRoute component={Templates} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      <Route path="/admin">
        <ProtectedRoute component={Admin} />
      </Route>
      <Route path="/billing">
        <ProtectedRoute component={Billing} />
      </Route>
      <Route path="/project/:id">
        <ProtectedRoute component={ProjectDetails} />
      </Route>
      <Route path="/project/:id/captures">
        <ProtectedRoute component={CaptureManager} />
      </Route>
      <Route path="/project/:projectId/captures/:captureId">
        <ProtectedRoute component={CaptureCanvas} />
      </Route>
      <Route path="/project/:projectId/floor-plans/:floorPlanId">
        <ProtectedRoute component={CaptureCanvas} />
      </Route>
      <Route path="/report/:id">
        <ProtectedRoute component={ReportEditor} />
      </Route>
      <Route path="/shared/:token" component={SharedPortal} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
