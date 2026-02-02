import { BenchmarkPanel } from "./benchmark-panel";

export default function AdminBenchmarkPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Competitor comparison</h1>
        <p className="text-muted-foreground text-sm mt-1.5 max-w-xl">
          See how you compare with nearby businesses
        </p>
      </div>
      <BenchmarkPanel />
    </div>
  );
}
