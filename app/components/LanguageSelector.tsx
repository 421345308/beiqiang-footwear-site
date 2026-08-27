import Link from "next/link";

export default function LanguageSelector({ locale, alternateHref }: { locale: "en" | "zh"; alternateHref: string }) {
  const chinese = locale === "zh";
  return (
    <details className="language-selector">
      <summary aria-label={chinese ? "选择网站语言，当前为简体中文" : "Choose website language, currently English"}>
        <span aria-hidden="true">{chinese ? "语言" : "Language"}</span>
        <strong>{chinese ? "中文" : "EN"}</strong>
      </summary>
      <div className="language-selector-menu" aria-label={chinese ? "网站语言" : "Website language"}>
        {chinese ? (
          <>
            <span aria-current="page"><b>简体中文</b><small>当前</small></span>
            <Link href={alternateHref} hrefLang="en" lang="en"><b>English</b><small>EN</small></Link>
          </>
        ) : (
          <>
            <span aria-current="page"><b>English</b><small>Current</small></span>
            <Link href={alternateHref} hrefLang="zh-CN" lang="zh-CN"><b>简体中文</b><small>ZH</small></Link>
          </>
        )}
      </div>
    </details>
  );
}
