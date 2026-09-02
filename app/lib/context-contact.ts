const PRIVATE_OR_DUPLICATE_PREFIXES = [
  "/admin",
  "/buyer-workspace",
  "/inquiry-status",
  "/request-quote",
  "/zh/buyer-workspace",
  "/zh/inquiry-status",
  "/zh/request-quote",
] as const;

const collectionLabels: Record<string, [string, string]> = {
  "wide-toe-box": ["wide toe box collection", "宽鞋头系列"],
  "knit-slip-on": ["knit slip-on collection", "针织易穿系列"],
  "breathable-lace-up": ["breathable lace-up collection", "透气系带系列"],
  "high-top-shoes": ["high-top and sock-style collection", "高帮与袜套系列"],
  "kids-shoes": ["kids footwear collection", "儿童鞋系列"],
  "extended-size-shoes": ["extended-size collection", "扩展尺码系列"],
  "fleece-lined-shoes": ["fleece-lined options", "加绒产品方向"],
};

export function cleanPublicPath(pathname: string) {
  const path = String(pathname || "/").split(/[?#]/, 1)[0];
  if (!path.startsWith("/") || path.includes("..")) return "/";
  return path.slice(0, 180) || "/";
}

export function shouldShowContextContact(pathname: string) {
  const path = cleanPublicPath(pathname);
  return !PRIVATE_OR_DUPLICATE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function describeContactPage(pathname: string, zh: boolean) {
  const path = cleanPublicPath(pathname).replace(/^\/zh(?=\/|$)/, "") || "/";
  const product = path.match(/^\/products\/(bq\d{3})\/?$/i);
  if (product) return zh ? `产品 ${product[1].toUpperCase()} 页面` : `product ${product[1].toUpperCase()} page`;
  const collection = path.match(/^\/collections\/([^/]+)\/?$/i)?.[1];
  if (collectionLabels[collection || ""]) return collectionLabels[collection!][zh ? 1 : 0];
  if (path.startsWith("/factory")) return zh ? "工厂与供应商资料" : "factory and supplier information";
  if (path.startsWith("/quality-packing")) return zh ? "检查与包装流程" : "quality-check and packing process";
  if (path.startsWith("/oem-odm") || path.startsWith("/solutions/") || path.startsWith("/private-label-concept")) return zh ? "OEM／ODM采购方案" : "OEM / ODM sourcing program";
  if (path.startsWith("/products") || path.startsWith("/product-finder") || path.startsWith("/line-sheet")) return zh ? "当前产品选款" : "current product selection";
  if (path.startsWith("/buyer-guide") || path.startsWith("/sample-order-process") || path.startsWith("/resources")) return zh ? "B2B采购流程资料" : "B2B buying-process information";
  return zh ? "贝强鞋业B2B网站" : "Beiqiang B2B footwear website";
}

export function buildContextContactLinks(pathname: string) {
  const path = cleanPublicPath(pathname);
  const zh = path === "/zh" || path.startsWith("/zh/");
  const context = describeContactPage(path, zh);
  const message = zh
    ? `您好，贝强鞋业。我正在查看${context}（页面：${path}）。我的目标市场／销售渠道是：[请填写]，预计采购数量是：[请填写]。请协助确认合适款式、样品方向，以及准备有效报价还需要哪些资料。`
    : `Hello Beiqiang, I am reviewing the ${context} (page: ${path}). My target market / sales channel is [please add], and my expected quantity is [please add]. Please help me confirm suitable styles, sample options and the information needed for a useful quotation.`;
  const subject = zh ? `贝强鞋业采购沟通｜${context}` : `Beiqiang sourcing discussion | ${context}`;
  return {
    zh,
    context,
    whatsappHref: `https://wa.me/8618959805256?text=${encodeURIComponent(message)}`,
    emailHref: `mailto:421345308@qq.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`,
    quoteHref: zh ? "/zh/request-quote/" : "/request-quote/",
  };
}
