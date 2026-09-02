const siteUrl = "https://www.beiqiang.online";

export function factoryVideoSchema(locale: "en" | "zh" = "en") {
  const zh = locale === "zh";
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: zh ? "贝强鞋业工作区域与鞋品处理实拍" : "Beiqiang footwear working-area and product-handling footage",
    description: zh
      ? "展示贝强鞋业工作区域、鞋品整理、检查与包装准备的35秒实拍视频。"
      : "A 35-second view of Beiqiang Footwear working areas, shoe handling, checking and packing preparation in Quanzhou, China.",
    thumbnailUrl: `${siteUrl}/videos/beiqiang-factory-proof-poster.jpg`,
    contentUrl: `${siteUrl}/videos/beiqiang-factory-proof.mp4`,
    embedUrl: `${siteUrl}${zh ? "/zh/factory/" : "/factory/"}`,
    uploadDate: "2026-08-28T00:00:00+08:00",
    duration: "PT35S",
    inLanguage: zh ? "zh-CN" : "en",
  };
}
