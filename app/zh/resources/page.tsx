import type { Metadata } from "next";
import Link from "next/link";
import ChineseSiteHeader from "../../components/ChineseSiteHeader";
import ChineseSiteFooter from "../../components/ChineseSiteFooter";
import { chineseBuyerResources } from "../../data/resources-zh";

export const metadata: Metadata = {
  title: "鞋类B2B采购知识与清单 | 贝强鞋业",
  description: "面向进口商、批发商、线上卖家和品牌买家的鞋类询价、样品审核与私标采购指南。",
  alternates: { canonical: "https://www.beiqiang.online/zh/resources/", languages: { "zh-CN": "https://www.beiqiang.online/zh/resources/", en: "https://www.beiqiang.online/resources/" } },
  openGraph: { title: "鞋类B2B采购知识与清单", description: "准备更清晰的询价、控制样品审核，并把私标鞋类项目推进到正式订单。", url: "https://www.beiqiang.online/zh/resources/", type: "website", locale: "zh_CN" },
};

export default function ChineseResourcesPage() {
  const structuredData = { "@context": "https://schema.org", "@type": "CollectionPage", name: "贝强鞋类采购知识", description: metadata.description, url: "https://www.beiqiang.online/zh/resources/", hasPart: chineseBuyerResources.map((resource) => ({ "@type": "Article", headline: resource.title, url: `https://www.beiqiang.online/zh/resources/${resource.slug}/` })) };
  return <main><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><ChineseSiteHeader englishHref="/resources/" />
    <section className="resource-hub-hero"><div><p className="eyebrow">B2B鞋类采购知识</p><h1>把产品兴趣整理成供应商可以审核的采购需求。</h1><p>围绕询价、样品审核和私标订单准备的实用指南；重点是决定、证据和商业边界，而不是零售宣传。</p><div className="hero-actions"><Link className="button" href="/zh/request-quote/">建立采购询价</Link><Link className="text-link" href="/zh/products/">比较30款真实产品资料 <span aria-hidden="true">→</span></Link></div></div><aside><strong>用于B2B决策</strong><span>没有零售结账</span><span>不虚构工厂能力</span><span>不自动建立生产订单</span></aside></section>
    <section className="section resource-hub-intro"><div className="section-heading"><div><p className="eyebrow">选择当前决定</p><h2>在项目最容易失去清晰度的阶段使用对应清单。</h2></div><p>每份指南都连接真实产品资料与结构化下一步；未知规格在确认前保持可见。</p></div><div className="resource-card-grid">{chineseBuyerResources.map((resource, index) => <article key={resource.slug}><span>{String(index + 1).padStart(2, "0")}</span><small>{resource.eyebrow}</small><h3>{resource.title}</h3><p>{resource.description}</p><div><b>{resource.audience}</b><i>{resource.readingTime}</i></div><Link href={`/zh/resources/${resource.slug}/`}>打开采购指南 <span aria-hidden="true">→</span></Link></article>)}</div></section>
    <section className="resource-evidence-strip"><div><p className="eyebrow eyebrow-light">证据边界</p><h2>指南能改善需求，但不能确认产品。</h2></div><p>材料、尺码配比、价格、MOQ、样品安排、交期、包装、测试、可用情况和正式订单条款仍需按产品和项目书面确认。</p></section>
    <section className="section resource-route-grid"><article><small>现有产品</small><h3>比较真实产品资料</h3><p>审核图库、尺码方向、结构与待确认项。</p><Link href="/zh/products/">打开产品目录 →</Link></article><article><small>私标项目</small><h3>准备定制范围</h3><p>把Logo和包装与需要可行性审核或打样的改动分开。</p><Link href="/zh/solutions/private-label-walking-shoes/">打开私标路径 →</Link></article><article><small>技术开发</small><h3>安全定义买家目标</h3><p>受控数值、新模具和测试需要开发需求，不应立即承诺。</p><Link href="/zh/solutions/oem-knit-shoes/">打开技术开发路径 →</Link></article></section><ChineseSiteFooter />
  </main>;
}
