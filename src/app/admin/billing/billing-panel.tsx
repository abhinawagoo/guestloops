"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PAYABLE_PLANS, type PlanSlug } from "@/types/tenant";
import { cn } from "@/lib/utils";

export function BillingPanel() {
  const [loadingPlan, setLoadingPlan] = useState<PlanSlug | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (planSlug: PlanSlug, amountPaisa: number) => {
    setError(null);
    setLoadingPlan(planSlug);
    try {
      const res = await fetch("/api/admin/payments/phonepe/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          amountPaisa,
          plan: planSlug,
          description: `${planSlug} plan subscription`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create order");
        setLoadingPlan(null);
        return;
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setError("No redirect URL received");
      setLoadingPlan(null);
    } catch (e) {
      setError("Request failed. Check console.");
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Choose a plan and pay with one click. You will be redirected to PhonePe and then back here.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PAYABLE_PLANS.map((plan) => {
          const amountRs = (plan.pricePaisa ?? 0) / 100;
          const isLoading = loadingPlan === plan.slug;
          return (
            <Card
              key={plan.slug}
              className={cn(
                "flex flex-col border-border bg-card transition-shadow",
                "hover:shadow-md"
              )}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <p className="text-2xl font-semibold text-foreground">
                  ₹{amountRs.toLocaleString("en-IN")}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <ul className="text-sm text-muted-foreground space-y-1">
                  {plan.features.slice(0, 3).map((f, i) => (
                    <li key={i}>• {f}</li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSubscribe(plan.slug, plan.pricePaisa ?? 0)}
                  disabled={isLoading}
                  className="mt-auto bg-violet-600 hover:bg-violet-700"
                >
                  {isLoading ? "Redirecting…" : `Pay ₹${amountRs.toLocaleString("en-IN")}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {PAYABLE_PLANS.length === 0 && (
        <Card className="border-border bg-card">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No paid plans configured. Add pricePaisa to plans in <code className="text-xs">src/types/tenant.ts</code>.
          </CardContent>
        </Card>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Payment is for this organization only. After payment you will return to your dashboard.
      </p>
    </div>
  );
}
