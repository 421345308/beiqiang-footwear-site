type FactoryEvidenceVideoProps = {
  compact?: boolean;
  locale?: "en" | "zh";
};

export default function FactoryEvidenceVideo({ compact = false, locale = "en" }: FactoryEvidenceVideoProps) {
  const zh = locale === "zh";
  return (
    <figure className={`factory-evidence-video${compact ? " factory-evidence-video-compact" : ""}`}>
      <video
        controls
        playsInline
        preload="metadata"
        poster="/videos/beiqiang-factory-proof-poster.jpg"
        aria-label={zh ? "贝强鞋业工作区域、鞋品整理、检查和包装的无声实拍视频" : "Silent footage of Beiqiang footwear working areas, shoe preparation, checking and packing"}
      >
        <source src="/videos/beiqiang-factory-proof.webm" type="video/webm" />
        <source src="/videos/beiqiang-factory-proof.mp4" type="video/mp4" />
        Your browser does not support embedded video.
      </video>
      <figcaption>
        <strong>{zh ? "工厂实拍" : "Factory-side footage"}</strong>
        <span>{zh ? "35秒 · 无声 · 生产、检查与包装" : "35 seconds · silent · production, checking and packing"}</span>
      </figcaption>
    </figure>
  );
}
