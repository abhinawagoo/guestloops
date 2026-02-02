"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Currency = "INR" | "USD";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    featured: false,
    inr: { price: 499, symbol: "₹" },
    usd: { price: 9, symbol: "$" },
    features: [
      "QR feedback",
      "Google review redirection",
      "Basic analytics",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    featured: true,
    inr: { price: 1499, symbol: "₹" },
    usd: { price: 24, symbol: "$" },
    features: [
      "WhatsApp automation",
      "AI reviews & replies",
      "Image uploads",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    featured: false,
    inr: { price: 2999, symbol: "₹" },
    usd: { price: 49, symbol: "$" },
    features: [
      "Multi-location",
      "Advanced analytics",
      "Priority support",
    ],
  },
] as const;

export function PricingSection() {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetch("/api/geo")
      .then((res) => res.json())
      .then((data: { countryCode?: string }) => {
        const code = (data.countryCode ?? "US").toUpperCase();
        setCurrency(code === "IN" ? "INR" : "USD");
      })
      .catch(() => setCurrency("USD"))
      .finally(() => setMounted(true));
  }, []);

  return (
    <motion.section
      id="pricing"
      className="border-t border-[var(--border)] bg-[var(--muted)]/50 py-12 sm:py-24"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <h2 className="text-center text-xl font-bold sm:text-3xl">
          Simple, transparent pricing
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[var(--muted-foreground)] sm:text-base">
          Choose the plan that fits your business. Start free, upgrade when you’re ready.
        </p>

        {/* Currency toggle */}
        <div className="mt-6 flex justify-center sm:mt-8">
          <div
            role="group"
            aria-label="Currency"
            className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--card)] p-1 shadow-sm"
          >
            <button
              type="button"
              onClick={() => setCurrency("INR")}
              className={cn(
                "min-h-[44px] rounded-lg px-4 text-sm font-medium transition-colors sm:min-h-9 sm:px-5",
                currency === "INR"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              India ₹
            </button>
            <button
              type="button"
              onClick={() => setCurrency("USD")}
              className={cn(
                "min-h-[44px] rounded-lg px-4 text-sm font-medium transition-colors sm:min-h-9 sm:px-5",
                currency === "USD"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              International $
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="mt-8 grid gap-6 sm:mt-12 sm:grid-cols-3 sm:gap-8">
          {PLANS.map((plan, index) => {
            const isFeatured = plan.featured;
            const { price, symbol } = currency === "INR" ? plan.inr : plan.usd;
            const priceFormatted =
              currency === "INR"
                ? `${symbol}${price.toLocaleString("en-IN")}`
                : `${symbol}${price}`;

            return (
              <motion.div
                key={plan.id}
                initial={
                  isFeatured
                    ? { scale: 0.98, opacity: 0 }
                    : { opacity: 0, y: 16 }
                }
                whileInView={
                  isFeatured
                    ? { scale: 1, opacity: 1 }
                    : { opacity: 1, y: 0 }
                }
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.5,
                  ease: "easeOut",
                  delay: index * 0.08,
                }}
                whileHover={{
                  scale: 1.03,
                  y: -6,
                  transition: { type: "spring", stiffness: 200 },
                }}
                className={cn(
                  "flex flex-col",
                  isFeatured && "sm:-mx-1 sm:z-10"
                )}
              >
                <Card
                  className={cn(
                    "flex h-full flex-col gap-0 rounded-2xl border-2 bg-[var(--card)] p-0 shadow-sm transition-shadow duration-200 hover:shadow-lg",
                    isFeatured
                      ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-md sm:scale-[1.02]"
                      : "border-[var(--border)]"
                  )}
                >
                  <CardHeader
                    className={cn(
                      "space-y-1 pb-4 pt-6 sm:pt-8",
                      isFeatured && "sm:pt-10"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-bold text-[var(--foreground)]">
                        {plan.name}
                      </h3>
                      {isFeatured && (
                        <span className="shrink-0 rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent-foreground)]">
                          Most Popular
                        </span>
                      )}
                    </div>
                    {mounted ? (
                      <div className="mt-2">
                        <span className="text-3xl font-bold tracking-tight text-[var(--primary)] sm:text-4xl">
                          {priceFormatted}
                        </span>
                        <span className="ml-1 text-base font-normal text-[var(--muted-foreground)]">
                          per month
                        </span>
                      </div>
                    ) : (
                      <div className="mt-2 h-10 w-24 animate-pulse rounded bg-[var(--muted)]" />
                    )}
                  </CardHeader>
                  <div className="h-px shrink-0 bg-[var(--border)] mx-6" />
                  <CardContent className="flex-1 space-y-3 px-6 py-5">
                    <ul className="space-y-2.5 text-sm text-[var(--muted-foreground)]">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2.5"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                            <Check className="h-3 w-3" strokeWidth={2.5} />
                          </span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="p-6 pt-0">
                    <Link href="/signup" className="block w-full">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full"
                      >
                        <Button
                          className={cn(
                            "w-full min-h-[44px] transition-all duration-200 sm:min-h-10",
                            isFeatured
                              ? "bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-95 hover:shadow-md"
                              : "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
                          )}
                        >
                          Start Free Trial
                        </Button>
                      </motion.div>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Trust row */}
        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center text-sm text-[var(--muted-foreground)] sm:mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <span>No credit card required</span>
          <span className="hidden sm:inline">·</span>
          <span>Cancel anytime</span>
          <span className="hidden sm:inline">·</span>
          <span>Google & WhatsApp compliant</span>
        </motion.div>
      </div>
    </motion.section>
  );
}
