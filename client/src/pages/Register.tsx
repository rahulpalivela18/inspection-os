import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, Loader2, Eye, EyeOff } from "lucide-react";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Register() {
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", companyName: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirmPassword: false, companyName: false });
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const touch = (key: string) => () =>
    setTouched((t) => ({ ...t, [key]: true }));

  const errors = {
    companyName: touched.companyName && form.companyName.trim().length < 1 ? "Company name is required." : "",
    name: touched.name && form.name.trim().length < 1 ? "Your name is required." : "",
    email: touched.email && !isValidEmail(form.email) ? "Please enter a valid email address." : "",
    password: touched.password && form.password.length < 6 ? "Password must be at least 6 characters." : "",
    confirmPassword: touched.confirmPassword && form.confirmPassword !== form.password ? "Passwords do not match." : "",
  };

  const hasErrors = Object.values(errors).some(Boolean);
  const allFilled = form.companyName && form.name && form.email && form.password && form.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirmPassword: true, companyName: true });

    const valid =
      form.companyName.trim().length >= 1 &&
      form.name.trim().length >= 1 &&
      isValidEmail(form.email) &&
      form.password.length >= 6 &&
      form.password === form.confirmPassword;

    if (!valid) return;

    setServerError("");
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await register(payload);
      setLocation("/dashboard");
    } catch (err: any) {
      setServerError(err.message || "Registration failed");
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
          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="space-y-4">
              {serverError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" data-testid="text-register-error">
                  {serverError}
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Company Name"
                  value={form.companyName}
                  onChange={set("companyName")}
                  onBlur={touch("companyName")}
                  className={errors.companyName ? "border-red-400 focus-visible:ring-red-400" : ""}
                  data-testid="input-company-name"
                />
                {errors.companyName && <p className="text-xs text-red-500" data-testid="error-company-name">{errors.companyName}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Full name"
                  value={form.name}
                  onChange={set("name")}
                  onBlur={touch("name")}
                  className={errors.name ? "border-red-400 focus-visible:ring-red-400" : ""}
                  data-testid="input-name"
                />
                {errors.name && <p className="text-xs text-red-500" data-testid="error-name">{errors.name}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={set("email")}
                  onBlur={touch("email")}
                  className={errors.email ? "border-red-400 focus-visible:ring-red-400" : ""}
                  data-testid="input-email"
                />
                {errors.email && <p className="text-xs text-red-500" data-testid="error-email">{errors.email}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={set("password")}
                    onBlur={touch("password")}
                    className={errors.password ? "border-red-400 focus-visible:ring-red-400 pr-10" : "pr-10"}
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500" data-testid="error-password">{errors.password}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={set("confirmPassword")}
                    onBlur={touch("confirmPassword")}
                    className={errors.confirmPassword ? "border-red-400 focus-visible:ring-red-400 pr-10" : "pr-10"}
                    data-testid="input-confirm-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                    data-testid="button-toggle-confirm-password"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500" data-testid="error-confirm-password">{errors.confirmPassword}</p>}
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
              <p className="text-xs text-center text-slate-400 border-t pt-3">
                Joining an existing team? Ask your workspace admin to add you from their Settings page — do not create a new account here.
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
