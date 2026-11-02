import { productCount } from "./catalog-meta.ts";

export const SITE_RELEASE = {
  releaseId: "2026-11-02.1",
  releasedAt: "2026-11-02T01:42:00+00:00",
  productCount,
  publicLanguages: ["en", "zh", "de", "fr", "es"],
  lineSheetPages: 16,
  factoryVideo: {
    durationSeconds: 180,
    narrationLanguages: ["en"],
    captionLanguages: ["en", "zh"],
    stillCount: 9,
  },
  publicOrigin: "https://www.beiqiang.online",
} as const;
