import type { Metadata } from "next";
import ChineseCapabilityPage, { type ChineseCapabilityPageData } from "../../components/ChineseCapabilityPage";

export const metadata: Metadata = { title: "鞋类OEM/ODM需求讨论｜贝强鞋业", description: "从现有基础款或结构化开发需求开始讨论私标步行鞋，先审核可行性，再确认商业条款。", alternates: { canonical: "https://www.beiqiang.online/zh/oem-odm/", languages: { en: "https://www.beiqiang.online/oem-odm/", "zh-CN": "https://www.beiqiang.online/zh/oem-odm/", "x-default": "https://www.beiqiang.online/oem-odm/" } } };
const data: ChineseCapabilityPageData = {
  englishHref: "/oem-odm/", eyebrow: "OEM / ODM需求讨论", title: "从合适的基础款开始，做自己的鞋款系列。", introduction: "想加自己的品牌标识、换个颜色，或开发不同的款式？可以从贝强现有鞋款选起，也可以提供参考。我们会结合修改内容、数量和样品要求，先确认哪些能做、需要怎样做。", primaryCta: "制作Logo概念", primaryHref: "/zh/private-label-concept/",
  proofLabel: "从想法到样品", proofTitle: "设计想法，要落到具体做法上。", proofCopy: "这些实拍视频截图展示了材料准备、鞋面车缝和整理过程。您的项目需要哪些工序，取决于选定鞋款的结构和修改内容。", images: [{ src: "/factory-video-stills/material-cutting.webp", alt: "鞋类工作区域内的材料裁切准备", caption: "材料准备" }, { src: "/factory-video-stills/stitching-line.webp", alt: "鞋面车缝工位", caption: "鞋面车缝" }, { src: "/factory-video-stills/upper-finishing.webp", alt: "在鞋楦上人工整理鞋面", caption: "鞋面整理" }],
  stepsTitle: "把这几件事说明白，就能开始讨论。", steps: [
  {
    "title": "选基础款或发参考",
    "copy": "有款号时可以直接定位鞋款；新设计可先发送参考链接，说明想保留和想改变的地方。"
  },
  {
    "title": "说明订单计划",
    "copy": "告诉我们销售市场、大致数量和计划上市时间。目标预算有助于讨论方案，但不等于已确认报价。"
  },
  {
    "title": "分清必改项和偏好",
    "copy": "Logo位置、配色、材料、尺码、标签和包装，哪些必须改、哪些可以商量？部分修改可能涉及部件或模具。"
  },
  {
    "title": "约定打样范围",
    "copy": "支付开发费用前，先说清样品包含什么、费用怎么计算、按什么标准检查。目标参数不等于打样后的实际结果。"
  }
],
  confirmedTitle: "可以从这些地方开始", confirmed: [
  "浏览现有鞋款，比较不同结构",
  "制作Logo示意，说明想放的位置",
  "按款号提交想修改的内容",
  "先咨询参考款，再决定样品安排"
], confirmTitle: "需要针对您的项目核实", confirm: ["Logo方式和位置", "定制颜色、材料与部件", "包装与标签执行", "MOQ、开发费用、样品时间与大货交期"],
  closingTitle: "不必准备好所有答案才联系我们。", closingCopy: "先提供款式或参考、销售市场、大致数量和最重要的修改要求。有保密技术文件时，请先沟通保密协议，再分享文件。",
};
export default function ChineseOemOdmPage() { return <ChineseCapabilityPage data={data} />; }
