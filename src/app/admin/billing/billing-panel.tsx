"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BillingPanel() {
  const [amountRupees, setAmountRupees] = useState("100");
  const [description, setDescription] = useState("Subscription payment");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setError(null);
    const amount = Math.round(parseFloat(amountRupees) * 100);
    if (!Number.isFinite(amount) || amount < 100) {
      setError("Enter a valid amount (min ₹1)");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payments/phonepe/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          amountPaisa: amount,
          description: description || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create order");
        setLoading(false);
        return;
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setError("No redirect URL received");
    } catch (e) {
      setError("Request failed. Check console.");
      setLoading(false);
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Pay with PhonePe</CardTitle>
        <p className="text-sm text-muted-foreground">
          Pay for your plan or add credits. You will be redirected to PhonePe and then back here.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              min="1"
              step="0.01"
              value={amountRupees}
              onChange={(e) => setAmountRupees(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Input
              type="text"
              placeholder="e.g. Pro plan - 1 month"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <Button
          onClick={handlePay}
          disabled={loading}
          className="bg-violet-600 hover:bg-violet-700"
        >
          {loading ? "Creating…" : "Pay with PhonePe"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Payment is for this organization only. After payment you will return to your dashboard.
        </p>
      </CardContent>
    </Card>
  );
}
