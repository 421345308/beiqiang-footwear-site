import type { Metadata } from "next";
import Link from "next/link";
import ChineseSiteFooter from "../components/ChineseSiteFooter";
import ChineseSiteHeader from "../components/ChineseSiteHeader";
import FactoryEvidenceVideo from "../components/FactoryEvidenceVideo";
import HomepageFactoryEvidence from "../components/HomepageFactoryEvidence";
import { chineseCollections } from "../data/collections-zh";
import { factoryVideoSchema } from "../lib/factory-video-schema";

export const metadata: Metadata = {
  title: "贝强鞋业｜泉州鞋类工厂、批发与OEM/ODM供应",
  description: "泉州贝强鞋业面向进口商、批发商、线上卖家和品牌买家，提供鞋类批发、私标与OEM/ODM项目审核、样品沟通和B2B询价。",
  alternates: { canonical: "https://www.beiqiang.online/zh/", languages: { en: "https://www.beiqiang.online/", "zh-CN": "https://www.beiqiang.online/zh/", "x-default": "https://www.beiqiang.online/" } },
  openGraph: { title: "贝强鞋业｜泉州B2B鞋类工厂供应", description: "了解工厂与合作流程，浏览当前在线选款或提交目标款式，建立批发、私标及OEM/ODM采购需求。", url: "https://www.beiqiang.online/zh/", locale: "zh_CN", images: [{ url: "https://www.beiqiang.online/og.jpg", alt: "贝强鞋业B2B鞋类工厂供应" }] },
  twitter: { card: "summary_large_image", title: "贝强鞋业｜泉州B2B鞋类工厂供应", description: "了解工厂与合作流程，浏览当前在线选款或提交目标款式。", images: ["https://www.beiqiang.online/og.jpg"] },
};

