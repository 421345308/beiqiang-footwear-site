/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useRef, useState } from "react";
import type { Product } from "../data/products";
import { t, type EuropeLocale } from "../data/europe-copy";
import {
  productTitle,
  productFact,
  productColour,
} from "../data/europe-products";
import { localizedPath } from "../lib/public-locales";
import { useProductColour } from "./ProductColourOptions";
import {
  productColours,
  colourImage,
  colourViews,
  galleryImage,
  withColour,
} from "../lib/product-colours";
import { addProductToQuote, readQuoteList } from "../lib/quote-list";
import { supplyMode } from "../data/published-product-codes";
import PrintProductSheetButton from "./PrintProductSheetButton";
import { siteOrigin } from "../lib/public-locales";
import { trackEvent } from "../lib/tracking";

export function EuropeAdd({
  product,
  locale,
}: {
  product: Product;
  locale: EuropeLocale;
}) {
  const { colour } = useProductColour(product);
  const [message, setMessage] = useState("");
  return (
    <>
      <button
        className="button"
        type="button"
        onClick={() => {
          if (
            readQuoteList().length >= 12 &&
            !readQuoteList().some((p) => p.code === product.code)
          ) {
            setMessage(t(locale, "listFull"));
            return;
          }
          try {
            addProductToQuote(product, colour?.name || "");
            setMessage(t(locale, "added"));
            trackEvent("quote_list_add", {
              styleCode: product.code,
              context: "localized_product",
            });
          } catch {
            setMessage(t(locale, "failure"));
          }
        }}
      >
        {t(locale, "add")}
      </button>
      <span className="europe-feedback" role="status">
        {message}
      </span>
    </>
  );
}
export function EuropeColours({
  product,
  locale,
  detail = false,
}: {
  product: Product;
  locale: EuropeLocale;
  detail?: boolean;
}) {
  const { id, select } = useProductColour(product);
  return (
    <div className="colour-options">
      <p>{t(locale, "colour")}</p>
      <div
        className="colour-options-list"
        role="group"
        aria-label={`${product.code} · ${t(locale, "chooseColour")}`}
      >
        {productColours(product).map((c) => (
          <button
            type="button"
            key={c.id}
            aria-label={productColour(c.name, locale)}
            aria-pressed={id === c.id}
            title={productColour(c.name, locale)}
            onClick={() => {
              select(c.id);
              if (detail) {
                const url = new URL(window.location.href);
                url.searchParams.set("colour", c.id);
                window.history.replaceState(window.history.state, "", url);
              }
            }}
          >
            <img
              src={galleryImage(product.images[c.imageIndex], true)}
              alt=""
              width={80}
              height={80}
              loading="lazy"
            />
            {detail && <span>{productColour(c.name, locale)}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
export function EuropeCard({
  product,
  locale,
  preferredColour = "",
  compare,
  onCompare,
}: {
  product: Product;
  locale: EuropeLocale;
  preferredColour?: string;
  compare?: boolean;
  onCompare?: () => void;
}) {
  const { id, select, colour } = useProductColour(product);
  useEffect(() => {
    if (preferredColour) select(preferredColour);
  }, [preferredColour, select]);
  const href = withColour(
    localizedPath(`/products/${product.slug}`, locale),
    id,
  );
  return (
    <article className="studio-card europe-card">
      <a className="product-image" href={href}>
        <img
          src={galleryImage(product.images[colourImage(product, id)])}
          alt={`${productTitle(product, locale)}${colour ? ` · ${productColour(colour.name, locale)}` : ""}`}
          width={640}
          height={640}
          loading="lazy"
        />
      </a>
      <div className="product-meta">
        <span>{product.code}</span>
        <span>{productFact(product.closure, locale)}</span>
      </div>
      <h3>
        <a href={href}>{productTitle(product, locale)}</a>
      </h3>
      <p>{productFact(product.size, locale)}</p>
      <EuropeColours product={product} locale={locale} />
      <div className="europe-card-actions">
        <a href={href}>{t(locale, "view")} ↗</a>
        {onCompare && (
          <button type="button" aria-pressed={compare} onClick={onCompare}>
            {t(locale, compare ? "compared" : "compare")}
          </button>
        )}
      </div>
    </article>
  );
}
export function EuropeComparisonPhoto({
  product,
  locale,
}: {
  product: Product;
  locale: EuropeLocale;
}) {
  const { id, colour } = useProductColour(product);
  return (
    <>
      <a
        href={withColour(
          localizedPath(`/products/${product.slug}`, locale),
          id,
        )}
      >
        <img
          className="europe-compare-photo"
          src={galleryImage(product.images[colourImage(product, id)])}
          alt={`${productTitle(product, locale)}${colour ? ` · ${productColour(colour.name, locale)}` : ""}`}
          width={300}
          height={300}
        />
        {productTitle(product, locale)}
      </a>
      <EuropeColours product={product} locale={locale} />
      <p>
        {colour
          ? productColour(colour.name, locale)
          : t(locale, "chooseColour")}
      </p>
    </>
  );
}
export function EuropeHeroPhoto({
  product,
  locale,
}: {
  product: Product;
  locale: EuropeLocale;
}) {
  const { id } = useProductColour(product);
  return (
    <div className="europe-hero-photo">
      <p className="eyebrow">
        {product.code} · {t(locale, "products")}
      </p>
      <a
        href={withColour(
          localizedPath(`/products/${product.slug}`, locale),
          id,
        )}
      >
        <img
          src={galleryImage(product.images[colourImage(product, id)])}
          alt={productTitle(product, locale)}
          width={900}
          height={900}
          fetchPriority="high"
        />
        <strong>{productTitle(product, locale)} ↗</strong>
      </a>
      <EuropeColours product={product} locale={locale} />
    </div>
  );
}
export default function EuropeProduct({
  product,
  locale,
}: {
  product: Product;
  locale: EuropeLocale;
}) {
  const { id, select, colour } = useProductColour(product);
  const [view, setSelectedView] = useState({
    colour: "",
    index: 0,
    all: false,
  });
  const showAll = view.colour === id && view.all;
  const setView = (index: number) =>
    setSelectedView({ colour: id, index, all: showAll });
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const restore = () => {
      const c = new URLSearchParams(window.location.search).get("colour");
      if (c !== null)
        select(productColours(product).some((v) => v.id === c) ? c : "");
    };
    restore();
    window.addEventListener("popstate", restore);
    trackEvent("product_view", {
      styleCode: product.code,
      context: "localized_product",
    });
    return () => window.removeEventListener("popstate", restore);
  }, [product, select]);
  const views = showAll
    ? product.images.map((_, index) => index)
    : colourViews(product, id);
  const chosen =
    view.colour === id && views.includes(view.index) ? view.index : views[0];
  const name = productTitle(product, locale);
  const change = (delta: number) =>
    setView(
      views[(views.indexOf(chosen) + delta + views.length) % views.length],
    );
  return (
    <>
      <nav className="studio-breadcrumb">
        <a href={localizedPath("/", locale)}>{t(locale, "home")}</a>
        <span>/</span>
        <a href={localizedPath("/products", locale)}>{t(locale, "products")}</a>
        <span>/ {product.code}</span>
      </nav>
      <section className="studio-product-hero europe-product-hero">
        <div className="europe-gallery">
          <button
            type="button"
            className="europe-main-photo"
            onClick={() => dialog.current?.showModal()}
            aria-label={t(locale, "zoom")}
          >
            <img
              src={galleryImage(product.images[chosen])}
              alt={`${name}${colour && !showAll ? ` · ${productColour(colour.name, locale)}` : ""}`}
              width={900}
              height={900}
            />
          </button>
          <div className="europe-thumbnails" aria-label={t(locale, "gallery")}>
            {views.map((n, i) => (
              <button
                key={n}
                aria-pressed={chosen === n}
                aria-label={`${t(locale, "photo")} ${i + 1}`}
                onClick={() => setView(n)}
              >
                <img
                  src={galleryImage(product.images[n], true)}
                  alt=""
                  width={100}
                  height={100}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            className="europe-link-button"
            aria-pressed={showAll}
            onClick={() => setSelectedView({ colour: id, index: 0, all: true })}
          >
            {t(locale, "allPhotos")} ({product.images.length})
          </button>
          {colour && (
            <button
              type="button"
              className="europe-link-button"
              aria-pressed={!showAll}
              onClick={() =>
                setSelectedView({
                  colour: id,
                  index: colour.imageIndex,
                  all: false,
                })
              }
            >
              {productColour(colour.name, locale)} ·{" "}
              {colourViews(product, id).length}
            </button>
          )}
          <dialog
            ref={dialog}
            className="europe-lightbox"
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") change(-1);
              if (event.key === "ArrowRight") change(1);
            }}
          >
            <button autoFocus onClick={() => dialog.current?.close()}>
              {t(locale, "close")} ×
            </button>
            <img src={galleryImage(product.images[chosen])} alt={name} />
            <div>
              <button onClick={() => change(-1)}>
                {t(locale, "previous")}
              </button>
              <span>
                {views.indexOf(chosen) + 1} / {views.length}
              </span>
              <button onClick={() => change(1)}>{t(locale, "next")}</button>
            </div>
          </dialog>
        </div>
        <div className="studio-product-copy">
          <p className="eyebrow">{product.code} · BEIQIANG</p>
          <h1>{name}</h1>
          <p>
            {t(
              locale,
              supplyMode(product.code) === "partner-sourced"
                ? "partner"
                : "own",
            )}
          </p>
          <dl className="studio-specs">
            {(["upper", "sole", "size", "closure"] as const).map((key) => (
              <div key={key}>
                <dt>{t(locale, key === "size" ? "sizes" : key)}</dt>
                <dd>{productFact(product[key], locale)}</dd>
              </div>
            ))}
          </dl>
          {product.sizeNote && (
            <p className="europe-note">{t(locale, "paired")}</p>
          )}
          <EuropeColours product={product} locale={locale} detail />
          <p>
            {colour
              ? productColour(colour.name, locale)
              : t(locale, "chooseColour")}
          </p>
          <EuropeAdd product={product} locale={locale} />
          <a
            className="button button-secondary"
            href={localizedPath("/request-quote", locale)}
          >
            {t(locale, "quote")} ↗
          </a>
          <PrintProductSheetButton styleCode={product.code} locale={locale} />
          <p className="europe-note">{t(locale, "availability")}</p>
        </div>
      </section>
      <section className="product-print-sheet europe-print-sheet">
        <header><p>BEIQIANG · {product.code}</p><h2 className="print-sheet-title">{name}</h2></header>
        <div className="studio-print-body">
          <img src={galleryImage(product.images[colourImage(product, id)])} alt={name} width={600} height={600} />
          <dl className="studio-specs">
            {(["upper", "sole", "size", "closure"] as const).map((key) => <div key={key}><dt>{t(locale, key === "size" ? "sizes" : key)}</dt><dd>{productFact(product[key], locale)}</dd></div>)}
            <div><dt>{t(locale, "colour")}</dt><dd>{colour ? productColour(colour.name, locale) : productColours(product).map(c => productColour(c.name, locale)).join(" / ")}</dd></div>
          </dl>
        </div>
        {product.sizeNote && <p>{t(locale, "paired")}</p>}
        <p>{t(locale, supplyMode(product.code) === "partner-sourced" ? "partner" : "own")}</p>
        <p>{t(locale, "availability")}</p>
        <p>{t(locale, product.fitEvidence === "wide_toe_verified" ? "wideNote" : "fitNote")}</p>
        <p><a href={withColour(`${siteOrigin}${localizedPath(`/products/${product.slug}`, locale)}`, id)}>{withColour(`${siteOrigin}${localizedPath(`/products/${product.slug}`, locale)}`, id)}</a></p>
      </section>
      <section className="europe-content">
        <h2>{t(locale, "specs")}</h2>
        <p>
          {t(
            locale,
            product.fitEvidence === "wide_toe_verified"
              ? "wideNote"
              : "fitNote",
          )}
        </p>
        <div className="europe-columns">
          <article>
            <h3>{t(locale, "branding")}</h3>
            <p>{t(locale, "brandingText")}</p>
          </article>
          <article>
            <h3>{t(locale, "samples")}</h3>
            <p>{t(locale, "samplesText")}</p>
          </article>
        </div>
        <a
          className="studio-text-link"
          href={localizedPath("/factory", locale)}
        >
          {t(locale, "factory")} ↗
        </a>
      </section>
    </>
  );
}
