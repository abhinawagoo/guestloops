import Link from "next/link";
import type { Metadata } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://guestloops.com";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "GuestLoops terms of service — rules and agreement for using our platform.",
  openGraph: { url: `${appUrl}/terms` },
};

export default function TermsPage() {
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
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: January 2025</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Agreement to terms</h2>
            <p className="mt-2 text-muted-foreground">
              By accessing or using GuestLoops (&quot;Service&quot;) at https://guestloops.com and related domains, you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. We may update these terms from time to time; continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Description of service</h2>
            <p className="mt-2 text-muted-foreground">
              GuestLoops provides a platform for hospitality businesses to collect guest feedback via QR codes, generate and manage Google reviews, sync with Google Business Profile, and use AI-assisted reply and analysis features. You are responsible for your use of the Service and for ensuring that your use complies with applicable laws and third-party terms (including Google&apos;s and OpenAI&apos;s).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Account and eligibility</h2>
            <p className="mt-2 text-muted-foreground">
              You must provide accurate information when registering and keep your account secure. You must be at least 18 years old and have the authority to bind your business. You are responsible for all activity under your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Acceptable use</h2>
            <p className="mt-2 text-muted-foreground">
              You agree not to use the Service to violate any law, infringe others&apos; rights, send spam or misleading content, or attempt to gain unauthorised access to our or third-party systems. You must use Google Business Profile and review features in line with Google&apos;s policies. We may suspend or terminate access for breach of these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Your content and data</h2>
            <p className="mt-2 text-muted-foreground">
              You retain ownership of content you submit. You grant us a licence to use, store, and process that content as necessary to provide the Service (including syncing and posting to Google when you approve). Our use of personal data is described in our{" "}
              <Link href="/privacy" className="text-primary underline hover:no-underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Fees and payment</h2>
            <p className="mt-2 text-muted-foreground">
              Some parts of the Service may be subject to fees as described on the site or in your plan. You agree to pay all applicable fees. We may change pricing with notice; continued use after a price change may constitute acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Disclaimers</h2>
            <p className="mt-2 text-muted-foreground">
              The Service is provided &quot;as is&quot;. We do not warrant that it will be uninterrupted, error-free, or secure. AI-generated content (e.g. review replies or insights) is for assistance only; you are responsible for reviewing and approving content before it is published.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Limitation of liability</h2>
            <p className="mt-2 text-muted-foreground">
              To the fullest extent permitted by law, GuestLoops and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for loss of profits or data, arising from your use of the Service. Our total liability shall not exceed the fees you paid to us in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Termination</h2>
            <p className="mt-2 text-muted-foreground">
              You may stop using the Service at any time. We may suspend or terminate your access for breach of these terms or for other reasons with notice where practicable. Upon termination, your right to use the Service ceases; we may retain data as required by law or our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">10. General</h2>
            <p className="mt-2 text-muted-foreground">
              These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of India. If any provision is held invalid, the remainder remains in effect. Our failure to enforce a right does not waive that right.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">11. Contact</h2>
            <p className="mt-2 text-muted-foreground">
              For questions about these Terms of Service, contact us at:{" "}
              <a href="mailto:legal@guestloops.com" className="text-primary underline hover:no-underline">
                legal@guestloops.com
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
