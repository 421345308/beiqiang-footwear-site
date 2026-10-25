/* eslint-disable @next/next/no-img-element */
"use client";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { Product } from "../data/products";
import { colorZh } from "../data/products-zh";
import { colourImage, galleryImage, productColours, selectedColourFromStorage } from "../lib/product-colours";

const eventName = "bq-product-colour";
const memory = new Map<string, string>();
function subscribe(callback: () => void) {
  window.addEventListener(eventName, callback);
  return () => window.removeEventListener(eventName, callback);
}
export function useProductColour(product: Product) {
  const get = useCallback(() => memory.get(product.code) ?? selectedColourFromStorage(product), [product]);
  const id = useSyncExternalStore(subscribe, get, () => "");
  const select = useCallback((next: string) => {
    if (next && !productColours(product).some(c => c.id === next)) return;
    memory.set(product.code, next);
    try { sessionStorage.setItem(`bq-colour-${product.code}`, next); } catch { /* In-memory selection still works. */ }
    window.dispatchEvent(new Event(eventName));
  }, [product]);
  return { id, select, colour: productColours(product).find(c => c.id === id) };
}
export default function ProductColourOptions({ product, locale = "en", detail = false }: { product: Product; locale?: "en" | "zh"; detail?: boolean }) {
  const { id, select, colour } = useProductColour(product);
  const zh = locale === "zh";
  useEffect(() => {
    if (!detail) return;
    const restore = () => {
      const requested = new URLSearchParams(window.location.search).get("colour");
      if (requested !== null) {
        const valid = productColours(product).some(c => c.id === requested);
        memory.set(product.code, valid ? requested : "");
        try { sessionStorage.setItem(`bq-colour-${product.code}`, valid ? requested : ""); } catch { /* optional persistence */ }
        window.dispatchEvent(new Event(eventName));
      }
    };
    restore(); window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [detail, product]);
  function choose(next: string) {
    select(next);
    if (detail) {
      const url = new URL(window.location.href); url.searchParams.set("colour", next);
      window.history.replaceState(window.history.state, "", url);
    }
  }
  return <div className={`colour-options${detail ? " colour-options-detail" : ""}`}>
    <p className="colour-heading"><span>{zh ? "配色" : "Colour"}{colour ? ` · ${zh ? colorZh(colour.name) : colour.name}` : ` · ${product.colors.length} ${zh ? "款可选" : "options"}`}</span>{detail && <small>{zh ? "选择配色，加入询价" : "Select a colour for your enquiry"}</small>}</p>
    <div className="colour-options-list" role="group" aria-label={`${product.code} ${zh ? "配色选择" : "colour selection"}`}>
      {productColours(product).map(c => <button key={c.id} type="button" aria-pressed={id === c.id} title={zh ? colorZh(c.name) : c.name} aria-label={`${zh ? "选择" : "Select"} ${zh ? colorZh(c.name) : c.name}`} onClick={() => choose(c.id)}>
        {c.imageIndex !== null ? <img src={galleryImage(product.images[c.imageIndex], true)} alt="" width={80} height={80} loading="lazy" /> : <span className="colour-text-option">{zh ? colorZh(c.name) : c.name}</span>}
        {detail && c.imageIndex !== null && <span>{zh ? colorZh(c.name) : c.name}</span>}
      </button>)}
    </div>
    {colour && colour.imageIndex === null && <p className="colour-image-note">{zh ? "此色暂无单独实拍，请参阅配色合照或咨询图片。" : "No individual photo for this colour. See the group view or request photos."}</p>}
  </div>;
}

export function ComparisonColour({ product, locale = "en" }: { product: Product; locale?: "en" | "zh" }) {
  const { id } = useProductColour(product);
  return <div className="comparison-colour"><img src={galleryImage(product.images[colourImage(product, id)])} alt={product.code} width={260} height={260} loading="lazy" /><ProductColourOptions product={product} locale={locale} /></div>;
}
