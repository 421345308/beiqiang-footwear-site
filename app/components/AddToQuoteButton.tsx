"use client";

import { useState } from "react";
import type { Product } from "../data/products";
import { addProductToQuote, readQuoteList } from "../lib/quote-list";
import { trackEvent } from "../lib/tracking";

export default function AddToQuoteButton({ product, compact = false }: { product: Product; compact?: boolean }) {
  const [added, setAdded] = useState(false);

  function add() {
    const inserted = addProductToQuote(product);
    setAdded(inserted || readQuoteList().some((line) => line.code === product.code));
    trackEvent("quote_list_add", { styleCode: product.code, inserted });
  }

  return <button type="button" className={compact ? "quote-add quote-add-compact" : "button quote-add"} onClick={add}>{added ? "Added to quote list" : compact ? "+ Add to quote" : "Add to quote list"}</button>;
}
