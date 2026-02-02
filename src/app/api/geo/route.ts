import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const DEFAULT_COUNTRY = "US";

export async function GET() {
  try {
    const headersList = await headers();
    const vercelCountry = headersList.get("x-vercel-ip-country");

    if (vercelCountry?.length === 2) {
      return NextResponse.json({ countryCode: vercelCountry });
    }

    // Fallback for local dev or non-Vercel: use a server-side geo lookup
    const res = await fetch("https://ipapi.co/json/", {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });
    if (!res.ok) return NextResponse.json({ countryCode: DEFAULT_COUNTRY });

    const data = (await res.json()) as { country_code?: string };
    const code =
      typeof data?.country_code === "string" && data.country_code.length === 2
        ? data.country_code
        : DEFAULT_COUNTRY;
    return NextResponse.json({ countryCode: code });
  } catch {
    return NextResponse.json({ countryCode: DEFAULT_COUNTRY });
  }
}
