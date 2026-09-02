import Link from "next/link";

type Props = { locale?: "en" | "zh" };

const content = {
  en: {
    eyebrow: "COMMERCIAL STARTING POINTS",
    title: "Check the project range before requesting a quotation.",
    intro: "These current planning references help sourcing buyers decide whether to start a sample or bulk-order discussion.",
    items: [
      ["Online sourcing start", "2 pairs", "Current store baseline for an initial sample or mixed-style discussion. Selected style and availability still require confirmation."],
      ["Bulk FOB target band", "USD 8–12 / pair", "Planning reference for suitable bulk programs. Freight, duty, tax and local delivery are excluded unless separately quoted in writing."],
      ["100-pair timing reference", "31 days", "Current planning baseline after the required confirmations. It is not a guaranteed production or delivery date."],
      ["Single-pair packing reference", "34 × 23 × 13 cm · 0.5 kg", "One-pair reference only. The selected style, size, packing method and measured shipment data take priority."],
    ],
    boundary: "Screening references only—not an offer, quotation, stock promise or order confirmation. Final terms require the selected SKU, material, quantity, size/color ratio, packing, destination, trade term and Beiqiang’s written confirmation.",
    cta: "Build a project-specific quote brief →",
    href: "/request-quote/",
  },
  zh: {
    eyebrow: "商业合作起点",
    title: "询价前，先判断项目范围是否匹配。",
    intro: "以下为当前规划参考，帮助采购买家判断是否值得进入样品或大货沟通。",
    items: [
      ["线上采购起点", "2双", "当前店铺用于初次样品或混款沟通的起点；具体款式及可用情况仍需确认。"],
      ["大货FOB目标带", "8–12美元 / 双", "适合项目的大货规划参考；除非另有书面报价，不包含主运费、关税、税费和当地派送。"],
      ["100双时间参考", "31天", "完成必要确认后的当前规划基线，不构成生产日期或交付日期保证。"],
      ["单双包装参考", "34 × 23 × 13厘米 · 0.5千克", "仅为单双参考；最终以所选款式、尺码、包装方式和实际测量的发运数据为准。"],
    ],
    boundary: "以上仅用于项目初筛，不构成要约、正式报价、库存承诺或订单确认。最终条款须根据所选SKU、材料、数量、尺码/颜色配比、包装、目的地、贸易条款及贝强书面确认确定。",
    cta: "建立具体项目询价需求 →",
    href: "/zh/request-quote/",
  },
} as const;

export default function CommercialStartingPoints({ locale = "en" }: Props) {
  const copy = content[locale];
  return (
    <section className="commercial-starting-points" aria-labelledby={`commercial-starting-points-${locale}`}>
      <div className="commercial-starting-points-heading">
        <div><p className="eyebrow">{copy.eyebrow}</p><h2 id={`commercial-starting-points-${locale}`}>{copy.title}</h2></div>
        <p>{copy.intro}</p>
      </div>
      <div className="commercial-starting-points-grid">
        {copy.items.map(([label, value, note]) => <article key={label}><small>{label}</small><strong>{value}</strong><p>{note}</p></article>)}
      </div>
      <div className="commercial-starting-points-boundary"><p>{copy.boundary}</p><Link className="text-link" href={copy.href}>{copy.cta}</Link></div>
    </section>
  );
}
