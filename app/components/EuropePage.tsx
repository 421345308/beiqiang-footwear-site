import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  t,
  europeLocales,
  type EuropeLocale,
  type CopyKey,
} from "../data/europe-copy";
import { productTitle } from "../data/europe-products";
import { products } from "../data/products";
import { supplyMode } from "../data/published-product-codes";
import {
  localizedPath,
  pageAlternates,
  europePages,
  siteOrigin,
} from "../lib/public-locales";
import { productMediaUrl } from "../lib/product-media-url";
import EuropeShell from "./EuropeShell";
import EuropeCatalog from "./EuropeCatalog";
import EuropeProduct, { EuropeCard, EuropeHeroPhoto } from "./EuropeProduct";
import EuropeInquiry from "./EuropeInquiry";
import EuropePrivacyChoices from "./EuropePrivacyChoices";

const titles: Record<string, CopyKey> = {
  "/": "hero",
  "/products/": "products",
  "/product-finder/": "finder",
  "/request-quote/": "quote",
  "/factory/": "factoryTitle",
  "/buyer-guide/": "guide",
  "/privacy/": "privacy",
  "/terms/": "terms",
  "/line-sheet/": "lineSheet",
  "/oem-odm/": "branding",
  "/quality-packing/": "specs",
  "/sample-order-process/": "processTitle",
  "/sourcing-review/": "custom",
};
function resolve(locale: string, path: string) {
  if (!europeLocales.includes(locale as EuropeLocale)) notFound();
  const product = products.find((p) => path === `/products/${p.slug}/`);
  if (!product && !europePages.includes(path)) notFound();
  return { locale: locale as EuropeLocale, product };
}
export function europeMetadata(localeId: string, path: string): Metadata {
  const { locale, product } = resolve(localeId, path);
  const title = product
    ? `${product.code} · ${productTitle(product, locale)}`
    : t(locale, titles[path]);
  const description = product
    ? `${productTitle(product, locale)}. ${t(locale, "availability")}`
    : t(
        locale,
        path === "/"
          ? "intro"
          : path === "/products/" || path === "/product-finder/"
            ? "catalogIntro"
            : path === "/request-quote/"
              ? "quoteIntro"
              : path === "/factory/"
                ? "factoryText"
                : path === "/privacy/"
                  ? "privacyText"
                  : "samplesText",
      );
  return {
    title: `${title} | Beiqiang`,
    description,
    alternates: pageAlternates(path, locale),
    openGraph: {
      title,
      description,
      url: `${siteOrigin}${localizedPath(path, locale)}`,
      locale: { de: "de_DE", fr: "fr_FR", es: "es_ES" }[locale],
      images: [
        {
          url: product ? productMediaUrl(product.images[0]) : "/og.jpg",
          alt: title,
        },
      ],
    },
  };
}
export default function EuropePage({
  locale: localeId,
  path,
}: {
  locale: string;
  path: string;
}) {
  const { locale, product } = resolve(localeId, path);
  const href = (p: string) => localizedPath(p, locale);
  const steps = (
    <div className="europe-process">
      {[1, 2, 3, 4].map((n) => (
        <article key={n}>
          <h3>{t(locale, `step${n}` as CopyKey)}</h3>
          <p>{t(locale, `step${n}text` as CopyKey)}</p>
        </article>
      ))}
    </div>
  );
  let content;
  if (product) {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: productTitle(product, locale),
      description: `${productTitle(product, locale)}. ${t(locale, "availability")}`,
      sku: product.code,
      model: product.code,
      url: `${siteOrigin}${href(path)}`,
      image: product.images.map(
        (img) => `${siteOrigin}${productMediaUrl(img)}`,
      ),
      ...(supplyMode(product.code) === "own-factory"
        ? {
            manufacturer: {
              "@type": "Organization",
              name: "Quanzhou Beiqiang Footwear & Apparel Co., Ltd.",
            },
          }
        : {}),
    };
    content = (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
        <EuropeProduct product={product} locale={locale} />
      </>
    );
  } else if (path === "/products/" || path === "/product-finder/")
    content = (
      <EuropeCatalog locale={locale} finder={path === "/product-finder/"} />
    );
  else if (path === "/request-quote/" || path === "/sourcing-review/")
    content = <EuropeInquiry locale={locale} />;
  else if (path === "/")
    content = (
      <>
        <section className="europe-hero">
          <div>
            <p className="eyebrow">BEIQIANG · QUANZHOU</p>
            <h1>{t(locale, "hero")}</h1>
            <p>{t(locale, "intro")}</p>
            <div className="europe-actions">
              <a className="button" href={href("/products")}>
                {t(locale, "browse")} ↗
              </a>
              <a className="studio-text-link" href={href("/request-quote")}>
                {t(locale, "custom")} →
              </a>
            </div>
            <p className="europe-note">OEM / ODM · {t(locale, "footer")}</p>
          </div>
          <EuropeHeroPhoto
            product={products.find((p) => p.code === "BQ003")!}
            locale={locale}
          />
        </section>
        <section className="europe-content">
          <p className="eyebrow">BEIQIANG · {products.length}</p>
          <h2>{t(locale, "selectTitle")}</h2>
          <p className="europe-lead">{t(locale, "catalogIntro")}</p>
          <div className="studio-product-grid">
            {["BQ001", "BQ018", "BQ1031", "BQ1059"]
              .map((code) => products.find((p) => p.code === code))
              .filter(Boolean)
              .map((p) => (
                <EuropeCard key={p!.code} product={p!} locale={locale} />
              ))}
          </div>
          <a
            className="button button-secondary europe-more"
            href={href("/product-finder")}
          >
            {t(locale, "finder")} ↗
          </a>
        </section>
        <section className="europe-content europe-tinted">
          <h2>{t(locale, "factoryRange")}</h2>
          <p className="europe-lead">{t(locale, "supplyIntro")}</p>
          <a href={href("/factory")}>{t(locale, "factory")} ↗</a>
        </section>
        <section className="europe-content">
          <h2>{t(locale, "processTitle")}</h2>
          {steps}
        </section>
      </>
    );
  else
    content = (
      <section className="europe-content europe-editorial">
        <p className="eyebrow">BEIQIANG</p>
        <h1>{t(locale, titles[path])}</h1>
        {path === "/factory/" ? (
          <>
            <p className="europe-lead">{t(locale, "factoryText")}</p>
            <video
              controls
              preload="metadata"
              poster="/videos/beiqiang-factory-tour-poster.jpg"
              width={1280}
              height={720}
              aria-label={t(locale, "factoryTitle")}
            >
              <source
                src="/videos/beiqiang-factory-tour.mp4"
                type="video/mp4"
              />
              <track
                kind="captions"
                src="/videos/beiqiang-factory-tour.en.vtt"
                srcLang="en"
                label="English"
              />
              <track
                kind="captions"
                src="/videos/beiqiang-factory-tour.zh.vtt"
                srcLang="zh"
                label="简体中文"
              />
            </video>
            <p className="europe-note">{t(locale, "videoNote")}</p>
            <h2>{t(locale, "factoryRange")}</h2>
            <p>{t(locale, "supplyIntro")}</p>
          </>
        ) : path === "/privacy/" ? (
          <>
            <p>{t(locale, "privacyText")}</p>
            <p>{t(locale, "storageText")}</p>
            <EuropePrivacyChoices locale={locale} />
          </>
        ) : path === "/terms/" ? (
          <p>{t(locale, "termsText")}</p>
        ) : path === "/line-sheet/" ? (
          <>
            <p>{t(locale, "pdfNote")}</p>
            <Link className="button" href="/line-sheet/" lang="en">
              {t(locale, "englishPdf")}
            </Link>
            <a className="studio-text-link" href={href("/products")}>
              {t(locale, "browse")}
            </a>
          </>
        ) : (
          <>
            <p className="europe-lead">
              {t(
                locale,
                path === "/oem-odm/"
                  ? "brandingText"
                  : path === "/quality-packing/"
                    ? "fitNote"
                    : "samplesText",
              )}
            </p>
            {steps}
          </>
        )}
        <div className="europe-actions">
          <a className="button" href={href("/request-quote")}>
            {t(locale, "custom")} ↗
          </a>
          <a href={href("/products")}>{t(locale, "browse")}</a>
        </div>
      </section>
    );
  return (
    <EuropeShell locale={locale} path={path}>
      {content}
    </EuropeShell>
  );
}
