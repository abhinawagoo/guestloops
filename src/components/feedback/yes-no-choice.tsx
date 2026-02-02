"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface YesNoChoiceProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
  labels?: [string, string];
  label?: string;
  className?: string;
}

export function YesNoChoice({
  value,
  onChange,
  labels = ["Yes", "No"],
  label,
  className,
}: YesNoChoiceProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {label && (
        <p className="text-sm font-medium text-muted-foreground text-center">
          {label}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          type="button"
          onClick={() => onChange(true)}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "tween", duration: 0.2 }}
          className={cn(
            "rounded-2xl border-2 py-4 px-4 text-base font-semibold transition-all duration-300 ease-out",
            value === true
              ? "border-primary bg-primary text-primary-foreground shadow-sm"
              : "border-border/80 bg-muted/40 hover:bg-muted/70"
          )}
        >
          {labels[0]}
        </motion.button>
        <motion.button
          type="button"
          onClick={() => onChange(false)}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "tween", duration: 0.2 }}
          className={cn(
            "rounded-2xl border-2 py-4 px-4 text-base font-semibold transition-all duration-300 ease-out",
            value === false
              ? "border-primary bg-primary text-primary-foreground shadow-sm"
              : "border-border/80 bg-muted/40 hover:bg-muted/70"
          )}
        >
          {labels[1]}
        </motion.button>
      </div>
    </div>
  );
}
