"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { analyticsConsent, setAnalyticsConsent } from "../lib/tracking";

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => setVisible(analyticsConsent() === null), 0); return () => window.clearTimeout(timer); }, []);
  if (!visible) return null;
  function choose(value: boolean) { setAnalyticsConsent(value); setVisible(false); }
  return <aside className="consent-banner" aria-label="Website analytics choice"><div><strong>Your privacy choice</strong><p>Essential functions keep quote lists and inquiry access on this device. Optional first-party analytics help Beiqiang understand which product pages lead to B2B inquiries. We do not run optional analytics unless you accept.</p><Link href="/privacy/">Read privacy notice</Link></div><div><button className="button button-small button-secondary" type="button" onClick={() => choose(false)}>Essential only</button><button className="button button-small" type="button" onClick={() => choose(true)}>Accept analytics</button></div></aside>;
}
