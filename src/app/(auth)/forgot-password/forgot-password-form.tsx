"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    if (!supabase) {
      setError("Password reset is not configured.");
      setLoading(false);
      return;
    }
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?next=/admin`,
      });
      if (err) {
        setError(err.message);
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Card className="auth-card border bg-card">
        <CardContent className="pt-6 pb-6">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Check your email for a link to reset your password. If you don&apos;t see it, check spam.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="auth-card border bg-card">
      <CardHeader className="pb-5">
        <h2 className="text-lg font-semibold text-foreground">Reset password</h2>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
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
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
