import type { Metadata } from "next";
import ChineseSiteFooter from "../../components/ChineseSiteFooter";
import ChineseSiteHeader from "../../components/ChineseSiteHeader";
import ChineseInquiryStatusLookup from "./ChineseInquiryStatusLookup";

export const metadata: Metadata = {
  title: "查询采购项目｜贝强鞋业",
  description: "使用询盘编号和私密查询码查看贝强鞋业采购项目的买家安全进度、消息与文件入口。",
  robots: { index: false, follow: false, noarchive: true, nocache: true },
  alternates: { canonical: "https://www.beiqiang.online/zh/inquiry-status/", languages: { en: "https://www.beiqiang.online/inquiry-status/", "zh-CN": "https://www.beiqiang.online/zh/inquiry-status/" } },
  openGraph: { title: "查询采购项目｜贝强鞋业", description: "使用询盘编号和私密查询码查看买家安全项目进度。", url: "https://www.beiqiang.online/zh/inquiry-status/", locale: "zh_CN", images: [] },
  twitter: { card: "summary", title: "查询采购项目｜贝强鞋业", description: "使用询盘编号和私密查询码查看买家安全项目进度。", images: [] },
};

export default function ChineseInquiryStatusPage() {
  return <main><ChineseSiteHeader englishHref="/inquiry-status/" /><ChineseInquiryStatusLookup /><ChineseSiteFooter /></main>;
}
