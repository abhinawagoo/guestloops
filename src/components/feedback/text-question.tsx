"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface TextQuestionProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  multiline?: boolean;
  maxLength?: number;
  className?: string;
}

export function TextQuestion({
  value,
  onChange,
  placeholder = "Your answer...",
  label,
  multiline = true,
  maxLength = 500,
  className,
}: TextQuestionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      )}
      {multiline ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[120px] resize-none rounded-xl border-border/80 bg-background text-base transition-[border-color,box-shadow] duration-200"
          maxLength={maxLength}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border/80 bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring/30 transition-[border-color,box-shadow] duration-200"
          maxLength={maxLength}
        />
      )}
      {maxLength && (
        <p className="text-xs text-muted-foreground text-right">
          {value.length} / {maxLength}
        </p>
      )}
    </div>
  );
}
