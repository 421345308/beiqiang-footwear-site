import type { Metadata } from "next";
import ChineseCapabilityPage, { type ChineseCapabilityPageData } from "../../components/ChineseCapabilityPage";
import { productCount } from "../../data/catalog-meta";

export const metadata: Metadata = { title: "鞋类OEM/ODM需求讨论｜贝强鞋业", description: "从现有基础款或结构化开发需求开始讨论私标步行鞋，先审核可行性，再确认商业条款。", alternates: { canonical: "https://www.beiqiang.online/zh/oem-odm/", languages: { en: "https://www.beiqiang.online/oem-odm/", "zh-CN": "https://www.beiqiang.online/zh/oem-odm/", "x-default": "https://www.beiqiang.online/oem-odm/" } } };
const data: ChineseCapabilityPageData = {
  englishHref: "/oem-odm/", eyebrow: "OEM / ODM需求讨论", title: "两条采购路径，一个原则：先确认可行性。", introduction: "可以选择贝强现有产品讨论基础调整，也可以提交结构化开发需求。Logo、颜色、材料和包装均需结合款式、数量与样品要求审核后确认。", primaryCta: "建立开发需求", primaryHref: "/zh/request-quote/?path=technical_development",
  proofLabel: "从基础款开始", proofTitle: "用真实产品让定制讨论更具体。", proofCopy: "现有款为买家和工厂提供共同视觉参考，但每项开发需求仍需技术和商业审核；本页不承诺任何数量下都能完成所有定制。", images: [{ src: "/catalog/bq001/01_main.jpg", alt: "BQ001宽鞋头针织套穿基础款", caption: "经验证宽鞋头基础款" }, { src: "/catalog/bq009/01_main.jpg", alt: "BQ009透气网布系带基础款", caption: "网布系带方向" }, { src: "/catalog/bq024/01_main.jpg", alt: "BQ024休闲鞋基础款", caption: "其他产品方向" }],
  stepsTitle: "建立工厂能够评估的需求。", steps: [{ title: "选择开发路径", copy: "引用现有款号，或提供清晰图片和书面开发方向。" }, { title: "说明买家背景", copy: "提供目的市场、销售渠道、预计数量和目标消费者。" }, { title: "列出变更要求", copy: "标明颜色、材料、Logo、标签、包装、尺码和时间的优先级。" }, { title: "通过样品确认", copy: "在样品流程中评审可行性、成本驱动项和双方约定的产品方向。" }],
  confirmedTitle: "可用的起点", confirmed: [`${productCount}款已整理基础款资料`, "宽鞋头、套穿、系带和季节性产品方向", "基于款号的询盘记录", "工厂端样品与需求讨论"], confirmTitle: "不能提前假定", confirm: ["Logo方式和位置", "定制颜色、材料与部件", "包装与标签执行", "MOQ、开发费用、样品时间与大货交期"],
  closingTitle: "完整需求能减少反复修改报价。", closingCopy: "请提供产品款号或参考、目标市场、预计数量、变更要求和时间。我们会区分可行项和仍需核实的内容。",
};
export default function ChineseOemOdmPage() { return <ChineseCapabilityPage data={data} />; }
