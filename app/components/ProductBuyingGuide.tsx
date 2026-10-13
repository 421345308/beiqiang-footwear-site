import Link from "next/link";
import type { Product } from "../data/products";
import { getProductBuyingGuide } from "../lib/product-buying-guide";

export default function ProductBuyingGuide({ product, locale = "en" }: { product: Product; locale?: "en" | "zh" }) {
  const zh = locale === "zh";
  const prefix = zh ? "/zh" : "";
  const guide = getProductBuyingGuide(product, locale);
  return <section className="section buyer-use-section product-buying-guide" aria-labelledby={`buying-guide-${product.code}`}>
    <div className="section-heading compact"><div>
      <p className="eyebrow">{zh ? `${product.code} 选款与看样` : `${product.code} SELECTION & SAMPLING`}</p>
      <h2 id={`buying-guide-${product.code}`}>{zh ? "这款鞋适合您的产品线吗？" : "Could this style suit your range?"}</h2>
    </div></div>
    <div className="buyer-grid">
      <article><span>01</span><h3>{zh ? "先比较款式" : "Compare the starting style"}</h3><p>{guide.shape}</p>
        <Link className="text-link" href={`${prefix}/products/`}>{zh ? "返回目录比较 →" : "Compare catalogue styles →"}</Link>
      </article>
      <article><span>02</span><h3>{zh ? "拿到样品，重点看这几项" : "What to check in the sample"}</h3>
        <ul>{guide.checks.map((check) => <li key={check}>{check}</li>)}</ul>
        <p className="sample-check-note">{zh ? "这是看样建议，不是本款已通过检测的声明。" : "These are suggested checks, not test results for this style."}</p>
        <Link className="text-link" href={`${prefix}/sample-order-process/`}>{zh ? "了解样品安排 →" : "See the sample process →"}</Link>
      </article>
      <article><span>03</span><h3>{zh ? "把数量和改动说清楚" : "Plan the order and any changes"}</h3><p>{guide.order}</p>
        <p>{zh ? "需要加Logo、调整颜色或包装？询价时一并说明，修改方式与费用另行确认。" : "Need a logo, different colors or packaging? Include the changes in your inquiry so the method and costs can be checked separately."}</p>
        <a className="text-link" href="#inquiry">{zh ? `咨询${product.code}样品或报价 →` : `Ask about ${product.code} samples or a quote →`}</a>
      </article>
    </div>
    <nav className="product-program-links" aria-label={zh ? "按采购需求了解方案" : "Explore your sourcing options"}>
      <Link href={`${prefix}/solutions/wholesale-walking-shoes/`}>{zh ? "采购现有款：批发方案 →" : "Buying existing styles: wholesale →"}</Link>
      <Link href={`${prefix}/solutions/private-label-walking-shoes/`}>{zh ? "做自己的品牌：贴牌方案 →" : "Adding your brand: private label →"}</Link>
      <Link href={`${prefix}/solutions/oem-knit-shoes/`}>{zh ? "改变结构或新设计：开发咨询 →" : "New construction or design: development →"}</Link>
    </nav>
  </section>;
}
