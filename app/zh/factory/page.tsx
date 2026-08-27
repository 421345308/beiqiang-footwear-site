import type { Metadata } from "next";
import ChineseCapabilityPage, { type ChineseCapabilityPageData } from "../../components/ChineseCapabilityPage";
import { productCount } from "../../data/catalog-meta";

export const metadata: Metadata = { title: "泉州鞋类工厂｜贝强鞋业", description: "查看贝强鞋业真实工作区域、鞋品处理与包装证据，再讨论步行鞋样品和B2B采购需求。", alternates: { canonical: "https://www.beiqiang.online/zh/factory/", languages: { en: "https://www.beiqiang.online/factory/", "zh-CN": "https://www.beiqiang.online/zh/factory/", "x-default": "https://www.beiqiang.online/factory/" } } };
const data: ChineseCapabilityPageData = {
  englishHref: "/factory/", eyebrow: "泉州鞋类工厂供应", title: "用看得见的证据开始工厂端采购沟通。", introduction: "贝强位于福建泉州，供应休闲步行鞋、纺织鞋及经逐款验证的宽鞋头产品。买家可先查看真实产品资料和工作区域证据，再进入样品和订单讨论。", primaryCta: "提交采购需求",
  proofLabel: "真实工作区域证据", proofTitle: "不要只依赖笼统的“工厂直供”表述。", proofCopy: "图片和视频来自贝强已核验的公司素材，展示工作区域、鞋品处理与纸箱准备；不据此虚构产能、客户品牌或认证。", evidenceVideo: true,
  images: [{ src: "/factory/workshop.png", alt: "贝强鞋业泉州工作区域", caption: "工作区域" }, { src: "/factory/workshop-line.png", alt: "鞋类工作台和生产区域", caption: "工作台区域" }, { src: "/factory/workshop-area.png", alt: "贝强鞋业另一处工作区域", caption: "工厂空间" }],
  stepsTitle: "把产品方向转成可核对项目。", steps: [{ title: "选择基础款", copy: `从网站${productCount}款资料中选款，或发送清晰参考图供可行性讨论。` }, { title: "说明市场需求", copy: "提供目标国家、买家类型、销售渠道、数量方向和关键要求。" }, { title: "核对规格", copy: "在最终条款前确认材料、尺码配比、颜色、结构和包装。" }, { title: "通过样品验证", copy: "以双方约定的样品评审产品方向，再决定是否进入大货。" }],
  confirmedTitle: "现在可以查看的内容", confirmed: [`${productCount}款已整理产品资料`, "真实产品图库与源款号", "工作、检查和包装图片及视频", "Email、WhatsApp和Alibaba.com联系入口"], confirmTitle: "收到需求后逐项确认", confirm: ["准确材料与结构", "可用尺码和颜色组合", "样品安排与定制可行性", "MOQ、价格、包装、交期和贸易条款"],
  closingTitle: "从款式和市场开始，不从一句“最低价”开始。", closingCopy: "完整需求能帮助工厂匹配产品方向、识别缺失规格，并准备更相关的样品或报价讨论。",
};
export default function ChineseFactoryPage() { return <ChineseCapabilityPage data={data} />; }
