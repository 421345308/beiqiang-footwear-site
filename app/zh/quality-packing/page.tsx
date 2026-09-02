import type { Metadata } from "next";
import ChineseCapabilityPage, { type ChineseCapabilityPageData } from "../../components/ChineseCapabilityPage";

export const metadata: Metadata = { title: "鞋类检查与包装｜贝强鞋业", description: "查看真实鞋品检查、整理与纸箱准备证据，并了解大货订单前应确认的检查和包装资料。", alternates: { canonical: "https://www.beiqiang.online/zh/quality-packing/", languages: { en: "https://www.beiqiang.online/quality-packing/", "zh-CN": "https://www.beiqiang.online/zh/quality-packing/", "x-default": "https://www.beiqiang.online/quality-packing/" } } };
const data: ChineseCapabilityPageData = {
  englishHref: "/quality-packing/", eyebrow: "产品检查与包装", title: "在纸箱准备前，把订单要求变成可核对项目。", introduction: "产品检查只有在买家要求清楚时才有意义。最终商业确认前，需要对齐款式、颜色、尺码配比、材料方向和包装要求。", primaryCta: "准备订单需求",
  proofLabel: "检查证据", proofTitle: "真实的鞋品处理、整理和包装准备。", proofCopy: "照片展示现有检查和纸箱准备场景；具体检查点、容差和包装方式仍以已确认产品和订单要求为准。", images: [{ src: "/factory-video-stills/shoe-packing.webp", alt: "包装前人工处理成品鞋", caption: "包装前鞋品处理" }, { src: "/factory-video-stills/packing-preparation.webp", alt: "鞋品包纸与鞋盒包装准备", caption: "鞋盒包装准备" }, { src: "/factory-video-stills/assembly-line.webp", alt: "鞋品通过生产线处理工位", caption: "生产线处理" }],
  stepsTitle: "实用的出货前检查顺序。", steps: [{ title: "冻结参考", copy: "确认选定款式、认可样品或双方约定的图片与规格参考。" }, { title: "对照订单", copy: "按订单资料核对颜色、码比、数量分配、标签和包装说明。" }, { title: "执行适用检查", copy: "包装前按订单要求进行视觉和实物检查。" }, { title: "协调包装与发运", copy: "与买家或指定货代确认纸箱、唛头、单据和交接安排。" }],
  confirmedTitle: "当前证据可见内容", confirmed: ["人工鞋品处理与检查", "批次整理场景", "纸箱存放与包装准备", "逐款产品图片资料"], confirmTitle: "每个订单必须定义", confirm: ["检查标准与容差", "单只、鞋盒、标签和外箱要求", "尺码配比与颜色分配", "箱唛、发运单据与交接时间"],
  closingTitle: "把检查和包装要求与产品清单一起提交。", closingCopy: "工厂可据此判断哪些内容采用常规安排，哪些必须在报价前单独确认。",
};
export default function ChineseQualityPackingPage() { return <ChineseCapabilityPage data={data} />; }
