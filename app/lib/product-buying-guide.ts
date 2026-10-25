import type { Product } from "../data/products";
import { PUBLISHED_PRODUCT_CODES } from "../data/published-product-codes.ts";

export function getProductBuyingGuide(product: Product, locale: "en" | "zh" = "en") {
  const zh = locale === "zh";
  const kids = /kids/i.test(product.group);
  const wide = product.fitEvidence === "wide_toe_verified";
  const high = /high-top|high top/i.test(`${product.name} ${product.upper}`);
  const fleece = /fleece-lined/i.test(product.shortDescription);
  const slipOn = product.closure === "Slip-On";
  const moulded = product.collections.includes("clogs-and-vented-shoes");
  const mule = product.collections.includes("mule-shoes");
  const pairedSizes = Boolean(product.sizeNote?.startsWith("Each paired label"));
  const shape = pairedSizes
    ? (zh ? "本款使用供应商双码标签，每组标签对应一个尺码选项。先核对鞋垫长度，再与目标市场尺码表匹配；不能按连续欧码直接换算。" : "Each paired supplier size label is one size option. Check sample insole lengths against your market size chart; do not convert the labels as a continuous EU size run.")
    : mule
      ? (zh ? "本款采用包头后空结构。供应商标注35–45，需通过样品长度与脚背贴合情况核对尺码；绒面和软木外观不等于已确认材料成分。" : "This mule has a closed toe and open heel. Check the supplier's 35–45 labels against sample length and instep fit. Suede-effect and cork-look surfaces do not establish material composition.")
    : kids
    ? (zh ? "先对照您所销售的儿童鞋尺码表，不要只凭EU码数推算适用年龄。" : "Compare the listed sizes with your own children's footwear size chart; do not infer an age range from EU sizes alone.")
    : wide
      ? (zh ? "这款为宽鞋头设计。选样时对照您自己的尺码表，比较同码样品的前掌空间；不同款式不能只看图片判断谁更宽。" : "This style has a wide toe box. Compare forefoot room in same-size samples against your own size guide; photos alone cannot establish which style is wider.")
      : high
        ? (zh ? "这款是高帮结构。除了鞋底长度，也要看鞋口高度与穿脱方式是否符合您的产品定位。" : "This is a higher-cut style. Consider the collar height and how the shoe is put on, as well as the size range, when comparing it with your existing range.")
        : (zh ? "先比较穿脱方式、鞋型和尺码范围。鞋楦宽度和合脚性需要看样，不能从针织或弹力鞋面推断。" : "Compare the fastening, silhouette and size range first. Knit or stretch uppers do not by themselves establish last width or fit; check a sample.");
  const checks = [
    mule
      ? (zh ? "贴合：核对前掌与脚背空间、搭扣可调范围及行走时脚掌的固定情况。" : "Fit: check forefoot and instep space, buckle adjustment and foot hold during walking.")
      : moulded
        ? (zh ? "结构：核对所选款式的后跟带或包跟结构、开孔位置与穿脱空间；仿鞋带装饰不作为可调系带。" : "Construction: check the selected style's heel strap or covered heel, openings and entry space. Moulded lace-look details are not adjustable laces.")
      : product.closure === "Zip-Up"
        ? (zh ? "拉链：检查启闭、鞋口空间及内侧接缝，确认穿着时的贴合情况。" : "Zipper: check operation, entry space and inner seams against sample fit.")
      : slipOn
      ? (zh ? "穿脱：用计划采购的尺码试穿，检查鞋口是否好穿、后跟是否容易滑动。" : "Entry and hold: try the intended size and check how it goes on and whether the heel slips.")
      : (zh ? "系带：检查鞋带调节范围，以及系好后鞋面和后跟的贴合情况。" : "Lacing: check the adjustment range and how the upper and heel hold when the laces are tied."),
    fleece
      ? (zh ? "内里：确认收到的是普通还是加绒版本，并核对所选颜色；不要把两种版本当作同一配置。" : "Lining: confirm whether the sample is the standard or fleece-lined version, and check the selected color. Treat them as separate specifications.")
      : (zh ? "实物：核对鞋面、内里、鞋底和接缝；图片无法替代脚感与做工检查。" : "Construction: check the upper, lining, sole and seams in person. Photos cannot substitute for assessing feel and finish."),
    zh ? "留样：记下款号、尺码、颜色和需要修改的地方。确认后以样品及书面规格作为大货对照。" : "Keep a reference: record the style, size, color and requested changes. Agree the sample and written specification before using them as the bulk-order reference.",
  ];
  return {
    shape,
    checks,
    order: zh
      ? `本页列出${product.size}和${product.colors.length}种配色供选款参考。请按款式、尺码和颜色分别提供双数，再确认本次可供组合、样品、包装与交期。`
      : `The page lists ${product.size} and ${product.colors.length} color options for selection. Give quantities by style, size and color so we can confirm the options available for this order, samples, packing and timing.`,
  };
}

/** Relevance for comparison, not a recommendation based on sales or verified fit. */
export function getRelatedProducts(product: Product, candidates: Product[], limit = 3): Product[] {
  if (!PUBLISHED_PRODUCT_CODES.has(product.code)) return [];
  const kids = /kids/i.test(product.group);
  const wide = product.fitEvidence === "wide_toe_verified";
  const isMouldedOrMule = (item: Product) => item.collections.some(group => group === "clogs-and-vented-shoes" || group === "mule-shoes");
  return candidates
    .filter((candidate) => PUBLISHED_PRODUCT_CODES.has(candidate.code)
      && candidate.code !== product.code
      && isMouldedOrMule(candidate) === isMouldedOrMule(product)
      && /kids/i.test(candidate.group) === kids
      && (!wide || candidate.fitEvidence === "wide_toe_verified")
      && (kids || candidate.closure === product.closure || candidate.collections.some((group) => product.collections.includes(group))))
    .map((candidate) => ({
      product: candidate,
      score: (candidate.group === product.group ? 4 : 0)
        + (candidate.closure === product.closure ? 3 : 0)
        + (candidate.size === product.size ? 2 : 0)
        + candidate.collections.filter((group) => product.collections.includes(group)).length,
    }))
    .sort((a, b) => b.score - a.score || a.product.code.localeCompare(b.product.code))
    .slice(0, Math.max(0, limit))
    .map(({ product: candidate }) => candidate);
}
