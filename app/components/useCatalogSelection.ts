"use client";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "../data/products";
import { defaultSelection, filterCatalog, parseSelection, selectionParams, type CatalogSelection } from "../lib/catalog-selection";

export function useCatalogSelection(products: Product[]) {
  const [selection, setSelection] = useState(defaultSelection);
  useEffect(() => {
    const restore = () => setSelection(parseSelection(new URLSearchParams(window.location.search)));
    restore(); window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  function update(patch: Partial<CatalogSelection>) {
    const next = { ...selection, limit: 12, ...patch };
    setSelection(next);
    const url = new URL(window.location.href);
    url.search = selectionParams(next, url.searchParams).toString();
    window.history.replaceState(window.history.state, "", url);
  }
  const visible = useMemo(() => filterCatalog(products, selection), [products, selection]);
  return { selection, update, reset: () => update(defaultSelection), visible, shown: visible.slice(0, selection.limit) };
}
