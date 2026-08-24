import Link from "next/link";

export default function ChineseSiteFooter() {
  return <footer><div className="brand footer-brand"><span className="brand-mark">BQ</span><span><strong>BEIQIANG</strong><small>贝强鞋业供应</small></span></div><p>泉州贝强鞋服有限公司<br />中国福建泉州<br /><a href="mailto:421345308@qq.com">421345308@qq.com</a> · <a href="https://wa.me/8618959805256" target="_blank" rel="noreferrer">WhatsApp +86 189 5980 5256</a></p><p className="footer-links"><Link href="/zh/products/">全部30款产品</Link><Link href="/zh/request-quote/">建立询价单</Link><Link href="/inquiry-status/">查询项目进度（英文）</Link><Link href="/zh/privacy/">隐私说明</Link><Link href="/zh/terms/">B2B交易说明</Link><Link href="/" hrefLang="en" lang="en">English website</Link><a href="https://cn1576227362luzl.m.en.alibaba.com/" target="_blank" rel="noreferrer">Alibaba.com店铺</a></p></footer>;
}
