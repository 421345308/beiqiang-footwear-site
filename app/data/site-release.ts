import { productCount } from "./catalog-meta.ts";

export const SITE_RELEASE = {
  releaseId: "2026-11-03.8",
  releasedAt: "2026-11-03T00:37:00+00:00",
  productCount,
  publicLanguages: ["en", "zh", "de", "fr", "es"],
  lineSheetPages: Math.ceil(productCount / 5) + 2,
  factoryVideo: {
    durationSeconds: 180,
    narrationLanguages: ["en"],
    captionLanguages: ["en", "zh"],
    stillCount: 9,
  },
  publicOrigin: "https://www.beiqiang.online",
} as const;
