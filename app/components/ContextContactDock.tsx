"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildContextContactLinks, shouldShowContextContact } from "../lib/context-contact";
import { trackEvent } from "../lib/tracking";

export default function ContextContactDock() {
  const pathname = usePathname() || "/";
  if (!shouldShowContextContact(pathname)) return null;
  const links = buildContextContactLinks(pathname);
  const context = pathname.slice(0, 80);
  return (
    <aside className="context-contact-dock" aria-label={links.zh ? "带当前页面信息联系贝强" : "Contact Beiqiang with this page context"}>
      <span>{links.zh ? "需要采购协助？" : "Need sourcing help?"}</span>
      <a href={links.whatsappHref} target="_blank" rel="noreferrer" onClick={() => trackEvent("whatsapp_click", { context, linkType: "context_dock" })}>WhatsApp</a>
      <a href={links.emailHref} onClick={() => trackEvent("email_click", { context, linkType: "context_dock" })}>{links.zh ? "邮件" : "Email"}</a>
      <Link href={links.quoteHref}>{links.zh ? "完整询价" : "Full inquiry"}</Link>
    </aside>
  );
}
