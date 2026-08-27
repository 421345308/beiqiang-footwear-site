import type { Metadata } from "next";
import ChineseSiteFooter from "../../components/ChineseSiteFooter";
import ChineseSiteHeader from "../../components/ChineseSiteHeader";
import ChineseInquiryStatusLookup from "./ChineseInquiryStatusLookup";

export const metadata: Metadata = {
  title: "中文采购项目与交易决定｜贝强鞋业",
  description: "使用询盘编号和私密查询码，以中文查看贝强鞋业采购项目并处理选款、样品、报价、订单、履约与复购决定。",
  robots: { index: false, follow: false, noarchive: true, nocache: true },
  alternates: { canonical: "https://www.beiqiang.online/zh/inquiry-status/", languages: { en: "https://www.beiqiang.online/inquiry-status/", "zh-CN": "https://www.beiqiang.online/zh/inquiry-status/" } },
  openGraph: { title: "中文采购项目与交易决定｜贝强鞋业", description: "在受保护项目中查看进度并处理选款、样品、报价、订单及履约决定。", url: "https://www.beiqiang.online/zh/inquiry-status/", locale: "zh_CN", images: [] },
  twitter: { card: "summary", title: "中文采购项目与交易决定｜贝强鞋业", description: "在受保护项目中查看进度并处理选款、样品、报价、订单及履约决定。", images: [] },
};

export default function ChineseInquiryStatusPage() {
  return <main><ChineseSiteHeader englishHref="/inquiry-status/" /><ChineseInquiryStatusLookup /><ChineseSiteFooter /></main>;
}
