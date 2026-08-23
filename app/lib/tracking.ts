"use client";

export type Attribution = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  landingPage: string;
  referrer: string;
};

const STORAGE_KEY = "beiqiang_first_touch";
const CONSENT_KEY = "beiqiang_analytics_consent";

export function analyticsConsent() {
  if (typeof window === "undefined") return null;
  try { const value = localStorage.getItem(CONSENT_KEY); return value === "yes" ? true : value === "no" ? false : null; } catch { return null; }
}

export function setAnalyticsConsent(value: boolean) {
  try { localStorage.setItem(CONSENT_KEY, value ? "yes" : "no"); if (!value) sessionStorage.removeItem(STORAGE_KEY); window.dispatchEvent(new Event("beiqiang-consent-changed")); } catch { /* preference storage unavailable */ }
}

function clean(value: string | null, max = 300) {
  return (value ?? "").trim().slice(0, max);
}

export function getAttribution(): Attribution {
  if (typeof window === "undefined") {
    return { utmSource: "", utmMedium: "", utmCampaign: "", utmContent: "", utmTerm: "", landingPage: "", referrer: "" };
  }
  if (analyticsConsent() !== true) return { utmSource: "", utmMedium: "", utmCampaign: "", utmContent: "", utmTerm: "", landingPage: "", referrer: "" };

  const params = new URLSearchParams(window.location.search);
  const current: Attribution = {
    utmSource: clean(params.get("utm_source"), 100),
    utmMedium: clean(params.get("utm_medium"), 100),
    utmCampaign: clean(params.get("utm_campaign"), 150),
    utmContent: clean(params.get("utm_content"), 150),
    utmTerm: clean(params.get("utm_term"), 150),
    landingPage: clean(`${window.location.pathname}${window.location.search}`),
    referrer: clean(document.referrer),
  };

  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    const hasCampaign = Boolean(current.utmSource || current.utmMedium || current.utmCampaign);
    if (!saved || hasCampaign) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return saved && !hasCampaign ? { ...JSON.parse(saved), landingPage: current.landingPage } : current;
  } catch {
    return current;
  }
}

export function trackEvent(event: string, details: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  if (analyticsConsent() !== true) return;
  const body = JSON.stringify({
    event,
    details,
    attribution: getAttribution(),
    page: window.location.pathname,
    occurredAt: new Date().toISOString(),
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    return;
  }

  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
