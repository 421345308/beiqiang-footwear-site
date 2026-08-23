"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { analyticsConsent, trackEvent } from "../lib/tracking";

export function SourcingProgramView({ slug }: { slug: string }) {
  const recorded = useRef(false);
  useEffect(() => {
    const record = () => { if (!recorded.current && analyticsConsent() === true) { recorded.current = true; trackEvent("sourcing_program_view", { context: slug }); } };
    record();
    window.addEventListener("beiqiang-consent-changed", record);
    return () => window.removeEventListener("beiqiang-consent-changed", record);
  }, [slug]);
  return null;
}

export function SourcingProgramCta({ slug, href, children, className = "button" }: { slug: string; href: string; children: React.ReactNode; className?: string }) {
  return <Link className={className} href={href} onClick={() => trackEvent("sourcing_program_cta", { context: slug })}>{children}</Link>;
}
