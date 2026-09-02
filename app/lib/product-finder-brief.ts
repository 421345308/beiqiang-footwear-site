import type { BuyerChannel, ClosurePreference, ProductPriority } from "./product-finder";

export type ProductFinderBrief = {
  mode: "matched_shortlist" | "human_review";
  buyerChannel: BuyerChannel;
  priority: ProductPriority;
  closure: ClosurePreference;
  styleCodes: string[];
};

const STORAGE_KEY = "beiqiang_product_finder_brief_v1";
const BUYER_CHANNELS = new Set<BuyerChannel>(["importer_wholesaler", "online_seller", "brand_private_label", "sourcing_agent"]);
const PRIORITIES = new Set<ProductPriority>(["open", "wide_toe", "easy_on", "breathable_lace_up", "mens", "kids", "cold_weather"]);
const CLOSURES = new Set<ClosurePreference>(["any", "Slip-On", "Lace-Up"]);

export function sanitizeProductFinderBrief(value: unknown): ProductFinderBrief | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<ProductFinderBrief>;
  if (!BUYER_CHANNELS.has(raw.buyerChannel as BuyerChannel) || !PRIORITIES.has(raw.priority as ProductPriority) || !CLOSURES.has(raw.closure as ClosurePreference)) return null;
  const styleCodes = Array.isArray(raw.styleCodes)
    ? [...new Set(raw.styleCodes.map((code) => String(code).trim().toUpperCase()).filter((code) => /^BQ\d{3}$/.test(code)))].slice(0, 4)
    : [];
  const mode = raw.mode === "human_review" ? "human_review" : "matched_shortlist";
  if (mode === "matched_shortlist" && !styleCodes.length) return null;
  return { mode, buyerChannel: raw.buyerChannel as BuyerChannel, priority: raw.priority as ProductPriority, closure: raw.closure as ClosurePreference, styleCodes };
}

export function saveProductFinderBrief(brief: ProductFinderBrief) {
  if (typeof window === "undefined") return;
  const safe = sanitizeProductFinderBrief(brief);
  if (safe) localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
}

export function readProductFinderBrief(): ProductFinderBrief | null {
  if (typeof window === "undefined") return null;
  try { return sanitizeProductFinderBrief(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")); }
  catch { return null; }
}

export function clearProductFinderBrief() {
  if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
}

export function buyerTypeFromFinder(channel: BuyerChannel) {
  return ({ importer_wholesaler: "Importer / wholesaler", online_seller: "Amazon / TikTok seller", brand_private_label: "Brand / private label", sourcing_agent: "Sourcing agent" } as const)[channel];
}

export function salesChannelFromFinder(channel: BuyerChannel) {
  return ({ importer_wholesaler: "Wholesale / distribution", online_seller: "Amazon / TikTok / online marketplace", brand_private_label: "Brand / private label", sourcing_agent: "Sourcing agent / buyer to confirm" } as const)[channel];
}

export function finderBriefLabels(brief: ProductFinderBrief, locale: "en" | "zh" = "en") {
  const zh = locale === "zh";
  const buyer = {
    importer_wholesaler: zh ? "进口商／批发商" : "Importer / wholesaler",
    online_seller: zh ? "Amazon／TikTok／在线卖家" : "Amazon / TikTok / online seller",
    brand_private_label: zh ? "品牌／私标买家" : "Brand / private-label buyer",
    sourcing_agent: zh ? "采购代理／待确认" : "Sourcing agent / to confirm",
  }[brief.buyerChannel];
  const priority = {
    open: zh ? "开放选择" : "Open documented range",
    wide_toe: zh ? "有证据的宽鞋头方向" : "Verified wide-toe direction",
    easy_on: zh ? "容易穿脱的套穿鞋" : "Easy-on slip-on shoes",
    breathable_lace_up: zh ? "透气／镂空纺织系带鞋" : "Breathable / open-textile lace-up",
    mens: zh ? "男鞋系列方向" : "Men's range",
    kids: zh ? "童鞋系列方向" : "Kids range",
    cold_weather: zh ? "冬季／加绒选项方向" : "Winter / fleece-option direction",
  }[brief.priority];
  const closure = brief.closure === "any" ? (zh ? "不限" : "No preference") : brief.closure === "Slip-On" ? (zh ? "套穿" : "Slip-On") : (zh ? "系带" : "Lace-Up");
  return { buyer, priority, closure };
}
