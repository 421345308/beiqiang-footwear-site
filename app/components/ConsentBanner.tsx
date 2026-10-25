"use client";

import Link from "next/link";
import { t, europeLocales, type EuropeLocale } from "../data/europe-copy";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { analyticsConsent, setAnalyticsConsent } from "../lib/tracking";

export default function ConsentBanner() {
  const pathname = usePathname();
  useEffect(()=>{const prefix=pathname.split("/")[1];document.documentElement.lang=prefix==="zh"?"zh-CN":["de","fr","es"].includes(prefix)?prefix:"en";},[pathname]);
  const isChinese = pathname === "/zh" || pathname.startsWith("/zh/");
  const [visible, setVisible] = useState(false);
  useEffect(() => { const refresh=()=>setVisible(analyticsConsent()===null); const timer=window.setTimeout(refresh,0); window.addEventListener("beiqiang-consent-changed",refresh); return ()=>{window.clearTimeout(timer);window.removeEventListener("beiqiang-consent-changed",refresh);}; }, []);
  if (!visible) return null;
  function choose(value: boolean) { setAnalyticsConsent(value); setVisible(false); }
  const language = pathname.split("/")[1] as EuropeLocale;
  if (europeLocales.includes(language)) return <aside className="consent-banner" aria-label={t(language,"privacyChoice")}><div><strong>{t(language,"privacyChoice")}</strong><p>{t(language,"consentText")}</p><a href={`/${language}/privacy/`}>{t(language,"privacy")}</a></div><div><button className="button button-small button-secondary" onClick={()=>choose(false)}>{t(language,"essential")}</button><button className="button button-small" onClick={()=>choose(true)}>{t(language,"analytics")}</button></div></aside>;
  if (isChinese) {
    return <aside className="consent-banner" aria-label="网站统计选择"><div><strong>你的隐私选择</strong><p>必要功能会在本设备保存询价单和询盘查询信息。可选的站内统计用于了解哪些产品页面带来了 B2B 询盘；只有在你同意后才会启用。</p><Link href="/zh/privacy/">阅读隐私说明</Link></div><div><button className="button button-small button-secondary" type="button" onClick={() => choose(false)}>仅使用必要功能</button><button className="button button-small" type="button" onClick={() => choose(true)}>同意站内统计</button></div></aside>;
  }
  return <aside className="consent-banner" aria-label="Website analytics choice"><div><strong>Your privacy choice</strong><p>Essential functions keep quote lists and inquiry access on this device. Optional first-party analytics help Beiqiang understand which product pages lead to B2B inquiries. We do not run optional analytics unless you accept.</p><Link href="/privacy/">Read privacy notice</Link></div><div><button className="button button-small button-secondary" type="button" onClick={() => choose(false)}>Essential only</button><button className="button button-small" type="button" onClick={() => choose(true)}>Accept analytics</button></div></aside>;
}
