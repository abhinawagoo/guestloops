"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { VenueWithSettings } from "@/data/demo-venues";
import { setStoredMobile, setStoredGuestName, setStoredWhatsAppOptIn } from "@/lib/session-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QRLandingProps {
  venue: VenueWithSettings;
}

function normalizeMobile(value: string): string {
  return value.replace(/\D/g, "").slice(0, 15);
}

function formatMobileDisplay(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

/**
 * One QR: scan → enter name + mobile (and WhatsApp opt-in) → then choose Menu, Services, or Feedback.
 * Name and mobile are used for rewards and for later feedback requests via WhatsApp.
 */
export function QRLanding({ venue }: QRLandingProps) {
  const { settings } = venue;
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const showMenu = settings.showMenu;
  const showServices = settings.showServices;
  const welcomeSubtitle = settings.uiText.welcomeSubtitle ?? "Scan to explore or share your experience";
  const feedbackCardTitle = settings.uiText.feedbackCardTitle ?? "Give Feedback & Unlock Reward";
  const feedbackCardSubtitle = settings.uiText.feedbackCardSubtitle ?? "Quick taps, no typing — we'll turn it into a Google review.";
  const rewardCta = settings.uiText.rewardCta ?? venue.rewardCta;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const digits = normalizeMobile(mobile);
    if (!trimmedName) {
      setError("Please enter your name");
      return;
    }
    if (digits.length < 10) {
      setError("Please enter a valid mobile number (at least 10 digits)");
      return;
    }
    setError("");
    setStoredGuestName(venue.id, trimmedName);
    setStoredMobile(venue.id, digits);
    setStoredWhatsAppOptIn(venue.id, whatsappOptIn);
    setSubmitted(true);
  };

  if (!submitted) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex flex-col p-6 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold text-foreground">{venue.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">{welcomeSubtitle}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex-1 flex flex-col"
        >
          <Card className="rounded-2xl border border-border/80 bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your name & mobile</CardTitle>
              <p className="text-sm text-muted-foreground">
                We use these for your reward and to reach you later (e.g. feedback via WhatsApp) if you opt in.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="guest-name">Name</Label>
                  <Input
                    id="guest-name"
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. Rahul"
                    value={name}
                    onChange={(e) => setName(e.target.value.trimStart())}
                    className="text-base"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile number</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="e.g. 98765 43210"
                    value={formatMobileDisplay(mobile)}
                    onChange={(e) => setMobile(normalizeMobile(e.target.value))}
                    className="text-base"
                    maxLength={15}
                  />
                  {error && (
                    <p className="text-sm text-muted-foreground">{error}</p>
                  )}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whatsappOptIn}
                    onChange={(e) => setWhatsappOptIn(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-muted-foreground">
                    Send me reward details & updates on WhatsApp
                  </span>
                </label>
                <Button type="submit" size="lg" className="w-full">
                  Continue →
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col p-6 pt-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground">{venue.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">{welcomeSubtitle}</p>
      </motion.div>

      <div className="flex flex-col gap-4 flex-1">
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Link href={`/q/${venue.id}/menu`}>
              <Card className="overflow-hidden rounded-2xl border-2 border-border/80 bg-card shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-300 cursor-pointer active:scale-[0.99]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                    <span className="text-2xl">📋</span>
                    Explore Menu
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  View our food menu with photos
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )}
        {showServices && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: showMenu ? 0.15 : 0.1 }}
          >
            <Link href={`/q/${venue.id}/services`}>
              <Card className="overflow-hidden rounded-2xl border-2 border-border/80 bg-card shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-300 cursor-pointer active:scale-[0.99]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                    <span className="text-2xl">✨</span>
                    Explore Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Spa, room service, breakfast, laundry & more
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: (showMenu || showServices ? 0.2 : 0.1) }}
        >
          <Link href={`/q/${venue.id}/feedback`}>
            <Card className="overflow-hidden rounded-2xl border-2 border-primary/25 bg-primary/5 shadow-sm hover:border-primary/50 hover:bg-primary/10 hover:shadow-md transition-all duration-300 cursor-pointer active:scale-[0.99]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <span className="text-2xl">🎁</span>
                  {feedbackCardTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{feedbackCardSubtitle}</p>
                {rewardCta && (
                  <p className="text-sm font-medium text-primary">{rewardCta}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
