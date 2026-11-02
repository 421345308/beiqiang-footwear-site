import Link from "next/link";

type Props = { locale?: "en" | "zh" };

const content = {
  en: {
    eyebrow: "COMMERCIAL STARTING POINTS",
    title: "Plan your sample and order.",
    intro: "Start with an existing style, or discuss changes to its branding and packaging. The references below help frame your enquiry.",
    items: [
      ["Existing styles", "Small mixed orders", "Existing styles can be discussed in smaller quantities with mixed colours and sizes. Our online store has a 2-pair starting point; availability depends on the selected styles."],
      ["Typical wholesale range", "USD 8–15 / pair", "Most wholesale styles fall in this reference range. The quotation depends on the style, quantity, changes and agreed trade terms."],
      ["Custom branding", "Built around your brief", "Discuss logos, insoles, labels, upper colours and boxes for your selected style. Minimums, sample costs and timing depend on the changes."],
      ["Sample and delivery", "Agreed for your order", "Confirm the sample version and its cost first; production timing, packing and shipping are agreed for the selected product and quantity."],
    ],
    boundary: "Share the styles, colour and size mix, expected quantity and destination for a written quotation. Price, availability, packaging, timing and trade terms are confirmed for each order.",
    cta: "Build a project-specific quote brief →",
    href: "/request-quote/",
  },
  zh: {
    eyebrow: "商业合作起点",
    title: "从选样到下单，先了解合作条件。",
    intro: "可以从现有款式开始，也可以讨论品牌与包装调整。以下信息可作为沟通采购需求的参考。",
    items: [
      ["现款采购", "支持小量混配", "现款可讨论小量混色混码；线上店铺采购起点为2双，具体款式和可供情况需确认。"],
      ["批发参考范围", "8–15美元 / 双", "多数批发款的参考范围。具体报价结合款式、数量、调整内容和约定的贸易条件确定。"],
      ["品牌化调整", "按需求讨论", "可针对所选款式沟通商标、鞋垫、标签、鞋面颜色和鞋盒；起订量、样品费用及时间按调整内容确定。"],
      ["样品与交付", "按订单确认", "先明确样品版本及费用，再结合所选产品和数量确认生产时间、包装与运输安排。"],
    ],
    boundary: "提供款式、色码配比、预计数量和目的地后，我们将结合具体要求书面确认报价、可供情况、包装、时间与贸易条件。",
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
