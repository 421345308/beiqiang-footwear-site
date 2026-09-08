import type { Metadata } from "next";
import ChineseCapabilityPage, { type ChineseCapabilityPageData } from "../../components/ChineseCapabilityPage";
import { productCount } from "../../data/catalog-meta";

export const metadata: Metadata = { title: "泉州鞋类工厂｜贝强鞋业", description: "查看贝强鞋业真实工作区域、鞋品处理与包装证据，再讨论步行鞋样品和B2B采购需求。", alternates: { canonical: "https://www.beiqiang.online/zh/factory/", languages: { en: "https://www.beiqiang.online/factory/", "zh-CN": "https://www.beiqiang.online/zh/factory/", "x-default": "https://www.beiqiang.online/factory/" } } };
const data: ChineseCapabilityPageData = {
  englishHref: "/factory/", factoryReviewPackProductCount: productCount, eyebrow: "泉州鞋类工厂供应", title: "来看看，您的下一批鞋将从怎样的工厂开始。", introduction: "贝强位于福建泉州，面向批发商、进口商和品牌客户供应休闲步行鞋、套穿鞋及纺织鞋。您可以从现有款式选起，也可以告诉我们想找什么鞋，一起确认适合的采购或定制方案。", primaryCta: "提交采购需求", primaryHref: "/zh/sourcing-review/",
  proofLabel: "走进贝强", proofTitle: "先看车间，再聊您的产品。", proofCopy: "这段工厂实拍视频记录了车缝、鞋品处理和包装等场景。看中某款鞋后，可以进一步沟通它的材料、做法和样品安排。", evidenceVideo: true,
  images: [{ src: "/factory-video-stills/factory-exterior.webp", alt: "贝强鞋业泉州工作场地外景", caption: "泉州工作场地" }, { src: "/factory-video-stills/stitching-line.webp", alt: "贝强工作区域内的鞋面车缝工位", caption: "鞋面车缝工位" }, { src: "/factory-video-stills/materials-storage.webp", alt: "整齐摆放的成品鞋存放与订单整理区域", caption: "成品鞋存放区域" }],
  stepsTitle: "从选款到看样，先把关键问题聊清楚。", steps: [
  {
    "title": "选款或提供参考",
    "copy": "可以先选几款感兴趣的鞋，也可以发送参考链接，说明喜欢的款式或希望改进的地方。不必准备好整套规格才能咨询。"
  },
  {
    "title": "说明卖给谁",
    "copy": "告诉我们销售国家、渠道和大致数量。数量还没确定也没关系，可以先说明计划。"
  },
  {
    "title": "逐项确认要求",
    "copy": "围绕所选鞋款，沟通材料、尺码、颜色和需要调整的地方，再确认价格与时间。"
  },
  {
    "title": "商量样品安排",
    "copy": "先确认样品是否可安排、费用以及要检查什么。看过样品的合脚性、做工和修改效果，再决定大货。"
  }
],
  confirmedTitle: "现在可以先了解", confirmed: [
  "现有鞋款的实拍图片、尺码和颜色信息",
  "套穿、系带等款式；宽鞋头信息以具体产品页为准",
  "工厂实拍视频和车间照片",
  "邮件、WhatsApp及阿里巴巴国际站联系入口"
], confirmTitle: "下单前一起确认", confirm: ["准确材料与结构", "可用尺码和颜色组合", "样品安排与定制可行性", "MOQ、价格、包装、交期和贸易条款"],
  closingTitle: "把您的选款想法发给我们。", closingCopy: "有参考款、销售市场和大致数量，就可以开始沟通。其他还没想好的细节，我们可以逐项梳理。",
};
export default function ChineseFactoryPage() { return <ChineseCapabilityPage data={data} />; }
