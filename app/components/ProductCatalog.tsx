"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Product } from "../data/products";
import { addProductToQuote, readQuoteList } from "../lib/quote-list";
import { trackEvent } from "../lib/tracking";
import ProductCard from "./ProductCard";
import { ComparisonColour } from "./ProductColourOptions";
import ComparisonShareActions from "./ComparisonShareActions";
import { parseComparisonCodes } from "../lib/comparison-link";
import CatalogFilters from "./CatalogFilters";
import { useCatalogSelection } from "./useCatalogSelection";
import { matchingColour } from "../lib/catalog-selection";

const PAGE_SIZE = 12;

export default function ProductCatalog({ products }: { products: Product[] }) {
  const { selection, update, reset, visible, shown } = useCatalogSelection(products);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareCodes, setCompareCodes] = useState<string[]>([]);
  const [compareMessage, setCompareMessage] = useState(
    "Select 2–4 styles to compare specifications.",
  );
  const trackedSharedComparison = useRef("");
  useEffect(() => {
    if (compareOpen) document.getElementById("product-comparison")?.scrollIntoView({ block: "start" });
  }, [compareOpen]);

  const compared = compareCodes
    .map((code) => products.find((product) => product.code === code))
    .filter((product): product is Product => Boolean(product));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const codes = parseComparisonCodes(
        params.get("compare") || "",
        products.map((product) => product.code),
      );
      if (codes.length >= 2) {
        const styleCodes = codes.join(",");
        setCompareCodes(codes);
        setCompareOpen(true);
        setCompareMessage(
          `Shared comparison loaded · ${codes.length}/4 styles.`,
        );
        if (trackedSharedComparison.current !== styleCodes) {
          trackedSharedComparison.current = styleCodes;
          trackEvent("comparison_open", {
            styleCodes,
            styleCount: codes.length,
            context: "catalog_en",
          });
        }
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [products]);

  function toggleCompare(product: Product) {
    if (compareCodes.includes(product.code)) {
      setCompareCodes((current) =>
        current.filter((code) => code !== product.code),
      );
      setCompareMessage(`${product.code} removed from comparison.`);
      return;
    }
    if (compareCodes.length >= 4) {
      setCompareMessage(
        "Compare up to 4 styles at one time. Remove one before adding another.",
      );
      return;
    }
    const next = [...compareCodes, product.code];
    setCompareCodes(next);
    setCompareMessage(`${product.code} added · ${next.length}/4 selected.`);
    trackEvent("product_compare", {
      styleCode: product.code,
      styleCount: next.length,
    });
  }

  function addComparedToQuote() {
    const existingCodes = new Set(readQuoteList().map((line) => line.code));
    const results = compared.map((product) => ({
      product,
      existed: existingCodes.has(product.code),
      inserted: addProductToQuote(product),
    }));
    const inserted = results.filter((result) => result.inserted).length;
    const existing = results.filter((result) => result.existed).length;
    const blocked = results.length - inserted - existing;
    setCompareMessage(
      [
        `${inserted} new style${inserted === 1 ? "" : "s"} added.`,
        existing ? `${existing} already listed.` : "",
        blocked
          ? `${blocked} not added because the 12-style limit was reached.`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
    results.forEach(({ product, inserted: wasInserted }) =>
      trackEvent("quote_list_add", {
        styleCode: product.code,
        inserted: wasInserted,
        context: "comparison",
      }),
    );
  }

  return (
    <>
      <CatalogFilters products={products} selection={selection} update={update} reset={reset} count={visible.length} shown={shown.length} locale="en" />
      {compared.length >= 2 && !compareOpen && <button className="mobile-compare-shortcut" type="button" onClick={() => setCompareOpen(true)}>Compare {compared.length} styles ↗</button>}
      <aside className={`compare-tray${compareCodes.length ? " has-selection" : ""}`}>
        <div>
          <strong>Compare styles</strong>
          <span>{compareMessage}</span>
        </div>
        <div>
          {compared.map((product) => (
            <button
              key={product.code}
              type="button"
              onClick={() => toggleCompare(product)}
            >
              {product.code} ×
            </button>
          ))}
          {compareCodes.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setCompareCodes([]);
                setCompareMessage("Comparison cleared.");
              }}
            >
              Clear
            </button>
          )}
        </div>
        {compared.length >= 2 && <button type="button" className="compare-open" aria-expanded={compareOpen} aria-controls="product-comparison" onClick={() => setCompareOpen(open => !open)}>{compareOpen ? "Close comparison" : "View comparison"} ↗</button>}
      </aside>
      {compared.length >= 2 && compareOpen ? (
        <ComparisonShareActions codes={compareCodes} />
      ) : null}
      {compared.length >= 2 && compareOpen ? (
        <section
          id="product-comparison" className="product-comparison comparison-en"
          aria-label="Selected product comparison"
        >
          <header className="comparison-print-header">
            <p>BEIQIANG FOOTWEAR · BUYER PRODUCT REVIEW</p>
            <h1>Product comparison shortlist</h1>
            <span>
              Selected styles:{" "}
              {compared.map((product) => product.code).join(" · ")}
            </span>
          </header>
          <div className="comparison-heading">
            <div>
              <p className="eyebrow">BUYER SHORTLIST</p>
              <h2>Compare product information and order-specific checks</h2>
              <p>
                Use the available product details to select candidates. Items
                that depend on quantity, color, material execution or timing
                are confirmed for your specific request.
              </p>
            </div>
            <div>
              <button
                className="button button-small"
                type="button"
                onClick={addComparedToQuote}
              >
                Add all to quote
              </button>
              <Link className="text-link" href="/request-quote/">
                Open quote list →
              </Link>
            </div>
          </div>
          <p className="comparison-mobile-hint">Swipe across to view the other selected styles →</p>
          <div className="comparison-scroll">
            <table>
              <thead>
                <tr>
                  <th>Comparison</th>
                  {compared.map((product) => (
                    <th key={product.code}>
                      <ComparisonColour product={product} />
                      <Link href={`/products/${product.slug}/`}>
                        {product.code}
                      </Link>

                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Product</th>
                  {compared.map((product) => (
                    <td key={product.code}>{product.name}</td>
                  ))}
                </tr>
                <tr>
                  <th>Product group</th>
                  {compared.map((product) => (
                    <td key={product.code}>{product.group}</td>
                  ))}
                </tr>
                <tr>
                  <th>Closure</th>
                  {compared.map((product) => (
                    <td key={product.code}>{product.closure}</td>
                  ))}
                </tr>
                <tr>
                  <th>Upper</th>
                  {compared.map((product) => (
                    <td key={product.code}>{product.upper}</td>
                  ))}
                </tr>
                <tr>
                  <th>Sole direction</th>
                  {compared.map((product) => (
                    <td key={product.code}>{product.sole}</td>
                  ))}
                </tr>
                <tr>
                  <th>Size direction</th>
                  {compared.map((product) => (
                    <td key={product.code}>{product.size}</td>
                  ))}
                </tr>
                <tr>
                  <th>Documented colors</th>
                  {compared.map((product) => (
                    <td key={product.code}>{product.colors.join(" · ")}</td>
                  ))}
                </tr>
                <tr>
                  <th>Buyer fit</th>
                  {compared.map((product) => (
                    <td key={product.code}>{product.buyerFit}</td>
                  ))}
                </tr>
                <tr>
                  <th>Product highlights</th>
                  {compared.map((product) => (
                    <td key={product.code}>
                      <ul>
                        {product.highlights.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
                <tr className="comparison-confirm">
                  <th>Confirm before quote</th>
                  {compared.map((product) => (
                    <td key={product.code}>
                      <ul>
                        {product.confirmBeforeQuote.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
                <tr className="comparison-review-row">
                  <th>Selection note</th>
                  {compared.map((product) => (
                    <td key={product.code}>
                      □ Preferred
                      <br />□ Backup
                      <br />□ Hold / remove
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <footer className="comparison-print-footer">
            <strong>Quanzhou Beiqiang Footwear & Apparel Co., Ltd.</strong>
            <span>
              shepeiqiang@gmail.com · WhatsApp +86 189 5980 5256 ·
              www.beiqiang.online
            </span>
            <p>
              Buyer product review only. This sheet is not a quotation,
              purchase order, contract, Trade Assurance order, payment request
              or production authorization. Confirm final specifications,
              quantity, size ratio, packing, price, trade term, payment and
              delivery in the issued written documents.
            </p>
          </footer>
        </section>
      ) : null}
      {visible.length ? (
        <>
          <div className="product-grid catalog-grid">
            {shown.map((product) => (
              <div
                className={`compare-card-wrap ${compareCodes.includes(product.code) ? "compare-selected" : ""}`}
                key={product.code}
              >
                <button
                  className="compare-toggle"
                  type="button"
                  aria-pressed={compareCodes.includes(product.code)}
                  onClick={() => toggleCompare(product)}
                >
                  {compareCodes.includes(product.code)
                    ? "✓ Comparing"
                    : "+ Compare"}
                </button>
                <ProductCard product={product} preferredColour={matchingColour(product, selection.colour)} />
              </div>
            ))}
          </div>
          {shown.length < visible.length ? (
            <div className="catalog-load-more">
              <p>
                {visible.length - shown.length} more matching styles are
                available.
              </p>
              <button
                className="button"
                type="button"
                onClick={() =>
                  update({ limit: selection.limit + PAGE_SIZE })
                }
              >
                Show more products
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="catalog-empty">
          <button className="button button-secondary" type="button" onClick={reset}>{"Clear filters and view all styles"}</button>
          <p>No matching style in the current online selection.</p>
          <Link
            className="text-link"
            href="/sourcing-review/"
          >
            Discuss another style →
          </Link>
        </div>
      )}
      <details className="catalog-style-index">
        <summary>Browse all {products.length} current product codes</summary>
        <nav aria-label="All current product pages">
          {products.map((product) => (
            <Link key={product.code} href={`/products/${product.slug}/`}>
              {product.code}
            </Link>
          ))}
        </nav>
      </details>
    </>
  );
}
