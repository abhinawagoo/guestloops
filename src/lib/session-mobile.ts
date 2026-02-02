const KEY_PREFIX = "growth-mobile-";
const WHATSAPP_OPT_IN_PREFIX = "growth-whatsapp-opt-in-";

export function getStoredMobile(venueId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(KEY_PREFIX + venueId);
  } catch {
    return null;
  }
}

export function setStoredMobile(venueId: string, mobile: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY_PREFIX + venueId, mobile.trim());
  } catch {
    // ignore
  }
}

export function getStoredWhatsAppOptIn(venueId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(WHATSAPP_OPT_IN_PREFIX + venueId) === "true";
  } catch {
    return false;
  }
}

export function setStoredWhatsAppOptIn(venueId: string, optedIn: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(WHATSAPP_OPT_IN_PREFIX + venueId, optedIn ? "true" : "false");
  } catch {
    // ignore
  }
}
