import type { Metadata } from "next";
import ChineseSiteFooter from "../../components/ChineseSiteFooter";
import ChineseSiteHeader from "../../components/ChineseSiteHeader";
import ChineseQuoteRequestBuilder from "./ChineseQuoteRequestBuilder";

export const metadata: Metadata = { title: "建立多款鞋类B2B询价｜贝强鞋业", description: "选择多款贝强鞋业产品，填写数量、颜色、尺码、包装、贸易术语和技术开发要求，提交一份可审核的B2B询价。", alternates: { canonical: "https://www.beiqiang.online/zh/request-quote/", languages: { en: "https://www.beiqiang.online/request-quote/", "zh-CN": "https://www.beiqiang.online/zh/request-quote/", "x-default": "https://www.beiqiang.online/request-quote/" } }, openGraph: { title: "建立多款鞋类B2B询价｜贝强鞋业", description: "把候选款、数量、市场与交付要求整理成一份工厂可审核的采购需求。", url: "https://www.beiqiang.online/zh/request-quote/", locale: "zh_CN", images: ["https://www.beiqiang.online/og.jpg"] }, twitter: { card: "summary_large_image", title: "建立多款鞋类B2B询价｜贝强鞋业", description: "把候选款与采购要求整理成一份工厂可审核的需求。", images: ["https://www.beiqiang.online/og.jpg"] } };
export default function ChineseRequestQuotePage() { return <main><ChineseSiteHeader englishHref="/request-quote/" /><ChineseQuoteRequestBuilder /><ChineseSiteFooter /></main>; }
