/**
 * Google Consent Mode v2 & Local Consent Management Utilities
 * for Rajasthan Exam Twister
 */

export const CONSENT_STORAGE_KEY = "ret_consent_v1";
export const CONSENT_VERSION = "1";
export const OPEN_CONSENT_EVENT = "ret:open-consent-modal";

export interface UserConsentState {
  version: string;
  analytics: boolean;
  advertising: boolean;
  timestamp: number;
}

/**
 * Retrieves the persisted consent state from localStorage if valid and matching CONSENT_VERSION.
 */
export function getStoredConsent(): UserConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      parsed.version === CONSENT_VERSION &&
      typeof parsed.analytics === "boolean" &&
      typeof parsed.advertising === "boolean"
    ) {
      return parsed as UserConsentState;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Persists the user consent selection to localStorage and updates Google Consent Mode v2.
 */
export function saveStoredConsent(consent: { analytics: boolean; advertising: boolean }): UserConsentState {
  const state: UserConsentState = {
    version: CONSENT_VERSION,
    analytics: Boolean(consent.analytics),
    advertising: Boolean(consent.advertising),
    timestamp: Date.now(),
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error("Failed to save consent state to localStorage:", err);
    }
    updateGoogleConsent(consent);
  }

  return state;
}

/**
 * Updates Google Consent Mode v2 via gtag('consent', 'update', ...)
 */
export function updateGoogleConsent(consent: { analytics: boolean; advertising: boolean }): void {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    (window as any).gtag("consent", "update", {
      ad_storage: consent.advertising ? "granted" : "denied",
      ad_user_data: consent.advertising ? "granted" : "denied",
      ad_personalization: consent.advertising ? "granted" : "denied",
      analytics_storage: consent.analytics ? "granted" : "denied",
      personalization_storage: consent.advertising ? "granted" : "denied",
    });
  }
}

/**
 * Triggers the consent preferences modal via a custom DOM event.
 * Usable from footer links or Privacy Policy page.
 */
export function openConsentPreferences(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_CONSENT_EVENT));
  }
}
