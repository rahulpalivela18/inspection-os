import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClipboardCheck, Loader2, Eye, EyeOff } from "lucide-react";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailError =
    touched.email && !isValidEmail(email)
      ? "Please enter a valid email address."
      : "";
  const passwordError =
    touched.password && password.length < 6
      ? "Password must be at least 6 characters."
      : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isValidEmail(email) || password.length < 6) return;

    setServerError("");
    setLoading(true);
    try {
      await login(email, password);
      setLocation("/dashboard");
    } catch (err: any) {
      setServerError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/home">
            <div className="inline-flex cursor-pointer items-center gap-2 text-2xl font-bold text-indigo-600 mb-2">
              <ClipboardCheck className="h-7 w-7" />
              Inspection OS
            </div>
          </Link>
          <p className="text-sm text-slate-500">Sign in to your workspace</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="space-y-4">
              {serverError && (
                <div
                  className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                  data-testid="text-login-error"
                >
                  {serverError}
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  className={
                    emailError
                      ? "border-red-400 focus-visible:ring-red-400"
                      : ""
                  }
                  data-testid="input-email"
                />
                {emailError && (
                  <p className="text-xs text-red-500" data-testid="error-email">
                    {emailError}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    className={
                      passwordError
                        ? "border-red-400 focus-visible:ring-red-400 pr-10"
                        : "pr-10"
                    }
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p
                    className="text-xs text-red-500"
                    data-testid="error-password"
                  >
                    {passwordError}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                data-testid="button-login"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing
                    in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              <p className="text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <Link href="/register">
                  <span className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer">
                    Sign up free
                  </span>
                </Link>
              </p>
              <Link href="/home">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
                >
                  &larr; Back to Home
                </button>
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
