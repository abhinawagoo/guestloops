"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type State = "PENDING" | "COMPLETED" | "FAILED" | "loading" | "error";

export default function PhonePeCallbackPage() {
  const searchParams = useSearchParams();
  const merchantOrderId = searchParams.get("merchantOrderId");
  const [state, setState] = useState<State>("loading");
  const [amount, setAmount] = useState<number | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!merchantOrderId) {
      setState("error");
      return;
    }
    fetch(`/api/payments/phonepe/order-status?merchantOrderId=${encodeURIComponent(merchantOrderId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.state) {
          setState(data.state);
          if (typeof data.amount === "number") setAmount(data.amount);
          const slug = data.metaInfo?.udf4;
          if (slug) setTenantSlug(String(slug));
        } else {
          setState("error");
        }
      })
      .catch(() => setState("error"));
  }, [merchantOrderId]);

  const backHref = tenantSlug ? `/admin?tenant=${encodeURIComponent(tenantSlug)}` : "/admin";
  const backLabel = tenantSlug ? "Back to Dashboard" : "Back to Admin";

  if (!merchantOrderId) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-lg text-white">Invalid link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400">Missing order reference. Return from the payment page or try again.</p>
            <Button asChild className="mt-4">
              <Link href="/admin">Back to Admin</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <p className="text-slate-400">Checking payment status…</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-lg text-white">Status unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400">We couldn’t verify this payment. Check again later or contact support.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href={backHref}>{backLabel}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSuccess = state === "COMPLETED";
  const amountRs = amount != null ? (amount / 100).toFixed(2) : null;

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card className={`border ${isSuccess ? "border-emerald-800 bg-emerald-950/30" : "border-slate-700 bg-slate-900/50"}`}>
        <CardHeader>
          <CardTitle className={`text-lg ${isSuccess ? "text-emerald-400" : "text-white"}`}>
            {isSuccess ? "Payment successful" : state === "FAILED" ? "Payment failed" : "Payment pending"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {amountRs && (
            <p className="text-sm text-slate-400">
              Amount: ₹{amountRs}
            </p>
          )}
          <p className="text-sm text-slate-400">
            Order: {merchantOrderId}
          </p>
          <Button asChild>
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
