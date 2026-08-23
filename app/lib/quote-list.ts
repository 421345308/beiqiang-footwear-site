import type { Product } from "../data/products";

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
    return Array.isArray(parsed) ? parsed.filter((item) => item?.code && item?.slug).slice(0, 12).map((item) => ({ ...item, image: `/catalog-thumbs/${item.slug}.webp` })) : [];
  } catch {
    return [];
  }
}

export function saveQuoteList(lines: QuoteLine[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lines.slice(0, 12)));
  notify();
}

export function addProductToQuote(product: Product) {
  const lines = readQuoteList();
  if (lines.some((line) => line.code === product.code)) return false;
  if (lines.length >= 12) return false;
  saveQuoteList([...lines, {
    code: product.code,
    slug: product.slug,
    sourceModel: product.sourceModel,
    name: product.name,
    image: `/catalog-thumbs/${product.slug}.webp`,
    quantity: "",
    colors: "",
    sizes: "",
    notes: "",
  }]);
  return true;
}

export function quoteListCount() {
  return readQuoteList().length;
}
