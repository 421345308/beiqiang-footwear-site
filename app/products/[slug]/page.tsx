import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductInquiry from "../../components/ProductInquiry";
import ProductCard from "../../components/ProductCard";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";
import AddToQuoteButton from "../../components/AddToQuoteButton";
import PrintProductSheetButton from "../../components/PrintProductSheetButton";
import ProductShareActions from "../../components/ProductShareActions";
import { getProduct, products } from "../../data/products";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = getProduct((await params).slug);
  if (!product) return {};
  const url = `https://www.beiqiang.online/products/${product.slug}/`;
  const image = `https://www.beiqiang.online${webGalleryImage(product.images[0])}`;
  const title = `${product.code} ${product.name}`;
  return {
    title: `${title} | Beiqiang Footwear`,
    description: `${product.shortDescription} Review verified size, closure, colors and real product images before requesting a B2B sample or quotation.`,
    alternates: {
      canonical: url,
      languages: {
        en: url,
        "zh-CN": `https://www.beiqiang.online/zh/products/${product.slug}/`,
        "x-default": url,
      },
    },
    openGraph: {
      title,
      description: product.shortDescription,
      url,
      type: "website",
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: product.shortDescription,
      images: [image],
    },
  };
}

function webGalleryImage(source: string) {
  return source
    .replace("/catalog/", "/catalog-web/")
    .replace(/\.jpg$/i, ".webp");
}

