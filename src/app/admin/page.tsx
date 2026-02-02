import { AdminDashboard } from "./admin-dashboard";

export default function AdminPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Performance Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1.5 max-w-xl">
          See where you’re winning and where to improve
        </p>
      </div>
      <AdminDashboard />
    </div>
  );
}
