import Link from "next/link";
import ChineseMobileNavigation from "./ChineseMobileNavigation";
import QuoteListLink from "./QuoteListLink";

export default function ChineseSiteHeader({ englishHref = "/" }: { englishHref?: string }) {
  return <><div className="top-note"><span>泉州鞋类工厂供应商</span><span>大货订单前确认样品、规格与商业条款</span></div><header className="site-header"><Link className="brand" href="/zh/" aria-label="贝强鞋业中文首页"><span className="brand-mark">BQ</span><span><strong>BEIQIANG</strong><small>贝强鞋业供应</small></span></Link><nav aria-label="中文主导航"><Link href="/zh/products/">全部产品</Link><Link href="/zh/line-sheet/">产品目录</Link><Link href="/zh/resources/">采购知识</Link><Link href="/zh/factory/">工厂</Link><Link href="/zh/buyer-workspace/">买家工作台</Link><Link className="language-link" href={englishHref} hrefLang="en" lang="en">English</Link></nav><QuoteListLink locale="zh" /><ChineseMobileNavigation englishHref={englishHref} /></header></>;
}
