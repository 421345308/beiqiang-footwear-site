"use client";

import { useState } from "react";
import type { Product } from "../data/products";
import { addProductToQuote, readQuoteList } from "../lib/quote-list";
import { trackEvent } from "../lib/tracking";

export default function AddToQuoteButton({ product, compact = false, locale = "en" }: { product: Product; compact?: boolean; locale?: "en" | "zh" }) {
  const [added, setAdded] = useState(false);

  function add() {
    const inserted = addProductToQuote(product);
    setAdded(inserted || readQuoteList().some((line) => line.code === product.code));
    trackEvent("quote_list_add", { styleCode: product.code, inserted });
  }

  const label = locale === "zh" ? (added ? "已加入询价单" : compact ? "+ 加入询价" : "加入询价单") : (added ? "Added to quote list" : compact ? "+ Add to quote" : "Add to quote list");
  return <button type="button" className={compact ? "quote-add quote-add-compact" : "button quote-add"} onClick={add}>{label}</button>;
}
