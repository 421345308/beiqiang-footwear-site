import type { Metadata } from "next";
import ChineseSiteFooter from "../../components/ChineseSiteFooter";
import ChineseSiteHeader from "../../components/ChineseSiteHeader";
import SourcingReviewForm from "../../components/SourcingReviewForm";

export const metadata: Metadata = { title: "鞋款选型与定制咨询｜贝强鞋业", description: "还没选好鞋款？提供销售市场、参考款和大致数量，咨询贝强的选款、定制可行性、样品与报价安排。", alternates: { canonical: "https://www.beiqiang.online/zh/sourcing-review/", languages: { en: "https://www.beiqiang.online/sourcing-review/", "zh-CN": "https://www.beiqiang.online/zh/sourcing-review/", "x-default": "https://www.beiqiang.online/sourcing-review/" } } };

export default function ChineseSourcingReviewPage() { return <main>
  <ChineseSiteHeader englishHref="/sourcing-review/" />
  <section className="finder-hero"><p className="eyebrow">选款与定制咨询</p><h1>还没找到想要的鞋？先说说您的想法。</h1><p>告诉我们卖给谁、想找什么款式，以及大致数量。不用先选好款号，也不必准备完整规格。有参考链接，可以直接放进需求里。</p></section>
  <section className="section sourcing-review-layout">
    <aside><p className="eyebrow">提交后怎么推进</p><h2>先看有没有合适的起点，再讨论具体做法。</h2>
      <ol><li><strong>了解您的要求</strong><span>对照现有鞋款，确认哪些可能合适。如果没有匹配款，我们会说明，不用别的鞋替代您的需求。</span></li>
      <li><strong>沟通候选款和修改</strong><span>有合适选项时，可以建议2至4款，说明还需调整什么。收到参考图，不等于已经确认能够生产。</span></li>
      <li><strong>确认样品或报价安排</strong><span>一起补齐所需资料，在您决定之前说清费用、时间和下一步。</span></li></ol>
      <small>这是咨询，不是下单。供货、定制、价格和时间均需书面确认。提交后可私密上传参考图片；涉及保密文件，请先沟通保密协议。</small>
    </aside>
    <SourcingReviewForm locale="zh" />
  </section><ChineseSiteFooter />
</main>; }
