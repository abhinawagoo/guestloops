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

/** For emoji-type questions: show as stars or sentiment faces (very dissatisfied → very satisfied). */
export type RatingStyle = "star" | "emoji";

/** Key maps to FeedbackScores for emoji, or custom slug for AI (e.g. what_liked, would_return). */
export type QuestionKey = keyof FeedbackScores | "optionalText" | string;

export interface CustomQuestion {
  id: string;
  title: string;
  type: QuestionType;
  /** For emoji: overall, cleanliness, service, foodQuality, roomQuality, value. For text/yesNo: custom slug for AI. */
  key: QuestionKey;
  order: number;
  /** For type "emoji": display as "star" (1-5 stars) or "emoji" (sentiment icons). */
  ratingStyle?: RatingStyle;
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

/** Legacy flat item; kept for backward compatibility. Prefer MenuCategory + items. */
export interface MenuItem {
  id: string;
  category: string;
  name: string;
  description?: string;
  price?: string;
  imageUrl?: string;
  order: number;
}

/** Size/variant option for a menu item (e.g. Small / Medium / Large). */
export interface MenuItemSize {
  id: string;
  name: string;
  price?: string;
  order: number;
}

/** Sub-item under a category (e.g. Baklava, Ice cream under Dessert). */
export interface MenuCategoryItem {
  id: string;
  name: string;
  description?: string;
  price?: string;
  imageUrl?: string;
  enabled: boolean;
  order: number;
  /** Optional sizes (Small/Medium/Large or Half/Full). */
  sizes?: MenuItemSize[];
}

/** Menu category (e.g. Dessert) with items (Baklava, Ice cream, Gulab jamun). */
export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  enabled: boolean;
  order: number;
  items: MenuCategoryItem[];
}

/** Legacy flat service item. Prefer ServiceCategory + items. */
export interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  order: number;
}

/** Service sub-item under a category (with image, price, description). */
export interface ServiceCategoryItem {
  id: string;
  name: string;
  description?: string;
  price?: string;
  imageUrl?: string;
  enabled: boolean;
  order: number;
}

/** Service category with items (e.g. Spa → Massage, Facial). */
export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  enabled: boolean;
  order: number;
  items: ServiceCategoryItem[];
}

/** Tone for AI-generated replies (Google reviews, WhatsApp). */
export type ReplyTone = "friendly" | "professional" | "apologetic" | "offerable" | "luxury" | "casual";

export interface VenueSettings {
  venueId: string;
  showMenu: boolean;
  showServices: boolean;
  uiText: VenueUIText;
  customQuestions: CustomQuestion[];
  /** Legacy flat list; use menuCategories when available. */
  menuItems: MenuItem[];
  /** Categories with sub-items (Dessert → Baklava, Ice cream, Gulab jamun). */
  menuCategories?: MenuCategory[];
  /** Legacy flat list; use serviceCategories when available. */
  serviceItems: ServiceItem[];
  /** Service categories with items (Spa → Massage, Facial). */
  serviceCategories?: ServiceCategory[];
  /** AI reply: tone (friendly, professional, etc.). Used for Google review & WhatsApp auto-reply. */
  replyTone?: ReplyTone;
  /** AI reply: custom instructions (e.g. "Always mention next visit discount"). */
  replyInstructions?: string;
  /** Optional: direct URL to your Google review / writereview page. Used for "Post to Google" link. */
  googleReviewUrl?: string;
  /** Default for emoji-type questions: "star" (1-5 stars) or "emoji" (sentiment icons). Used when question has no ratingStyle. */
  defaultRatingStyle?: RatingStyle;
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
