"use client";

import { useMemo, useState } from "react";
import type { Product } from "../data/products";
import ProductCard from "./ProductCard";

export default function ProductCatalog({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [closure, setClosure] = useState("All");

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesClosure = closure === "All" || product.closure === closure;
      const haystack = [product.code, product.sourceModel, product.name, product.group, ...product.colors].join(" ").toLowerCase();
      return matchesClosure && (!normalized || haystack.includes(normalized));
    });
  }, [closure, products, query]);

  return (
    <>
      <div className="catalog-tools" aria-label="Product catalogue filters">
        <label><span>Search by code, model or product</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try BQ009, L1026 or slip-on" /></label>
        <label><span>Closure</span><select value={closure} onChange={(event) => setClosure(event.target.value)}><option>All</option><option>Slip-On</option><option>Lace-Up</option></select></label>
        <strong>{visible.length} styles</strong>
      </div>
      {visible.length ? <div className="product-grid catalog-grid">{visible.map((product) => <ProductCard key={product.code} product={product} />)}</div> : <p className="catalog-empty">No matching style. Try another code, model or closure.</p>}
    </>
  );
}
