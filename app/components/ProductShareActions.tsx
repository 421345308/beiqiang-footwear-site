"use client";

import { useState } from "react";
import { trackEvent } from "../lib/tracking";

type Props = { code: string; name: string; url: string; locale?: "en" | "zh" };

export default function ProductShareActions({ code, name, url, locale = "en" }: Props) {
  const [status, setStatus] = useState("");
  const zh = locale === "zh";
  const text = zh ? `请查看贝强鞋业 ${code} — ${name}。产品事实、图片和询价前待确认事项：${url}` : `Review ${code} — ${name} from Beiqiang Footwear. Product facts and open quotation items: ${url}`;

  function record(channel: string) {
    trackEvent("product_share", { styleCode: code, channel, context: "product_detail" });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus(zh ? "产品链接已复制，可粘贴到采购团队沟通中。" : "Product link copied. You can paste it into your buying-team conversation.");
      record("copy_link");
    } catch {
      setStatus(zh ? "浏览器阻止了复制，请从地址栏手动复制页面链接。" : "Copy was blocked by this browser. Select the page address from the address bar instead.");
    }
  }

  async function nativeShare() {
    if (!navigator.share) { setStatus(zh ? "此浏览器不支持系统分享，请使用WhatsApp、邮件或复制链接。" : "This browser does not provide a device share menu. Use WhatsApp, email or copy the link."); return; }
    try {
      await navigator.share({ title: `${code} ${name}`, text: zh ? `查看这款贝强鞋业采购候选：${code} — ${name}` : `Review this Beiqiang footwear sourcing candidate: ${code} — ${name}`, url });
      setStatus(zh ? "产品已分享。" : "Product shared.");
      record("device_share");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setStatus(zh ? "设备无法打开分享菜单，请使用WhatsApp、邮件或复制链接。" : "This device could not open its share menu. Use WhatsApp, email or copy the link.");
    }
  }

  return (
    <aside className="product-share-actions" aria-label={zh ? `向采购团队分享${code}` : `Share ${code} with a buying team`}>
      <div><strong>{zh ? "分享给采购团队" : "Share with your buying team"}</strong><span>{zh ? "把同一份产品证据发送给同事、负责人或客户。" : "Send the same product evidence to a colleague, manager or customer."}</span></div>
      <div className="product-share-buttons">
        <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" onClick={() => record("whatsapp")}>WhatsApp</a>
        <a href={`mailto:?subject=${encodeURIComponent(`${code} ${name} — ${zh ? "采购审核" : "sourcing review"}`)}&body=${encodeURIComponent(text)}`} onClick={() => record("email")}>{zh ? "邮件" : "Email"}</a>
        <button type="button" onClick={nativeShare}>{zh ? "分享" : "Share"}</button>
        <button type="button" onClick={copyLink}>{zh ? "复制链接" : "Copy link"}</button>
      </div>
      <p aria-live="polite">{status}</p>
    </aside>
  );
}
