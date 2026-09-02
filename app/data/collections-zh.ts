import type { CollectionSlug } from "./products";

export type ChineseCollection = {
  slug: CollectionSlug;
  name: string;
  title: string;
  description: string;
  buyerIntent: string;
  proofBoundary: string;
};

export const chineseCollections: ChineseCollection[] = [
  {
    slug: "wide-toe-box",
    name: "宽鞋头系列",
    title: "已确认宽鞋头设计的步行鞋",
    description: "面向舒适鞋进口商、批发商和线上卖家的宽鞋头候选款；只对资料已确认的具体款式使用宽鞋头描述。",
    buyerIntent: "希望建立差异化宽版舒适鞋产品线，并在大货前审核实物样品的B2B买家。",
    proofBoundary: "本系列只包含当前资料已确认的具体款式，不代表所有贝强鞋款均为宽鞋头，也不构成医疗或矫形声明。",
  },
  {
    slug: "knit-slip-on",
    name: "针织套穿系列",
    title: "针织与织物套穿步行鞋",
    description: "用于日常步行、旅行和休闲产品组合的易穿脱候选款，可比较不同鞋面、尺码与颜色方向。",
    buyerIntent: "重视穿脱便利、产品组合宽度，并希望先通过样品测试市场方向的B2B买家。",
    proofBoundary: "套穿结构和已整理外观来自产品资料；材料、可用颜色、尺码、包装与商业条件仍按具体款式确认。",
  },
  {
    slug: "breathable-lace-up",
    name: "透气系带系列",
    title: "针织、网布与织物系带步行鞋",
    description: "覆盖夏季、运动休闲及日常休闲方向的系带候选款，帮助采购团队按结构与视觉差异建立选款清单。",
    buyerIntent: "采购夏季、运动休闲或日常系带鞋产品组合的进口商、批发商和线上渠道买家。",
    proofBoundary: "透气方向以对应产品的鞋面结构和资料为依据，不代表防水、医疗、测试性能或无条件材料承诺。",
  },
];

export function getChineseCollection(slug: string) {
  return chineseCollections.find((collection) => collection.slug === slug);
}
