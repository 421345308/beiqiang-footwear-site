import Link from "next/link";
import { productCount } from "../data/catalog-meta";

export default function SiteFooter() {
  return (
    <footer>
      <div className="brand footer-brand"><span className="brand-mark">BQ</span><span><strong>BEIQIANG</strong><small>FOOTWEAR SUPPLY</small></span></div>
      <p>Quanzhou Beiqiang Footwear &amp; Apparel Co., Ltd.<br />No. 26, Xitou, Pengshu Village, Majia Town, Luojiang District, Quanzhou, Fujian 362014, China<br /><a href="mailto:shepeiqiang@gmail.com">shepeiqiang@gmail.com</a> · <a href="https://wa.me/8618959805256" target="_blank" rel="noreferrer">WhatsApp +86 189 5980 5256</a></p>
      <p className="footer-links"><Link href="/line-sheet/">{productCount}-style line sheet</Link><Link href="/resources/">Sourcing resources</Link><Link href="/buyer-guide/">B2B buyer guide</Link><Link href="/buyer-workspace/">Buyer workspace</Link><Link href="/solutions/wholesale-walking-shoes/">Wholesale sourcing</Link><Link href="/solutions/private-label-walking-shoes/">Private label</Link><Link href="/private-label-concept/">Logo concept studio</Link><Link href="/solutions/oem-knit-shoes/">OEM knit development</Link><Link href="/factory/">Factory</Link><Link href="/quality-packing/">Quality &amp; packing</Link><Link href="/oem-odm/">OEM / ODM</Link><Link href="/sample-order-process/">Sample &amp; order process</Link><Link href="/inquiry-status/">Check request status</Link><Link href="/privacy/">Privacy</Link><Link href="/terms/">Terms</Link><Link href="/zh/" hrefLang="zh-CN" lang="zh-CN">简体中文</Link></p>
    </footer>
  );
}
