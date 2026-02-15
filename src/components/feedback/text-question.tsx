"use client";

import { useState, useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mic, MicOff, Sparkles } from "lucide-react";

interface TextQuestionProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  multiline?: boolean;
  maxLength?: number;
  className?: string;
  /** Show mic button for voice input (uses browser Speech Recognition). */
  showVoiceButton?: boolean;
  /** Show "Format with AI" button when there is text; formats and replaces with cleaned version. */
  enableFormatWithAI?: boolean;
}

declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition ?? window.webkitSpeechRecognition
    : undefined;

export function TextQuestion({
  value,
  onChange,
  placeholder = "Your answer...",
  label,
  multiline = true,
  maxLength = 500,
  className,
  showVoiceButton = false,
  enableFormatWithAI = false,
}: TextQuestionProps) {
  const [isListening, setIsListening] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<InstanceType<NonNullable<typeof SpeechRecognition>> | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      setVoiceError("Voice input is not supported in this browser.");
      return;
    }
    setVoiceError(null);
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-IN";
    rec.onresult = (event: SpeechRecognitionEvent) => {
      const parts: string[] = [];
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          parts.push(event.results[i][0].transcript);
        }
      }
      if (parts.length === 0) return;
      const base = valueRef.current.trim();
      const added = parts.join(" ").trim();
      const next = base ? `${base} ${added}` : added;
      if (next.length <= (maxLength ?? 500)) onChange(next);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    try {
      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
    } catch (e) {
      setVoiceError("Could not start microphone.");
    }
  }, [onChange, maxLength]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const handleFormatWithAI = useCallback(async () => {
    if (!value.trim()) return;
    setFormatting(true);
    try {
      const res = await fetch("/api/feedback/format-voice-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      const data = await res.json();
      if (res.ok && typeof data.text === "string") {
        onChange(data.text.slice(0, maxLength ?? 500));
      }
    } catch {
      // keep current value
    } finally {
      setFormatting(false);
    }
  }, [value, onChange, maxLength]);

  const canUseVoice = !!SpeechRecognition;

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
      <div className="flex flex-wrap items-center gap-2">
        {maxLength && (
          <p className="text-xs text-muted-foreground mr-auto">
            {value.length} / {maxLength}
          </p>
        )}
        {showVoiceButton && (
          <>
            {canUseVoice ? (
              <Button
                type="button"
                variant={isListening ? "destructive" : "outline"}
                size="sm"
                className="rounded-xl gap-1.5"
                onClick={isListening ? stopListening : startListening}
              >
                {isListening ? (
                  <>
                    <MicOff className="h-4 w-4" />
                    Stop
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    Speak
                  </>
                )}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">Voice input not supported in this browser.</p>
            )}
            {voiceError && (
              <p className="text-xs text-destructive">{voiceError}</p>
            )}
          </>
        )}
        {enableFormatWithAI && value.trim().length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-xl gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={handleFormatWithAI}
            disabled={formatting}
          >
            <Sparkles className="h-4 w-4" />
            {formatting ? "Formatting…" : "Format with AI"}
          </Button>
        )}
      </div>
    </div>
  );
}
