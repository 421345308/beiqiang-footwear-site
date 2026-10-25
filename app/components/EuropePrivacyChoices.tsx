"use client";
import { useState } from "react";
import { t, type EuropeLocale } from "../data/europe-copy";
import { setAnalyticsConsent } from "../lib/tracking";
export default function EuropePrivacyChoices({
  locale,
}: {
  locale: EuropeLocale;
}) {
  const [saved, setSaved] = useState(false);
  return (
    <div>
      <h2>{t(locale, "privacyChoice")}</h2>
      <div className="europe-actions">
        {[false, true].map((value) => (
          <button
            key={String(value)}
            className="button button-secondary"
            onClick={() => {
              setAnalyticsConsent(value);
              setSaved(true);
            }}
          >
            {t(locale, value ? "analytics" : "essential")}
          </button>
        ))}
      </div>
      <p role="status">{saved ? t(locale, "saved") : ""}</p>
    </div>
  );
}
