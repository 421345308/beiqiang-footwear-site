import type { Metadata } from "next";
import BuyerHome from "../components/BuyerHome";
import { pageAlternates } from "../lib/public-locales";
export const metadata: Metadata = {title:"贝强鞋业｜休闲鞋与步行鞋制造 · OEM与品牌定制",description:"泉州贝强鞋业面向品牌商、进口商和批发客户，经营休闲鞋与步行鞋OEM/ODM及批发业务。浏览产品系列，了解工厂与定制服务。",alternates:pageAlternates("/","zh"),openGraph:{title:"贝强鞋业｜鞋类制造与品牌定制",description:"产品系列、工厂实拍与OEM/ODM服务。",url:"https://www.beiqiang.online/zh/",locale:"zh_CN"}};
export default function ChineseHome() {return <BuyerHome locale="zh" />;}
