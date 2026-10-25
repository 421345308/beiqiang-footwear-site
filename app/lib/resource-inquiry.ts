import type { BuyerResource } from "../data/resources";

export function findInquiryResource(slug: string, resources: BuyerResource[]) {
  return resources.find((resource) => resource.slug === slug) ?? null;
}

export function resourceFromProgram(program: string, resources: BuyerResource[]) {
  return program.startsWith("resource-") ? findInquiryResource(program.slice(9), resources) : null;
}

// Only an explicit product CTA selects a style. The general CTA asks for a
// sourcing review; it never turns suggested styles into buyer selections.
export function resourceInquiryHref(resource: BuyerResource, locale: "en" | "zh" = "en", styleCode?: string) {
  const prefix = locale === "zh" ? "/zh" : "";
  const selected = styleCode && /^BQ(?:\d{3,4}|-(?:LQ(?:059|060|2597)|C2627|CA67|M858))$/.test(styleCode) && resource.relatedProductCodes.includes(styleCode);
  const params = new URLSearchParams({ resource: resource.slug });
  if (selected) params.set("shortlist", styleCode);
  return `${prefix}/${selected ? "request-quote" : "sourcing-review"}/?${params}`;
}
