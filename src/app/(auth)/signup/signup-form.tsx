"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { COUNTRIES, formatPhoneWithDial } from "@/lib/countries";
import { createClient } from "@/lib/supabase/client";

const BUSINESS_TYPES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "hotel", label: "Hotel" },
  { value: "both", label: "Both" },
] as const;

export function SignupForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("US");
  const [businessCountryCode, setBusinessCountryCode] = useState("US");
  const [mobileLocal, setMobileLocal] = useState("");
  const [form, setForm] = useState({
    orgName: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    businessType: "restaurant" as "restaurant" | "hotel" | "both",
  });

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        fetch("/api/app/me", { credentials: "include" })
          .then((r) => r.json())
          .then((me) => {
            const slug = me.tenantSlug ?? (user.user_metadata?.tenant_slug as string) ?? null;
            window.location.href = slug ? `/admin?tenant=${slug}` : "/admin";
          })
          .catch(() => {
            const slug = user.user_metadata?.tenant_slug as string | undefined;
            window.location.href = slug ? `/admin?tenant=${slug}` : "/admin";
          });
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const dialCode = COUNTRIES.find((c) => c.code === countryCode)?.dialCode ?? "+1";
    const mobile = mobileLocal.trim() ? formatPhoneWithDial(dialCode, mobileLocal) : undefined;
    try {
      const res = await fetch("/api/app/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.orgName.trim(),
          slug: form.orgName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .slice(0, 32) || "business",
          businessType: form.businessType,
          ownerEmail: form.email.trim(),
          ownerFirstName: form.firstName.trim() || undefined,
          ownerLastName: form.lastName.trim() || undefined,
          ownerMobile: mobile,
          ownerCountryCode: countryCode,
          countryCode: businessCountryCode,
          password: form.password.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Sign up failed");
        return;
      }
      const slug = data.tenant?.slug ?? null;
      // When Supabase was used (tenant id is UUID), sign in to establish session
      const isSupabaseTenant =
        data.tenant?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(String(data.tenant.id));
      const supabase = createClient();
      if (supabase && form.password.trim() && isSupabaseTenant) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (signInErr) {
          setError("Account created but sign-in failed. Please sign in manually.");
          return;
        }
        // Brief delay so session cookie is persisted before full-page redirect
        await new Promise((r) => setTimeout(r, 200));
      }
      if (slug) window.location.href = `/admin/onboarding?tenant=${slug}`;
      else window.location.href = "/admin";
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="auth-card border bg-card">
      <CardHeader className="pb-5">
        <h2 className="text-lg font-semibold text-foreground">Sign up</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your hotel or restaurant name, your name, email, and mobile.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="orgName" className="text-sm font-medium text-foreground">
              Hotel / Restaurant name
            </Label>
            <Input
              id="orgName"
              placeholder="e.g. The Garden Table"
              value={form.orgName}
              onChange={(e) => setForm((f) => ({ ...f, orgName: e.target.value }))}
              required
              className="rounded-xl border-input h-11"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
                First name
              </Label>
              <Input
                id="firstName"
                placeholder="John"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                required
                className="rounded-xl border-input h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
                Last name
              </Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                required
                className="rounded-xl border-input h-11"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@yourbusiness.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              className="rounded-xl border-input h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              minLength={6}
              className="rounded-xl border-input h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Mobile number</Label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-[130px] rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring h-11"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.dialCode} {c.name}
                  </option>
                ))}
              </select>
              <Input
                placeholder="9876543210"
                value={mobileLocal}
                onChange={(e) => setMobileLocal(e.target.value.replace(/\D/g, "").slice(0, 15))}
                className="flex-1 rounded-xl border-input h-11"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Business type</Label>
            <div className="flex gap-2 flex-wrap">
              {BUSINESS_TYPES.map((t) => (
                <Button
                  key={t.value}
                  type="button"
                  variant={form.businessType === t.value ? "default" : "outline"}
                  size="sm"
                  className="rounded-xl transition-colors"
                  onClick={() => setForm((f) => ({ ...f, businessType: t.value }))}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessCountry" className="text-sm font-medium text-foreground">
              Business country
            </Label>
            <select
              id="businessCountry"
              value={businessCountryCode}
              onChange={(e) => setBusinessCountryCode(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring h-11"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
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
            {loading ? "Creating account…" : "Sign up"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
