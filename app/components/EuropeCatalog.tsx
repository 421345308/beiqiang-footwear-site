"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { products, type Product } from "../data/products";
import {
  t,
  categories,
  translatedCategory,
  type EuropeLocale,
  europeLocales,
} from "../data/europe-copy";
import {
  productTitle,
  productFact,
  productColour,
} from "../data/europe-products";
import {
  colourFamilies,
  documentedSizes,
  matchingColour,
} from "../lib/catalog-selection";
import { useCatalogSelection } from "./useCatalogSelection";
import { localizedPath } from "../lib/public-locales";
import { EuropeCard, EuropeAdd, EuropeComparisonPhoto } from "./EuropeProduct";
import { trackEvent } from "../lib/tracking";

const familyLabels = {
  black: ["Schwarz", "Noir", "Negro"],
  white: ["Weiß", "Blanc", "Blanco"],
  neutral: ["Beige und Braun", "Beige et marron", "Beige y marrón"],
  grey: ["Grau", "Gris", "Gris"],
  blue: ["Blau", "Bleu", "Azul"],
  green: ["Grün", "Vert", "Verde"],
  pink: ["Rosa und Violett", "Rose et violet", "Rosa y morado"],
  warm: [
    "Rot, Orange und Gelb",
    "Rouge, orange et jaune",
    "Rojo, naranja y amarillo",
  ],
};
export default function EuropeCatalog({
  locale,
  finder = false,
}: {
  locale: EuropeLocale;
  finder?: boolean;
}) {
  const searchText = useCallback(
    (p: Product) =>
      [
        productTitle(p, locale),
        productFact(p.upper, locale),
        productFact(p.closure, locale),
        ...p.colors.map((c) => productColour(c, locale)),
      ].join(" "),
    [locale],
  );
  const { selection, update, reset, visible, shown } = useCatalogSelection(
    products,
    searchText,
  );
  const [compare, setCompare] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const filters = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (filters.current)
      filters.current.open = window.matchMedia("(min-width: 701px)").matches;
  }, []);
  useEffect(() => {
    const restore = () =>
      setCompare(
        [
          ...new Set(
            (new URLSearchParams(window.location.search).get("compare") || "")
              .toUpperCase()
              .split(","),
          ),
        ]
          .filter((c) => products.some((p) => p.code === c))
          .slice(0, 4),
      );
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  function toggle(code: string) {
    if (!compare.includes(code) && compare.length >= 4) {
      setMessage(t(locale, "compareLimit"));
      return;
    }
    const next = compare.includes(code)
      ? compare.filter((c) => c !== code)
      : [...compare, code];
    setCompare(next);
    const url = new URL(window.location.href);
    if (next.length) url.searchParams.set("compare", next.join(","));
    else url.searchParams.delete("compare");
    window.history.replaceState(window.history.state, "", url);
    trackEvent("product_compare", {
      styleCode: code,
      context: "localized_catalog",
    });
  }
  const fields = (
    <>
      <label>
        {t(locale, "search")}
        <input
          value={selection.q}
          onChange={(e) => update({ q: e.target.value })}
          maxLength={80}
        />
      </label>
      <label>
        {t(locale, "category")}
        <select
          value={selection.direction}
          onChange={(e) => update({ direction: e.target.value })}
        >
          <option value="">{t(locale, "all")}</option>
          {Object.keys(categories).map((key) => (
            <option key={key} value={key}>
              {translatedCategory(locale, key as keyof typeof categories)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t(locale, "closure")}
        <select
          value={selection.closure}
          onChange={(e) => update({ closure: e.target.value })}
        >
          <option value="">{t(locale, "all")}</option>
          {[...new Set(products.map((p) => p.closure))].map((c) => (
            <option key={c} value={c}>
              {productFact(c, locale)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t(locale, "colour")}
        <select
          value={selection.colour}
          onChange={(e) => update({ colour: e.target.value })}
        >
          <option value="">{t(locale, "all")}</option>
          {colourFamilies.map((c) => (
            <option key={c.id} value={c.id}>
              {familyLabels[c.id][europeLocales.indexOf(locale)]}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t(locale, "size")}
        <select
          value={selection.size}
          onChange={(e) => update({ size: e.target.value })}
        >
          <option value="">{t(locale, "all")}</option>
          {[...new Set(products.flatMap(documentedSizes))]
            .sort((a, b) => a - b)
            .map((s) => (
              <option key={s} value={s}>
                EU {s}
              </option>
            ))}
        </select>
      </label>
      <label>
        {t(locale, "sort")}
        <select
          value={selection.sort}
          onChange={(e) => update({ sort: e.target.value })}
        >
          <option value="code_asc">{t(locale, "ascending")}</option>
          <option value="code_desc">{t(locale, "descending")}</option>
        </select>
      </label>
    </>
  );
  return (
    <section className="europe-content europe-catalog">
      <p className="eyebrow">BEIQIANG · {products.length}</p>
      <h1>{t(locale, finder ? "finder" : "products")}</h1>
      <p className="europe-lead">
        {t(locale, finder ? "finderIntro" : "catalogIntro")}
      </p>
      <details className="europe-filters" ref={filters}>
        <summary>{t(locale, "filters")}</summary>
        <div className="europe-filter-grid">{fields}</div>
      </details>
      <div className="europe-result-bar">
        <strong role="status">
          {visible.length} {t(locale, "results")}
        </strong>
        <button onClick={reset}>{t(locale, "reset")}</button>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href);
              setMessage(t(locale, "copied"));
            } catch {
              setMessage(t(locale, "copyFailed"));
            }
          }}
        >
          {t(locale, "share")} ↗
        </button>
      </div>
      <p role="status">{message}</p>
      <div className="europe-comparison">
        <h2>
          {t(locale, "compareTitle")} ({compare.length}/4)
        </h2>
        <p>{t(locale, "compareHint")}</p>
        {compare.length > 0 && (
          <div className="europe-compare-grid">
            {compare.map((code) => {
              const p = products.find((p) => p.code === code)!;
              return (
                <article key={code}>
                  <h3>{code}</h3>
                  <EuropeComparisonPhoto product={p} locale={locale} />
                  <dl>
                    {(["upper", "sole", "size", "closure"] as const).map(
                      (key) => (
                        <div key={key}>
                          <dt>{t(locale, key === "size" ? "sizes" : key)}</dt>
                          <dd>{productFact(p[key], locale)}</dd>
                        </div>
                      ),
                    )}
                  </dl>
                  <EuropeAdd product={p} locale={locale} />
                  <button
                    onClick={() => toggle(code)}
                    aria-label={`${t(locale, "remove")} ${code}`}
                  >
                    {t(locale, "remove")}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
      {!visible.length && (
        <div className="europe-empty">
          <p>{t(locale, "noResults")}</p>
          <button className="button" onClick={reset}>
            {t(locale, "reset")}
          </button>
          <a href={localizedPath("/request-quote", locale)}>
            {t(locale, "custom")}
          </a>
        </div>
      )}
      <div className="studio-product-grid">
        {shown.map((p) => (
          <EuropeCard
            key={p.code}
            product={p}
            locale={locale}
            preferredColour={matchingColour(p, selection.colour)}
            compare={compare.includes(p.code)}
            onCompare={() => toggle(p.code)}
          />
        ))}
      </div>
      {shown.length < visible.length && (
        <button
          className="button europe-more"
          onClick={() => update({ limit: selection.limit + 12 })}
        >
          {t(locale, "more")} ({shown.length}/{visible.length})
        </button>
      )}
    </section>
  );
}