export default function ChineseHome() {
  const brief = encodeURIComponent("您好，贝强鞋业。我希望了解鞋类产品选款、样品与B2B报价，请协助确认适合的款式和需要提供的采购资料。");
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(factoryVideoSchema("zh")) }} />
      <ChineseSiteHeader englishHref="/" />
      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">泉州鞋类工厂 · B2B供应</p>
          <h1>面向批发、私标与OEM项目的鞋类工厂。</h1>
          <p className="hero-lead">贝强服务进口商、批发商、Amazon/TikTok卖家、采购代理和品牌买家。您可以从当前在线产品开始，也可以直接发送参考款、目标市场和预计数量，由工厂审核更广的产品范围与下一步。</p>
          <div className="hero-actions"><Link className="button" href="/zh/request-quote/">提交采购项目</Link><Link className="button button-secondary" href="/zh/factory/">查看工厂与流程</Link><Link className="text-link" href="/zh/products/">浏览当前在线选款 →</Link></div>
          <dl className="hero-facts"><div><dt>B2B</dt><dd>批发与私标供应</dd></div><div><dt>OEM</dt><dd>按具体项目审核要求</dd></div><div><dt>泉州</dt><dd>中国福建鞋类供应基地</dd></div></dl>
        </div>
        <div className="hero-visual"><FactoryEvidenceVideo locale="zh" /></div>
      </section>

      <section className="assurance" aria-label="供应要点"><span>工厂端项目审核</span><span>真实产品与流程画面</span><span>大货前样品确认</span><span>书面确认规格与商业条款</span></section>

      <section className="section factory-home-intro">
        <div className="section-heading"><div><p className="eyebrow">先了解供应商</p><h2>看看贝强如何支持一次采购决定。</h2></div><p>这个网站是买家工作入口：介绍工厂、帮助缩小产品方向，并收集业务可以有效回复的采购资料。它不是零售结账页，也不表示每项定制要求已经可以执行。</p></div>
        <HomepageFactoryEvidence locale="zh" />
        <div className="trust-entry-grid"><Link href="/zh/factory/"><span>01</span><h3>工厂与工作区域</h3><p>查看当前工厂实拍，以及从产品方向到样品讨论的项目路径。</p><strong>打开工厂页面 →</strong></Link><Link href="/zh/quality-packing/"><span>02</span><h3>检查与包装</h3><p>了解订单中需要确认的产品、配码、包装与装箱信息。</p><strong>查看质量与包装 →</strong></Link><Link href="/zh/oem-odm/"><span>03</span><h3>OEM / ODM审核</h3><p>提交Logo、材料、颜色或开发目标，由工厂先审核可行性。</p><strong>准备OEM需求 →</strong></Link><Link href="/zh/sample-order-process/"><span>04</span><h3>从样品到正式订单</h3><p>了解从选款、样品到确认商业条款的每一步决定。</p><strong>查看买家流程 →</strong></Link></div>
      </section>

      <section className="section sourcing-program-entry">
        <div className="section-heading"><div><p className="eyebrow">选择采购路径</p><h2>先明确要做的商业决定。</h2></div><p>现有款、私标改款和技术开发需要不同资料。所有价格、MOQ、材料、尺码、包装与交期按具体项目书面确认。</p></div>
        <div className="sourcing-program-entry-grid"><Link href="/zh/solutions/wholesale-walking-shoes/"><span>01 · 当前产品与更广选款</span><h3>批发与多款测试</h3><p>从网站当前选款开始，或提交目标方向，由工厂审核适合进口、分销或线上渠道测试的组合。</p><strong>打开批发采购方案 →</strong></Link><Link href="/zh/solutions/private-label-walking-shoes/"><span>02 · 基础款调整</span><h3>私标与包装需求</h3><p>从具体产品或参考款开始，提交颜色、Logo、标签和包装方向，由工厂先审核可行性。</p><strong>打开私标采购方案 →</strong></Link><Link href="/zh/solutions/oem-knit-shoes/"><span>03 · 技术开发</span><h3>新楦、鞋底或测试目标</h3><p>把硬度、材料、模具、测试和保密要求作为买家目标提交，不提前写成贝强现有能力。</p><strong>打开技术开发方案 →</strong></Link></div>
      </section>

      <section className="proof-section" id="process">
        <div className="proof-image"><img src="/factory-web/batch-check.webp" alt="贝强鞋业鞋类产品装箱前批次检查与整理" loading="lazy" decoding="async" /></div>
        <div className="proof-copy"><p className="eyebrow eyebrow-light">从工厂审核到商业回复</p><h2>把产品方向变成工厂可以核对的采购资料。</h2><p>网站当前产品页是实用的起始选款，不是贝强产品范围的上限。业务也可以结合参考图、目标市场和预计数量审核其他工厂款式。</p><ul><li><span>01</span> 产品方向或参考图</li><li><span>02</span> 材料、尺码、颜色与包装要求</li><li><span>03</span> 样品与书面商业条款确认</li></ul><Link className="button button-light" href="/zh/request-quote/">建立采购询价</Link></div>
      </section>

      <section className="section collection-entry" id="collections">
        <div className="section-heading"><div><p className="eyebrow">当前产品方向</p><h2>用紧凑的分类入口进入产品库，不让单款产品代表工厂。</h2></div><p>这里连接当前网站已整理的56款产品，不是工厂全部产品。未找到目标款时，可以直接发送参考图，由业务审核更广的选款范围。</p></div>
        <div className="collection-grid">{chineseCollections.slice(0, 3).map((collection) => <Link key={collection.slug} href={`/zh/collections/${collection.slug}/`}><span>{collection.name}</span><h3>{collection.title}</h3><p>{collection.description}</p><strong>打开产品方向 →</strong></Link>)}</div>
        <div className="section-cta"><Link className="button button-secondary" href="/zh/products/">浏览当前56款网站产品</Link><Link className="text-link" href="/zh/line-sheet/">打开当前产品资料 →</Link></div>
      </section>

      <section className="section process" id="contact"><div className="section-heading compact"><div><p className="eyebrow">联系贝强</p><h2>把采购方向变成可以有效回复的项目。</h2></div></div><div className="process-grid"><article><span>01</span><h3>提供产品方向</h3><p>选择当前产品、填写目标品类，或上传清楚的参考款资料。</p></article><article><span>02</span><h3>补充订单背景</h3><p>说明目标国家、渠道、数量、尺码配比、颜色、包装和时间。</p></article><article><span>03</span><h3>等待工厂审核</h3><p>贝强确认材料、样品、可行性和商业条款后再形成正式报价。</p></article></div><div className="section-cta"><Link className="button" href="/zh/request-quote/?program=reference-style">提交其他目标款式</Link><a className="text-link" href={`https://wa.me/8618959805256?text=${brief}`} target="_blank" rel="noreferrer">WhatsApp发送采购需求 →</a><a className="text-link" href="mailto:421345308@qq.com">邮件：421345308@qq.com</a></div><p className="commercial-note">正式交易通过Alibaba Trade Assurance订单或双方签署合同完成；网站不直接收取银行卡付款。</p></section>
      <ChineseSiteFooter />
    </main>
  );
}
