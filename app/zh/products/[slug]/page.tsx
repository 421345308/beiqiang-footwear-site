/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToQuoteButton from "../../../components/AddToQuoteButton";
import ChineseProductCard from "../../../components/ChineseProductCard";
import ChineseSiteFooter from "../../../components/ChineseSiteFooter";
import ChineseSiteHeader from "../../../components/ChineseSiteHeader";
import InquiryForm from "../../../components/InquiryForm";
import PrintProductSheetButton from "../../../components/PrintProductSheetButton";
import ProductShareActions from "../../../components/ProductShareActions";
import CommercialStartingPoints from "../../../components/CommercialStartingPoints";
import {
  buyerFitZh,
  closureZh,
  colorZh,
  factZh,
  productNameZh,
  productSummaryZh,
} from "../../../data/products-zh";
import { getProduct, products } from "../../../data/products";

type Props = { params: Promise<{ slug: string }> };
const origin = "https://www.beiqiang.online";
function webImage(source: string) {
  return source
    .replace("/catalog/", "/catalog-web/")
    .replace(/\.jpg$/i, ".webp");
}
function alibabaUrl(product: NonNullable<ReturnType<typeof getProduct>>) {
  if (!product.alibabaProductId)
    return "https://cn1576227362luzl.m.en.alibaba.com/";
  const slug = product.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `https://www.alibaba.com/product-detail/${slug}_${product.alibabaProductId}.html`;
}

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = getProduct((await params).slug);
  if (!product) return {};
  const title = `${product.code} ${productNameZh(product)}`;
  const url = `${origin}/zh/products/${product.slug}/`;
  const english = `${origin}/products/${product.slug}/`;
  const image = `${origin}${webImage(product.images[0])}`;
  return {
    title: `${title}｜贝强鞋业`,
    description: `${productSummaryZh(product)} 查看真实产品图片、已整理规格和报价前待确认事项。`,
    alternates: {
      canonical: url,
      languages: { en: english, "zh-CN": url, "x-default": english },
    },
    openGraph: {
      title,
      description: productSummaryZh(product),
      url,
      locale: "zh_CN",
      type: "website",
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: productSummaryZh(product),
      images: [image],
    },
  };
}

