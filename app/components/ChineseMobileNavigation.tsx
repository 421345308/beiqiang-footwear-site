"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { trackEvent } from "../lib/tracking";
import { productCount } from "../data/catalog-meta";

const links = [
  ["中文首页", "/zh/"],
  [`全部${productCount}款产品`, "/zh/products/"],
  ["B2B采购选款助手", "/zh/product-finder/"],
  ["产品目录 Line Sheet", "/zh/line-sheet/"],
  ["宽鞋头产品系列", "/zh/collections/wide-toe-box/"],
  ["针织套穿产品系列", "/zh/collections/knit-slip-on/"],
  ["透气系带产品系列", "/zh/collections/breathable-lace-up/"],
  ["高帮／袜套产品系列", "/zh/collections/high-top-shoes/"],
  ["儿童鞋产品系列", "/zh/collections/kids-shoes/"],
  ["扩展尺码产品系列", "/zh/collections/extended-size-shoes/"],
  ["加绒产品方向", "/zh/collections/fleece-lined-shoes/"],
  ["采购知识与清单", "/zh/resources/"],
  ["步行鞋批发方案", "/zh/solutions/wholesale-walking-shoes/"],
  ["私标步行鞋方案", "/zh/solutions/private-label-walking-shoes/"],
  ["Logo概念工作台", "/zh/private-label-concept/"],
  ["OEM针织鞋开发", "/zh/solutions/oem-knit-shoes/"],
  ["工厂与实拍证据", "/zh/factory/"],
  ["检查与包装", "/zh/quality-packing/"],
  ["OEM / ODM", "/zh/oem-odm/"],
  ["样品与订单流程", "/zh/sample-order-process/"],
  ["B2B采购指南", "/zh/buyer-guide/"],
  ["建立询价单", "/zh/request-quote/"],
  ["买家工作台", "/zh/buyer-workspace/"],
  ["查询项目进度", "/zh/inquiry-status/"],
  ["隐私说明", "/zh/privacy/"],
] as const;

export default function ChineseMobileNavigation({ englishHref = "/" }: { englishHref?: string }) {
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
  return <div className="mobile-navigation"><button ref={triggerRef} className="mobile-menu-trigger" type="button" aria-expanded={open} aria-controls="mobile-buyer-menu-zh" aria-label={open ? "关闭采购菜单" : "打开采购菜单"} onClick={() => { setOpen((value) => !value); if (!open) trackEvent("mobile_nav_open", { context: "site_header_zh" }); }}><span /><span /><span /></button>{open && <div className="mobile-menu-layer"><button className="mobile-menu-backdrop" type="button" aria-label="关闭采购菜单" onClick={() => setOpen(false)} /><div ref={dialogRef} id="mobile-buyer-menu-zh" className="mobile-menu-drawer" role="dialog" aria-modal="true" aria-labelledby="mobile-menu-title-zh"><header><div><small>贝强鞋业 B2B</small><h2 id="mobile-menu-title-zh">采购菜单</h2></div><button type="button" aria-label="关闭采购菜单" onClick={() => setOpen(false)}>×</button></header><div className="mobile-menu-scroll"><section className="mobile-language-choice"><h3>语言 / Language</h3><nav aria-label="网站语言"><span aria-current="page"><b>简体中文</b><small>当前</small></span><Link href={englishHref} hrefLang="en" lang="en" onClick={() => follow("英文网站")}><span>English</span><b aria-hidden="true">→</b></Link></nav></section><section><h3>采购路径</h3><nav aria-label="中文采购导航">{links.map(([label, href]) => <Link key={href} href={href} onClick={() => follow(label)}><span>{label}</span><b aria-hidden="true">→</b></Link>)}</nav></section><section className="mobile-menu-contact"><h3>联系贝强</h3><a href="https://wa.me/8618959805256" target="_blank" rel="noreferrer" onClick={() => follow("whatsapp")}>WhatsApp +86 189 5980 5256</a><a href="mailto:421345308@qq.com" onClick={() => follow("email")}>421345308@qq.com</a><p>大货订单前逐项确认样品、规格与商业条款。</p></section></div></div></div>}</div>;
}
