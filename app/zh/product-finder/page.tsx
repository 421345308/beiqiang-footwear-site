import type { Metadata } from "next";
import ProductFinder from "../../components/ProductFinder";
import ChineseSiteFooter from "../../components/ChineseSiteFooter";
import ChineseSiteHeader from "../../components/ChineseSiteHeader";

export const metadata: Metadata = {
  title: "B2B鞋款采购选款助手｜贝强鞋业",
  description:
    "按买家渠道、产品方向和穿脱结构，从贝强当前在线步行鞋与休闲鞋选款中生成2至4款有依据的候选清单。",
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
        <h1>从当前在线选款缩小到可审核的候选清单。</h1>
        <p>
          选择买家渠道、首要产品方向和穿脱结构。结果会说明为什么匹配，以及正式报价前仍需确认什么。
        </p>
      </section>
      <section className="section">
        <ProductFinder locale="zh" />
      </section>
      <ChineseSiteFooter />
    </main>
  );
}
