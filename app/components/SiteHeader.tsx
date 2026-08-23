import Link from "next/link";
import QuoteListLink from "./QuoteListLink";
import MobileNavigation from "./MobileNavigation";

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
          <Link href="/line-sheet/">Line sheet</Link>
          <Link href="/factory/">Factory</Link>
          <Link href="/quality-packing/">Quality &amp; packing</Link>
          <Link href="/oem-odm/">OEM / ODM</Link>
          <Link href="/resources/">Resources</Link>
          <Link href="/buyer-workspace/">Buyer workspace</Link>
        </nav>
        <QuoteListLink />
        <MobileNavigation />
      </header>
    </>
  );
}
