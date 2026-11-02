"use client";
import { useState } from "react";
import { trackEvent } from "../lib/tracking";
import type { Product } from "../data/products";
import type { PublicLocale } from "../lib/public-locales";
import { productShareCopy } from "../lib/product-share-copy";
import { useProductColour } from "./ProductColourOptions";
import { withColour } from "../lib/product-colours";
type Props = { product: Product; code: string; name: string; url: string; locale?: PublicLocale };
export default function ProductShareActions({ code, name, url: baseUrl, product, locale = "en" }: Props) {
  const [status, setStatus] = useState("");
  const { id, ready } = useProductColour(product);
  const url = withColour(baseUrl, id);
  const copy = productShareCopy[locale];
  const text = `${copy.review}: ${code} — ${name}. ${url}`;
  function record(channel: string) {
    trackEvent("product_share", { styleCode: code, channel, context: "product_detail" });
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus(copy.copied);
      record("copy_link");
    } catch { setStatus(copy.copyError); }
  }
  async function nativeShare() {
    if (!navigator.share) { setStatus(copy.unavailable); return; }
    try {
      await navigator.share({ title: `${code} ${name}`, text: `${copy.review}: ${code} — ${name}`, url });
      setStatus(copy.shared);
      record("device_share");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setStatus(copy.unavailable);
    }
  }
  return <aside className="product-share-actions" aria-label={`${copy.title} · ${code}`}>
    <div><strong>{copy.title}</strong><span>{copy.intro}</span></div>
    <div className="product-share-buttons">
      <a href={ready ? `https://wa.me/?text=${encodeURIComponent(text)}` : undefined} aria-disabled={!ready} target="_blank" rel="noreferrer" onClick={() => record("whatsapp")}>WhatsApp</a>
      <a href={ready ? `mailto:?subject=${encodeURIComponent(`${code} ${name} — ${copy.subject}`)}&body=${encodeURIComponent(text)}` : undefined} aria-disabled={!ready} onClick={() => record("email")}>{copy.email}</a>
      <button type="button" disabled={!ready} onClick={nativeShare}>{copy.share}</button>
      <button type="button" disabled={!ready} onClick={copyLink}>{copy.copy}</button>
    </div>
    <p aria-live="polite">{status}</p>
  </aside>;
}
