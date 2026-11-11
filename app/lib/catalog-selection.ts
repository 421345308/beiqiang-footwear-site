import type { Product } from "../data/products";
import { productNameZh, colorZh, closureZh } from "../data/products-zh.ts";
import { isCatalogDirection, productMatchesCatalogDirection } from "./catalog-filtering.ts";
import { productColours } from "./product-colours.ts";
import { documentedSizes } from "./documented-sizes.ts";
export { documentedSizes } from "./documented-sizes.ts";

export const colourFamilies = [
  { id: "black", en: "Black", zh: "黑色", pattern: /black/i },
  { id: "white", en: "White", zh: "白色", pattern: /white/i },
  { id: "neutral", en: "Beige & brown", zh: "米色与棕色", pattern: /beige|cream|sand|brown|khaki|camel|apricot|coffee|\btan\b/i },
  { id: "grey", en: "Grey", zh: "灰色", pattern: /gr[ae]y|silver/i },
  { id: "blue", en: "Blue", zh: "蓝色", pattern: /blue|navy/i },
  { id: "green", en: "Green", zh: "绿色", pattern: /green|olive/i },
  { id: "pink", en: "Pink & purple", zh: "粉色与紫色", pattern: /pink|purple|lavender|rose/i },
  { id: "warm", en: "Red, orange & yellow", zh: "红色、橙色与黄色", pattern: /red|orange|yellow|burgundy|wine/i },
] as const;
export type CatalogSelection = { q: string; direction: string; closure: string; colour: string; size: string; sort: string; limit: number };
export const defaultSelection: CatalogSelection = { q: "", direction: "", closure: "", colour: "", size: "", sort: "code_asc", limit: 12 };
export function parseSelection(params: URLSearchParams): CatalogSelection {
  const closure = params.get("closure") || "";
  const size = params.get("size") || "";
  const sort = params.get("sort") || "";
  return { q: (params.get("q") || "").slice(0, 80), direction: isCatalogDirection(params.get("direction")) ? params.get("direction")! : "",
    closure: ["Slip-On", "Lace-Up", "Zip-Up", "Dial", "Hook & Loop", "Toggle"].includes(closure) ? closure : "",
    colour: colourFamilies.some(c => c.id === params.get("colour")) ? params.get("colour")! : "",
    size: /^\d{2}$/.test(size) && +size >= 20 && +size <= 55 ? size : "",
    sort: ["code_asc", "code_desc", "slip_on", "lace_up"].includes(sort) ? sort : "code_asc",
    limit: Math.max(12, Math.min(120, Number(params.get("show")) || 12)) };
}
export function selectionParams(state: CatalogSelection, existing = new URLSearchParams()) {
  const params = new URLSearchParams(existing);
  for (const key of ["q", "direction", "closure", "colour", "size", "sort"] as const) {
    if (state[key] && state[key] !== defaultSelection[key]) params.set(key, state[key]); else params.delete(key);
  }
  if (state.limit > 12) params.set("show", String(state.limit)); else params.delete("show");
  return params;
}
export function matchingColour(product: Product, family: string) {
  const rule = colourFamilies.find(c => c.id === family);
  if (!rule) return "";
  const choices = productColours(product);
  return (choices.find(c => c.id === family || c.id === `all-${family}`) || choices.find(c => rule.pattern.test(c.name)))?.id || "";
}
export function filterCatalog(products: Product[], state: CatalogSelection, localizedText?: (product: Product) => string) {
  const words = state.q.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return products.filter(p => {
    const haystack = [p.code, p.name, productNameZh(p), p.group, p.upper, p.closure, closureZh(p.closure), ...p.colors, ...p.colors.map(colorZh), localizedText?.(p) || ""].join(" ").toLocaleLowerCase();
    return words.every(word => haystack.includes(word)) && (!state.direction || productMatchesCatalogDirection(p, state.direction))
      && (!state.closure || p.closure === state.closure) && (!state.colour || Boolean(matchingColour(p, state.colour)))
      && (!state.size || documentedSizes(p).includes(+state.size));
  }).sort((a,b) => {
    if (state.sort === "code_desc") return b.code.localeCompare(a.code, undefined, {numeric:true});
    if (state.sort === "slip_on" || state.sort === "lace_up") {
      const target = state.sort === "slip_on" ? "Slip-On" : "Lace-Up";
      const difference = Number(b.closure === target) - Number(a.closure === target);
      if (difference) return difference;
    }
    return a.code.localeCompare(b.code, undefined, {numeric:true});
  });
}
