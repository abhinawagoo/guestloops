import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const headersList = await headers();
  const vercelCountry = headersList.get("x-vercel-ip-country");

  if (vercelCountry) {
    return NextResponse.json({ countryCode: vercelCountry });
  }

  // Fallback for local dev or non-Vercel: use a server-side geo lookup
  try {
    const res = await fetch("https://ipapi.co/json/", {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error("Geo fetch failed");
    const data = (await res.json()) as { country_code?: string };
    const code = data.country_code ?? "US";
    return NextResponse.json({ countryCode: code });
  } catch {
    return NextResponse.json({ countryCode: "US" });
  }
}
