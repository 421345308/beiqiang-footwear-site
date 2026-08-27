import type { Metadata } from "next";
import ChineseSiteFooter from "../../components/ChineseSiteFooter";
import ChineseSiteHeader from "../../components/ChineseSiteHeader";
import ChineseBuyerWorkspace from "./ChineseBuyerWorkspace";

export const metadata: Metadata = {
  title: "买家工作台｜贝强鞋业",
  description: "通过一次性安全邮件链接查看与业务邮箱关联的贝强鞋业采购项目、买家安全摘要与下一步。",
  robots: { index: false, follow: false, noarchive: true, nocache: true },
  alternates: { canonical: "https://www.beiqiang.online/zh/buyer-workspace/", languages: { en: "https://www.beiqiang.online/buyer-workspace/", "zh-CN": "https://www.beiqiang.online/zh/buyer-workspace/" } },
  openGraph: { title: "买家工作台｜贝强鞋业", description: "通过一次性邮件链接查看多个买家安全项目摘要。", url: "https://www.beiqiang.online/zh/buyer-workspace/", locale: "zh_CN", images: [] },
  twitter: { card: "summary", title: "买家工作台｜贝强鞋业", description: "通过一次性邮件链接查看多个买家安全项目摘要。", images: [] },
};

export default function ChineseBuyerWorkspacePage() {
  return <main><ChineseSiteHeader englishHref="/buyer-workspace/" /><ChineseBuyerWorkspace /><ChineseSiteFooter /></main>;
}
