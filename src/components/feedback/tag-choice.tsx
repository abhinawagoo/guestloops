"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TagChoiceProps {
  /** Available options (e.g. "Breakfast", "Brunch", "Lunch") */
  options: string[];
  /** Single: selected option. Multi: selected options. */
  value: string | string[] | null;
  /** If true, multiple options can be selected; show "Continue" to advance. */
  multiSelect?: boolean;
  onChange: (value: string | string[]) => void;
  /** Subtitle, e.g. "Select all that apply" */
  subtitle?: string;
  className?: string;
}

export function TagChoice({
  options,
  value,
  multiSelect,
  onChange,
  subtitle,
  className,
}: TagChoiceProps) {
  const selectedSet = Array.isArray(value) ? new Set(value) : value ? new Set([value]) : new Set<string>();

  const handleClick = (option: string) => {
    if (multiSelect) {
      const next = selectedSet.has(option)
        ? [...selectedSet].filter((s) => s !== option)
        : [...selectedSet, option];
      onChange(next);
    } else {
      onChange(option);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {subtitle && (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selectedSet.has(opt);
          return (
            <motion.button
              key={opt}
              type="button"
              onClick={() => handleClick(opt)}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "tween", duration: 0.2 }}
              className={cn(
                "rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all duration-200",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border/80 bg-muted/40 hover:bg-muted/70 hover:border-border"
              )}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
