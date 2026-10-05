import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  OPEN_CONSENT_EVENT,
  getStoredConsent,
  saveStoredConsent,
  updateGoogleConsent,
  openConsentPreferences,
} from "@/components/privacy/consent-utils";
import fs from "node:fs";
import path from "node:path";

describe("Custom Consent Management & Google Consent Mode v2", () => {
  let mockStore: Record<string, string> = {};
  const listeners: Record<string, Array<(...args: any[]) => void>> = {};

  beforeEach(() => {
    mockStore = {};
    for (const key of Object.keys(listeners)) {
      delete listeners[key];
    }

    const mockWindow = {
      localStorage: {
        getItem: (key: string) => mockStore[key] || null,
        setItem: (key: string, value: string) => {
          mockStore[key] = value;
        },
        removeItem: (key: string) => {
          delete mockStore[key];
        },
        clear: () => {
          mockStore = {};
        },
      },
      addEventListener: (event: string, cb: (...args: any[]) => void) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(cb);
      },
      removeEventListener: (event: string, cb: (...args: any[]) => void) => {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter((fn) => fn !== cb);
        }
      },
      dispatchEvent: (event: any) => {
        const type = event.type || event;
        if (listeners[type]) {
          listeners[type].forEach((fn) => fn(event));
        }
        return true;
      },
      gtag: vi.fn(),
    };

    vi.stubGlobal("window", mockWindow);
    vi.stubGlobal("localStorage", mockWindow.localStorage);
    vi.stubGlobal("CustomEvent", class CustomEvent {
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    });
  });

  it("should return null when no consent is stored in localStorage", () => {
    expect(getStoredConsent()).toBeNull();
  });

  it("should save consent to localStorage and call gtag('consent', 'update') on Accept All", () => {
    const gtagMock = vi.fn();
    (window as any).gtag = gtagMock;

    const saved = saveStoredConsent({ analytics: true, advertising: true });

    expect(saved.version).toBe(CONSENT_VERSION);
    expect(saved.analytics).toBe(true);
    expect(saved.advertising).toBe(true);
    expect(typeof saved.timestamp).toBe("number");

    // Check localStorage persistence
    const stored = getStoredConsent();
    expect(stored).not.toBeNull();
    expect(stored?.analytics).toBe(true);
    expect(stored?.advertising).toBe(true);

    // Verify gtag consent update call
    expect(gtagMock).toHaveBeenCalledWith("consent", "update", {
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      analytics_storage: "granted",
      personalization_storage: "granted",
    });
  });

  it("should save consent to localStorage and deny all tracking on Reject All", () => {
    const gtagMock = vi.fn();
    (window as any).gtag = gtagMock;

    const saved = saveStoredConsent({ analytics: false, advertising: false });

    expect(saved.analytics).toBe(false);
    expect(saved.advertising).toBe(false);

    expect(gtagMock).toHaveBeenCalledWith("consent", "update", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      personalization_storage: "denied",
    });
  });

  it("should invalidate stored consent if version is outdated", () => {
    mockStore[CONSENT_STORAGE_KEY] = JSON.stringify({
      version: "0",
      analytics: true,
      advertising: true,
      timestamp: Date.now() - 100000,
    });

    expect(getStoredConsent()).toBeNull();
  });

  it("should dispatch custom window event when openConsentPreferences is invoked", () => {
    const listener = vi.fn();
    window.addEventListener(OPEN_CONSENT_EVENT, listener);

    openConsentPreferences();

    expect(listener).toHaveBeenCalled();
    window.removeEventListener(OPEN_CONSENT_EVENT, listener);
  });

  it("should verify Google Consent Scripts and RootLayout render without duplicate GA4 / AdSense tags", () => {
    const layoutPath = path.join(process.cwd(), "app", "layout.tsx");
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");

    expect(layoutContent).toContain("GoogleConsentScripts");
    expect(layoutContent).toContain("ConsentBanner");
    expect(layoutContent).toContain("google-adsense");

    // Verify only one AdSense script element
    const adsenseMatches = (layoutContent.match(/id="google-adsense"/g) || []).length;
    expect(adsenseMatches).toBe(1);
  });
});
