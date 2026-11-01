"use client";

import { useState } from "react";
import type { QuoteLine } from "../lib/quote-list";
import { buildQuoteListShareUrl } from "../lib/quote-list-share";
import { quoteShareCopy } from "../lib/quote-share-copy";
import type { PublicLocale } from "../lib/public-locales";

export default function QuoteListShare({ lines, locale = "en", importMessage = "" }: { lines: QuoteLine[]; locale?: PublicLocale; importMessage?: string }) {
  const [status, setStatus] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const copy = quoteShareCopy[locale];

  async function copyLink() {
    let url: string;
    try { url = buildQuoteListShareUrl(lines, locale); }
    catch { setManualUrl(""); setStatus(copy.tooLong); return; }
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      else {
        const field = document.createElement("textarea");
        field.value = url; field.setAttribute("readonly", ""); field.style.position = "fixed"; field.style.opacity = "0";
        document.body.appendChild(field); field.select(); const copied = document.execCommand("copy"); field.remove();
        if (!copied) throw new Error("copy_unavailable");
      }
      setManualUrl(""); setStatus(copy.copied);
    } catch {
      setManualUrl(url); setStatus(copy.manual);
    }
  }

  if (!lines.length && !importMessage) return null;
  return <aside className="quote-list-share" aria-label={copy.title}>
    <div><strong>{copy.title}</strong><span>{copy.notice}</span></div>
    {lines.length ? <button type="button" onClick={copyLink}>{copy.button}</button> : null}
    {manualUrl && <label>{copy.manual}<input readOnly value={manualUrl} onFocus={event => event.currentTarget.select()} /></label>}
    <p aria-live="polite">{status || importMessage}</p>
  </aside>;
}
