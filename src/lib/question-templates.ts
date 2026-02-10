/**
 * Google-style question templates for hotels and restaurants.
 * Structured choices improve SEO (keywords from options) and analytics.
 * Admins can add these via Settings → "Add from template".
 */

import type { CustomQuestion } from "@/types/venue";
import type { VenueType } from "@/types/venue";

function makeId(prefix: string, key: string): string {
  return `${prefix}-${key}-${Date.now()}`;
}

/** Hotel: what did you use / book (surfaces keywords: room stay, dining, spa, etc.) */
export const HOTEL_WHAT_DID_YOU_USE: Omit<CustomQuestion, "id" | "order"> = {
  title: "What did you use during your stay?",
  type: "singleChoice",
  key: "what_did_you_use",
  options: ["Room stay", "Dining", "Spa", "Bar / Lounge", "Event / Conference", "Pool", "Room service", "Other"],
  seoHint: "Surfaces keywords: room stay, dining, spa, bar, events, pool, room service",
};

/** Hotel: spend per person (value perception, budget segment) */
export const HOTEL_SPEND_PER_PERSON: Omit<CustomQuestion, "id" | "order"> = {
  title: "How much did you spend per person (approx.)?",
  type: "singleChoice",
  key: "spend_per_person",
  options: [
    "Under ₹2,000",
    "₹2,000–5,000",
    "₹5,000–10,000",
    "₹10,000–20,000",
    "₹20,000–50,000",
    "₹50,000+",
    "Prefer not to say",
  ],
  seoHint: "Value perception; helps with budget-friendly / luxury positioning",
};

/** Hotel: wait / check-in or service speed */
export const HOTEL_WAIT_TIME: Omit<CustomQuestion, "id" | "order"> = {
  title: "How long did you wait for check-in or key service?",
  type: "singleChoice",
  key: "wait_time",
  options: ["No wait", "Up to 10 min", "10–30 min", "30–60 min", "Over an hour"],
  seoHint: "Service speed, efficiency — feeds weak areas / recommendations",
};

/** Hotel: who is this place best for (multi-select, like Google) */
export const HOTEL_BEST_FOR: Omit<CustomQuestion, "id" | "order"> = {
  title: "Who is this place best suited for?",
  type: "multiChoice",
  key: "best_for",
  multiSelect: true,
  options: ["Solo travelers", "Couples", "Families", "Business", "Groups / events", "Suitable for all", "Not sure"],
  seoHint: "Keywords: solo, romantic, family-friendly, business hotel, group events",
};

/** Restaurant: what did you get (meal type) */
export const RESTAURANT_WHAT_DID_YOU_GET: Omit<CustomQuestion, "id" | "order"> = {
  title: "What did you get?",
  type: "singleChoice",
  key: "what_did_you_get",
  options: ["Breakfast", "Brunch", "Lunch", "Dinner", "Coffee / snacks", "Other"],
  seoHint: "Surfaces keywords: best breakfast, brunch, lunch, dinner — strong for local SEO",
};

/** Restaurant: spend per person */
export const RESTAURANT_SPEND_PER_PERSON: Omit<CustomQuestion, "id" | "order"> = {
  title: "How much did you spend per person (approx.)?",
  type: "singleChoice",
  key: "spend_per_person",
  options: [
    "Under ₹200",
    "₹200–400",
    "₹400–600",
    "₹600–1,000",
    "₹1,000–2,000",
    "₹2,000+",
    "Prefer not to say",
  ],
  seoHint: "Value perception; affordable / mid-range / fine dining",
};

/** Restaurant: wait for table */
export const RESTAURANT_WAIT_TIME: Omit<CustomQuestion, "id" | "order"> = {
  title: "How long did you wait for a table?",
  type: "singleChoice",
  key: "wait_time",
  options: ["No wait", "Up to 10 min", "10–30 min", "30–60 min", "Over an hour"],
  seoHint: "Wait time, service speed — feeds recommendations",
};

/** Restaurant: group size / best for (multi-select) */
export const RESTAURANT_BEST_FOR: Omit<CustomQuestion, "id" | "order"> = {
  title: "What size group is this place best suited for?",
  type: "multiChoice",
  key: "best_for",
  multiSelect: true,
  options: ["1 person", "2 people", "3–4 people", "5–8 people", "9+ people", "Suitable for all", "Not sure"],
  seoHint: "Keywords: solo dining, date night, family dinner, group booking",
};

export function getHotelGoogleStyleQuestions(startOrder: number): CustomQuestion[] {
  const base = [HOTEL_WHAT_DID_YOU_USE, HOTEL_SPEND_PER_PERSON, HOTEL_WAIT_TIME, HOTEL_BEST_FOR];
  return base.map((q, i) => ({
    ...q,
    id: makeId("hotel", q.key),
    order: startOrder + i,
  })) as CustomQuestion[];
}

export function getRestaurantGoogleStyleQuestions(startOrder: number): CustomQuestion[] {
  const base = [
    RESTAURANT_WHAT_DID_YOU_GET,
    RESTAURANT_SPEND_PER_PERSON,
    RESTAURANT_WAIT_TIME,
    RESTAURANT_BEST_FOR,
  ];
  return base.map((q, i) => ({
    ...q,
    id: makeId("restaurant", q.key),
    order: startOrder + i,
  })) as CustomQuestion[];
}

export function getGoogleStyleQuestionsForVenue(venueType: VenueType, startOrder: number): CustomQuestion[] {
  return venueType === "hotel"
    ? getHotelGoogleStyleQuestions(startOrder)
    : getRestaurantGoogleStyleQuestions(startOrder);
}
