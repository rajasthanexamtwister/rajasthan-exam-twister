import Script from "next/script";

interface GoogleConsentScriptsProps {
  googleTagId?: string;
  gaMeasurementId?: string;
}

export const EEA_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "EL", "HU", "IE", "IT", "LV", "LT", "LU", "MT",
  "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI",
  "NO", "GB", "CH"
];

/**
 * Renders Google Consent Mode v2 inline initialization and Google tag (gtag.js) script.
 * Adheres to Google Consent Mode v2 regional guidelines:
 * - EEA / UK / Swiss regions: Default denied (strict opt-in compliance).
 * - Non-EEA regions (India, global): Default granted (opt-out compliance; resolves Google 0% consent warning).
 * - Saved user choice: Explicit user preference overrides defaults immediately on first load.
 */
export function GoogleConsentScripts({
  googleTagId = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID || "GT-KDDT6VRQ",
  gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
}: GoogleConsentScriptsProps) {
  const eeaRegionsJson = JSON.stringify(EEA_REGIONS);

  // Synchronous script establishing Consent Mode v2 regional defaults or stored choice
  const consentInitCode = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    
    var retConsent = null;
    try {
      var raw = localStorage.getItem('ret_consent_v1');
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.version === '1') {
          retConsent = parsed;
        }
      }
    } catch (e) {}

    if (retConsent) {
      // User's explicit choice overrides defaults
      gtag('consent', 'default', {
        'ad_storage': retConsent.advertising ? 'granted' : 'denied',
        'ad_user_data': retConsent.advertising ? 'granted' : 'denied',
        'ad_personalization': retConsent.advertising ? 'granted' : 'denied',
        'analytics_storage': retConsent.analytics ? 'granted' : 'denied',
        'functionality_storage': 'granted',
        'personalization_storage': retConsent.advertising ? 'granted' : 'denied',
        'security_storage': 'granted'
      });
    } else {
      // 1. Strict denied defaults for European Economic Area (EEA), UK, and Switzerland
      gtag('consent', 'default', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'analytics_storage': 'denied',
        'functionality_storage': 'granted',
        'personalization_storage': 'denied',
        'security_storage': 'granted',
        'region': ${eeaRegionsJson},
        'wait_for_update': 500
      });

      // 2. Default granted for Non-EEA traffic (India, US, global traffic - fixes 0% non-EEA consent rate warning)
      gtag('consent', 'default', {
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted',
        'analytics_storage': 'granted',
        'functionality_storage': 'granted',
        'personalization_storage': 'granted',
        'security_storage': 'granted'
      });
    }

    gtag('js', new Date());
    ${googleTagId ? `gtag('config', '${googleTagId}');` : ""}
    ${gaMeasurementId && gaMeasurementId !== googleTagId ? `gtag('config', '${gaMeasurementId}', { anonymize_ip: true });` : ""}
  `.trim();

  return (
    <>
      {/* 1. Google tag (gtag.js) non-blocking loader */}
      {googleTagId && (
        <Script
          id="google-tag-manager-gtag"
          src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`}
          strategy="afterInteractive"
        />
      )}

      {/* 2. Consent Mode v2 & Google Tag initialization */}
      <Script
        id="google-consent-mode-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: consentInitCode }}
      />
    </>
  );
}
