import type { Metadata } from "next";
import ChineseCapabilityPage, { type ChineseCapabilityPageData } from "../../components/ChineseCapabilityPage";

export const metadata: Metadata = { title: "鞋类检查与包装｜贝强鞋业", description: "查看真实鞋品检查、整理与纸箱准备证据，并了解大货订单前应确认的检查和包装资料。", alternates: { canonical: "https://www.beiqiang.online/zh/quality-packing/", languages: { en: "https://www.beiqiang.online/quality-packing/", "zh-CN": "https://www.beiqiang.online/zh/quality-packing/", "x-default": "https://www.beiqiang.online/quality-packing/" } } };
const data: ChineseCapabilityPageData = {
  englishHref: "/quality-packing/", eyebrow: "产品检查与包装", title: "先说清怎么检查，再安排装箱。", introduction: "批量采购不只是款式选对，尺码、颜色和包装也要与订单一致。请尽早说明您的检查和包装要求，方便双方在下单前确认执行方式。", primaryCta: "准备订单需求",
  proofLabel: "检查与包装", proofTitle: "看看鞋品装箱前的处理过程。", proofCopy: "这些画面截取自工厂实拍视频，展示鞋品处理和包装准备。具体订单的检查项目与包装要求需要另行约定；车间画面不能代替检测报告。", images: [{ src: "/factory-video-stills/shoe-packing.webp", alt: "包装前人工处理成品鞋", caption: "包装前鞋品处理" }, { src: "/factory-video-stills/packing-preparation.webp", alt: "鞋品包纸与鞋盒包装准备", caption: "鞋盒包装准备" }, { src: "/factory-video-stills/assembly-line.webp", alt: "鞋品通过生产线处理工位", caption: "生产线处理" }],
  stepsTitle: "下单前，建议把这四项写清楚。", steps: [
  {
    "title": "确定对照标准",
    "copy": "用双方认可的样品和书面规格，明确款式、材料、颜色与做工要求。"
  },
  {
    "title": "核对尺码和颜色数量",
    "copy": "按尺码、颜色列出双数，检查合计是否与订单相符。有混装或标签要求，也一并写清。"
  },
  {
    "title": "约定检查项目",
    "copy": "说明重点关注的缺陷、允许偏差或测试要求。检测、第三方验货等安排，需在预约或生产前确认。"
  },
  {
    "title": "确认包装说明",
    "copy": "约定鞋盒、标签、外箱和唛头；出货前再确认实际包装数据及货物交接方式。"
  }
],
  confirmedTitle: "本页可以看到", confirmed: [
  "人工处理与检查鞋品的场景",
  "装箱前的鞋品整理",
  "鞋盒与外箱的包装准备",
  "现有鞋款的产品实拍图"
], confirmTitle: "您的订单还需确认", confirm: ["检查标准与容差", "单只、鞋盒、标签和外箱要求", "尺码配比与颜色分配", "箱唛、发运单据与交接时间"],
  closingTitle: "有自己的包装说明或验货清单？", closingCopy: "询价时可以先说明。提交成功后，可凭询盘编号和私密查询码上传文件，继续补充具体要求。",
};
export default function ChineseQualityPackingPage() { return <ChineseCapabilityPage data={data} />; }
