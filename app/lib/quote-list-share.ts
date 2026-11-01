import type { Product } from "../data/products";
import type { QuoteLine } from "./quote-list";
import { localizedPath, type PublicLocale } from "./public-locales.ts";
import { colourId, colourImage, galleryImage } from "./product-colours.ts";

const CODE_PATTERN = /^BQ(?:\d{3,4}|-(?:LQ(?:059|060|2597)|C2627|CA67|M858))$/;
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

export type SharedQuoteSelection = Pick<QuoteLine, "code" | "colors" | "sizes" | "quantity">;

// Fragments stay in the browser rather than being sent to the site with the request.
// Share only the four fields the buyer sees in the sharing notice, never free notes or contact details.
export function buildQuoteListShareUrl(items: (string | QuoteLine)[], locale: PublicLocale = "en") {
  const safe = [...new Set(items.map((item) => (typeof item === "string" ? item : item.code).trim().toUpperCase()).filter((code) => CODE_PATTERN.test(code)))].slice(0, MAX_SHARED_STYLES);
  const url = new URL(localizedPath("/request-quote", locale), "https://www.beiqiang.online");
  if (safe.length) url.searchParams.set("shortlist", safe.join(","));
  const details = safe.map(code => {
    const line = items.find(item => typeof item !== "string" && item.code.toUpperCase() === code);
    const field = (value: unknown) => {
      if (typeof value !== "string") return "";
      if (value.length > 200) throw new RangeError("selection_field_too_long");
      return value;
    };
    return typeof line === "object" ? { c: code, o: field(line.colors), s: field(line.sizes), q: field(line.quantity) } : null;
  }).filter(item => item && (item.o || item.s || item.q));
  if (details.length) url.hash = new URLSearchParams({ selection: JSON.stringify({ v: 1, items: details }) }).toString();
  if (url.hash.length > 16000) throw new RangeError("selection_link_too_long");
  return url.toString();
}

export function parseSharedQuoteSelection(hash: string, allowedCodes: string[]): SharedQuoteSelection[] {
  if (hash.length > 16000) return [];
  try {
    const value = new URLSearchParams(hash.replace(/^#/, "")).get("selection");
    if (!value) return [];
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || !("v" in parsed) || parsed.v !== 1 || !("items" in parsed) || !Array.isArray(parsed.items)) return [];
    const allowed = new Set(allowedCodes);
    const seen = new Set<string>();
    const result: SharedQuoteSelection[] = [];
    for (const item of parsed.items.slice(0, MAX_SHARED_STYLES)) {
      if (!item || typeof item !== "object" || typeof item.c !== "string") continue;
      const code = item.c.toUpperCase();
      if (!allowed.has(code) || seen.has(code)) continue;
      seen.add(code);
      const field = (v: unknown) => typeof v === "string" && v.length <= 200 ? v : "";
      result.push({ code, colors: field(item.o), sizes: field(item.s), quantity: field(item.q) });
    }
    return result;
  } catch { return []; }
}

export function mergeSharedQuoteList(current: QuoteLine[], sharedCodes: string[], catalog: Product[], selections: SharedQuoteSelection[] = []) {
  const existingCodes = new Set(current.map((line) => line.code.toUpperCase()));
  const byCode = new Map(catalog.map((product) => [product.code.toUpperCase(), product]));
  let updated = 0;
  const preserved = current.map(line => {
    const shared = selections.find(item => item.code === line.code.toUpperCase() && sharedCodes.includes(item.code));
    if (!shared) return line;
    const product = byCode.get(line.code.toUpperCase());
    const colour = !line.colors && shared.colors.split(",").map(c => c.trim()).reverse().find(c => product?.colors?.includes(c));
    const image = colour && product?.images?.length ? galleryImage(product.images[colourImage(product, colourId(colour))]) : line.image;
    const next = { ...line, image, colors: line.colors || shared.colors, sizes: line.sizes || shared.sizes, quantity: line.quantity || shared.quantity };
    if (next.colors !== line.colors || next.sizes !== line.sizes || next.quantity !== line.quantity) updated++;
    return next;
  });
  const added: QuoteLine[] = [];

  for (const code of sharedCodes) {
    if (current.length + added.length >= MAX_SHARED_STYLES) break;
    if (existingCodes.has(code)) continue;
    const product = byCode.get(code);
    if (!product) continue;
    existingCodes.add(code);
    const shared = selections.find(item => item.code === code);
    const colour = shared?.colors.split(",").map(c => c.trim()).reverse().find(c => product.colors?.includes(c));
    const image = colour && product.images?.length ? galleryImage(product.images[colourImage(product, colourId(colour))]) : `/catalog-thumbs/${product.slug}.webp`;
    added.push({
      code: product.code,
      slug: product.slug,
      sourceModel: product.sourceModel,
      name: product.name,
      image,
      quantity: shared?.quantity || "",
      colors: shared?.colors || "",
      sizes: shared?.sizes || "",
      notes: "",
    });
  }

  return { lines: [...preserved, ...added].slice(0, MAX_SHARED_STYLES), imported: added.length, updated };
}
