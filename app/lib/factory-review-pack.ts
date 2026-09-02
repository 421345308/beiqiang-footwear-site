export type FactoryReviewPackLocale = "en" | "zh";

export function buildFactoryReviewPackText(productCount: number, locale: FactoryReviewPackLocale) {
  const count = Number.isFinite(productCount) && productCount > 0 ? Math.floor(productCount) : 0;
  if (locale === "zh") {
    return [
      "贝强鞋业｜买家供应商评审简报",
      "",
      "公司：泉州贝强鞋业服饰有限公司",
      "地点：中国福建泉州",
      "供货模式：鞋类OEM/ODM与批发供货",
      "服务买家：进口商、批发商、Amazon/TikTok卖家、采购代理及品牌/私标买家",
      `当前网站选款：${count}款已整理产品页；不等于工厂全部产品范围`,
      "产品方向：舒适步行鞋、休闲步行鞋、轻量套脚鞋、透气针织/纺织鞋及相关休闲鞋",
      "",
      "现在可以审核：",
      "- 真实工作区域、鞋品处理、检查与包装图片和视频",
      "- 当前已整理产品图库、源款号与逐款公开资料",
      "- 样品、规格、报价、订单准备和履约协作路径",
      "- Email、WhatsApp和Alibaba.com联系及正式交易入口",
      "",
      "收到具体采购需求后确认：",
      "- 准确材料、结构、尺码和颜色组合",
      "- 样品可行性、范围、费用和时间",
      "- MOQ、价格、包装、交期和贸易条款",
      "- 买家点名要求的公司、合规或测试文件是否可提供",
      "",
      "买家下一步：提供目标市场、销售渠道、参考款或图片、预计数量、尺码颜色、品牌包装、目的地和目标时间。",
      "联系：421345308@qq.com｜WhatsApp +86 189 5980 5256",
      "交易：规格和书面报价确认后，通过Alibaba Trade Assurance或双方签署合同推进。",
      "",
      "本简报用于采购团队初步供应商评审，不是第三方审厂报告、认证、产能证明、报价、库存确认、样品批准、合同、订单或付款请求。所有项目事实需按具体款式和书面文件确认。",
    ].join("\n");
  }

  return [
    "Beiqiang Footwear | Buyer supplier-review brief",
    "",
    "Company: Quanzhou Beiqiang Footwear & Apparel Co., Ltd.",
    "Location: Quanzhou, Fujian, China",
    "Supply model: footwear OEM/ODM and wholesale supply",
    "Buyer fit: importers, wholesalers, Amazon/TikTok sellers, sourcing agents and brand/private-label buyers",
    `Current website selection: ${count} organized product pages; not the factory's full product range`,
    "Product directions: comfort walking shoes, casual walking shoes, lightweight slip-ons, breathable knit/textile shoes and related casual footwear",
    "",
    "Available for review now:",
    "- Real working-area, footwear handling, checking and packing images and video",
    "- Current organized product galleries, source-model references and style-level public details",
    "- Sample, specification, quotation, order-preparation and fulfillment collaboration paths",
    "- Email, WhatsApp and Alibaba.com contact and formal transaction routes",
    "",
    "Confirmed after a specific sourcing brief:",
    "- Exact materials, construction, size and color matrix",
    "- Sample feasibility, scope, cost and timing",
    "- MOQ, price, packing, lead time and trade terms",
    "- Availability of any company, compliance or test documents named by the buyer",
    "",
    "Buyer next step: share the target market, sales channel, style reference or image, expected quantity, size/color plan, branding/packing, destination and target timing.",
    "Contact: 421345308@qq.com | WhatsApp +86 189 5980 5256",
    "Transaction: after specifications and written quotation are confirmed, proceed through Alibaba Trade Assurance or a signed bilateral contract.",
    "",
    "This brief supports an initial buying-team supplier review. It is not a third-party factory audit, certificate, capacity proof, quotation, stock confirmation, sample approval, contract, order or payment request. Confirm every project fact against the specific style and written documents.",
  ].join("\n");
}
