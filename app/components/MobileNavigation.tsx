"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { trackEvent } from "../lib/tracking";
import { productCount } from "../data/catalog-meta";

const groups = [
  {
    label: "Products",
    links: [
      [`All ${productCount} products`, "/products/"],
      [`${productCount}-style line sheet`, "/line-sheet/"],
      ["Wide toe box collection", "/collections/wide-toe-box/"],
      ["Knit slip-on collection", "/collections/knit-slip-on/"],
      ["Breathable lace-up collection", "/collections/breathable-lace-up/"],
    ],
  },
  {
    label: "Sourcing paths",
    links: [
      ["Wholesale walking shoes", "/solutions/wholesale-walking-shoes/"],
      ["Private-label walking shoes", "/solutions/private-label-walking-shoes/"],
      ["OEM knit-shoe development", "/solutions/oem-knit-shoes/"],
      ["OEM / ODM overview", "/oem-odm/"],
    ],
  },
  {
    label: "Verify and proceed",
    links: [
      ["Factory", "/factory/"],
      ["Quality & packing", "/quality-packing/"],
      ["Sourcing resources", "/resources/"],
      ["B2B buyer guide", "/buyer-guide/"],
      ["Sample & order process", "/sample-order-process/"],
      ["Check request status", "/inquiry-status/"],
    ],
  },
] as const;

export default function MobileNavigation({ chineseHref = "/zh/" }: { chineseHref?: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); return; }
      if (event.key !== "Tab") return;
      const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') || [])];
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); trigger?.focus(); };
  }, [open]);

  function openMenu() { setOpen(true); trackEvent("mobile_nav_open", { context: "site_header" }); }
  function follow(label: string) { setOpen(false); trackEvent("mobile_nav_link", { context: "site_header", linkType: label }); }

  return <div className="mobile-navigation">
    <button ref={triggerRef} className="mobile-menu-trigger" type="button" aria-expanded={open} aria-controls="mobile-buyer-menu" aria-label={open ? "Close buyer menu" : "Open buyer menu"} onClick={() => open ? setOpen(false) : openMenu()}><span /><span /><span /></button>
    {open && <div className="mobile-menu-layer"><button className="mobile-menu-backdrop" type="button" aria-label="Close buyer menu" onClick={() => setOpen(false)} /><div ref={dialogRef} id="mobile-buyer-menu" className="mobile-menu-drawer" role="dialog" aria-modal="true" aria-labelledby="mobile-menu-title">
      <header><div><small>BEIQIANG B2B</small><h2 id="mobile-menu-title">Buyer menu</h2></div><button type="button" aria-label="Close buyer menu" onClick={() => setOpen(false)}>×</button></header>
      <div className="mobile-menu-scroll">
        <section className="mobile-language-choice"><h3>Language / 语言</h3><nav aria-label="Website language"><span aria-current="page"><b>English</b><small>Current</small></span><Link href={chineseHref} hrefLang="zh-CN" lang="zh-CN" onClick={() => follow("简体中文")}><span>简体中文</span><b aria-hidden="true">→</b></Link></nav></section>
        {groups.map((group) => <section key={group.label}><h3>{group.label}</h3><nav aria-label={`${group.label} mobile navigation`}>{group.links.map(([label, href]) => <Link key={href} href={label === "简体中文" ? chineseHref : href} onClick={() => follow(label)}><span>{label}</span><b aria-hidden="true">→</b></Link>)}</nav></section>)}
        <section className="mobile-menu-contact"><h3>Start a conversation</h3><Link className="button" href="/request-quote/" onClick={() => follow("request_quote")}>Build a quote request</Link><a href="https://wa.me/8618959805256" target="_blank" rel="noreferrer" onClick={() => follow("whatsapp")}>WhatsApp +86 189 5980 5256</a><a href="mailto:421345308@qq.com" onClick={() => follow("email")}>421345308@qq.com</a><p>Samples, specifications and commercial terms are confirmed before bulk orders.</p></section>
      </div>
    </div></div>}
  </div>;
}
