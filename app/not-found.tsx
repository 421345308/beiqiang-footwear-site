import Link from "next/link";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";

export default function NotFound() {
  return (
    <main>
      <SiteHeader />
      <section className="catalog-hero">
        <p className="eyebrow">ERROR 404 · PAGE NOT FOUND</p>
        <h1>This address does not exist.</h1>
        <p>
          The link may be out of date, or the address may contain a typo. Nothing
          has been lost: every current style, buyer guide and inquiry route is
          reachable from the catalogue below.
        </p>
        <div className="hero-actions">
          <Link className="button" href="/products/">
            Browse the product catalogue
          </Link>
          <Link className="text-link" href="/product-finder/">
            Find styles by requirement →
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">START FROM WHERE YOU ARE</p>
            <h2>Pick the step that matches your order.</h2>
          </div>
        </div>
        <div className="collection-grid">
          <Link href="/products/">
            <span>Current selection</span>
            <h3>Compare current styles</h3>
            <p>
              Review slip-ons, lace-ups and verified wide-toe styles, then add
              several to one quote list.
            </p>
            <strong>Open the catalogue →</strong>
          </Link>
          <Link href="/product-finder/">
            <span>Guided shortlist</span>
            <h3>Describe what you need</h3>
            <p>
              Give your market, closure preference and quantity to narrow the
              current selection before you inquire.
            </p>
            <strong>Use the product finder →</strong>
          </Link>
          <Link href="/request-quote/">
            <span>Direct inquiry</span>
            <h3>Send a quote brief</h3>
            <p>
              Share style codes, quantities, size mix and destination for a
              written quotation.
            </p>
            <strong>Start a quote brief →</strong>
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">中文访问</p>
            <h2>这个地址不存在。</h2>
            <p>
              链接可能已经失效，或地址输入有误。当前在售款式、采购指南和询价入口都可以从中文站重新进入。
            </p>
            <p>
              <Link className="text-link" href="/zh/">
                访问中文站 →
              </Link>
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
