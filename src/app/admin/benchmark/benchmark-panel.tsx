"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Demo data — replace with Google Places / your API
const DEMO_YOUR_BUSINESS = {
  name: "The Garden Table",
  rating: 4.2,
  reviewCount: 128,
  serviceScore: 78,
  valueScore: 65,
};

const DEMO_COMPETITORS = [
  { name: "Bistro Central", rating: 4.5, reviewCount: 312, serviceScore: 82, valueScore: 70 },
  { name: "Riverside Café", rating: 4.0, reviewCount: 89, serviceScore: 72, valueScore: 68 },
  { name: "The Local Table", rating: 4.3, reviewCount: 201, serviceScore: 85, valueScore: 62 },
];

function ScoreBar({ value, max = 100, label }: { value: number; max?: number; label: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const color =
    pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500/80";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
}

export function BenchmarkPanel() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2"
      >
        <Card className="admin-card overflow-hidden border bg-card bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Your business</CardTitle>
            <CardDescription className="text-muted-foreground">Current snapshot vs. competitors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-2xl font-semibold">{DEMO_YOUR_BUSINESS.name}</p>
                <p className="text-sm text-muted-foreground">
                  ★ {DEMO_YOUR_BUSINESS.rating} · {DEMO_YOUR_BUSINESS.reviewCount} reviews
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                You
              </Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 max-w-md">
              <ScoreBar value={DEMO_YOUR_BUSINESS.serviceScore} label="Service" />
              <ScoreBar value={DEMO_YOUR_BUSINESS.valueScore} label="Value" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Card className="admin-card overflow-hidden border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Nearby competitors</CardTitle>
          <CardDescription className="text-muted-foreground">Compare ratings and review volume</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {DEMO_COMPETITORS.map((c, i) => {
              const serviceDiff = c.serviceScore - DEMO_YOUR_BUSINESS.serviceScore;
              const valueDiff = c.valueScore - DEMO_YOUR_BUSINESS.valueScore;
              return (
                <motion.li
                  key={c.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{c.name}</p>
                    <span className="text-sm text-muted-foreground">
                      ★ {c.rating} · {c.reviewCount} reviews
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Service</p>
                      <p className={cn(serviceDiff > 0 && "text-amber-600 dark:text-amber-400")}>
                        {c.serviceScore}%
                        {serviceDiff !== 0 && (
                          <span className="ml-1">
                            ({serviceDiff > 0 ? "+" : ""}{serviceDiff}% vs you)
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Value</p>
                      <p className={cn(valueDiff > 0 && "text-amber-600 dark:text-amber-400")}>
                        {c.valueScore}%
                        {valueDiff !== 0 && (
                          <span className="ml-1">
                            ({valueDiff > 0 ? "+" : ""}{valueDiff}% vs you)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card className="admin-card overflow-hidden border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Insight</CardTitle>
          <CardDescription className="text-muted-foreground">AI summary</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your service score is below 2 of 3 nearby competitors. Focus on speed and friendliness during peak hours to close the gap. Your value score is competitive.
          </p>
          <Button variant="outline" size="sm" className="mt-4 rounded-lg">
            Connect Google Business to refresh
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