export default async function ChineseProductPage({ params }: Props) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  const name = productNameZh(product);
  const url = `${origin}/zh/products/${product.slug}/`;
  const related = products
    .filter(
      (candidate) =>
        candidate.code !== product.code &&
        candidate.collections.some((collection) =>
          product.collections.includes(collection),
        ),
    )
    .slice(0, 3);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.code} ${name}`,
    sku: product.code,
    model: product.sourceModel,
    brand: { "@type": "Brand", name: "Beiqiang" },
    image: product.images.map((image) => `${origin}${image}`),
    description: productSummaryZh(product),
    manufacturer: {
      "@type": "Organization",
      name: "Quanzhou Beiqiang Footwear & Apparel Co., Ltd.",
    },
    inLanguage: "zh-CN",
  };
  const recordedHighlights = product.highlights.filter((item) =>
    /recorded in (?:Alibaba trunk|the product package|the source package)/i.test(item),
  );
  const brief = `您好，贝强鞋业。我希望了解${product.code}（${product.sourceModel}）${name}的样品和B2B报价，请确认规格、可选颜色、尺码配比、包装与时间要求。`;
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <ChineseSiteHeader englishHref={`/products/${product.slug}/`} />
      <div className="product-breadcrumb">
        <Link href="/zh/products/">全部产品</Link>
        <span>›</span>
        <span>{product.code}</span>
      </div>
      <section className="product-detail-hero">
        <div className="product-detail-image">
          <img
            src={webImage(product.images[0])}
            alt={`${product.code} ${name}`}
            decoding="async"
            fetchPriority="high"
          />
        </div>
        <div className="product-detail-copy">
          <p className="eyebrow">B2B产品资料</p>
          <div className="product-id-line">
            <span>{product.code}</span>
            <span>工厂款号 {product.sourceModel}</span>
            <span>{closureZh(product.closure)}</span>
          </div>
          <h1>{name}</h1>
          <p className="hero-lead">{productSummaryZh(product)}</p>
          <ul className="product-hero-points">
            <li>
              <strong>
                {product.fitEvidence === "wide_toe_verified"
                  ? "本款为宽鞋头设计"
                  : "鞋楦宽度请按本款样品确认"}
              </strong>
            </li>
            <li>
              <strong>{product.colors.length}种配色图片可供参考</strong>
            </li>
            <li>
              <strong>可先咨询样品，再决定大货</strong>
            </li>
          </ul>
          <div className="hero-actions">
            <AddToQuoteButton product={product} locale="zh" />
            <PrintProductSheetButton styleCode={product.code} locale="zh" />
            <a className="text-link" href="#inquiry">
              咨询这款样品 →
            </a>
          </div>
          <ProductShareActions
            code={product.code}
            name={name}
            url={url}
            locale="zh"
          />
          <p className="commercial-note">
            最终价格取决于确认后的款式、数量、材料、尺码配比、包装和贸易要求。
          </p>
        </div>
      </section>
      <section
        className="product-fact-strip"
        aria-label={`${product.code}采购要点`}
      >
        <div>
          <small>网站款号</small>
          <strong>{product.code}</strong>
        </div>
        <div>
          <small>工厂款号</small>
          <strong>{product.sourceModel}</strong>
        </div>
        <div>
          <small>尺码</small>
          <strong>{product.size}</strong>
        </div>
        <div>
          <small>穿脱结构</small>
          <strong>{closureZh(product.closure)}</strong>
        </div>
      </section>
      <CommercialStartingPoints locale="zh" />
      <section className="section product-spec-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">当前产品信息</p>
            <h2>先了解这款产品，再讨论样品和报价。</h2>
          </div>
          <p>先用以下信息选款。请告诉我们需要的尺码、颜色和数量，再核实本次订单的可选方案。</p>
        </div>
        <div className="spec-layout">
          <dl className="spec-table">
            <div>
              <dt>网站款号</dt>
              <dd>{product.code}</dd>
            </div>
            <div>
              <dt>工厂款号</dt>
              <dd>{product.sourceModel}</dd>
            </div>
            <div>
              <dt>英文产品名</dt>
              <dd>{product.name}</dd>
            </div>
            <div>
              <dt>穿脱结构</dt>
              <dd>{closureZh(product.closure)}</dd>
            </div>
            <div>
              <dt>鞋面</dt>
              <dd>{factZh(product.upper)}</dd>
            </div>
            <div>
              <dt>鞋底</dt>
              <dd>{factZh(product.sole)}</dd>
            </div>
            <div>
              <dt>尺码</dt>
              <dd>{product.size}</dd>
            </div>
            <div>
              <dt>图片中的配色</dt>
              <dd>{product.colors.map(colorZh).join("、")}</dd>
            </div>
            {recordedHighlights.length ? (
              <div>
                <dt>产品细节</dt>
                <dd>{recordedHighlights.map(factZh).join("；")}</dd>
              </div>
            ) : null}
          </dl>
          <aside className="confirmation-card">
            <p className="eyebrow">报价前确认</p>
            <h3>下单前，我们一起确认。</h3>
            <ul>
              {product.confirmBeforeQuote.map((item) => (
                <li key={item}>{factZh(item)}</li>
              ))}
            </ul>
            <a className="text-link" href="#inquiry">
              咨询这款鞋 →
            </a>
          </aside>
        </div>
      </section>
      <section className="product-gallery">
        <div className="product-evidence-heading">
          <p className="eyebrow eyebrow-light">看看鞋子的细节</p>
          <h2>产品实拍与配色参考。</h2>
        </div>
        <div className="detail-gallery-grid">
          {product.images.map((image, index) => (
            <figure
              key={image}
              className={index === 0 ? "gallery-feature" : ""}
            >
              <img
                src={webImage(image)}
                alt={`${product.code} ${name} 产品图 ${index + 1}`}
                loading={index > 0 ? "lazy" : undefined}
                decoding="async"
              />
              <figcaption>
                {index === 0 ? "主产品图" : `产品图 ${index + 1}`}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section className="section buyer-use-section">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">适合买家</p>
            <h2>这款鞋适合您的产品线吗？</h2>
          </div>
        </div>
        <div className="buyer-grid">
          <article>
            <span>01</span>
            <h3>{buyerFitZh(product)}</h3>
            <p>可以对照您的客户需求，看看鞋型、穿脱方式和尺码是否合适。图片没说明白的地方，欢迎直接咨询。</p>
          </article>
          <article>
            <span>02</span>
            <h3>样品验证</h3>
            <p>在确认大货条款前核实所选样品的材料、结构、合脚性与包装。</p>
          </article>
          <article>
            <span>03</span>
            <h3>商量订单方案</h3>
            <p>提供数量、目标市场和订单要求，便于工厂准备有效报价。</p>
          </article>
        </div>
      </section>
      {related.length > 0 && (
        <section className="section related-section">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">样品前先比较</p>
              <h2>也可以比较这些款式。</h2>
            </div>
          </div>
          <div className="product-grid">
            {related.map((item) => (
              <ChineseProductCard key={item.code} product={item} />
            ))}
          </div>
        </section>
      )}
      <section className="product-inquiry-section" id="inquiry">
        <div className="product-inquiry-grid">
          <div className="product-inquiry-copy">
            <p className="eyebrow eyebrow-light">{product.code} 样品需求</p>
            <h2>想了解这款鞋的样品或报价？</h2>
            <p>
              告诉我们销售市场、大致数量和您最关心的问题。我们核对所选款式后，再与您确认样品安排和报价。
            </p>
            <div className="contact-links">
              <a
                className="button button-light"
                href={`https://wa.me/8618959805256?text=${encodeURIComponent(brief)}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp发送{product.code}需求
              </a>
              <a
                className="contact-text-link"
                href={`mailto:421345308@qq.com?subject=${encodeURIComponent(`${product.code}样品和报价需求`)}&body=${encodeURIComponent(brief)}`}
              >
                邮件联系 421345308@qq.com
              </a>
              <a
                className="contact-text-link"
                href={alibabaUrl(product)}
                target="_blank"
                rel="noreferrer"
              >
                {product.alibabaProductId
                  ? `在Alibaba.com查看${product.code}`
                  : "查看贝强Alibaba.com店铺"}
              </a>
            </div>
          </div>
          <InquiryForm
            styleCode={product.code}
            styleLabel={`${product.code} — ${name}`}
            context="product"
            locale="zh"
          />
        </div>
      </section>
      <ChineseSiteFooter />
      <article
        className="product-print-sheet"
        aria-label={`${product.code}可打印采购审核资料`}
      >
        <header>
          <div>
            <p>贝强鞋业 · B2B产品资料</p>
            <h1>
              {product.code} · {name}
            </h1>
            <span>工厂款号 {product.sourceModel}</span>
          </div>
          <strong>
            采购审核资料
            <br />
            不是正式报价
          </strong>
        </header>
        <section className="product-print-summary">
          <img src={product.images[0]} alt={`${product.code} ${name}`} />
          <div>
            <p>{productSummaryZh(product)}</p>
            <h2>已整理产品方向</h2>
            <ul>
              <li>{closureZh(product.closure)}结构</li>
              <li>{product.size}</li>
              <li>{product.colors.length}种颜色方向</li>
            </ul>
          </div>
        </section>
        <section className="product-print-specs">
          <h2>产品事实</h2>
          <dl>
            <div>
              <dt>款号</dt>
              <dd>{product.code}</dd>
            </div>
            <div>
              <dt>工厂款号</dt>
              <dd>{product.sourceModel}</dd>
            </div>
            <div>
              <dt>鞋面</dt>
              <dd>{factZh(product.upper)}</dd>
            </div>
            <div>
              <dt>鞋底</dt>
              <dd>{factZh(product.sole)}</dd>
            </div>
            <div>
              <dt>尺码</dt>
              <dd>{product.size}</dd>
            </div>
            <div>
              <dt>颜色</dt>
              <dd>{product.colors.map(colorZh).join("、")}</dd>
            </div>
          </dl>
        </section>
        <section className="product-print-confirm">
          <h2>报价或订单前确认</h2>
          <ul>
            {product.confirmBeforeQuote.map((item) => (
              <li key={item}>{factZh(item)}</li>
            ))}
          </ul>
          <p>
            价格、MOQ、可用情况、材料执行、尺码配比、包装、交期、测试和贸易条款均需按具体项目书面确认。样品通过本身不构成大货订单。
          </p>
        </section>
        <footer>
          <div>
            <strong>泉州贝强鞋服有限公司</strong>
            <span>OEM/ODM与鞋类批发供应 · 中国福建泉州</span>
          </div>
          <div>
            <span>421345308@qq.com</span>
            <span>WhatsApp +86 189 5980 5256</span>
            <span>www.beiqiang.online/zh/products/{product.slug}/</span>
          </div>
        </footer>
      </article>
    </main>
  );
}
