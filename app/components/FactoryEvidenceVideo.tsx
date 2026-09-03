type FactoryEvidenceVideoProps = {
  compact?: boolean;
  locale?: "en" | "zh";
};

const chapters = {
  en: [
    ["00:00", "Working-site exterior in Quanzhou"],
    ["00:08", "Material cutting preparation"],
    ["00:30", "Organized component racks"],
    ["00:40", "Stitching and upper construction"],
    ["01:03", "Finished-shoe storage and order staging"],
    ["01:25", "Upper finishing on the last"],
    ["01:40", "Production-line handling and pair checking"],
    ["02:05", "Shoe-box packing preparation"],
    ["02:13", "Line handling and finishing work"],
    ["02:40", "Equipment-assisted finishing"],
  ],
  zh: [
    ["00:00", "泉州工作场地外景"],
    ["00:08", "材料裁切准备"],
    ["00:30", "部件整理架"],
    ["00:40", "车缝与鞋面制作"],
    ["01:03", "成品鞋存放与订单整理"],
    ["01:25", "鞋楦上的鞋面整理"],
    ["01:40", "生产线处理与配对检查"],
    ["02:05", "鞋盒包装准备"],
    ["02:13", "生产线整理工作"],
    ["02:40", "设备辅助整理"],
  ],
} as const;

export default function FactoryEvidenceVideo({ compact = false, locale = "en" }: FactoryEvidenceVideoProps) {
  const zh = locale === "zh";
  const fullTour = !compact;
  return (
    <figure className={`factory-evidence-video${compact ? " factory-evidence-video-compact" : ""}`}>
      <video
        controls
        playsInline
        preload="metadata"
        poster={fullTour ? "/videos/beiqiang-factory-tour-poster.jpg" : "/videos/beiqiang-factory-proof-poster.jpg"}
        aria-label={zh ? "贝强鞋业工作区域与鞋类生产流程的无声实拍视频" : "Silent footage of Beiqiang footwear working areas and footwear production steps"}
      >
        {fullTour ? (
          <>
            <source src="/videos/beiqiang-factory-tour.mp4" type="video/mp4" />
            <source src="/videos/beiqiang-factory-tour.webm" type="video/webm" />
            <track kind="captions" src="/videos/beiqiang-factory-tour.en.vtt" srcLang="en" label="English scene captions" default={!zh} />
            <track kind="captions" src="/videos/beiqiang-factory-tour.zh.vtt" srcLang="zh" label="中文场景字幕" default={zh} />
          </>
        ) : (
          <>
            <source src="/videos/beiqiang-factory-proof.webm" type="video/webm" />
            <source src="/videos/beiqiang-factory-proof.mp4" type="video/mp4" />
          </>
        )}
        Your browser does not support embedded video.
      </video>
      <figcaption>
        <strong>{zh ? "工厂实拍" : "Factory-side footage"}</strong>
        <span>
          {fullTour
            ? (zh ? "Alibaba.com 3分钟完整工厂视频 · 原片静音 · 可选中英文场景字幕" : "Full 3-minute Alibaba.com factory tour · silent original · English scene captions on by default")
            : (zh ? "35秒预览 · 查看工厂页的3分钟完整版" : "35-second preview · watch the full 3-minute tour on the factory page")}
        </span>
        {compact ? <a href={zh ? "/zh/factory/" : "/factory/"}>{zh ? "观看完整版 →" : "Watch full tour →"}</a> : null}
      </figcaption>
      {fullTour ? (
        <details className="factory-video-chapters">
          <summary>{zh ? "查看视频章节与场景说明" : "View video chapters and scene guide"}</summary>
          <ol>
            {chapters[locale].map(([time, label]) => <li key={time}><time>{time}</time><span>{label}</span></li>)}
          </ol>
          <p>{zh ? "说明文字只描述视频中可见内容，不代表所有款式都采用完全相同的工艺或设备。" : "Scene descriptions cover only what is visible in this footage; they do not imply every style uses the same process or equipment."}</p>
        </details>
      ) : null}
    </figure>
  );
}
