import type { VenueSettings } from "@/types/venue";

/** Raw venue_settings row from Supabase (snake_case). */
export type VenueSettingsRow = {
  venue_id: string;
  show_menu: boolean;
  show_services: boolean;
  ui_text: Record<string, unknown>;
  custom_questions: unknown[];
  menu_items: unknown[];
  service_items: unknown[];
  menu_categories?: unknown[] | null;
  service_categories?: unknown[] | null;
  google_review_url?: string | null;
  default_rating_style?: string | null;
  reply_tone?: string | null;
  reply_instructions?: string | null;
};

export function rowToVenueSettings(row: VenueSettingsRow): VenueSettings {
  return {
    venueId: row.venue_id,
    showMenu: row.show_menu,
    showServices: row.show_services,
    uiText: (row.ui_text as VenueSettings["uiText"]) ?? {},
    customQuestions: (row.custom_questions as VenueSettings["customQuestions"]) ?? [],
    menuItems: (row.menu_items as VenueSettings["menuItems"]) ?? [],
    serviceItems: (row.service_items as VenueSettings["serviceItems"]) ?? [],
    menuCategories: (row.menu_categories as VenueSettings["menuCategories"]) ?? [],
    serviceCategories: (row.service_categories as VenueSettings["serviceCategories"]) ?? [],
    googleReviewUrl: row.google_review_url ?? undefined,
    defaultRatingStyle: (row.default_rating_style as VenueSettings["defaultRatingStyle"]) ?? undefined,
    replyTone: (row.reply_tone as VenueSettings["replyTone"]) ?? undefined,
    replyInstructions: row.reply_instructions ?? undefined,
  };
}