export default async function ProductPage({ params }: Props) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  const related = products
    .filter(
      (candidate) =>
        candidate.code !== product.code &&
        candidate.collections.some((collection) =>
          product.collections.includes(collection),
        ),
    )
    .slice(0, 3);
  const label = `${product.code} — ${product.name}`;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.code} ${product.name}`,
    sku: product.code,
    model: product.sourceModel,
    brand: { "@type": "Brand", name: "Beiqiang" },
    image: product.images.map((image) => `https://www.beiqiang.online${image}`),
    description: product.shortDescription,
    manufacturer: {
      "@type": "Organization",
      name: "Quanzhou Beiqiang Footwear & Apparel Co., Ltd.",
    },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <SiteHeader />
      <div className="product-breadcrumb">
        <Link href="/products/">All products</Link>
        <span>›</span>
        <span>{product.code}</span>
      </div>
      <section className="product-detail-hero">
        <div className="product-detail-image">
          <img
            src={webGalleryImage(product.images[0])}
            alt={`${product.code} ${product.name}`}
            decoding="async"
            fetchPriority="high"
          />
        </div>
        <div className="product-detail-copy">
          <p className="eyebrow">{product.group.toUpperCase()}</p>
          <div className="product-id-line">
            <span>{product.code}</span>
            <span>Source model {product.sourceModel}</span>
            <span>{product.closure}</span>
          </div>
          <h1>{product.name}</h1>
          <p className="hero-lead">{product.shortDescription}</p>
          <ul className="product-hero-points">
            {product.highlights.map((highlight) => (
              <li key={highlight}>
                <strong>{highlight}</strong>
              </li>
            ))}
          </ul>
          <div className="hero-actions">
            <AddToQuoteButton product={product} />
            <PrintProductSheetButton styleCode={product.code} />
            <a className="text-link" href="#inquiry">
              Ask about this sample →
            </a>
          </div>
          <ProductShareActions
            code={product.code}
            name={product.name}
            url={`https://www.beiqiang.online/products/${product.slug}/`}
          />
          <p className="commercial-note">
            Final price depends on confirmed style, quantity, material, size
            ratio, packing and trade requirements.
          </p>
        </div>
      </section>

      <section
        className="product-fact-strip"
        aria-label={`${product.code} sourcing highlights`}
      >
        <div>
          <small>STYLE</small>
          <strong>{product.code}</strong>
        </div>
        <div>
          <small>SOURCE MODEL</small>
          <strong>{product.sourceModel}</strong>
        </div>
        <div>
          <small>SIZE DIRECTION</small>
          <strong>{product.size}</strong>
        </div>
        <div>
          <small>CLOSURE</small>
          <strong>{product.closure}</strong>
        </div>
      </section>

      <section className="section product-spec-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PRODUCT-PROOF FIRST</p>
            <h2>Facts for a first sourcing review.</h2>
          </div>
          <p>
            Visible product facts and documented package data are separated from
            commercial details that still require order-by-order confirmation.
          </p>
        </div>
        <div className="spec-layout">
          <dl className="spec-table">
            <div>
              <dt>Style code</dt>
              <dd>{product.code}</dd>
            </div>
            <div>
              <dt>Source model</dt>
              <dd>{product.sourceModel}</dd>
            </div>
            <div>
              <dt>Product group</dt>
              <dd>{product.group}</dd>
            </div>
            <div>
              <dt>Closure</dt>
              <dd>{product.closure}</dd>
            </div>
            <div>
              <dt>Upper direction</dt>
              <dd>{product.upper}</dd>
            </div>
            <div>
              <dt>Sole direction</dt>
              <dd>{product.sole}</dd>
            </div>
            <div>
              <dt>Size direction</dt>
              <dd>{product.size}</dd>
            </div>
            <div>
              <dt>Colors documented</dt>
              <dd>{product.colors.join(", ")}</dd>
            </div>
          </dl>
          <aside className="confirmation-card">
            <p className="eyebrow">CONFIRM BEFORE QUOTATION</p>
            <h3>Protect buyer trust with exact specifications.</h3>
            <ul>
              {product.confirmBeforeQuote.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <a className="text-link" href="#inquiry">
              Prepare these details →
            </a>
          </aside>
        </div>
      </section>

      <section className="product-gallery">
        <div className="product-evidence-heading">
          <p className="eyebrow eyebrow-light">REAL PRODUCT PACKAGE</p>
          <h2>Review the product and available visual directions.</h2>
        </div>
        <div className="detail-gallery-grid">
          {product.images.map((image, index) => (
            <figure
              key={image}
              className={index === 0 ? "gallery-feature" : ""}
            >
              <img
                src={webGalleryImage(image)}
                alt={`${product.code} ${product.name} product view ${index + 1}`}
                loading={index > 0 ? "lazy" : undefined}
                decoding="async"
              />
              <figcaption>
                {index === 0
                  ? "Primary product view"
                  : `Product view ${index + 1}`}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="section buyer-use-section">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">BUYER FIT</p>
            <h2>
              Use this style as a sourcing candidate, not a generic promise.
            </h2>
          </div>
        </div>
        <div className="buyer-grid">
          <article>
            <span>01</span>
            <h3>{product.buyerFit}</h3>
            <p>
              Review the documented silhouette, closure, size and color
              directions against your channel needs.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Sample validation</h3>
            <p>
              Confirm materials, construction, fit and packing on the selected
              sample before bulk terms.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Commercial qualification</h3>
            <p>
              Share quantity, target market and order requirements so the
              factory can prepare a useful quotation.
            </p>
          </article>
        </div>
      </section>

      <section
        className="product-trust-strip"
        aria-label="Beiqiang supply information"
      >
        <Link href="/factory/">
          <strong>Factory evidence</strong>
          <span>Review real working-area images →</span>
        </Link>
        <Link href="/quality-packing/">
          <strong>Quality &amp; packing</strong>
          <span>Prepare order requirements →</span>
        </Link>
        <Link href="/oem-odm/">
          <strong>OEM / ODM discussion</strong>
          <span>Check feasibility first →</span>
        </Link>
        <Link href="/sample-order-process/">
          <strong>Sample &amp; order process</strong>
          <span>See every next decision →</span>
        </Link>
      </section>
      {related.length > 0 && (
        <section className="section related-section">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">COMPARE BEFORE SAMPLING</p>
              <h2>Related sourcing candidates.</h2>
            </div>
          </div>
          <div className="product-grid">
            {related.map((item) => (
              <ProductCard key={item.code} product={item} />
            ))}
          </div>
        </section>
      )}
      <section className="product-inquiry-section" id="inquiry">
        <ProductInquiry
          code={product.code}
          label={label}
          productName={`${product.sourceModel} ${product.name}`}
          alibabaProductId={product.alibabaProductId}
        />
      </section>
      <SiteFooter />
      <article
        className="product-print-sheet"
        aria-label={`${product.code} printable sourcing review sheet`}
      >
        <header>
          <div>
            <p>BEIQIANG FOOTWEAR · B2B PRODUCT SHEET</p>
            <h1>
              {product.code} · {product.name}
            </h1>
            <span>Source model {product.sourceModel}</span>
          </div>
          <strong>
            SOURCING REVIEW
            <br />
            NOT A QUOTATION
          </strong>
        </header>
        <section className="product-print-summary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images[0]}
            alt={`${product.code} ${product.name}`}
          />
          <div>
            <p>{product.shortDescription}</p>
            <h2>Documented product direction</h2>
            <ul>
              {product.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </div>
        </section>
        <section className="product-print-specs">
          <h2>Documented product facts</h2>
          <dl>
            <div>
              <dt>Style code</dt>
              <dd>{product.code}</dd>
            </div>
            <div>
              <dt>Source model</dt>
              <dd>{product.sourceModel}</dd>
            </div>
            <div>
              <dt>Product group</dt>
              <dd>{product.group}</dd>
            </div>
            <div>
              <dt>Closure</dt>
              <dd>{product.closure}</dd>
            </div>
            <div>
              <dt>Upper direction</dt>
              <dd>{product.upper}</dd>
            </div>
            <div>
              <dt>Sole direction</dt>
              <dd>{product.sole}</dd>
            </div>
            <div>
              <dt>Size direction</dt>
              <dd>{product.size}</dd>
            </div>
            <div>
              <dt>Documented colors</dt>
              <dd>{product.colors.join(", ")}</dd>
            </div>
            <div>
              <dt>Buyer fit</dt>
              <dd>{product.buyerFit}</dd>
            </div>
          </dl>
        </section>
        <section className="product-print-confirm">
          <h2>Confirm before quotation or order</h2>
          <ul>
            {product.confirmBeforeQuote.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            Price, MOQ, availability, material execution, size ratio, packing,
            lead time, testing and trade terms require written confirmation for
            the selected project. Sample approval does not by itself create a
            bulk order.
          </p>
        </section>
        <footer>
          <div>
            <strong>Quanzhou Beiqiang Footwear &amp; Apparel Co., Ltd.</strong>
            <span>
              OEM/ODM and wholesale footwear supply · Quanzhou, Fujian, China
            </span>
          </div>
          <div>
            <span>421345308@qq.com</span>
            <span>WhatsApp +86 189 5980 5256</span>
            <span>www.beiqiang.online/products/{product.slug}/</span>
          </div>
        </footer>
      </article>
    </main>
  );
}
