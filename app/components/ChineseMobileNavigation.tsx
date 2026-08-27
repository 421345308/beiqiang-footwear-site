"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { trackEvent } from "../lib/tracking";
import { productCount } from "../data/catalog-meta";

const links = [
  ["中文首页", "/zh/"],
  [`全部${productCount}款产品`, "/zh/products/"],
  ["建立询价单", "/zh/request-quote/"],
  ["买家工作台", "/zh/buyer-workspace/"],
  ["查询项目进度", "/zh/inquiry-status/"],
  ["隐私说明", "/zh/privacy/"],
  ["英文网站", "/"],
] as const;

export default function ChineseMobileNavigation() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    function onKeyDown(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); trigger?.focus(); };
  }, [open]);
  function follow(label: string) { setOpen(false); trackEvent("mobile_nav_link", { context: "site_header_zh", linkType: label }); }
  return <div className="mobile-navigation"><button ref={triggerRef} className="mobile-menu-trigger" type="button" aria-expanded={open} aria-controls="mobile-buyer-menu-zh" aria-label={open ? "关闭采购菜单" : "打开采购菜单"} onClick={() => { setOpen((value) => !value); if (!open) trackEvent("mobile_nav_open", { context: "site_header_zh" }); }}><span /><span /><span /></button>{open && <div className="mobile-menu-layer"><button className="mobile-menu-backdrop" type="button" aria-label="关闭采购菜单" onClick={() => setOpen(false)} /><div ref={dialogRef} id="mobile-buyer-menu-zh" className="mobile-menu-drawer" role="dialog" aria-modal="true" aria-labelledby="mobile-menu-title-zh"><header><div><small>贝强鞋业 B2B</small><h2 id="mobile-menu-title-zh">采购菜单</h2></div><button type="button" aria-label="关闭采购菜单" onClick={() => setOpen(false)}>×</button></header><div className="mobile-menu-scroll"><section><h3>采购路径</h3><nav aria-label="中文采购导航">{links.map(([label, href]) => <Link key={href} href={href} onClick={() => follow(label)}><span>{label}</span><b aria-hidden="true">→</b></Link>)}</nav></section><section className="mobile-menu-contact"><h3>联系贝强</h3><a href="https://wa.me/8618959805256" target="_blank" rel="noreferrer" onClick={() => follow("whatsapp")}>WhatsApp +86 189 5980 5256</a><a href="mailto:421345308@qq.com" onClick={() => follow("email")}>421345308@qq.com</a><p>大货订单前逐项确认样品、规格与商业条款。</p></section></div></div></div>}</div>;
}
