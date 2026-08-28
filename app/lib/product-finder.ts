import type { Product } from "../data/products.ts";

export type BuyerChannel = "importer_wholesaler" | "online_seller" | "brand_private_label" | "sourcing_agent";
export type ProductPriority = "open" | "wide_toe" | "easy_on" | "breathable_lace_up" | "mens" | "kids" | "cold_weather";
export type ClosurePreference = "any" | Product["closure"];

export type FinderAnswers = {
  buyerChannel: BuyerChannel;
  priority: ProductPriority;
  closure: ClosurePreference;
  resultCount: 2 | 3 | 4;
};

export type FinderMatch = { product: Product; score: number; reasons: string[] };

const tierScore: Record<Product["tier"], number> = { A: 6, B: 5, C: 3, D: 2, E: 1, New: 0 };

function text(product: Product) {
  return [product.name, product.group, product.upper, product.buyerFit, ...product.highlights].join(" ").toLowerCase();
}

export function matchesPriority(product: Product, priority: ProductPriority) {
  const haystack = text(product);
  if (priority === "open") return true;
  if (priority === "wide_toe") return product.fitEvidence === "wide_toe_verified";
  if (priority === "easy_on") return product.closure === "Slip-On";
  if (priority === "breathable_lace_up") return product.closure === "Lace-Up" && /breathable|mesh|hollow|open-knit/.test(haystack);
  if (priority === "mens") return /men's|\bmen\b/.test(haystack);
  if (priority === "kids") return /kids|children/.test(haystack);
  return /winter|fleece|cold/.test(haystack);
}

function buyerChannelScore(product: Product, channel: BuyerChannel) {
  const haystack = text(product);
  if (channel === "importer_wholesaler") return /importer|wholesaler/.test(haystack) ? 4 : 0;
  if (channel === "online_seller") return /online|marketplace|amazon|tiktok/.test(haystack) ? 4 : 0;
  if (channel === "brand_private_label") return product.tier === "A" || product.tier === "B" ? 3 : 0;
  return product.size !== "To be confirmed" ? 2 : 0;
}

function reasons(product: Product, answers: FinderAnswers) {
  const result: string[] = [];
  if (answers.priority === "wide_toe") result.push("SKU-level wide-toe evidence");
  else if (answers.priority === "easy_on") result.push("Slip-on construction");
  else if (answers.priority === "breathable_lace_up") result.push("Documented breathable or open-textile lace-up direction");
  else if (answers.priority === "mens") result.push("Documented men's range direction");
  else if (answers.priority === "kids") result.push("Documented kids range direction");
  else if (answers.priority === "cold_weather") result.push("Documented winter or fleece-option direction");
  else result.push(`${product.closure} · ${product.upper}`);
  if (answers.closure !== "any") result.push(`${answers.closure} preference matched`);
  result.push(product.buyerFit);
  return result.slice(0, 3);
}

export function findProducts(products: Product[], answers: FinderAnswers): FinderMatch[] {
  return products
    .filter((product) => matchesPriority(product, answers.priority))
    .filter((product) => answers.closure === "any" || product.closure === answers.closure)
    .map((product) => ({
      product,
      score: tierScore[product.tier] + buyerChannelScore(product, answers.buyerChannel) + (product.size !== "To be confirmed" ? 1 : 0) + (product.fitEvidence === "wide_toe_verified" ? 1 : 0),
      reasons: reasons(product, answers),
    }))
    .sort((a, b) => b.score - a.score || a.product.code.localeCompare(b.product.code))
    .slice(0, answers.resultCount);
}
