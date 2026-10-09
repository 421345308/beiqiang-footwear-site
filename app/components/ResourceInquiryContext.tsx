import Link from "next/link";
import type { BuyerResource } from "../data/resources";
import { resourceInquiryHref } from "../lib/resource-inquiry";

export default function ResourceInquiryContext({ resource, locale = "en", offerReview = false }: { resource: BuyerResource | null; locale?: "en" | "zh"; offerReview?: boolean }) {
  if (!resource) return null;
  const zh = locale === "zh";
  return <section className="finder-brief-handoff" aria-label={zh ? "本次咨询对应的采购指南" : "Guide for this sourcing request"}>
    <p className="eyebrow">{zh ? "本次咨询的起点" : "YOUR SOURCING STARTING POINT"}</p>
    <h3>{resource.title}</h3>
    <details><summary>{zh ? "查看这份需求需要准备什么" : "What to prepare for this discussion"}</summary><ul>{resource.checklist.map((item) => <li key={item}>{item}</li>)}</ul></details>
    <p>{zh ? "还没确定的内容可以写“待讨论”。下面的表单由您填写，指南不会替您确认数量、规格或供货条件。" : "Mark undecided items as “To discuss”. Fill in your own details below; the guide does not confirm quantities, specifications or supply terms."}</p>
    <Link href={`${zh ? "/zh" : ""}/resources/${resource.slug}/`}>{zh ? "回看采购指南 →" : "Read the guide again →"}</Link>
    {offerReview ? <p><Link href={resourceInquiryHref(resource, locale)}>{zh ? "还没选定款式？直接讨论采购需求 →" : "No style selected? Discuss your sourcing needs →"}</Link></p> : null}
  </section>;
}
