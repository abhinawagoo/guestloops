import { NextResponse } from "next/server";
import { requireAdminTenant } from "@/lib/require-admin-tenant";
import { getValidAccessTokenForTenant } from "@/lib/google-business";
import { listLocations } from "@/lib/google-business";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdminTenant();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");
  if (!accountId) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }

  const accessToken = await getValidAccessTokenForTenant(admin.tenantId);
  if (!accessToken) {
    return NextResponse.json({ error: "Google not connected" }, { status: 400 });
  }

  try {
    const { locations, nextPageToken } = await listLocations(accessToken, accountId);
    return NextResponse.json({
      locations: locations.map((l) => ({
        name: l.name,
        locationId: l.name?.replace(/^accounts\/[^/]+\/locations\//, "") ?? "",
        title: l.title,
        storeCode: l.storeCode,
      })),
      nextPageToken,
    });
  } catch (e) {
    console.error("[admin/google/locations]", e);
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
