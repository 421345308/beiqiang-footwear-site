import type { CollectionSlug } from "./products";
import type { CollectionFaq } from "./products";

export type ChineseCollection = {
  slug: CollectionSlug;
  name: string;
  title: string;
  description: string;
  buyerIntent: string;
  proofBoundary: string;
  faq?: CollectionFaq[];
  guideSlug?: string;
  guideAnchor?: string;
};

export const chineseCollections: ChineseCollection[] = [
  {
    slug: "wide-toe-box",
    name: "宽鞋头系列",
    title: "宽楦与宽鞋头步行鞋批发选款",
    description: "面向舒适鞋进口商、批发商和线上卖家的宽楦与宽鞋头候选款；只对资料已确认的具体款式使用宽版描述，宽度需逐款确认。",
    buyerIntent: "希望建立差异化宽版或加宽舒适鞋产品线的B2B买家，把宽度当作选款决策项，而不只是看尺码。",
    proofBoundary: "本系列只包含当前资料已确认的具体款式，不代表所有贝强鞋款均为宽楦，也不构成医疗或矫形声明。此处的「宽楦／宽版」仅指所列款式的鞋头结构方向。",
    guideSlug: "wide-fit-shoes-sourcing-guide",
    guideAnchor: "宽版与加宽鞋的采购确认方法",
    faq: [
      {
        question: "宽楦和宽鞋头有什么区别？",
        answer: "宽鞋头说的是鞋的前掌部分，也就是脚趾所在的位置。宽楦是更宽的采购说法，还可能指整只鞋的楦型宽度、中足宽度或脚背容量。本系列的归组依据是资料中已确认的鞋头结构，其他宽度维度仍需按具体款式确认。",
      },
      {
        question: "你们有加宽（extra wide）或宽版尺码的鞋吗？",
        answer: "系列中部分款式的资料记录了鞋头加宽方向，每个产品页会写明该款自己的方向。全系列不存在统一的宽度等级，请把您需要的宽度告我们，我们会确认哪些款式可以按这个要求来审核。",
      },
      {
        question: "下单前可以确认宽度吗？",
        answer: "可以，这正是打样的用途。注明款号、说明要解决的宽度问题和销售市场，再拿实物样品对照这个要求来验。样品评审就是宽度从「描述」变成「可核验事项」的环节。",
      },
      {
        question: "鞋头宽就等于适合宽脚吗？",
        answer: "不一定。鞋头宽度只是其中一个维度，整体合脚程度还取决于楦型、中足宽度、脚背容量和您订的尺码。建议把鞋头方向当作初筛条件，其余在样品上确认。",
      },
      {
        question: "宽版款和常规款可以混在一张订单里吗？",
        answer: "可以在同一份询价里同时提出这两个方向。数量、码比和起订量都按款式分别审核，请把您想要的比例写清楚，我们会在报价前确认哪些安排可行。",
      },
    ],
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
  {
    slug: "high-top-shoes",
    name: "高帮与袜套款",
    title: "高帮与袜套式休闲鞋采购选款",
    description: "集中比较当前较高鞋帮和袜套式轮廓，供季节性、休闲或差异化产品组合进行初步选款。",
    buyerIntent: "希望在打样前比较较高鞋帮轮廓的进口商、批发商和线上渠道买家。",
    proofBoundary: "本系列只描述产品资料中的鞋帮轮廓；内里、保暖性、准确鞋面材料、可用颜色、尺码与订单条件仍需逐款确认。",
  },
  {
    slug: "kids-shoes",
    name: "儿童鞋",
    title: "儿童休闲与步行鞋批发选款",
    description: "把当前儿童鞋候选款集中展示，便于买家在询价前说明目标年龄、尺码配比、颜色和样品要求。",
    buyerIntent: "正在准备明确儿童鞋采购简报的进口商、批发商和线上卖家。",
    proofBoundary: "儿童鞋分类不等于年龄分级、合规、尺码现货或市场适用性已经确认；买家必须点名目标市场和项目要求后逐项审核。",
  },
  {
    slug: "extended-size-shoes",
    name: "扩展尺码",
    title: "资料中延伸至较大欧码的步行鞋款",
    description: "比较当前资料中尺码方向达到EU 46或EU 47的候选款，再在报价前核对实际尺码段与订单码比。",
    buyerIntent: "寻找较宽欧码方向的步行鞋和休闲鞋候选款，并愿意先核实样品与尺码的B2B买家。",
    proofBoundary: "资料中的尺码方向不是现货或已确认生产尺码段；准确尺码、模具、版型、码比和可用状态仍按项目确认。",
  },
  {
    slug: "fleece-lined-shoes",
    name: "加绒选项",
    title: "已有加绒颜色方向的步行鞋款",
    description: "这些款式的原始资料中有加绒版本。准备秋冬选款时，可以先沟通内里和可选颜色，再安排样品。",
    buyerIntent: "希望先比较秋冬候选款，再确认样品、材料和当前可用状态的进口商、批发商与线上卖家。",
    proofBoundary: "加绒方向可能只适用于个别颜色；准确内里材料、保暖表现、当前可用颜色、尺码和商业条件必须在报价前确认。",
  },
];

export function getChineseCollection(slug: string) {
  return chineseCollections.find((collection) => collection.slug === slug);
}
