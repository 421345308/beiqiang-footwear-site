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
          <Link href="/collections/wide-toe-box/">Wide toe</Link>
          <Link href="/collections/knit-slip-on/">Easy-on</Link>
          <Link href="/#proof">Factory proof</Link>
        </nav>
        <Link className="button button-small" href="/#inquiry">Request a sample</Link>
      </header>
    </>
  );
}
