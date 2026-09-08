import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ChineseProductCard from "../../../components/ChineseProductCard";
import ChineseSiteFooter from "../../../components/ChineseSiteFooter";
import ChineseSiteHeader from "../../../components/ChineseSiteHeader";
import {
  SourcingProgramCta,
  SourcingProgramView,
} from "../../../components/SourcingProgramTracking";
import { products } from "../../../data/products";
import {
  chineseSourcingPrograms,
  getChineseSourcingProgram,
} from "../../../data/sourcing-programs-zh";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return chineseSourcingPrograms.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const program = getChineseSourcingProgram((await params).slug);
  if (!program) return {};
  const canonical = `https://www.beiqiang.online/zh/solutions/${program.slug}/`;
  const english = `https://www.beiqiang.online/solutions/${program.slug}/`;
  return {
    title: `${program.title} | 贝强鞋业`,
    description: program.description,
    alternates: { canonical, languages: { "zh-CN": canonical, en: english } },
    openGraph: {
      title: program.title,
      description: program.description,
      url: canonical,
      type: "website",
      locale: "zh_CN",
    },
  };
}

export default async function ChineseSourcingProgramPage({ params }: Props) {
  const program = getChineseSourcingProgram((await params).slug);
  if (!program) notFound();
  const selectedProducts = program.productCodes
    .map((code) => products.find((product) => product.code === code))
    .filter((product) => product !== undefined);
  const quoteHref = `/zh/request-quote/?program=${program.slug}&path=${program.projectPath}`;
  const url = `https://www.beiqiang.online/zh/solutions/${program.slug}/`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: program.title,
        description: program.description,
        provider: {
          "@type": "Organization",
          name: "Quanzhou Beiqiang Footwear & Apparel Co., Ltd.",
        },
        areaServed: ["United States", "Europe"],
        serviceType: program.pathLabel,
        url,
      },
      {
        "@type": "FAQPage",
        mainEntity: program.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "中文首页",
            item: "https://www.beiqiang.online/zh/",
          },
          { "@type": "ListItem", position: 2, name: "采购方案" },
          { "@type": "ListItem", position: 3, name: program.title, item: url },
        ],
      },
    ],
  };
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SourcingProgramView slug={program.slug} />
      <ChineseSiteHeader englishHref={`/solutions/${program.slug}/`} />
      <section className="sourcing-program-hero">
        <div>
          <p className="eyebrow">{program.eyebrow}</p>
          <h1>{program.title}</h1>
          <p>{program.description}</p>
          <div className="hero-actions">
            <SourcingProgramCta slug={program.slug} href={quoteHref}>
              建立项目需求
            </SourcingProgramCta>
            <Link className="text-link" href="/zh/products/">
              浏览当前在线选款 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <aside>
          <small>适合买家</small>
          <strong>{program.buyerIntent}</strong>
          <span>{program.pathLabel}</span>
        </aside>
      </section>
      <section className="section sourcing-program-value">
        <div className="section-heading">
          <div>
            <p className="eyebrow">合作内容</p>
            <h2>我们会和您一起解决什么。</h2>
          </div>
          <p>{program.evidenceBoundary}</p>
        </div>
        <div>
          {program.benefits.map((benefit, index) => (
            <article key={benefit.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{benefit.title}</h3>
              <p>{benefit.copy}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="sourcing-program-brief">
        <div>
          <p className="eyebrow eyebrow-light">需要准备</p>
          <h2>先准备这些信息，沟通会更顺畅。</h2>
          <p>
            还没确定的地方可以留空或写“待定”，我们会在沟通时一起补充。
          </p>
        </div>
        <ul>
          {program.briefItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">相关产品参考</p>
            <h2>先看看这些基础鞋款。</h2>
          </div>
          <p>打开产品页查看真实图库、当前已整理事实和报价前仍需确认的项目。</p>
        </div>
        <div className="product-grid catalog-grid">
          {selectedProducts.map((product) => (
            <ChineseProductCard key={product.code} product={product} />
          ))}
        </div>
      </section>
      <section className="section sourcing-program-workflow">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">买家流程</p>
            <h2>从第一次联系到确定订单。</h2>
          </div>
        </div>
        <div>
          {program.workflow.map((step, index) => (
            <article key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section sourcing-program-faq">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">买家常见问题</p>
            <h2>客户常问的问题。</h2>
          </div>
        </div>
        <div>
          {program.faq.map((item) => (
            <details key={item.question}>
              <summary>
                {item.question}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="sourcing-program-close">
        <div>
          <p className="eyebrow eyebrow-light">开始沟通</p>
          <h2>把您想做的鞋发给我们。</h2>
          <p>
            可以先选择产品，也可以从项目要求开始。报价、样品和订单条款均需书面确认。
          </p>
        </div>
        <div>
          <SourcingProgramCta
            slug={program.slug}
            href={quoteHref}
            className="button button-light"
          >
            进入这条采购路径
          </SourcingProgramCta>
          <a
            href="https://wa.me/8618959805256"
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp +86 189 5980 5256 →
          </a>
        </div>
      </section>
      <ChineseSiteFooter />
    </main>
  );
}
