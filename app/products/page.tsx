import type { Metadata } from "next";
import Link from "next/link";
import ProductCatalog from "../components/ProductCatalog";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import { products, type CollectionSlug } from "../data/products";
import {
  type CatalogDirection,
  productMatchesCatalogDirection,
} from "../lib/catalog-filtering";

const catalogDirections: Array<{
  key: CatalogDirection;
  slug: CollectionSlug;
  title: string;
  copy: string;
}> = [
  { key: "wide-toe-box", slug: "wide-toe-box", title: "Roomy-toe walking shoes", copy: "Verified wide-toe styles for comfort-footwear assortments." },
  { key: "knit-slip-on", slug: "knit-slip-on", title: "Easy-on knit styles", copy: "Slip-on textile and knit options for convenient daily-wear ranges." },
  { key: "breathable-lace-up", slug: "breathable-lace-up", title: "Breathable lace-up styles", copy: "Knit, mesh and textile lace-up directions for warmer markets." },
  { key: "high_top", slug: "high-top-shoes", title: "High-top and sock styles", copy: "Higher-cut silhouettes for seasonal or differentiated assortments." },
  { key: "kids", slug: "kids-shoes", title: "Kids footwear", copy: "Current children’s styles grouped for a faster buyer review." },
  { key: "large_size", slug: "extended-size-shoes", title: "Extended-size directions", copy: "Styles whose documented size direction reaches larger EU sizes." },
  { key: "fleece", slug: "fleece-lined-shoes", title: "Fleece-lined options", copy: "Documented color options that include a fleece-lined direction." },
];

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
          Walking and casual shoes for wholesale and private label.
        </h1>
        <p>
          Compare styles by construction, closure and fit. Add your choices to one
          quote list, then tell us your quantity, size mix and destination.
          Current availability and any changes are confirmed before you order.
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
          {catalogDirections.map((direction) => (
            <Link
              key={direction.key}
              href={`/collections/${direction.slug}/`}
            >
              <span>
                {products.filter((product) => productMatchesCatalogDirection(product, direction.key)).length} current styles
              </span>
              <h3>{direction.title}</h3>
              <p>{direction.copy}</p>
              <strong>Open the sourcing collection →</strong>
            </Link>
          ))}
        </div>
      </section>
      <section className="section catalog-section" id="catalog">
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
