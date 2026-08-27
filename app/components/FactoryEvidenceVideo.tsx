type FactoryEvidenceVideoProps = {
  compact?: boolean;
};

export default function FactoryEvidenceVideo({ compact = false }: FactoryEvidenceVideoProps) {
  return (
    <figure className={`factory-evidence-video${compact ? " factory-evidence-video-compact" : ""}`}>
      <video
        controls
        playsInline
        preload="metadata"
        poster="/videos/beiqiang-factory-proof-poster.jpg"
        aria-label="Silent footage of Beiqiang footwear working areas, shoe preparation, checking and packing"
      >
        <source src="/videos/beiqiang-factory-proof.webm" type="video/webm" />
        <source src="/videos/beiqiang-factory-proof.mp4" type="video/mp4" />
        Your browser does not support embedded video.
      </video>
      <figcaption>
        <strong>Factory-side footage</strong>
        <span>35 seconds · silent · production, checking and packing</span>
      </figcaption>
    </figure>
  );
}
