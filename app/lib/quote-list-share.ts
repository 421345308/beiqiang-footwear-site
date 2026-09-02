import type { Product } from "../data/products";
import type { QuoteLine } from "./quote-list";

const CODE_PATTERN = /^BQ\d{3}$/;
const MAX_SHARED_STYLES = 12;

export function parseSharedQuoteCodes(value: string, allowedCodes: string[]) {
  const allowed = new Set(allowedCodes.map((code) => code.toUpperCase()));
  const result: string[] = [];
  for (const raw of value.split(",")) {
    const code = raw.trim().toUpperCase();
    if (!CODE_PATTERN.test(code) || !allowed.has(code) || result.includes(code)) continue;
    result.push(code);
    if (result.length === MAX_SHARED_STYLES) break;
  }
  return result;
}

export function buildQuoteListShareUrl(codes: string[], locale: "en" | "zh" = "en") {
  const safe = [...new Set(codes.map((code) => code.trim().toUpperCase()).filter((code) => CODE_PATTERN.test(code)))].slice(0, MAX_SHARED_STYLES);
  const url = new URL(locale === "zh" ? "/zh/request-quote/" : "/request-quote/", "https://www.beiqiang.online");
  if (safe.length) url.searchParams.set("shortlist", safe.join(","));
  return url.toString();
}

export function mergeSharedQuoteList(current: QuoteLine[], sharedCodes: string[], catalog: Product[]) {
  const existingCodes = new Set(current.map((line) => line.code.toUpperCase()));
  const byCode = new Map(catalog.map((product) => [product.code.toUpperCase(), product]));
  const added: QuoteLine[] = [];

  for (const code of sharedCodes) {
    if (current.length + added.length >= MAX_SHARED_STYLES) break;
    if (existingCodes.has(code)) continue;
    const product = byCode.get(code);
    if (!product) continue;
    existingCodes.add(code);
    added.push({
      code: product.code,
      slug: product.slug,
      sourceModel: product.sourceModel,
      name: product.name,
      image: `/catalog-thumbs/${product.slug}.webp`,
      quantity: "",
      colors: "",
      sizes: "",
      notes: "",
    });
  }

  return { lines: [...current, ...added].slice(0, MAX_SHARED_STYLES), imported: added.length };
}
