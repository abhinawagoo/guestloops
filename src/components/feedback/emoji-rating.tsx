"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RatingStyle } from "@/types/venue";

/** Sentiment icons: very dissatisfied → very satisfied (Material-style names). */
const SENTIMENT_EMOJI = ["😠", "🙁", "😐", "🙂", "😊"] as const;
const SENTIMENT_LABELS = [
  "Very dissatisfied",
  "Dissatisfied",
  "Neutral",
  "Satisfied",
  "Very satisfied",
] as const;

const MAX = 5;

interface EmojiRatingProps {
  value: number | null; // 1-5
  onChange: (value: number) => void;
  label?: string;
  className?: string;
  /** "star" = 1-5 stars; "emoji" = sentiment faces (very dissatisfied → very satisfied). */
  variant?: RatingStyle;
}

export function EmojiRating({
  value,
  onChange,
  label,
  className,
  variant = "star",
}: EmojiRatingProps) {
  const useEmoji = variant === "emoji";

  return (
    <div className={cn("space-y-4", className)}>
      {label && (
        <p className="text-sm font-medium text-muted-foreground text-center">
          {label}
        </p>
      )}
      <div
        className="flex justify-center gap-2 sm:gap-3"
        role="group"
        aria-label={useEmoji ? "Rate from very dissatisfied to very satisfied" : "Rate 1 to 5 stars"}
      >
        {Array.from({ length: MAX }, (_, i) => {
          const score = i + 1;
          const isSelected = useEmoji ? value === score : (value !== null && value >= score);
          return (
            <motion.button
              key={score}
              type="button"
              onClick={() => onChange(score)}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "tween", duration: 0.2 }}
              className={cn(
                "p-2.5 sm:p-3 rounded-xl border-2 transition-all duration-200 ease-out",
                isSelected
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:border-muted-foreground/30"
              )}
              aria-label={useEmoji ? SENTIMENT_LABELS[i] : `Rate ${score} out of 5`}
              aria-pressed={isSelected}
            >
              {useEmoji ? (
                <span className="text-3xl sm:text-4xl leading-none" role="img">
                  {SENTIMENT_EMOJI[i]}
                </span>
              ) : (
                <Star
                  className={cn("size-7 sm:size-8", isSelected ? "fill-current" : "")}
                  strokeWidth={1.5}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
