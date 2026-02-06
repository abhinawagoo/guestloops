import Link from "next/link";
import type { Metadata } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://guestloops.com";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "GuestLoops privacy policy — how we collect, use, and protect your data.",
  openGraph: { url: `${appUrl}/privacy` },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-bold text-primary hover:underline">
            GuestLoops
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 pb-16">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: January 2025</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Introduction</h2>
            <p className="mt-2 text-muted-foreground">
              GuestLoops (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates https://guestloops.com and related services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, including our website, QR feedback flows, and Google Business Profile integration.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Information we collect</h2>
            <p className="mt-2 text-muted-foreground">
              We may collect: (a) <strong>Account and profile data</strong> — name, email, phone, business name, and similar details when you sign up or manage your account; (b) <strong>Feedback and review data</strong> — ratings, comments, and optional text submitted by guests via our QR flows; (c) <strong>Google Business Profile data</strong> — when you connect your Google account, we access and store review data and reply content as needed to sync reviews and post replies on your behalf; (d) <strong>Usage and technical data</strong> — such as IP address, device type, and how you use our services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. How we use your information</h2>
            <p className="mt-2 text-muted-foreground">
              We use the information to provide, operate, and improve our services; to sync and display Google reviews and to generate and post replies when you approve them; to send you service-related communications and, with your consent, marketing or WhatsApp messages; to comply with legal obligations; and to protect our rights and the security of our platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Data sharing and disclosure</h2>
            <p className="mt-2 text-muted-foreground">
              We do not sell your personal information. We may share data with: service providers (e.g. hosting, analytics, email, and API providers such as Google and OpenAI) who assist in operating our services; legal or regulatory authorities when required; or in connection with a merger, sale, or transfer of assets, subject to applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Data retention and security</h2>
            <p className="mt-2 text-muted-foreground">
              We retain your data for as long as your account is active or as needed to provide services and comply with legal obligations. We implement appropriate technical and organisational measures to protect your data against unauthorised access, loss, or misuse.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Your rights</h2>
            <p className="mt-2 text-muted-foreground">
              Depending on your location, you may have rights to access, correct, delete, or port your personal data, or to object to or restrict certain processing. You can manage your account and preferences in the app. To exercise your rights or ask questions, contact us using the details below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Cookies and similar technologies</h2>
            <p className="mt-2 text-muted-foreground">
              We use cookies and similar technologies for authentication, preferences, and analytics. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Changes and contact</h2>
            <p className="mt-2 text-muted-foreground">
              We may update this Privacy Policy from time to time; the &quot;Last updated&quot; date will be revised. Continued use of our services after changes constitutes acceptance. For privacy-related questions or requests, contact us at:{" "}
              <a href="mailto:privacy@guestloops.com" className="text-primary underline hover:no-underline">
                privacy@guestloops.com
              </a>
              .
            </p>
          </section>
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          <Link href="/" className="text-primary hover:underline">← Back to home</Link>
        </p>
      </main>
    </div>
  );
}
