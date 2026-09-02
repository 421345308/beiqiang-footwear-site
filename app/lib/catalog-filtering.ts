import type { Product } from "../data/products";

export const catalogDirectionValues = [
  "wide-toe-box",
  "knit-slip-on",
  "breathable-lace-up",
  "high_top",
  "kids",
  "large_size",
  "fleece",
] as const;

export type CatalogDirection = (typeof catalogDirectionValues)[number];

export function isCatalogDirection(value: string | null): value is CatalogDirection {
  return Boolean(value && catalogDirectionValues.includes(value as CatalogDirection));
}

export function productMatchesCatalogDirection(
  product: Product,
  direction: string,
) {
  if (direction === "high_top") {
    return /high top|high-top|sock/i.test(`${product.name} ${product.group}`);
  }
  if (direction === "kids") return /kids/i.test(product.group);
  if (direction === "large_size") {
    return /EU (?:37|38)-4[67]|large size/i.test(`${product.size} ${product.group}`);
  }
  if (direction === "fleece") {
    return product.colors.some((color) => /fleece/i.test(color));
  }
  return product.collections.includes(
    direction as Product["collections"][number],
  );
}
