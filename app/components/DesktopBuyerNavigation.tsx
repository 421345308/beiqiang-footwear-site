import Link from "next/link";
import { productCount } from "../data/catalog-meta";
import LanguageSelector from "./LanguageSelector";

type Props = {
  locale?: "en" | "zh";
  alternateHref: string;
};

const englishGroups = [
  {
    label: "Products",
    wide: true,
    links: [
      [`All ${productCount} products`, "/products/", "Search, filter and compare the current online catalogue."],
      ["Find styles", "/product-finder/", "Answer a few sourcing questions to narrow the current range."],
      ["Download line sheet", "/line-sheet/", "Request the current buyer-ready product PDF."],
      ["Wide toe box", "/collections/wide-toe-box/", "SKU-specific roomy-toe candidates."],
      ["Knit slip-on", "/collections/knit-slip-on/", "Easy-on knit and textile directions."],
      ["Breathable lace-up", "/collections/breathable-lace-up/", "Knit, mesh and textile lace-up directions."],
      ["High-top / sock", "/collections/high-top-shoes/", "Higher-cut and sock-style silhouettes."],
      ["Kids footwear", "/collections/kids-shoes/", "Current children’s footwear candidates."],
      ["Extended size", "/collections/extended-size-shoes/", "Styles with documented larger EU size directions."],
      ["Fleece-lined", "/collections/fleece-lined-shoes/", "Styles with documented fleece-lined color options."],
    ],
  },
  {
    label: "Programs",
    links: [
      ["Wholesale walking shoes", "/solutions/wholesale-walking-shoes/", "Build a multi-style wholesale brief."],
      ["Private-label walking shoes", "/solutions/private-label-walking-shoes/", "Prepare branding and market requirements."],
      ["OEM knit-shoe development", "/solutions/oem-knit-shoes/", "Separate buyer targets from confirmed capability."],
      ["OEM / ODM overview", "/oem-odm/", "Review customization inputs and confirmation points."],
      ["Logo concept studio", "/private-label-concept/", "Create a non-production artwork discussion brief."],
    ],
  },
  {
    label: "Verify",
    links: [
      ["Factory", "/factory/", "Review factory-side media and supplier information."],
      ["Quality & packing", "/quality-packing/", "See checking and packing confirmation points."],
      ["Sample & order process", "/sample-order-process/", "Understand the path before a bulk order."],
    ],
  },
  {
    label: "How to buy",
    links: [
      ["B2B buyer guide", "/buyer-guide/", "Follow the decisions from shortlist to order handover."],
      ["Sourcing resources", "/resources/", "Use buyer checklists and decision guides."],
      ["Request human review", "/sourcing-review/", "Ask Beiqiang to review a broader sourcing brief."],
    ],
  },
] as const;

const chineseGroups = [
  {
    label: "产品选款",
    wide: true,
    links: [
      [`全部${productCount}款产品`, "/zh/products/", "搜索、筛选和比较当前已上线产品。"],
      ["采购选款助手", "/zh/product-finder/", "按采购问题缩小当前选款范围。"],
      ["申请产品目录", "/zh/line-sheet/", "获取当前面向买家的产品PDF。"],
      ["宽鞋头系列", "/zh/collections/wide-toe-box/", "仅限有产品级宽鞋头依据的候选。"],
      ["针织易穿系列", "/zh/collections/knit-slip-on/", "针织和织物易穿方向。"],
      ["透气系带系列", "/zh/collections/breathable-lace-up/", "针织、网布和织物系带方向。"],
      ["高帮／袜套系列", "/zh/collections/high-top-shoes/", "较高鞋帮和袜套式轮廓。"],
      ["儿童鞋系列", "/zh/collections/kids-shoes/", "当前已整理的儿童鞋候选。"],
      ["扩展尺码系列", "/zh/collections/extended-size-shoes/", "资料中延伸至较大欧码的款式。"],
      ["加绒方向", "/zh/collections/fleece-lined-shoes/", "已有加绒颜色记录的款式。"],
    ],
  },
  {
    label: "采购方案",
    links: [
      ["步行鞋批发", "/zh/solutions/wholesale-walking-shoes/", "整理多款批发采购需求。"],
      ["品牌贴牌鞋", "/zh/solutions/private-label-walking-shoes/", "准备品牌与目标市场资料。"],
      ["OEM针织鞋开发", "/zh/solutions/oem-knit-shoes/", "区分买家目标和已确认能力。"],
      ["OEM / ODM概览", "/zh/oem-odm/", "查看定制资料与确认节点。"],
      ["Logo概念工作台", "/zh/private-label-concept/", "生成非生产确认的图稿沟通简报。"],
    ],
  },
  {
    label: "了解工厂",
    links: [
      ["工厂与实拍", "/zh/factory/", "查看工厂实拍与供应商资料。"],
      ["检查与包装", "/zh/quality-packing/", "了解检查和包装确认点。"],
      ["样品与订单流程", "/zh/sample-order-process/", "了解大货订单前的推进路径。"],
    ],
  },
  {
    label: "如何采购",
    links: [
      ["B2B采购指南", "/zh/buyer-guide/", "从选款到订单交接逐步核对。"],
      ["采购知识与清单", "/zh/resources/", "使用买家清单和决策指南。"],
      ["申请人工复核", "/zh/sourcing-review/", "让贝强业务员审核完整采购需求。"],
    ],
  },
] as const;

export default function DesktopBuyerNavigation({ locale = "en", alternateHref }: Props) {
  const zh = locale === "zh";
  const groups = zh ? chineseGroups : englishGroups;
  return (
    <nav className="desktop-buyer-nav" aria-label={zh ? "中文主导航" : "Primary buyer navigation"}>
      {groups.map((group) => (
        <details className="nav-menu" key={group.label}>
          <summary>{group.label}</summary>
          <div className={`nav-menu-panel${group.wide ? " nav-menu-panel-wide" : ""}`}>
            {group.links.map(([label, href, description]) => (
              <Link href={href} key={href}>
                <strong>{label}</strong>
                <small>{description}</small>
              </Link>
            ))}
          </div>
        </details>
      ))}
      <Link href={zh ? "/zh/buyer-workspace/" : "/buyer-workspace/"}>
        {zh ? "买家工作台" : "Buyer workspace"}
      </Link>
      <LanguageSelector locale={locale} alternateHref={alternateHref} />
    </nav>
  );
}
