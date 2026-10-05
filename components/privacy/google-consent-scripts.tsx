import Script from "next/script";

interface GoogleConsentScriptsProps {
  gaMeasurementId?: string;
}

/**
 * Renders Google Consent Mode v2 inline initialization and GA4 gtag.js script.
 * Synchronously establishes conservative denied defaults before any Google tags process data.
 */
export function GoogleConsentScripts({
  gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-B6W6YLVPSQ",
}: GoogleConsentScriptsProps) {
  // Synchronous script establishing Consent Mode v2 default state from localStorage or strict denied defaults
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

    gtag('consent', 'default', {
      'ad_storage': retConsent && retConsent.advertising ? 'granted' : 'denied',
      'ad_user_data': retConsent && retConsent.advertising ? 'granted' : 'denied',
      'ad_personalization': retConsent && retConsent.advertising ? 'granted' : 'denied',
      'analytics_storage': retConsent && retConsent.analytics ? 'granted' : 'denied',
      'functionality_storage': 'granted',
      'personalization_storage': retConsent && retConsent.advertising ? 'granted' : 'denied',
      'security_storage': 'granted',
      'wait_for_update': 500
    });

    gtag('js', new Date());
    ${gaMeasurementId ? `gtag('config', '${gaMeasurementId}', { anonymize_ip: true });` : ""}
  `.trim();

  return (
    <>
      {/* 1. Synchronous Consent Mode v2 default configuration */}
      <script
        id="google-consent-mode-init"
        dangerouslySetInnerHTML={{ __html: consentInitCode }}
      />

      {/* 2. Google Analytics gtag.js loader */}
      {gaMeasurementId && (
        <Script
          id="google-gtag-js"
          src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
          strategy="afterInteractive"
        />
      )}
    </>
  );
}
