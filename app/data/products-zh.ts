import type { Product } from "./products";

const names: Record<string, string> = {
  BQ001: "宽鞋头针织套穿步行鞋", BQ002: "加宽鞋头针织套穿步行鞋", BQ003: "夏季镂空针织系带休闲鞋", BQ004: "轻量针织套穿休闲鞋", BQ005: "夏季镂空针织系带步行鞋",
  BQ006: "秋冬厚底针织系带鞋", BQ007: "透气织物套穿步行鞋", BQ008: "网布厚底运动步行鞋", BQ009: "透气网布厚底运动步行鞋", BQ010: "弹力织物包头系带步行鞋",
  BQ011: "男士织物套穿步行鞋", BQ012: "透气针织厚底系带步行鞋", BQ013: "柔软织物套穿步行鞋", BQ014: "秋冬弹力织物套穿步行鞋", BQ015: "秋冬织物系带步行鞋",
  BQ016: "儿童针织套穿步行鞋", BQ017: "菱格织物系带步行鞋", BQ018: "轻量针织系带步行鞋", BQ019: "蜂窝针织系带休闲步行鞋", BQ020: "夏季镂空针织系带步行鞋",
  BQ021: "全黑针织套穿步行鞋", BQ022: "条纹针织套穿步行鞋", BQ023: "柔软针织套穿步行鞋", BQ024: "男士混色针织套穿步行鞋", BQ025: "低帮人字纹针织套穿鞋",
  BQ026: "透气孔眼针织系带步行鞋", BQ027: "米色针织波浪底系带步行鞋", BQ028: "贝壳鞋头针织套穿步行鞋", BQ029: "高帮袜套针织步行鞋", BQ030: "儿童网布系带步行鞋",
};

const colors: Record<string, string> = {
  Black: "黑色", White: "白色", Grey: "灰色", Pink: "粉色", Orange: "橙色", Blue: "蓝色", Purple: "紫色", Green: "绿色", Cream: "米色", Apricot: "杏色", Brown: "棕色", "Wine Red": "酒红色", "Light Grey": "浅灰色", "Dark Grey": "深灰色", Lavender: "薰衣草紫", "Mint Green": "薄荷绿", "All Black": "全黑", "All White": "全白", "Black White": "黑白", "Grey White": "灰白", "Grey Black": "灰黑", "Grey Khaki": "灰卡其", "White Grey": "白灰", "White Green": "白绿", "White Purple": "白紫", "White Pink": "白粉", "White Black": "白黑", "White Khaki": "白卡其", "Orange Black": "橙黑", "Black White Stripe": "黑白条纹", "Yellow Sole": "黄色鞋底", "White Sole Black": "白底黑面", "Zebra Stripe": "斑马纹", Red: "红色",
};

const phrases: [RegExp, string][] = [
  [/Knitted textile upper/gi, "针织织物鞋面"], [/Hollow knitted textile upper/gi, "镂空针织织物鞋面"], [/Breathable knitted upper/gi, "透气针织鞋面"], [/Mesh-textile upper/gi, "网布织物鞋面"], [/Mesh textile upper/gi, "网布织物鞋面"], [/Breathable mesh upper/gi, "透气网布鞋面"], [/Stretch fabric upper/gi, "弹力织物鞋面"], [/Stretch textile upper/gi, "弹力织物鞋面"], [/Textile upper/gi, "织物鞋面"], [/Soft textile upper/gi, "柔软织物鞋面"], [/Soft knitted upper/gi, "柔软针织鞋面"], [/Striped knitted upper/gi, "条纹针织鞋面"], [/Low-cut knitted upper/gi, "低帮针织鞋面"], [/High-top knit textile upper/gi, "高帮针织织物鞋面"], [/Quilted textile upper/gi, "菱格织物鞋面"],
  [/Cushion-profile sole; material confirmed before quotation/gi, "缓震轮廓鞋底；材质在报价前确认"], [/To be confirmed/gi, "待确认"],
  [/Order quantity and size ratio/gi, "订单数量与尺码配比"], [/Current color availability/gi, "当前颜色可用情况"], [/Packing and target timing/gi, "包装与目标时间"], [/Outsole and lining materials/gi, "鞋底与内里材质"], [/Upper, outsole and lining materials/gi, "鞋面、鞋底与内里材质"], [/Outsole foam\/material/gi, "鞋底发泡体系 / 材质"], [/Size range/gi, "尺码范围"], [/Fleece availability by color/gi, "各颜色加绒版本可用情况"], [/Kids compliance and age positioning/gi, "儿童产品合规要求与适用年龄定位"], [/Closure\/lace construction/gi, "闭合 / 鞋带结构"], [/Season\/lining option/gi, "季节与内里版本"], [/Season and lining/gi, "季节与内里"], [/Outsole material/gi, "鞋底材质"], [/Eyelet and upper material composition/gi, "孔眼与鞋面材料组成"], [/Fleece option by selected color/gi, "所选颜色对应的加绒版本"],
];

export function productNameZh(product: Product) { return names[product.code] || product.name; }
export function colorZh(color: string) { return colors[color] || color; }
export function factZh(value: string) { return phrases.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value); }
export function closureZh(value: Product["closure"]) { return value === "Slip-On" ? "套穿" : "系带"; }
export function productSummaryZh(product: Product) {
  const fit = product.code === "BQ001" || product.code === "BQ002" ? "已核实宽鞋头结构" : `${closureZh(product.closure)}结构`;
  return `${product.sourceModel}款，${fit}，提供${product.colors.length}种已整理颜色方向，适合作为海外B2B选款、样品和报价讨论的候选产品。`;
}
export function buyerFitZh(product: Product) {
  if (/Kids/i.test(product.group)) return "儿童鞋进口商、批发商及渠道买家";
  if (/Men/i.test(product.group)) return "男士休闲鞋进口商和批发买家";
  if (product.code === "BQ001" || product.code === "BQ002") return "宽鞋头舒适鞋进口商、批发商和线上渠道买家";
  if (/Athletic/i.test(product.group)) return "运动休闲鞋进口商、批发商和线上卖家";
  return "休闲步行鞋进口商、批发商、线上卖家和品牌买家";
}
