"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { analyticsConsent, trackEvent } from "../lib/tracking";

export function ResourceView({ slug }: { slug: string }) {
  const recorded = useRef(false);
  useEffect(() => {
    const record = () => { if (!recorded.current && analyticsConsent() === true) { recorded.current = true; trackEvent("resource_view", { context: slug }); } };
    record(); window.addEventListener("beiqiang-consent-changed", record); return () => window.removeEventListener("beiqiang-consent-changed", record);
  }, [slug]);
  return null;
}

export function ResourceCta({ slug, href, children, className = "button" }: { slug: string; href: string; children: React.ReactNode; className?: string }) {
  return <Link className={className} href={href} onClick={() => trackEvent("resource_cta", { context: slug, linkType: href.startsWith("/request-quote") ? "quote" : "internal" })}>{children}</Link>;
}

export function ResourceProductLink({ slug, href, styleCode, children }: { slug: string; href: string; styleCode: string; children: React.ReactNode }) {
  return <Link href={href} onClick={() => trackEvent("resource_product_open", { context: slug, styleCode })}>{children}</Link>;
}
