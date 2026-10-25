"use client";

import { useState } from "react";
import type { Product } from "../data/products";
import { addProductToQuote, readQuoteList } from "../lib/quote-list";
import { trackEvent } from "../lib/tracking";
import { useProductColour } from "./ProductColourOptions";

export default function AddToQuoteButton({ product, compact = false, locale = "en" }: { product: Product; compact?: boolean; locale?: "en" | "zh" }) {
  const { colour, id } = useProductColour(product);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const added = addedId === id;

  function add() {
    try {
      const inserted = addProductToQuote(product, colour?.name || "");
      if (inserted || readQuoteList().some(line => line.code === product.code)) { setAddedId(id); setError(""); }
      else setError(locale === "zh" ? "询价单已满，请先整理已选产品。" : "Your list is full. Review your selected styles first.");
      trackEvent("quote_list_add", { styleCode: product.code, inserted });
    } catch { setError(locale === "zh" ? "浏览器无法保存，请使用本页咨询表单。" : "Could not save. Please use the enquiry form on this page."); }
  }

  const label = locale === "zh" ? (added ? "已加入询价单" : compact ? "+ 加入询价" : "加入询价单") : (added ? "Added to quote list" : compact ? "+ Add to quote" : "Add to quote list");
  return <><button type="button" className={compact ? "quote-add quote-add-compact" : "button quote-add"} onClick={add}>{label}</button>{error && <small role="status">{error}</small>}</>;
}
