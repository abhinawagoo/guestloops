import type { VenueSettings, CustomQuestion } from "@/types/venue";

/** Ideal flow: emotion → aspect → aspect → positive text → optional image → review */
const DEFAULT_QUESTIONS: CustomQuestion[] = [
  { id: "service", title: "How did our service make you feel today?", type: "emoji", key: "service", order: 0 },
  { id: "cleanliness", title: "How was the cleanliness?", type: "emoji", key: "cleanliness", order: 1 },
  { id: "quality", title: "How was the food?", type: "emoji", key: "quality", order: 2 },
  { id: "value", title: "How was the value for money?", type: "emoji", key: "value", order: 3 },
  { id: "overall", title: "Overall, how was your experience?", type: "emoji", key: "overall", order: 4 },
  { id: "what_liked", title: "What did you enjoy the most?", type: "text", key: "what_liked", order: 5, placeholder: "e.g. The dessert and the friendly server!" },
  { id: "would_recommend", title: "Would you recommend us to friends?", type: "yesNo", key: "would_recommend", order: 6, yesNoLabels: ["Yes", "No"] },
  { id: "optionalText", title: "Anything else you’d like to share? (optional)", type: "text", key: "optionalText", order: 7, placeholder: "Optional note..." },
];

function defaultSettings(venueId: string): VenueSettings {
  return {
    venueId,
    showMenu: true,
    showServices: true,
    uiText: {
      welcomeSubtitle: "Scan to explore or share your experience",
      feedbackCardTitle: "Give Feedback & Unlock Reward",
      feedbackCardSubtitle: "Quick taps — we'll turn it into a Google review.",
      rewardCta: "Win 10% off your next visit 🎁",
      claimRewardLabel: "I'm done — claim my reward",
      thanksTitle: "Thanks! 🎁",
    },
    customQuestions: [],
    menuItems: [],
    serviceItems: [],
  };
}

const store = new Map<string, VenueSettings>();

export function getSettings(venueId: string): VenueSettings {
  if (!store.has(venueId)) {
    store.set(venueId, defaultSettings(venueId));
  }
  return store.get(venueId)!;
}

export function setSettings(venueId: string, patch: Partial<VenueSettings>): VenueSettings {
  const current = getSettings(venueId);
  const next: VenueSettings = {
    ...current,
    ...patch,
    venueId,
    uiText: patch.uiText ? { ...current.uiText, ...patch.uiText } : current.uiText,
  };
  store.set(venueId, next);
  return next;
}

export function getDefaultQuestions(): CustomQuestion[] {
  return [...DEFAULT_QUESTIONS];
}
