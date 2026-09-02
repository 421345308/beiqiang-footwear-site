"use client";

import { useState } from "react";
import type { QuoteLine } from "../lib/quote-list";
import { buildQuoteListShareUrl } from "../lib/quote-list-share";

export default function QuoteListShare({ lines, locale = "en", importMessage = "" }: { lines: QuoteLine[]; locale?: "en" | "zh"; importMessage?: string }) {
  const [status, setStatus] = useState("");
  const zh = locale === "zh";

  async function copyLink() {
    const url = buildQuoteListShareUrl(lines.map((line) => line.code), locale);
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      else {
        const field = document.createElement("textarea");
        field.value = url; field.setAttribute("readonly", ""); field.style.position = "fixed"; field.style.opacity = "0";
        document.body.appendChild(field); field.select(); document.execCommand("copy"); field.remove();
      }
      setStatus(zh ? `已复制${lines.length}款团队复核链接。` : `Team review link copied for ${lines.length} style${lines.length === 1 ? "" : "s"}.`);
    } catch {
      setStatus(zh ? "无法自动复制，请使用浏览器地址栏分享本页。" : "Automatic copy was unavailable. Use your browser address bar to share this page.");
    }
  }

  if (!lines.length && !importMessage) return null;
  return <aside className="quote-list-share" aria-label={zh ? "向采购团队分享候选清单" : "Share shortlist with a buying team"}>
    <div><strong>{zh ? "让采购团队在另一台设备复核款式" : "Let your buying team review these styles on another device"}</strong><span>{zh ? "链接只包含款号；不会包含数量、颜色、尺码、备注、价格、联系人或公司资料。" : "The link contains style codes only—not quantities, colors, sizes, notes, prices, contacts or company details."}</span></div>
    {lines.length ? <button type="button" onClick={copyLink}>{zh ? "复制团队复核链接" : "Copy team review link"}</button> : null}
    <p aria-live="polite">{status || importMessage}</p>
  </aside>;
}
