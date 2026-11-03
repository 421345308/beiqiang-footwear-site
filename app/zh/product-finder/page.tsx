import type { Metadata } from "next";
import ProductFinder from "../../components/ProductFinder";
import ChineseSiteFooter from "../../components/ChineseSiteFooter";
import ChineseSiteHeader from "../../components/ChineseSiteHeader";

export const metadata: Metadata = {
  title: "B2B鞋款采购选款助手｜贝强鞋业",
  description:
    "按销售渠道、产品方向和穿脱方式，快速挑选适合您业务的贝强鞋款。",
  alternates: {
    canonical: "https://www.beiqiang.online/zh/product-finder/",
    languages: {
      en: "https://www.beiqiang.online/product-finder/",
      "zh-CN": "https://www.beiqiang.online/zh/product-finder/",
      "x-default": "https://www.beiqiang.online/product-finder/",
    },
  },
};

export default function ChineseProductFinderPage() {
  return (
    <main>
      <ChineseSiteHeader englishHref="/product-finder/" />
      <section className="finder-hero">
        <p className="eyebrow">B2B采购选款助手</p>
        <h1>找到适合您市场的鞋款。</h1>
        <p>
          选择销售渠道、产品方向和穿脱方式，浏览适合的鞋款并加入询价单。
        </p>
      </section>
      <section className="section">
        <ProductFinder locale="zh" />
      </section>
      <ChineseSiteFooter />
    </main>
  );
}
