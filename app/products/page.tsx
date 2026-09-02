import type { Metadata } from "next";
import Link from "next/link";
import ProductCatalog from "../components/ProductCatalog";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import { collections, products, productsInCollection } from "../data/products";

export const metadata: Metadata = {
  title: "Walking Shoe Product Catalogue | Beiqiang Footwear",
  description: `Browse Beiqiang's current online selection of ${products.length} detailed walking and casual shoe pages, or request the latest factory line sheet for a broader sourcing review.`,
  alternates: {
    canonical: "https://www.beiqiang.online/products/",
    languages: {
      en: "https://www.beiqiang.online/products/",
      "zh-CN": "https://www.beiqiang.online/zh/products/",
      "x-default": "https://www.beiqiang.online/products/",
    },
  },
};

export default function ProductsPage() {
  return (
    <main>
      <SiteHeader />
      <section className="catalog-hero">
        <p className="eyebrow">CURRENT ONLINE SELECTION</p>
        <h1>
          Compare {products.length} product pages prepared for online review.
        </h1>
        <p>
          This is a curated website selection, not Beiqiang&apos;s entire
          factory range. Filter by product code, source model or closure, then
          ask for the latest line sheet or send a reference style if your target
          is not shown.
        </p>
        <div className="catalog-summary">
          <span>
            <strong>{products.length}</strong> current product pages
          </span>
          <span>
            <strong>
              {products.filter((p) => p.closure === "Slip-On").length}
            </strong>{" "}
            slip-on styles
          </span>
          <span>
            <strong>
              {products.filter((p) => p.closure === "Lace-Up").length}
            </strong>{" "}
            lace-up styles
          </span>
        </div>
        <div className="hero-actions">
          <Link className="button" href="/line-sheet/">
            Request current line sheet
          </Link>
          <Link
            className="text-link"
            href="/request-quote/?program=reference-style"
          >
            Send another product direction →
          </Link>
        </div>
      </section>
      <section
        className="catalog-directions"
        aria-labelledby="catalog-direction-title"
      >
        <div>
          <p className="eyebrow">START BY SOURCING DIRECTION</p>
          <h2 id="catalog-direction-title">
            Review a product family before individual styles.
          </h2>
          <p>
            Choose the commercial direction closest to your market, then narrow
            the current online selection with the catalogue filters.
          </p>
        </div>
        <div className="catalog-direction-grid">
          {collections.map((collection) => (
            <Link
              key={collection.slug}
              href={`/collections/${collection.slug}/`}
            >
              <span>
                {productsInCollection(collection.slug).length} current styles
              </span>
              <h3>{collection.title}</h3>
              <p>{collection.description}</p>
              <strong>Review this direction →</strong>
            </Link>
          ))}
        </div>
      </section>
      <section className="section catalog-section">
        <ProductCatalog products={products} />
      </section>
      <section className="catalog-help">
        <div>
          <p className="eyebrow eyebrow-light">NEED A BROADER RANGE?</p>
          <h2>Start with a guided shortlist or send your target style.</h2>
          <p>
            The finder works with the current online selection. For other
            factory styles, share your market, quantity and reference so
            Beiqiang can review the wider range and sourcing fit.
          </p>
        </div>
        <Link className="button button-light" href="/product-finder/">
          Use the B2B product finder
        </Link>
      </section>
      <SiteFooter />
    </main>
  );
}
