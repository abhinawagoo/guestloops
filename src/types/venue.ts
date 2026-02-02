export type VenueType = "restaurant" | "hotel" | "both";

export interface Venue {
  id: string;
  /** Tenant that owns this venue (multi-tenant) */
  tenantId: string;
  name: string;
  type: VenueType;
  googlePlaceId?: string;
  rewardCta?: string;
  createdAt?: string;
}

/** Question type: emoji (1-5), yesNo, or text. Manager can add/remove/reorder in Settings. */
export type QuestionType = "emoji" | "yesNo" | "text";

/** Key maps to FeedbackScores for emoji, or custom slug for AI (e.g. what_liked, would_return). */
export type QuestionKey = keyof FeedbackScores | "optionalText" | string;

export interface CustomQuestion {
  id: string;
  title: string;
  type: QuestionType;
  /** For emoji: overall, cleanliness, service, foodQuality, roomQuality, value. For text/yesNo: custom slug for AI. */
  key: QuestionKey;
  order: number;
  /** Optional placeholder for text questions */
  placeholder?: string;
  /** Optional labels for yesNo: [ "Yes", "No" ] or custom */
  yesNoLabels?: [string, string];
}

export interface VenueUIText {
  welcomeSubtitle?: string;
  feedbackCardTitle?: string;
  feedbackCardSubtitle?: string;
  rewardCta?: string;
  claimRewardLabel?: string;
  thanksTitle?: string;
}

export interface MenuItem {
  id: string;
  category: string;
  name: string;
  description?: string;
  price?: string;
  imageUrl?: string;
  order: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  order: number;
}

/** Tone for AI-generated replies (Google reviews, WhatsApp). */
export type ReplyTone = "friendly" | "professional" | "apologetic" | "offerable" | "luxury" | "casual";

export interface VenueSettings {
  venueId: string;
  showMenu: boolean;
  showServices: boolean;
  uiText: VenueUIText;
  customQuestions: CustomQuestion[];
  menuItems: MenuItem[];
  serviceItems: ServiceItem[];
  /** AI reply: tone (friendly, professional, etc.). Used for Google review & WhatsApp auto-reply. */
  replyTone?: ReplyTone;
  /** AI reply: custom instructions (e.g. "Always mention next visit discount"). */
  replyInstructions?: string;
  /** Optional: direct URL to your Google review / writereview page. Used for "Post to Google" link. */
  googleReviewUrl?: string;
}

export interface FeedbackScores {
  overall: number;
  cleanliness?: number;
  service?: number;
  foodQuality?: number;
  roomQuality?: number;
  value?: number;
}

export interface FeedbackSubmission {
  venueId: string;
  mobile?: string;
  scores: FeedbackScores;
  textAnswers?: Record<string, string>;
  yesNoAnswers?: Record<string, boolean>;
  optionalText?: string;
  imageUrls?: string[];
  recentOrderItems?: string[];
  sessionId?: string;
}

export interface GeneratedReview {
  text: string;
  suggestedRating: number;
}
