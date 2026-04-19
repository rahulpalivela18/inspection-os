import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, Loader2 } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "", companyName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-2xl font-bold text-indigo-600 mb-2">
            <ClipboardCheck className="h-7 w-7" />
            ReportGen
          </div>
          <p className="text-sm text-slate-500">Create your free workspace</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Get started</CardTitle>
            <CardDescription>Your team's inspection hub, ready in seconds</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" data-testid="text-register-error">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="e.g. AP31 Home Inspections"
                  value={form.companyName}
                  onChange={set("companyName")}
                  required
                  data-testid="input-company-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Full name"
                  value={form.name}
                  onChange={set("name")}
                  required
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={set("email")}
                  required
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={set("password")}
                  required
                  data-testid="input-password"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button type="submit" className="w-full" disabled={loading} data-testid="button-register">
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating workspace...</> : "Create Free Account"}
              </Button>
              <p className="text-sm text-center text-slate-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setLocation("/login")}
                  className="text-indigo-600 font-medium hover:underline"
                  data-testid="link-login"
                >
                  Sign in
                </button>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
