import type { Metadata } from "next";
import Link from "next/link";
import ChineseSiteHeader from "../../components/ChineseSiteHeader";
import ChineseSiteFooter from "../../components/ChineseSiteFooter";
import { chineseBuyerResources } from "../../data/resources-zh";

export const metadata: Metadata = {
  title: "鞋类B2B采购知识与清单 | 贝强鞋业",
  description:
    "面向进口商、批发商、线上卖家和品牌买家的鞋类询价、样品审核与私标采购指南。",
  alternates: {
    canonical: "https://www.beiqiang.online/zh/resources/",
    languages: {
      "zh-CN": "https://www.beiqiang.online/zh/resources/",
      en: "https://www.beiqiang.online/resources/",
      "x-default": "https://www.beiqiang.online/resources/",
    },
  },
  openGraph: {
    title: "鞋类B2B采购知识与清单",
    description:
      "准备更清晰的询价、控制样品审核，并把私标鞋类项目推进到正式订单。",
    url: "https://www.beiqiang.online/zh/resources/",
    type: "website",
    locale: "zh_CN",
  },
};

export default function ChineseResourcesPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "贝强鞋类采购知识",
    description: metadata.description,
    url: "https://www.beiqiang.online/zh/resources/",
    hasPart: chineseBuyerResources.map((resource) => ({
      "@type": "Article",
      headline: resource.title,
      url: `https://www.beiqiang.online/zh/resources/${resource.slug}/`,
    })),
  };
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ChineseSiteHeader englishHref="/resources/" />
      <section className="resource-hub-hero">
        <div>
          <p className="eyebrow">B2B鞋类采购知识</p>
          <h1>鞋类采购与品牌定制指南。</h1>
          <p>
            从挑选鞋款到沟通样品、报价和包装，了解采购各阶段需要准备的信息。
          </p>
          <div className="hero-actions">
            <Link className="button" href="/zh/request-quote/">
              建立采购询价
            </Link>
            <Link className="text-link" href="/zh/products/">
              浏览产品系列 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <aside>
          <strong>采购沟通</strong>
          <span>选款与配色</span>
          <span>样品与报价</span>
          <span>品牌与包装</span>
        </aside>
      </section>
      <section className="section resource-hub-intro">
        <div className="section-heading">
          <div>
            <p className="eyebrow">采购指南</p>
            <h2>按采购阶段找到需要的信息。</h2>
          </div>
          <p>
            了解如何整理采购需求、评估样品和准备品牌定制。
          </p>
        </div>
        <div className="resource-card-grid">
          {chineseBuyerResources.map((resource, index) => (
            <article key={resource.slug}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <small>{resource.eyebrow}</small>
              <h3>{resource.title}</h3>
              <p>{resource.description}</p>
              <div>
                <b>{resource.audience}</b>
                <i>{resource.readingTime}</i>
              </div>
              <Link href={`/zh/resources/${resource.slug}/`}>
                打开采购指南 <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="resource-evidence-strip">
        <div>
          <p className="eyebrow eyebrow-light">与贝强合作</p>
          <h2>从选款开始，逐步推进采购。</h2>
        </div>
        <p>
          告诉我们您的目标市场、感兴趣的款式、数量和品牌要求，我们将与您讨论样品和报价。
        </p>
      </section>
      <section className="section resource-route-grid">
        <article>
          <small>现有产品</small>
          <h3>比较真实产品资料</h3>
          <p>查看产品图片、尺码和款式细节。</p>
          <Link href="/zh/products/">打开产品目录 →</Link>
        </article>
        <article>
          <small>私标项目</small>
          <h3>准备定制范围</h3>
          <p>把Logo和包装与需要可行性审核或打样的改动分开。</p>
          <Link href="/zh/solutions/private-label-walking-shoes/">
            打开私标路径 →
          </Link>
        </article>
        <article>
          <small>技术开发</small>
          <h3>安全定义买家目标</h3>
          <p>受控数值、新模具和测试需要开发需求，不应立即承诺。</p>
          <Link href="/zh/solutions/oem-knit-shoes/">打开技术开发路径 →</Link>
        </article>
      </section>
      <ChineseSiteFooter />
    </main>
  );
}
