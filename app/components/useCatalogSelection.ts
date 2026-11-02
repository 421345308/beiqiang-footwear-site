"use client";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "../data/products";
import { defaultSelection, filterCatalog, parseSelection, selectionParams, type CatalogSelection } from "../lib/catalog-selection";

export function useCatalogSelection(products: Product[], localizedText?: (product: Product) => string) {
  const [selection, setSelection] = useState(defaultSelection);
  // Static HTML is visible before its event handlers are attached. Keep the
  // controls disabled until the URL selection has been restored so an early
  // keystroke cannot be silently overwritten during hydration.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const restore = () => setSelection(parseSelection(new URLSearchParams(window.location.search)));
    const frame = window.requestAnimationFrame(() => { restore(); setReady(true); });
    window.addEventListener("popstate", restore);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("popstate", restore); };
  }, []);
  function update(patch: Partial<CatalogSelection>) {
    const next = { ...selection, limit: 12, ...patch };
    setSelection(next);
    const url = new URL(window.location.href);
    url.search = selectionParams(next, url.searchParams).toString();
    window.history.replaceState(window.history.state, "", url);
  }
  const visible = useMemo(() => filterCatalog(products, selection, localizedText), [products, selection, localizedText]);
  return { selection, update, reset: () => update(defaultSelection), visible, shown: visible.slice(0, selection.limit), ready };
}
