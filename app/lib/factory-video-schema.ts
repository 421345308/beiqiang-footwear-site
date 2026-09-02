const siteUrl = "https://www.beiqiang.online";

export function factoryVideoSchema(locale: "en" | "zh" = "en") {
  const zh = locale === "zh";
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: zh ? "贝强鞋业工厂工作区域与鞋类生产流程实拍" : "Beiqiang footwear factory and production workflow footage",
    description: zh
      ? "展示贝强鞋业工作区域、鞋类生产、检查与包装环节的35秒实拍视频。"
      : "A 35-second view of Beiqiang Footwear working areas, footwear production, checking and packing in Quanzhou, China.",
    thumbnailUrl: `${siteUrl}/videos/beiqiang-factory-proof-poster.jpg`,
    contentUrl: `${siteUrl}/videos/beiqiang-factory-proof.mp4`,
    embedUrl: `${siteUrl}${zh ? "/zh/factory/" : "/factory/"}`,
    uploadDate: "2026-08-28T00:00:00+08:00",
    duration: "PT35S",
    inLanguage: zh ? "zh-CN" : "en",
  };
}
