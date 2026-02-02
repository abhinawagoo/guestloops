"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const EMOJIS = ["😡", "😕", "😐", "🙂", "😍"] as const;
export type EmojiValue = (typeof EMOJIS)[number];

interface EmojiRatingProps {
  value: number | null; // 1-5
  onChange: (value: number) => void;
  label?: string;
  className?: string;
}

export function EmojiRating({
  value,
  onChange,
  label,
  className,
}: EmojiRatingProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {label && (
        <p className="text-sm font-medium text-muted-foreground text-center">
          {label}
        </p>
      )}
      <div className="flex justify-center gap-2 sm:gap-4">
        {EMOJIS.map((emoji, i) => {
          const score = i + 1;
          const isSelected = value === score;
          return (
            <motion.button
              key={emoji}
              type="button"
              onClick={() => onChange(score)}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "tween", duration: 0.2 }}
              className={cn(
                "text-3xl sm:text-4xl p-3 rounded-2xl border-2 transition-all duration-300 ease-out",
                isSelected
                  ? "border-primary bg-primary/15 scale-110 shadow-sm"
                  : "border-transparent bg-muted/40 hover:bg-muted/70"
              )}
              aria-label={`Rate ${score} out of 5`}
            >
              {emoji}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
