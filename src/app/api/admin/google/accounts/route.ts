import { NextResponse } from "next/server";
import { requireAdminTenant } from "@/lib/require-admin-tenant";
import { getValidAccessTokenForTenant } from "@/lib/google-business";
import { listAccounts } from "@/lib/google-business";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdminTenant();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const accessToken = await getValidAccessTokenForTenant(admin.tenantId);
  if (!accessToken) {
    return NextResponse.json({ error: "Google not connected" }, { status: 400 });
  }

  try {
    const accounts = await listAccounts(accessToken);
    return NextResponse.json({
      accounts: accounts.map((a) => ({
        name: a.name,
        accountId: a.name?.replace("accounts/", "") ?? "",
        accountName: a.accountName,
      })),
    });
  } catch (e) {
    console.error("[admin/google/accounts]", e);
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
