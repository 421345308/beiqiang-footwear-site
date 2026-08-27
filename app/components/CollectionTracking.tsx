"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { analyticsConsent, trackEvent } from "../lib/tracking";

type LinkProps = {
  slug?: string;
  href: string;
  children: ReactNode;
  className?: string;
  styleCode?: string;
};

export function CollectionView({ slug }: { slug: string }) {
  const sent = useRef(false);
  useEffect(() => {
    const record = () => {
      if (sent.current || !analyticsConsent()) return;
      sent.current = true;
      trackEvent("collection_view", { context: slug });
    };
    record();
    window.addEventListener("beiqiang-consent-changed", record);
    return () => window.removeEventListener("beiqiang-consent-changed", record);
  }, [slug]);
  return null;
}

export function CollectionProductLink({ slug, href, children, className, styleCode }: LinkProps) {
  return <Link className={className} href={href} onClick={() => slug && trackEvent("collection_product_open", { context: slug, styleCode })}>{children}</Link>;
}

export function CollectionQuoteLink({ slug, href, children, className }: Required<Pick<LinkProps, "slug" | "href" | "children">> & Pick<LinkProps, "className">) {
  return <Link className={className} href={href} onClick={() => trackEvent("collection_quote_cta", { context: slug, linkType: "quote" })}>{children}</Link>;
}
