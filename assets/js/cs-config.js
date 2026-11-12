/* Public module configuration (no secrets). Tracking runs through GTM; with every ID null nothing external loads
   and events only show with ?cs_debug=1. */
window.CS_CONFIG = {
  siteId: 'l-oliveira-concrete',
  lead: {
    endpoint: '/api/lead.php',
    redirect: '/thank-you/',
    smsConsentVersion: 'sms-v1-2026-11-11'
  },
  serviceArea: { zips: [], outOfArea: 'accept-with-message' },
  tracking: {
    mode: 'gtm',
    ga4: null,
    metaPixel: null,
    googleAds: null,
    gtm: null,
    consentDefault: 'granted',
    leadValue: null,
    debugParam: 'cs_debug'
  }
};

// preview copy: the form is simulated and nothing is tracked
window.CS_CONFIG = Object.assign({}, window.CS_CONFIG, { preview: true });
window.CS_CONFIG.lead = Object.assign({}, window.CS_CONFIG.lead, { endpoint: '/l-oliveira-concrete-preview/api/lead.php', redirect: null });
window.CS_CONFIG.tracking = Object.assign({}, window.CS_CONFIG.tracking, { mode: 'off', ga4: null, metaPixel: null, googleAds: null, gtm: null });
