import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer>
      <div className="brand footer-brand"><span className="brand-mark">BQ</span><span><strong>BEIQIANG</strong><small>FOOTWEAR SUPPLY</small></span></div>
      <p>Quanzhou Beiqiang Footwear &amp; Apparel Co., Ltd.<br />Quanzhou, Fujian, China<br /><a href="mailto:421345308@qq.com">421345308@qq.com</a> · <a href="https://wa.me/8618959805256" target="_blank" rel="noreferrer">WhatsApp +86 189 5980 5256</a></p>
      <p className="footer-links"><Link href="/line-sheet/">30-style line sheet</Link><Link href="/buyer-guide/">B2B buyer guide</Link><Link href="/solutions/wholesale-walking-shoes/">Wholesale sourcing</Link><Link href="/solutions/private-label-walking-shoes/">Private label</Link><Link href="/solutions/oem-knit-shoes/">OEM knit development</Link><Link href="/factory/">Factory</Link><Link href="/quality-packing/">Quality &amp; packing</Link><Link href="/oem-odm/">OEM / ODM</Link><Link href="/sample-order-process/">Sample &amp; order process</Link><Link href="/inquiry-status/">Check request status</Link><Link href="/privacy/">Privacy</Link><Link href="/terms/">Terms</Link></p>
    </footer>
  );
}
