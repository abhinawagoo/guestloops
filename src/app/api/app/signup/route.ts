import { NextResponse } from "next/server";
import { createTenant, createVenueForTenant } from "@/data/tenants";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_UI_TEXT = {
  welcomeSubtitle: "Scan to explore or share your experience",
  feedbackCardTitle: "Give Feedback & Unlock Reward",
  feedbackCardSubtitle: "Quick taps — we'll turn it into a Google review.",
  rewardCta: "Win 10% off your next visit 🎁",
  claimRewardLabel: "I'm done — claim my reward",
  thanksTitle: "Thanks! 🎁",
};

/**
 * Create a new tenant (business signup). With Supabase configured (service role),
 * creates tenant + auth user + profile in DB and optionally first venue.
 * Otherwise uses in-memory store.
 */
export async function POST(request: Request) {
  let body: {
    slug?: string;
    name: string;
    businessType?: "hotel" | "restaurant" | "both";
    ownerEmail: string;
    ownerFirstName?: string;
    ownerLastName?: string;
    ownerMobile?: string;
    ownerCountryCode?: string;
    countryCode?: string;
    password?: string;
    firstVenueName?: string;
    firstVenueType?: "restaurant" | "hotel";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug =
    body.slug?.toLowerCase().trim().replace(/[^a-z0-9-]/g, "") ||
    body.name
      ?.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 32) ||
    "";
  if (!slug || slug.length < 2) {
    return NextResponse.json(
      { error: "Slug must be at least 2 characters (letters, numbers, hyphens)" },
      { status: 400 }
    );
  }
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  if (!body.ownerEmail?.trim()) {
    return NextResponse.json({ error: "Owner email required" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (admin) {
    // --- Supabase: create tenant + user + profile (+ optional venue) ---
    const { data: existing } = await admin
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "This business name is already taken. Try another." }, { status: 409 });
    }

    const { data: tenantRow, error: tenantErr } = await admin
      .from("tenants")
      .insert({
        slug,
        name: body.name.trim(),
        business_type: body.businessType ?? "restaurant",
        plan: "free",
        status: "trial",
        owner_email: body.ownerEmail.trim(),
        owner_first_name: body.ownerFirstName?.trim() || null,
        owner_last_name: body.ownerLastName?.trim() || null,
        owner_mobile: body.ownerMobile?.trim() || null,
        owner_country_code: body.ownerCountryCode || null,
        country_code: body.countryCode || null,
      })
      .select("id, slug, name, plan, status")
      .single();

    if (tenantErr || !tenantRow) {
      console.error("Signup tenant insert:", tenantErr);
      return NextResponse.json(
        { error: tenantErr?.message ?? "Failed to create tenant. Please try again." },
        { status: 500 }
      );
    }

    const password = body.password?.trim();
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password is required (at least 6 characters)" },
        { status: 400 }
      );
    }

    const { data: userData, error: userErr } = await admin.auth.admin.createUser({
      email: body.ownerEmail.trim(),
      password,
      email_confirm: true,
      user_metadata: {
        tenant_id: tenantRow.id,
        tenant_slug: tenantRow.slug,
      },
    });

    if (userErr || !userData.user) {
      await admin.from("tenants").delete().eq("id", tenantRow.id);
      const msg = userErr?.message ?? "Failed to create account";
      if (msg.includes("already been registered") || msg.includes("already exists")) {
        return NextResponse.json({ error: "This email is already registered. Sign in instead." }, { status: 409 });
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { error: profileErr } = await admin.from("profiles").insert({
      id: userData.user.id,
      tenant_id: tenantRow.id,
      email: body.ownerEmail.trim(),
      first_name: body.ownerFirstName?.trim() || null,
      last_name: body.ownerLastName?.trim() || null,
      mobile: body.ownerMobile?.trim() || null,
      country_code: body.ownerCountryCode || null,
      role: "owner",
    });

    if (profileErr) {
      await admin.auth.admin.deleteUser(userData.user.id);
      await admin.from("tenants").delete().eq("id", tenantRow.id);
      console.error("Signup profile insert:", profileErr);
      return NextResponse.json(
        { error: "Account created but profile setup failed. Please contact support." },
        { status: 500 }
      );
    }

    if (body.firstVenueName?.trim()) {
      const { data: venueRow, error: venueErr } = await admin
        .from("venues")
        .insert({
          tenant_id: tenantRow.id,
          name: body.firstVenueName.trim(),
          type: body.firstVenueType ?? "restaurant",
        })
        .select("id")
        .single();

      if (!venueErr && venueRow) {
        await admin.from("venue_settings").insert({
          venue_id: venueRow.id,
          show_menu: true,
          show_services: true,
          ui_text: DEFAULT_UI_TEXT,
          custom_questions: [],
          menu_items: [],
          service_items: [],
        });
      }
    }

    return NextResponse.json({
      tenant: {
        id: tenantRow.id,
        slug: tenantRow.slug,
        name: tenantRow.name,
        plan: tenantRow.plan,
        status: tenantRow.status,
      },
      message: "Account created. Signing you in…",
    });
  }

  // --- In-memory fallback ---
  const tenant = createTenant({
    slug,
    name: body.name.trim(),
    businessType: body.businessType ?? "restaurant",
    ownerEmail: body.ownerEmail.trim(),
    ownerFirstName: body.ownerFirstName?.trim(),
    ownerLastName: body.ownerLastName?.trim(),
    ownerMobile: body.ownerMobile?.trim(),
    ownerCountryCode: body.ownerCountryCode,
    countryCode: body.countryCode,
  });

  if (!tenant) {
    return NextResponse.json({ error: "This business name is already taken. Try another." }, { status: 409 });
  }

  if (body.firstVenueName?.trim()) {
    createVenueForTenant(tenant.id, {
      name: body.firstVenueName.trim(),
      type: body.firstVenueType ?? "restaurant",
    });
  }

  return NextResponse.json({
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      plan: tenant.plan,
      status: tenant.status,
    },
    message: `Tenant created. Use ?tenant=${tenant.slug} for dev. Sign in at /signin when Supabase is configured.`,
  });
}
