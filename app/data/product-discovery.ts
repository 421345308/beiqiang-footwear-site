import type { CollectionSlug, Product } from "./products";
import { productMatchesCatalogDirection } from "../lib/catalog-filtering.ts";
import type { CatalogDirection } from "../lib/catalog-filtering";

// Display order is editorial variety, never a sales or popularity ranking.
export const discoveryCategories: { slug: CollectionSlug; direction: CatalogDirection; en: string; zh: string; cover: string }[] = [
  { slug: "knit-slip-on", direction: "knit-slip-on", en: "Knit slip-ons", zh: "针织套穿", cover: "bq004" },
  { slug: "breathable-lace-up", direction: "breathable-lace-up", en: "Lace-up shoes", zh: "系带休闲", cover: "bq018" },
  { slug: "wide-toe-box", direction: "wide-toe-box", en: "Wide toe box", zh: "宽鞋头", cover: "bq001" },
  { slug: "kids-shoes", direction: "kids", en: "Kids’ shoes", zh: "童鞋", cover: "bq016" },
  { slug: "high-top-shoes", direction: "high_top", en: "High-top shoes", zh: "高帮鞋", cover: "bq029" },
  { slug: "fleece-lined-shoes", direction: "fleece", en: "Fleece-lined", zh: "加绒款", cover: "bq015" },
  { slug: "extended-size-shoes", direction: "large_size", en: "Extended sizes", zh: "扩展尺码", cover: "bq-lq060" },
];

export function discoveryGroups(products: Product[]) {
  return discoveryCategories.map(category => ({
    ...category,
    products: products.filter(product => productMatchesCatalogDirection(product, category.direction)),
  }));
}

export function diverseProductPreview(products: Product[], limit = 8) {
  const groups = discoveryGroups(products).map(group => ({
    ...group,
    products: [...group.products].sort((a, b) => Number(b.slug === group.cover) - Number(a.slug === group.cover)),
  }));
  const result: Product[] = [];
  // Round-robin across real categories so a long range cannot hide a smaller one.
  for (let row = 0; row < products.length && result.length < limit; row++) {
    for (const group of groups) {
      const candidate = group.products[row];
      if (candidate && !result.some(item => item.code === candidate.code)) result.push(candidate);
      if (result.length === limit) break;
    }
  }
  return result;
}
