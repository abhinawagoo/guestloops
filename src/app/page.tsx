import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PricingSection } from "@/components/landing/pricing-section";
import { AnimatedSection } from "@/components/landing/animated-section";
import { AnimatedMedia } from "@/components/landing/animated-media";
import { HeroIllustration } from "@/components/landing/hero-illustration";
import { AnalyticsIllustration } from "@/components/landing/analytics-illustration";

const TRUSTED_BRANDS = [
  "The Grove Hotel",
  "Spice Route Kitchen",
  "Lakeside Resort",
  "Urban Bistro",
  "Saffron Palace",
  "Pine Valley Inn",
  "Coastal Bay Hotel",
  "Masala House",
  "Heritage Grand",
  "Garden Café",
];

export default function HomePage() {
  return (
    <div className="landing min-h-screen overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* Nav — mobile/tablet friendly: touch targets, wrap on small */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/80">
        <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 sm:gap-4">
          <Link
            href="/"
            className="text-lg font-bold text-[var(--primary)] sm:text-xl shrink-0"
          >
            GuestLoops
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
            <Link
              href="/q/demo-restaurant"
              className="min-h-[44px] min-w-[44px] flex items-center rounded-md px-3 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] sm:min-h-0 sm:min-w-0"
            >
              <span className="hidden sm:inline">Try Restaurant QR</span>
              <span className="sm:hidden">Restaurant</span>
            </Link>
            <Link
              href="/q/demo-hotel"
              className="min-h-[44px] min-w-[44px] flex items-center rounded-md px-3 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] sm:min-h-0 sm:min-w-0"
            >
              <span className="hidden sm:inline">Try Hotel QR</span>
              <span className="sm:hidden">Hotel</span>
            </Link>
            <Link href="/signin" className="flex items-center">
              <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-0 sm:px-3">
                Sign in
              </Button>
            </Link>
            <Link href="/signup" className="flex items-center">
              <Button size="sm" className="min-h-[44px] bg-[var(--primary)] px-4 hover:opacity-90 sm:min-h-8">
                Start Free Trial
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* 1. Hero — with illustration / image slot */}
      <AnimatedSection className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 md:py-24 lg:py-32">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="mx-auto max-w-xl text-center lg:text-left">
            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Get more Google reviews & repeat customers automatically
            </h1>
            <p className="mt-3 text-base text-[var(--muted-foreground)] sm:mt-4 sm:text-lg md:text-xl">
              Guests scan a QR, give quick feedback, and GuestLoops turns it into
              SEO-friendly Google reviews and WhatsApp offers.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4 lg:justify-start">
              <Link href="/signup" className="block w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full min-h-[48px] bg-[var(--primary)] px-6 text-white hover:opacity-90 sm:min-h-10 sm:w-auto sm:px-8"
                >
                  Start Free Trial
                </Button>
              </Link>
              <Link href="#how-it-works" className="block w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full min-h-[48px] border-[var(--border)] sm:min-h-10 sm:w-auto"
                >
                  See How It Works
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-xs text-[var(--muted-foreground)] sm:mt-8">
              Powered by <span className="font-medium text-[var(--foreground)]">OpenAI</span>
              {" · "}
              <span className="font-medium text-[var(--foreground)]">Google Business Profile</span>
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-md lg:max-w-lg">
            <HeroIllustration />
          </div>
        </div>
      </AnimatedSection>

      {/* Trusted by — scrolling marquee */}
      <AnimatedSection className="border-y border-[var(--border)] bg-[var(--card)] py-6 sm:py-8" aria-label="Trusted by">
        <p className="mb-4 text-center text-sm font-medium text-[var(--muted-foreground)]">
          Trusted by hotels & restaurants
        </p>
        <div className="relative w-full overflow-hidden">
          <div className="marquee-track flex w-max gap-10 px-4 sm:gap-16">
            {[...TRUSTED_BRANDS, ...TRUSTED_BRANDS].map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="shrink-0 text-base font-semibold text-[var(--foreground)]/80 sm:text-lg"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* 2. How it works */}
      <AnimatedSection id="how-it-works" className="border-t border-[var(--border)] bg-[var(--muted)]/50 py-12 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-xl font-bold sm:text-3xl">
            How it works
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[var(--muted-foreground)] sm:text-base">
            Simple flow — takes less than 60 seconds.
          </p>
          <ul className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-5 lg:gap-8">
            {[
              "Guest scans QR",
              "Answers quick, game-like questions",
              "AI summarizes feedback",
              "Happy guests → Google review",
              "WhatsApp offer sent for next visit",
            ].map((step, i) => (
              <li
                key={step}
                className="landing-card rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center sm:p-6"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)]/10 text-sm font-semibold text-[var(--primary)]">
                  {i + 1}
                </span>
                <p className="mt-3 font-medium">{step}</p>
              </li>
            ))}
          </ul>
        </div>
      </AnimatedSection>

      {/* 3. Problem */}
      <AnimatedSection className="py-12 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-xl font-bold sm:text-3xl">
            Most happy guests never leave reviews
          </h2>
          <ul className="mx-auto mt-8 grid max-w-2xl gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4">
            {[
              "Feedback forms are boring",
              "Guests forget to review",
              "Negative reviews hurt ratings",
              "No follow-up = no repeat visits",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3"
              >
                <span className="text-[var(--primary)]">×</span>
                <span className="text-[var(--muted-foreground)]">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </AnimatedSection>

      {/* 4. Solution */}
      <AnimatedSection className="border-t border-[var(--border)] bg-[var(--muted)]/50 py-12 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="text-xl font-bold sm:text-3xl md:text-3xl">
            GuestLoops fixes this with one smooth journey
          </h2>
          <ul className="mt-6 flex flex-wrap justify-center gap-4 sm:mt-8 sm:gap-6">
            {[
              "High completion feedback",
              "More positive Google reviews",
              "Repeat visits via WhatsApp",
            ].map((item) => (
              <li
                key={item}
                className="rounded-full bg-[var(--primary)]/10 px-4 py-2 text-sm font-medium text-[var(--primary)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </AnimatedSection>

      {/* 4b. Growth report — social proof / fake results */}
      <AnimatedSection className="py-12 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-xl font-bold sm:text-3xl">
            Results that speak
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[var(--muted-foreground)] sm:text-base">
            Hospitality businesses see real impact in the first 90 days.
          </p>
          <div className="mx-auto mt-8 max-w-2xl">
            <div className="landing-card rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-4">
                <span className="text-sm font-medium text-[var(--muted-foreground)]">Growth Report</span>
                <span className="text-xs text-[var(--muted-foreground)]">Last 90 days · Sample venue</span>
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-3xl font-bold text-[#22C55E] sm:text-4xl">+47%</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">Google reviews</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[var(--primary)] sm:text-4xl">3.2×</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">More 5-star reviews</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[var(--accent)] sm:text-4xl">68%</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">Feedback completion rate</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[var(--primary)] sm:text-4xl">2.1×</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">Repeat visit intent (WhatsApp)</p>
                </div>
              </div>
              <p className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
                Results vary by venue. Powered by GuestLoops + OpenAI · Google.
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* 5. Features grid */}
      <AnimatedSection className="py-12 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-xl font-bold sm:text-3xl">
            Everything you need to grow reviews
          </h2>
          <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {[
              { title: "QR Feedback", desc: "No app, no login" },
              { title: "AI Review Writing", desc: "SEO-optimized Google reviews" },
              { title: "Smart Review Routing", desc: "Happy → Google, Unhappy → Private feedback" },
              { title: "WhatsApp Automation", desc: "Thank-you + offers automatically" },
              { title: "Image Uploads", desc: "Guests attach photos" },
              { title: "AI Review Replies", desc: "Auto or manager-approved replies" },
            ].map((f) => (
              <div
                key={f.title}
                className="landing-card rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6"
              >
                <h3 className="font-semibold text-[var(--primary)]">{f.title}</h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* 6. Analytics dashboard — with illustration / image slot */}
      <AnimatedSection className="border-t border-[var(--border)] bg-[var(--muted)]/50 py-12 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-xl font-bold sm:text-3xl">
            Know exactly what to improve
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[var(--muted-foreground)] sm:text-base">
            Color-coded performance insights.
          </p>
          <div className="mt-8 grid gap-6 sm:mt-12 lg:grid-cols-2 lg:items-center lg:gap-12">
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {[
                { label: "Cleanliness", value: 78, color: "green" },
                { label: "Service", value: 42, color: "orange" },
                { label: "Food Quality", value: 65, color: "green" },
                { label: "Ambience", value: 71, color: "green" },
              ].map((m) => (
                <div
                  key={m.label}
                  className="landing-card rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6"
                >
                  <p className="text-sm font-medium text-[var(--muted-foreground)]">{m.label}</p>
                  <p className="mt-1 flex items-center gap-2 text-2xl font-bold">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        m.color === "green" ? "bg-[#22C55E]" : "bg-[#FB923C]"
                      }`}
                    />
                    {m.value}%
                  </p>
                </div>
              ))}
            </div>
            <div className="mx-auto w-full max-w-md">
              <AnalyticsIllustration />
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* 7. WhatsApp & Google */}
      <AnimatedSection className="py-12 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="text-xl font-bold sm:text-3xl">
            Works with tools you already use
          </h2>
          <ul className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-[var(--muted-foreground)] sm:mt-8 sm:gap-8 sm:text-base">
            <li>Google Business Profile integration</li>
            <li>WhatsApp Cloud API</li>
            <li>Secure consent-based messaging</li>
          </ul>
        </div>
      </AnimatedSection>

      {/* 8. Pricing — premium section with geo, toggle, Motion */}
      <PricingSection />

      {/* Video placeholder — add your demo video URL here */}
      <AnimatedSection className="border-t border-[var(--border)] bg-[var(--card)] py-12 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-center text-xl font-bold sm:text-3xl">
            See GuestLoops in action
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[var(--muted-foreground)] sm:text-base">
            Watch how guests scan, feedback, and turn into 5-star reviews.
          </p>
          <div className="mt-8 aspect-video w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--muted)]/50 shadow-lg">
            <AnimatedMedia
              variant="video-placeholder"
              alt="Product demo video"
              aspectRatio="aspect-video"
              className="h-full w-full"
            />
          </div>
        </div>
      </AnimatedSection>

      {/* 9. Who it's for */}
      <AnimatedSection className="py-12 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-xl font-bold sm:text-3xl">
            Who it&apos;s for
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3 sm:mt-8 sm:gap-4">
            {["Restaurants", "Cafes", "Hotels", "Resorts", "Chains & franchises"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* 10. Final CTA */}
      <AnimatedSection className="border-t border-[var(--border)] bg-[var(--primary)] py-12 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-xl font-bold text-white sm:text-3xl">
            Turn guest feedback into growth
          </h2>
          <Link href="/signup" className="mt-6 block sm:mt-6 sm:inline-block">
            <Button
              size="lg"
              className="w-full min-h-[48px] bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90 sm:w-auto sm:min-h-10 sm:px-8"
            >
              Get Started Free
            </Button>
          </Link>
          <p className="mt-3 text-sm text-white/80">No credit card required</p>
        </div>
      </AnimatedSection>

      {/* Footer */}
      <AnimatedSection>
        <footer className="border-t border-[var(--border)] py-6 sm:py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <span className="font-semibold text-[var(--primary)]">GuestLoops</span>
            <nav className="flex gap-6 text-sm text-[var(--muted-foreground)]">
              <Link href="/privacy" className="hover:text-[var(--foreground)]">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-[var(--foreground)]">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-[var(--foreground)]">
                Contact
              </Link>
            </nav>
          </div>
          <p className="mt-4 text-center text-xs text-[var(--muted-foreground)] sm:text-left">
            WhatsApp & Google compliance note — consent-based messaging only.
          </p>
        </div>
        </footer>
      </AnimatedSection>
    </div>
  );
}
