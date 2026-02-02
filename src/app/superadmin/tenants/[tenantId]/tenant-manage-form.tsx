"use client";

import { useState } from "react";
import type { PlanSlug, TenantStatus } from "@/types/tenant";
import { PLANS } from "@/types/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const PLAN_OPTIONS: PlanSlug[] = ["free", "starter", "pro", "enterprise"];
const STATUS_OPTIONS: TenantStatus[] = ["active", "trial", "suspended", "cancelled"];

export function TenantManageForm({
  tenantId,
  currentPlan,
  currentStatus,
}: {
  tenantId: string;
  currentPlan: PlanSlug;
  currentStatus: TenantStatus;
}) {
  const [plan, setPlan] = useState<PlanSlug>(currentPlan);
  const [status, setStatus] = useState<TenantStatus>(currentStatus);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error ?? "Failed to update");
        return;
      }
      setMessage("Saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardHeader>
        <CardTitle className="text-lg text-white">Manage tenant</CardTitle>
        <p className="text-sm text-slate-500">Change plan and status</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-slate-400">Plan</Label>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value as PlanSlug)}
            className="w-full max-w-xs rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-slate-600"
          >
            {PLAN_OPTIONS.map((slug) => (
              <option key={slug} value={slug}>
                {PLANS[slug].name} — {PLANS[slug].maxVenues} venue(s)
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-400">Status</Label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TenantStatus)}
            className="w-full max-w-xs rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-slate-600"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={save}
            disabled={saving}
            className="bg-slate-700 text-white hover:bg-slate-600"
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
          {message && (
            <span className="text-sm text-slate-400">{message}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
