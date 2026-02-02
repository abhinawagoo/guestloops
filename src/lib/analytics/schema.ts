/**
 * Analytics schema for hospitality feedback & Google review growth.
 * Use with Supabase/PostgreSQL for dashboards and AI insights.
 * Aligned with spec: aspect scores, time, day, image tags, sentiment, completion time, posted.
 */

export interface FeedbackRecord {
  id: string;
  venue_id: string;
  session_id?: string;
  /** Customer mobile (collected after QR scan) */
  mobile?: string;
  /** Aspect scores 1–5 */
  overall: number;
  cleanliness?: number;
  service?: number;
  food_quality?: number;
  room_quality?: number;
  value?: number;
  optional_text?: string;
  image_urls?: string[];
  /** AI auto-tags: food, room, staff, etc. */
  image_tags?: string[];
  generated_review_text?: string;
  generated_review_rating?: number;
  posted_to_google_at?: string;
  /** ISO timestamp when feedback started */
  created_at: string;
  /** Time of visit (optional, from user or inferred) */
  time_of_visit?: string;
  /** 0–6 or Mon–Sun for analytics */
  day_of_week?: number;
  /** positive | neutral | negative, derived from scores */
  sentiment?: "positive" | "neutral" | "negative";
  /** Seconds from start to submit (target < 45) */
  completion_time_sec?: number;
  /** Whether user clicked through to Google */
  google_review_posted?: boolean;
}

export interface VenueAnalytics {
  venue_id: string;
  period: "7d" | "30d" | "90d";
  scans: number;
  feedback_completions: number;
  completion_rate_pct: number;
  google_reviews_posted: number;
  post_rate_pct: number;
  avg_overall: number;
  avg_cleanliness?: number;
  avg_service?: number;
  avg_food_quality?: number;
  avg_room_quality?: number;
  avg_value?: number;
}

export interface InsightRecord {
  id: string;
  venue_id: string;
  period: string;
  insight_text: string;
  aspect?: string;
  created_at: string;
}

/** Target metrics for selling (from spec) */
export const TARGET_METRICS = {
  scan_to_completion_pct: { min: 65, max: 80 },
  completion_to_google_review_pct: { min: 50, max: 70 },
  avg_feedback_time_sec: { max: 45 },
  typing_pct_of_journey: { max: 20 },
} as const;
