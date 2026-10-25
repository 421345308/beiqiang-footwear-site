import { productMediaUrl } from "./product-media-url.ts";
import { products, type Product } from "../data/products.ts";
import { selectedColourName, colourId, colourImage, galleryImage } from "./product-colours.ts";

export type QuoteLine = {
  code: string;
  slug: string;
  sourceModel: string;
  name: string;
  image: string;
  quantity: string;
  colors: string;
  sizes: string;
  notes: string;
};

const STORAGE_KEY = "beiqiang_quote_list_v1";
export const QUOTE_LIST_EVENT = "beiqiang-quote-list-change";

function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(QUOTE_LIST_EVENT));
}

export function readQuoteList(): QuoteLine[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => item?.code && item?.slug).slice(0, 12).map((item) => {
      const product = products.find(p => p.code === item.code && p.slug === item.slug);
      const colour = String(item.colors || "").split(",").map(c => c.trim()).reverse().find(c => product?.colors.includes(c));
      // Re-resolve the saved request after catalogue photography changes; a legacy
      // image position can now represent a different colour or viewing angle.
      const image = product ? galleryImage(product.images[colourImage(product, colour ? colourId(colour) : "")]) : productMediaUrl(`/catalog-thumbs/${item.slug}.webp`);
      return { ...item, image };
    }) : [];
  } catch {
    return [];
  }
}

export function saveQuoteList(lines: QuoteLine[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lines.slice(0, 12)));
  notify();
}

export function addProductToQuote(product: Product, requestedColour = selectedColourName(product)) {
  const lines = readQuoteList();
  const color = product.colors.includes(requestedColour) ? requestedColour : "";
  const image = color ? galleryImage(product.images[colourImage(product, colourId(color))]) : `/catalog-thumbs/${product.slug}.webp`;
  const existing = lines.find(line => line.code === product.code);
  if (existing) {
    if (color && !existing.colors.split(",").map(c => c.trim()).includes(color)) {
      existing.colors = [existing.colors, color].filter(Boolean).join(", ");
      existing.image = image;
      saveQuoteList(lines);
    }
    return false;
  }
  if (lines.length >= 12) return false;
  saveQuoteList([...lines, {
    code: product.code,
    slug: product.slug,
    sourceModel: product.sourceModel,
    name: product.name,
    image,
    quantity: "",
    colors: color,
    sizes: "",
    notes: "",
  }]);
  return true;
}

export function quoteListCount() {
  return readQuoteList().length;
}
