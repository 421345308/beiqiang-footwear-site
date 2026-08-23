"use client";

import { useState } from "react";
import { trackEvent } from "../lib/tracking";

type Props = { code: string; name: string; url: string };

export default function ProductShareActions({ code, name, url }: Props) {
  const [status, setStatus] = useState("");
  const text = `Review ${code} — ${name} from Beiqiang Footwear. Product facts and open quotation items: ${url}`;

  function record(channel: string) {
    trackEvent("product_share", { styleCode: code, channel, context: "product_detail" });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Product link copied. You can paste it into your buying-team conversation.");
      record("copy_link");
    } catch {
      setStatus("Copy was blocked by this browser. Select the page address from the address bar instead.");
    }
  }

  async function nativeShare() {
    if (!navigator.share) { setStatus("This browser does not provide a device share menu. Use WhatsApp, email or copy the link."); return; }
    try {
      await navigator.share({ title: `${code} ${name}`, text: `Review this Beiqiang footwear sourcing candidate: ${code} — ${name}`, url });
      setStatus("Product shared.");
      record("device_share");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setStatus("This device could not open its share menu. Use WhatsApp, email or copy the link.");
    }
  }

  return (
    <aside className="product-share-actions" aria-label={`Share ${code} with a buying team`}>
      <div><strong>Share with your buying team</strong><span>Send the same product evidence to a colleague, manager or customer.</span></div>
      <div className="product-share-buttons">
        <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" onClick={() => record("whatsapp")}>WhatsApp</a>
        <a href={`mailto:?subject=${encodeURIComponent(`${code} ${name} — sourcing review`)}&body=${encodeURIComponent(text)}`} onClick={() => record("email")}>Email</a>
        <button type="button" onClick={nativeShare}>Share</button>
        <button type="button" onClick={copyLink}>Copy link</button>
      </div>
      <p aria-live="polite">{status}</p>
    </aside>
  );
}
