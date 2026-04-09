import { NextResponse } from "next/server";
import { requireAdminTenant } from "@/lib/require-admin-tenant";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createWhatsAppTemplate,
  listWhatsAppTemplates,
  type CreateTemplateInput,
} from "@/lib/meta-whatsapp";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/whatsapp/templates
 * Returns templates from DB. Pass ?sync=1 to pull latest status from Meta first.
 */
export async function GET(request: Request) {
  const ctx = await requireAdminTenant();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const sync = searchParams.get("sync") === "1";

  // Optionally sync from Meta before returning
  if (sync) {
    const { data: wa } = await admin
      .from("whatsapp_accounts")
      .select("waba_id, access_token")
      .eq("tenant_id", ctx.tenantId)
      .eq("status", "active")
      .single();

    if (wa?.waba_id && wa?.access_token) {
      try {
        const metaTemplates = await listWhatsAppTemplates(wa.waba_id, wa.access_token);
        // Upsert each template's status back into DB
        for (const t of metaTemplates) {
          await admin.from("whatsapp_templates").upsert(
            {
              tenant_id: ctx.tenantId,
              meta_template_id: t.id,
              name: t.name,
              category: t.category,
              language: t.language,
              status: t.status,
              components: t.components,
              rejection_reason: t.rejection_reason ?? null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "tenant_id,name" }
          );
        }
      } catch (e) {
        console.error("[whatsapp/templates] Meta sync error:", e);
        // Non-fatal — still return DB data
      }
    }
  }

  const { data: templates, error } = await admin
    .from("whatsapp_templates")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false });

  // Table may not exist yet (migration pending) — return empty list gracefully
  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json({ templates: [], migrationPending: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ templates: templates ?? [] });
}

/**
 * POST /api/admin/whatsapp/templates
 * Creates a new template on Meta and saves to DB.
 */
export async function POST(request: Request) {
  const ctx = await requireAdminTenant();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const body = (await request.json().catch(() => null)) as CreateTemplateInput | null;
  if (!body?.name || !body.category || !body.language || !body.components?.length) {
    return NextResponse.json({ error: "name, category, language, and components are required" }, { status: 400 });
  }

  // Validate template name: lowercase letters, numbers, underscores only
  if (!/^[a-z0-9_]+$/.test(body.name)) {
    return NextResponse.json(
      { error: "Template name must be lowercase letters, numbers, and underscores only" },
      { status: 400 }
    );
  }

  // Get WhatsApp credentials
  const { data: wa } = await admin
    .from("whatsapp_accounts")
    .select("waba_id, access_token")
    .eq("tenant_id", ctx.tenantId)
    .eq("status", "active")
    .single();

  if (!wa?.waba_id || !wa?.access_token) {
    return NextResponse.json({ error: "WhatsApp account not connected" }, { status: 400 });
  }

  try {
    const { id: metaTemplateId, status } = await createWhatsAppTemplate(
      wa.waba_id,
      wa.access_token,
      body
    );

    const { data: saved, error: dbErr } = await admin
      .from("whatsapp_templates")
      .upsert(
        {
          tenant_id: ctx.tenantId,
          meta_template_id: metaTemplateId,
          name: body.name,
          category: body.category,
          language: body.language,
          status,
          components: body.components,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id,name" }
      )
      .select()
      .single();

    if (dbErr) {
      console.error("[whatsapp/templates] DB save error:", dbErr);
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }

    return NextResponse.json({ template: saved }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message ?? "Template creation failed";
    console.error("[whatsapp/templates] Meta create error:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
