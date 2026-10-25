import media from "../data/product-colour-media.json" with { type: "json" };
import type { Product } from "../data/products";
import { productMediaUrl } from "./product-media-url.ts";

type ColourMedia = { images: Record<string, number>; overview?: number };
export const colourId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
export function productColours(product: Product) {
  const entry = (media as Record<string, ColourMedia>)[product.code];
  return product.colors.map(name => ({ id: colourId(name), name, imageIndex: entry?.images[name] ?? null }));
}
export function colourOverview(product: Product) {
  return (media as Record<string, ColourMedia>)[product.code]?.overview ?? null;
}
export function colourImage(product: Product, id: string) {
  if (!id) return 0;
  const colour = productColours(product).find(c => c.id === id);
  return colour?.imageIndex ?? colourOverview(product) ?? 0;
}
export function galleryImage(source: string, small = false) {
  return productMediaUrl(source.replace("/catalog/", small ? "/catalog-small/" : "/catalog-web/").replace(/\.jpg$/i, ".webp"));
}
export function selectedColourFromStorage(product: Product): string {
  if (typeof window === "undefined") return "";
  try {
    const id = sessionStorage.getItem(`bq-colour-${product.code}`) || "";
    return productColours(product).some(c => c.id === id) ? id : "";
  } catch { return ""; }
}
export function selectedColourName(product: Product) {
  return productColours(product).find(c => c.id === selectedColourFromStorage(product))?.name || "";
}
export function withColour(url: string, id: string) {
  if (!id) return url;
  const [base, hash] = url.split("#");
  return `${base}${base.includes("?") ? "&" : "?"}colour=${encodeURIComponent(id)}${hash ? `#${hash}` : ""}`;
}
