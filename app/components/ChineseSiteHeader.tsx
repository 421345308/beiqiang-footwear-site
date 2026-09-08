import Link from "next/link";
import ChineseMobileNavigation from "./ChineseMobileNavigation";
import QuoteListLink from "./QuoteListLink";
import DesktopBuyerNavigation from "./DesktopBuyerNavigation";

export default function ChineseSiteHeader({ englishHref = "/" }: { englishHref?: string }) {
  return <><div className="top-note"><span>泉州鞋类工厂供应商</span><span>先确认样品、规格和报价，再安排订单</span></div><header className="site-header"><Link className="brand" href="/zh/" aria-label="贝强鞋业中文首页"><span className="brand-mark">BQ</span><span><strong>BEIQIANG</strong><small>贝强鞋业供应</small></span></Link><DesktopBuyerNavigation locale="zh" alternateHref={englishHref} /><QuoteListLink locale="zh" /><ChineseMobileNavigation englishHref={englishHref} /></header></>;
}
