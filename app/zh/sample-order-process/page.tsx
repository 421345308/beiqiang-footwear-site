import type { Metadata } from "next";
import ChineseCapabilityPage, { type ChineseCapabilityPageData } from "../../components/ChineseCapabilityPage";

export const metadata: Metadata = { title: "鞋类样品与订单流程｜贝强鞋业", description: "了解从产品选款和规格核对，到样品、订单确认、包装与发运协调的B2B鞋类采购流程。", alternates: { canonical: "https://www.beiqiang.online/zh/sample-order-process/", languages: { en: "https://www.beiqiang.online/sample-order-process/", "zh-CN": "https://www.beiqiang.online/zh/sample-order-process/", "x-default": "https://www.beiqiang.online/sample-order-process/" } } };
const data: ChineseCapabilityPageData = {
  englishHref: "/sample-order-process/", eyebrow: "先样品、后大货", title: "先看样品，再决定大货。", introduction: "您可以从几款感兴趣的鞋开始，也可以提供自己的参考。我们先了解用途和要求，再确认是否能安排合适的样品、费用是多少，以及这次看样要解决哪些问题。", primaryCta: "建立询价单", primaryHref: "/zh/request-quote/",
  proofLabel: "从选款到下单", proofTitle: "图片用来选款，样品用来做决定。", proofCopy: "先用产品图片缩小范围，再通过样品检查合脚性、脚感和做工是否符合约定。样品订单与大货订单分开确认，收到样品并不代表必须采购大货。", images: [{ src: "/catalog/bq002/01_main.jpg", alt: "BQ002样品选款产品证据", caption: "产品选款" }, { src: "/factory/sole-check.jpg", alt: "产品评审过程中的鞋底检查", caption: "规格检查" }, { src: "/factory/stock-boxes.jpg", alt: "鞋品纸箱与订单处理", caption: "订单准备" }],
  stepsTitle: "从第一次咨询到出货，通常这样推进。", steps: [
  {
    "title": "说明想找什么鞋",
    "copy": "发送款号或参考链接，说明销售市场和大致数量。还没决定的细节，可以在沟通中补齐。"
  },
  {
    "title": "确认具体规格",
    "copy": "逐项沟通材料、尺码、颜色、品牌标识和包装调整，并核实所选款式能否实现。"
  },
  {
    "title": "安排样品",
    "copy": "付款前确认样品是否可安排、样品费、运费和时间，同时说清楚是看基础款，还是查看修改后的效果。"
  },
  {
    "title": "评样后确认大货",
    "copy": "先检查样品、沟通修改，再书面确认大货数量、码比、价格、付款方式和生产时间。"
  },
  {
    "title": "检查并安排出货",
    "copy": "按双方约定的样品和订单要求检查、包装，再确认发运单据和货物交接方式。"
  }
],
  confirmedTitle: "现在就能在网站上开始", confirmed: [
  "浏览和比较现有鞋款",
  "咨询单款，或合并多款提交询价",
  "保存询盘编号，私密查询和补充需求",
  "通过邮件、WhatsApp或阿里巴巴国际站联系"
], confirmTitle: "支付样品费用前，先确认", confirm: [
  "具体款式、尺码与颜色",
  "是否包含所提修改，哪些仍需开发",
  "样品费、运费及双方约定的费用条款",
  "预计备样和运输时间"
],
  closingTitle: "还没选好要看哪款样品？", closingCopy: "先告诉我们卖给谁、想找什么鞋。可以从合适的基础款聊起，再决定要看哪些样品。",
};
export default function ChineseSampleOrderProcessPage() { return <ChineseCapabilityPage data={data} />; }
