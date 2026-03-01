import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getTenantByIdAsync, getTenantBySlugAsync } from "@/lib/tenant-resolver";
import { ContactsPanel } from "./contacts-panel";

export default async function AdminContactsPage() {
  const headersList = await headers();
  const ctx = getTenantFromHeaders(headersList);
  if (ctx.hostType !== "tenant") redirect("/");

  let tenantId = ctx.tenantId;
  if (!tenantId && ctx.tenantSlug) {
    const tenant = await getTenantBySlugAsync(ctx.tenantSlug);
    tenantId = tenant?.id ?? null;
  }
  if (!tenantId) redirect("/");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Contacts</h1>
        <p className="text-muted-foreground text-sm mt-1.5 max-w-xl">
          Manage customer contacts with consent tracking for WhatsApp messaging
        </p>
      </div>
      <ContactsPanel />
    </div>
  );
}
