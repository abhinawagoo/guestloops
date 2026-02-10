import { BillingPanel } from "./billing-panel";

export default function AdminBillingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Billing & payments</h1>
        <p className="text-muted-foreground text-sm mt-1.5 max-w-xl">
          Pay for your plan or add credits. Each organization manages its own payments.
        </p>
      </div>
      <BillingPanel />
    </div>
  );
}
