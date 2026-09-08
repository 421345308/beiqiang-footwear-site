import type { Metadata } from "next";
import BuyerHome from "../components/BuyerHome";
export const metadata: Metadata = {
 title: "贝强鞋业｜休闲鞋批发、品牌贴牌与来样定制",
 description: "福建泉州贝强鞋业，为批发商和品牌客户提供休闲鞋选款、贴牌定制沟通、样品确认与订单跟进。查看工厂实拍，告诉我们您的款式、数量和销售市场。",
 alternates: { canonical: "https://www.beiqiang.online/zh/", languages: { en: "https://www.beiqiang.online/", "zh-CN": "https://www.beiqiang.online/zh/", "x-default": "https://www.beiqiang.online/" } },
 openGraph: { title: "贝强鞋业｜休闲鞋批发与品牌定制", description: "从选款、打样到包装和出货，先把每一步说明白。", url: "https://www.beiqiang.online/zh/", locale: "zh_CN" }
};
export default function ChineseHome() { return <BuyerHome locale="zh" />; }
