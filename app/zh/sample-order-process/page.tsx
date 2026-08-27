import type { Metadata } from "next";
import ChineseCapabilityPage, { type ChineseCapabilityPageData } from "../../components/ChineseCapabilityPage";

export const metadata: Metadata = { title: "鞋类样品与订单流程｜贝强鞋业", description: "了解从产品选款和规格核对，到样品、订单确认、包装与发运协调的B2B鞋类采购流程。", alternates: { canonical: "https://www.beiqiang.online/zh/sample-order-process/", languages: { en: "https://www.beiqiang.online/sample-order-process/", "zh-CN": "https://www.beiqiang.online/zh/sample-order-process/", "x-default": "https://www.beiqiang.online/sample-order-process/" } } };
const data: ChineseCapabilityPageData = {
  englishHref: "/sample-order-process/", eyebrow: "先样品、后大货", title: "把产品兴趣转成可下单的规格。", introduction: "网站帮助买家选款和整理采购资料；选定款式和高影响订单信息核对后，才能进入样品、报价和大货条款。", primaryCta: "建立询价单", primaryHref: "/zh/request-quote/",
  proofLabel: "为什么需要流程", proofTitle: "每一步解决不同的采购不确定性。", proofCopy: "图片帮助选款，但不能确认全部材料、适配、包装或商业要求。样品与订单需求书用于建立双方下一次决定的共同参考。", images: [{ src: "/catalog/bq002/01_main.jpg", alt: "BQ002样品选款产品证据", caption: "产品选款" }, { src: "/factory/sole-check.jpg", alt: "产品评审过程中的鞋底检查", caption: "规格检查" }, { src: "/factory/stock-boxes.jpg", alt: "鞋品纸箱与订单处理", caption: "订单准备" }],
  stepsTitle: "从选款到发运协调的五个决定。", steps: [{ title: "选款", copy: "选择产品款号，或提交参考图及目的市场和销售渠道。" }, { title: "规格核对", copy: "对齐尺码、颜色、材料、数量、包装和定制要求。" }, { title: "样品讨论", copy: "确认样品是否可安排、费用、交付方式及样品验证范围。" }, { title: "大货确认", copy: "规格评审后，以书面方式确认价格、数量、码比、包装、贸易条款和时间。" }, { title: "检查、包装和交接", copy: "按已确认订单参考推进检查、包装和发运交接。" }],
  confirmedTitle: "网站目前可以处理", confirmed: ["产品发现与比较", "单款和多款询盘", "邮件通知与内部询盘台账", "WhatsApp、Email和Alibaba.com承接"], confirmTitle: "需要直接商业确认", confirm: ["样品费用与交付方式", "最终FOB或其他贸易条款价格", "大货数量、包装和交期", "付款、物流与正式交易安排"],
  closingTitle: "提供足以支持下一项决定的资料。", closingCopy: "款号、市场、数量、尺码、颜色和时间，比一句“多少钱”更可执行，也能减少业务员反复追问。",
};
export default function ChineseSampleOrderProcessPage() { return <ChineseCapabilityPage data={data} />; }
