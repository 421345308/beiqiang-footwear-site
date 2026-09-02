import type { Metadata } from "next";
import PrivateLabelConceptStudio from "../../components/PrivateLabelConceptStudio";
import ChineseSiteFooter from "../../components/ChineseSiteFooter";
import ChineseSiteHeader from "../../components/ChineseSiteHeader";

export const metadata: Metadata = {
  title: "私标鞋Logo概念工作台｜贝强鞋业",
  description:
    "选择贝强真实产品款号，加入买家Logo概念，下载视觉简报，并把品牌要求带入结构化B2B询价。",
  alternates: {
    canonical: "https://www.beiqiang.online/zh/private-label-concept/",
    languages: {
      en: "https://www.beiqiang.online/private-label-concept/",
      "zh-CN": "https://www.beiqiang.online/zh/private-label-concept/",
      "x-default": "https://www.beiqiang.online/private-label-concept/",
    },
  },
};

export default function ChinesePrivateLabelConceptPage() {
  return (
    <main>
      <ChineseSiteHeader englishHref="/private-label-concept/" />
      <section className="concept-hero">
        <p className="eyebrow">私标买家工具</p>
        <h1>把一款真实鞋型变成更清楚的品牌需求。</h1>
        <p>
          选择贝强已整理产品，加入Logo或品牌文字，标记期望位置，并把买家目标带入结构化询价。预览只用于沟通，不是生产可行性或样品批准。
        </p>
      </section>
      <section className="section concept-studio">
        <PrivateLabelConceptStudio locale="zh" />
      </section>
      <section className="concept-process">
        <article>
          <span>01</span>
          <h2>选择真实依据</h2>
          <p>从当前已整理的产品款号开始，不使用无法识别的空泛参考。</p>
        </article>
        <article>
          <span>02</span>
          <h2>记录买家目标</h2>
          <p>说明图稿状态、期望位置和备注，但不把目标写成已经可生产。</p>
        </article>
        <article>
          <span>03</span>
          <h2>提交工厂审核</h2>
          <p>
            继续进入询价；需要时，在取得项目查询码后通过受保护项目上传下载的概念图。
          </p>
        </article>
      </section>
      <ChineseSiteFooter />
    </main>
  );
}
