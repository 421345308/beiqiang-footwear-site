const siteUrl = "https://www.beiqiang.online";

export function factoryVideoSchema(locale: "en" | "zh" = "en") {
  const zh = locale === "zh";
  const transcript = zh
    ? "00:00 场地外景；00:08 材料裁切准备；00:30 部件整理；00:40 车缝与鞋面制作；01:03 成品鞋存放；01:25 鞋面整理；01:40 生产线处理与配对检查；02:05 鞋盒包装准备；02:13 生产线整理；02:40 设备辅助整理。"
    : "00:00 working-site exterior; 00:08 material cutting preparation; 00:30 component organization; 00:40 stitching and upper construction; 01:03 finished-shoe storage; 01:25 upper finishing; 01:40 line handling and pair checking; 02:05 shoe-box packing preparation; 02:13 line finishing work; 02:40 equipment-assisted finishing.";
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: zh ? "贝强鞋业工作区域与鞋品处理实拍" : "Beiqiang footwear working-area and product-handling footage",
    description: zh
      ? "展示贝强鞋业场地外景、材料准备、鞋面车缝、生产线处理、鞋品检查与包装准备的3分钟实拍视频，提供英文配音及中英文场景字幕。"
      : "A three-minute tour of Beiqiang Footwear showing the working-site exterior, material preparation, upper stitching, line handling, shoe checking and packing preparation, with English narration and selectable captions.",
    thumbnailUrl: `${siteUrl}/videos/beiqiang-factory-tour-poster.jpg`,
    contentUrl: `${siteUrl}/videos/beiqiang-factory-tour.mp4`,
    embedUrl: `${siteUrl}${zh ? "/zh/factory/" : "/factory/"}`,
    uploadDate: "2026-09-03T00:00:00+08:00",
    duration: "PT3M",
    inLanguage: zh ? "zh-CN" : "en",
    transcript,
  };
}
