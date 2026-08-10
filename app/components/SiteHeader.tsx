import Link from "next/link";

export default function SiteHeader() {
  return (
    <>
      <div className="top-note">
        <span>QUANZHOU FOOTWEAR FACTORY SUPPLIER</span>
        <span>Samples and specifications confirmed before bulk orders</span>
      </div>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Beiqiang Footwear home">
          <span className="brand-mark">BQ</span>
          <span><strong>BEIQIANG</strong><small>FOOTWEAR SUPPLY</small></span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link href="/products/">All products</Link>
          <Link href="/factory/">Factory</Link>
          <Link href="/quality-packing/">Quality &amp; packing</Link>
          <Link href="/oem-odm/">OEM / ODM</Link>
          <Link href="/sample-order-process/">Order process</Link>
        </nav>
        <Link className="button button-small" href="/#inquiry">Request a sample</Link>
      </header>
    </>
  );
}
