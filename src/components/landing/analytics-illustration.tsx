"use client";

import { motion } from "framer-motion";

export function AnalyticsIllustration() {
  const bars = [
    { h: 72, label: "Cleanliness", color: "var(--success, #22C55E)" },
    { h: 42, label: "Service", color: "var(--warning, #FB923C)" },
    { h: 65, label: "Food", color: "var(--success, #22C55E)" },
    { h: 71, label: "Ambience", color: "var(--success, #22C55E)" },
  ];
  return (
    <motion.div
      className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg"
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--muted-foreground)]">Performance</span>
        <span className="text-xs text-[var(--muted-foreground)]">Last 30 days</span>
      </div>
      <div className="flex items-end justify-between gap-4 h-32">
        {bars.map((bar, i) => (
          <motion.div
            key={bar.label}
            className="flex flex-1 flex-col items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <div
              className="w-full max-w-[56px] rounded-t-md transition-all duration-300"
              style={{
                height: `${bar.h}%`,
                backgroundColor: bar.color,
                minHeight: 8,
              }}
            />
            <span className="text-xs font-medium text-[var(--muted-foreground)]">{bar.label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
