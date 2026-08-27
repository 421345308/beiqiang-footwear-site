"use client";

import { useState } from "react";
import { buildComparisonUrl } from "../lib/comparison-link";
import { trackEvent } from "../lib/tracking";

export default function ComparisonShareActions({ codes, locale = "en" }: { codes: string[]; locale?: "en" | "zh" }) {
  const [status, setStatus] = useState("");
  const zh = locale === "zh";
  const url = buildComparisonUrl(codes, locale);
  const title = zh ? `贝强鞋业产品比较：${codes.join(" / ")}` : `Beiqiang footwear comparison: ${codes.join(" / ")}`;
  const message = zh ? `查看${codes.join("、")}的采购比较：${url}` : `Review the sourcing comparison for ${codes.join(", ")}: ${url}`;
  const eventDetails = { styleCodes: codes.join(","), styleCount: codes.length, context: zh ? "catalog_zh" : "catalog_en" };
  async function copy() { try { await navigator.clipboard.writeText(url); trackEvent("comparison_share", { ...eventDetails, channel: "copy" }); setStatus(zh ? "比较链接已复制。" : "Comparison link copied."); } catch { setStatus(zh ? "无法自动复制，请使用邮件或WhatsApp分享。" : "Automatic copy is unavailable. Use email or WhatsApp instead."); } }
  return <div className="comparison-share-actions"><button className="button button-small button-secondary" type="button" onClick={copy}>{zh ? "复制比较链接" : "Copy comparison link"}</button><a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" onClick={() => trackEvent("comparison_share", { ...eventDetails, channel: "whatsapp" })}>WhatsApp</a><a href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`} onClick={() => trackEvent("comparison_share", { ...eventDetails, channel: "email" })}>{zh ? "邮件" : "Email"}</a><small aria-live="polite">{status || (zh ? "链接只包含已选款号，不含采购私密资料。" : "The link contains selected style codes only, not private sourcing details.")}</small></div>;
}
