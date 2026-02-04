"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

function friendlyAuthError(message: string): string {
  if (message.includes("Invalid login credentials") || message.includes("invalid_credentials")) {
    return "Invalid email or password.";
  }
  if (message.includes("Email not confirmed")) {
    return "Please confirm your email before signing in.";
  }
  return message;
}

export function SigninForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        fetch("/api/app/me", { credentials: "include" })
          .then((r) => r.json())
          .then((me) => {
            const slug = me.tenantSlug ?? (user.user_metadata?.tenant_slug as string) ?? null;
            if (slug) window.location.href = `/admin?tenant=${slug}`;
            else window.location.href = "/admin";
          })
          .catch(() => {
            const slug = user.user_metadata?.tenant_slug as string | undefined;
            window.location.href = slug ? `/admin?tenant=${slug}` : "/admin";
          });
      }
    });
  }, []);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    if (!supabase) {
      setError("Sign-in is not configured. Use demo: /admin?tenant=demo");
      setLoading(false);
      return;
    }
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (signInError) {
        setError(friendlyAuthError(signInError.message));
        return;
      }
      // Brief delay so session cookie is persisted before full-page redirect
      await new Promise((r) => setTimeout(r, 200));
      const meRes = await fetch("/api/app/me", { credentials: "include" });
      const me = await meRes.json().catch(() => ({}));
      const slug = me.tenantSlug ?? (data.user?.user_metadata?.tenant_slug as string) ?? null;
      if (slug) window.location.href = `/admin?tenant=${slug}`;
      else window.location.href = "/admin";
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    if (!supabase) {
      setError("Sign-in is not configured. Add Supabase and enable Google in Auth.");
      setLoading(false);
      return;
    }
    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "",
        },
      });
      if (signInError) {
        setError(friendlyAuthError(signInError.message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="auth-card border bg-card">
      <CardHeader className="pb-5">
        <h2 className="text-lg font-semibold text-foreground">Sign in</h2>
      </CardHeader>
      <CardContent className="space-y-5">
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-xl h-11 font-medium border-input hover:bg-muted/60 transition-colors"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          Continue with Google
        </Button>
        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Or
            </span>
          </div>
        </div>
        <form onSubmit={handleEmailSignIn} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@yourbusiness.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl border-input h-11"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-xl border-input h-11"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive rounded-lg bg-destructive/10 py-2.5 px-3">
              {error}
            </p>
          )}
          <Button
            type="submit"
            className="w-full rounded-xl h-11 font-medium"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in with email"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
