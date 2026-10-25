import Link from "next/link";
import QuoteListLink from "./QuoteListLink";
import MobileNavigation from "./MobileNavigation";
import DesktopBuyerNavigation from "./DesktopBuyerNavigation";

export default function SiteHeader({ chineseHref = "/zh/" }: { chineseHref?: string }) {
  return (
    <>
      <div className="top-note">
        <span>FOOTWEAR MANUFACTURING · QUANZHOU, CHINA</span>
        <span>OEM / ODM · PRIVATE LABEL · WHOLESALE</span>
      </div>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Beiqiang Footwear home">
          <span className="brand-mark">BQ</span>
          <span><strong>BEIQIANG</strong><small>FOOTWEAR SUPPLY</small></span>
        </Link>
        <DesktopBuyerNavigation locale="en" alternateHref={chineseHref} />
        <QuoteListLink />
        <MobileNavigation chineseHref={chineseHref} />
      </header>
    </>
  );
}
