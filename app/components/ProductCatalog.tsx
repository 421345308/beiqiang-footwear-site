"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Product } from "../data/products";
import { addProductToQuote, readQuoteList } from "../lib/quote-list";
import { trackEvent } from "../lib/tracking";
import ProductCard from "./ProductCard";
import ComparisonShareActions from "./ComparisonShareActions";
import { parseComparisonCodes } from "../lib/comparison-link";

export default function ProductCatalog({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [closure, setClosure] = useState("All");
  const [compareCodes, setCompareCodes] = useState<string[]>([]);
  const [compareMessage, setCompareMessage] = useState("Select 2 to 4 styles for a buyer-safe side-by-side comparison.");
  const trackedSharedComparison = useRef("");

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesClosure = closure === "All" || product.closure === closure;
      const haystack = [product.code, product.sourceModel, product.name, product.group, ...product.colors].join(" ").toLowerCase();
      return matchesClosure && (!normalized || haystack.includes(normalized));
    });
  }, [closure, products, query]);
  const compared = compareCodes.map((code) => products.find((product) => product.code === code)).filter((product): product is Product => Boolean(product));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const codes = parseComparisonCodes(new URLSearchParams(window.location.search).get("compare") || "", products.map((product) => product.code));
      if (codes.length >= 2) {
        const styleCodes = codes.join(",");
        setCompareCodes(codes); setCompareMessage(`Shared comparison loaded · ${codes.length}/4 styles.`);
        if (trackedSharedComparison.current !== styleCodes) { trackedSharedComparison.current = styleCodes; trackEvent("comparison_open", { styleCodes, styleCount: codes.length, context: "catalog_en" }); }
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [products]);

  function toggleCompare(product: Product) {
    if (compareCodes.includes(product.code)) { setCompareCodes((current) => current.filter((code) => code !== product.code)); setCompareMessage(`${product.code} removed from comparison.`); return; }
    if (compareCodes.length >= 4) { setCompareMessage("Compare up to 4 styles at one time. Remove one before adding another."); return; }
    const next = [...compareCodes, product.code]; setCompareCodes(next); setCompareMessage(`${product.code} added · ${next.length}/4 selected.`); trackEvent("product_compare", { styleCode: product.code, styleCount: next.length });
  }

  function addComparedToQuote() {
    const existingCodes = new Set(readQuoteList().map((line) => line.code));
    const results = compared.map((product) => ({ product, existed: existingCodes.has(product.code), inserted: addProductToQuote(product) }));
    const inserted = results.filter((result) => result.inserted).length; const existing = results.filter((result) => result.existed).length; const blocked = results.length - inserted - existing;
    setCompareMessage([`${inserted} new style${inserted === 1 ? "" : "s"} added.`, existing ? `${existing} already listed.` : "", blocked ? `${blocked} not added because the 12-style limit was reached.` : ""].filter(Boolean).join(" "));
    results.forEach(({ product, inserted: wasInserted }) => trackEvent("quote_list_add", { styleCode: product.code, inserted: wasInserted, context: "comparison" }));
  }

  return (
    <>
      <div className="catalog-tools" aria-label="Product catalogue filters">
        <label><span>Search by code, model or product</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try BQ009, L1026 or slip-on" /></label>
        <label><span>Closure</span><select value={closure} onChange={(event) => setClosure(event.target.value)}><option>All</option><option>Slip-On</option><option>Lace-Up</option></select></label>
        <strong>{visible.length} styles</strong>
      </div>
      <aside className="compare-tray"><div><strong>Compare styles</strong><span>{compareMessage}</span></div><div>{compared.map((product) => <button key={product.code} type="button" onClick={() => toggleCompare(product)}>{product.code} ×</button>)}{compareCodes.length > 0 && <button type="button" onClick={() => { setCompareCodes([]); setCompareMessage("Comparison cleared."); }}>Clear</button>}</div></aside>
      {compared.length >= 2 ? <ComparisonShareActions codes={compareCodes} /> : null}
      {compared.length >= 2 ? <section className="product-comparison comparison-en" aria-label="Selected product comparison"><header className="comparison-print-header"><p>BEIQIANG FOOTWEAR · INTERNAL SOURCING REVIEW</p><h1>Product comparison shortlist</h1><span>Selected styles: {compared.map((product) => product.code).join(" · ")}</span></header><div className="comparison-heading"><div><p className="eyebrow">BUYER SHORTLIST</p><h2>Compare verified facts and open confirmations</h2><p>Unknown materials or terms stay marked for confirmation. This table does not infer quality, sales rank or medical benefit.</p></div><div><button className="button button-small" type="button" onClick={addComparedToQuote}>Add all to quote</button><Link className="text-link" href="/request-quote/">Open quote list →</Link></div></div><div className="comparison-scroll"><table><thead><tr><th>Comparison</th>{compared.map((product) => <th key={product.code}><img src={`/catalog-thumbs/${product.slug}.webp`} alt="" loading="lazy" decoding="async" width={640} height={640} /><Link href={`/products/${product.slug}/`}>{product.code}</Link><small>{product.sourceModel}</small></th>)}</tr></thead><tbody><tr><th>Product</th>{compared.map((product) => <td key={product.code}>{product.name}</td>)}</tr><tr><th>Product group</th>{compared.map((product) => <td key={product.code}>{product.group}</td>)}</tr><tr><th>Closure</th>{compared.map((product) => <td key={product.code}>{product.closure}</td>)}</tr><tr><th>Upper</th>{compared.map((product) => <td key={product.code}>{product.upper}</td>)}</tr><tr><th>Sole direction</th>{compared.map((product) => <td key={product.code}>{product.sole}</td>)}</tr><tr><th>Size direction</th>{compared.map((product) => <td key={product.code}>{product.size}</td>)}</tr><tr><th>Documented colors</th>{compared.map((product) => <td key={product.code}>{product.colors.join(" · ")}</td>)}</tr><tr><th>Buyer fit</th>{compared.map((product) => <td key={product.code}>{product.buyerFit}</td>)}</tr><tr><th>Evidence-led highlights</th>{compared.map((product) => <td key={product.code}><ul>{product.highlights.map((item) => <li key={item}>{item}</li>)}</ul></td>)}</tr><tr className="comparison-confirm"><th>Confirm before quote</th>{compared.map((product) => <td key={product.code}><ul>{product.confirmBeforeQuote.map((item) => <li key={item}>{item}</li>)}</ul></td>)}</tr><tr className="comparison-review-row"><th>Internal decision</th>{compared.map((product) => <td key={product.code}>□ Preferred<br />□ Backup<br />□ Hold / remove</td>)}</tr></tbody></table></div><footer className="comparison-print-footer"><strong>Quanzhou Beiqiang Footwear & Apparel Co., Ltd.</strong><span>421345308@qq.com · WhatsApp +86 189 5980 5256 · www.beiqiang.online</span><p>Internal sourcing review only. This sheet is not a quotation, purchase order, contract, Trade Assurance order, payment request or production authorization. Confirm final specifications, quantity, size ratio, packing, price, trade term, payment and delivery in the issued written documents.</p></footer></section> : null}
      {visible.length ? <div className="product-grid catalog-grid">{visible.map((product) => <div className={`compare-card-wrap ${compareCodes.includes(product.code) ? "compare-selected" : ""}`} key={product.code}><button className="compare-toggle" type="button" aria-pressed={compareCodes.includes(product.code)} onClick={() => toggleCompare(product)}>{compareCodes.includes(product.code) ? "✓ Comparing" : "+ Compare"}</button><ProductCard product={product} /></div>)}</div> : <p className="catalog-empty">No matching style. Try another code, model or closure.</p>}
    </>
  );
}
