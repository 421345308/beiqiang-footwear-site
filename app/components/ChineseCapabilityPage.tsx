import Link from "next/link";
import ChineseSiteFooter from "./ChineseSiteFooter";
import ChineseSiteHeader from "./ChineseSiteHeader";
import FactoryEvidenceVideo from "./FactoryEvidenceVideo";
import FactoryReviewPack from "./FactoryReviewPack";

export type ChineseCapabilityPageData = {
  eyebrow: string;
  title: string;
  introduction: string;
  primaryCta: string;
  primaryHref?: string;
  proofLabel: string;
  proofTitle: string;
  proofCopy: string;
  images: { src: string; alt: string; caption: string }[];
  evidenceVideo?: boolean;
  stepsTitle: string;
  steps: { title: string; copy: string }[];
  confirmedTitle: string;
  confirmed: string[];
  confirmTitle: string;
  confirm: string[];
  closingTitle: string;
  closingCopy: string;
  englishHref: string;
  factoryReviewPackProductCount?: number;
};

export default function ChineseCapabilityPage({ data }: { data: ChineseCapabilityPageData }) {
  const webImage = (src: string) => src.startsWith("/factory/") ? src.replace("/factory/", "/factory-web/").replace(/\.(?:jpe?g|png)$/i, ".webp") : src;
  return <main>
    <ChineseSiteHeader englishHref={data.englishHref} />
    <section className="capability-hero"><div><p className="eyebrow">{data.eyebrow}</p><h1>{data.title}</h1><p className="hero-lead">{data.introduction}</p><div className="hero-actions"><Link className="button" href={data.primaryHref || "/zh/request-quote/"}>{data.primaryCta}</Link><Link className="text-link" href="/zh/products/">选择产品 <span aria-hidden="true">→</span></Link></div></div><aside className="capability-brief"><small>为了获得有效首次回复</small><strong>请提供市场、渠道、参考款号、预计数量与目标时间。</strong><p>高影响规格和商业条款均按具体款式和项目确认。</p></aside></section>
    <section className="section capability-proof"><div className="section-heading"><div><p className="eyebrow">{data.proofLabel}</p><h2>{data.proofTitle}</h2></div><p>{data.proofCopy}</p></div>{data.evidenceVideo ? <FactoryEvidenceVideo locale="zh" /> : null}<div className="capability-gallery">{data.images.map((image, index) => <figure key={image.src} className={index === 0 ? "capability-gallery-lead" : ""}><img src={webImage(image.src)} alt={image.alt} loading={index > 0 ? "lazy" : undefined} decoding="async" /><figcaption>{image.caption}</figcaption></figure>)}</div></section>
    <section className="section capability-process"><div className="section-heading compact"><div><p className="eyebrow">买家流程</p><h2>{data.stepsTitle}</h2></div></div><div className="capability-step-grid">{data.steps.map((step, index) => <article key={step.title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{step.title}</h3><p>{step.copy}</p></article>)}</div></section>
    <section className="capability-checks"><article><p className="eyebrow eyebrow-light">现有证据</p><h2>{data.confirmedTitle}</h2><ul>{data.confirmed.map((item) => <li key={item}>{item}</li>)}</ul></article><article><p className="eyebrow">按订单确认</p><h2>{data.confirmTitle}</h2><ul>{data.confirm.map((item) => <li key={item}>{item}</li>)}</ul></article></section>
    {data.factoryReviewPackProductCount ? <FactoryReviewPack productCount={data.factoryReviewPackProductCount} locale="zh" /> : null}
    <section className="section capability-closing"><div><p className="eyebrow">下一步</p><h2>{data.closingTitle}</h2><p>{data.closingCopy}</p></div><div className="hero-actions"><Link className="button" href={data.primaryHref || "/zh/request-quote/"}>提交采购需求</Link><a className="text-link" href="https://wa.me/8618959805256" target="_blank" rel="noreferrer">通过WhatsApp沟通 <span aria-hidden="true">→</span></a></div></section>
    <ChineseSiteFooter />
  </main>;
}
