import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://guestloops.com";
const title = "GuestLoops — Turn guest feedback into 5-star reviews";
const description =
  "Guests scan a QR, give quick feedback, and GuestLoops turns it into SEO-friendly Google reviews and WhatsApp offers. Get more reviews and repeat visits. For hotels and restaurants.";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: title,
    template: "%s | GuestLoops",
  },
  description,
  keywords: [
    "Google reviews",
    "guest feedback",
    "hospitality",
    "hotel reviews",
    "restaurant reviews",
    "QR feedback",
    "review generation",
    "GuestLoops",
  ],
  authors: [{ name: "GuestLoops", url: appUrl }],
  creator: "GuestLoops",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    siteName: "GuestLoops",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: appUrl,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GuestLoops",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0a",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${appUrl}/#organization`,
      name: "GuestLoops",
      url: appUrl,
      description,
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": `${appUrl}/#website`,
      url: appUrl,
      name: "GuestLoops",
      description,
      publisher: { "@id": `${appUrl}/#organization` },
      inLanguage: "en-US",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
