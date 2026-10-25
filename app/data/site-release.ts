import { productCount } from "./catalog-meta.ts";

export const SITE_RELEASE = {
  releaseId: "2026-10-25.5",
  releasedAt: "2026-10-25T10:49:13+00:00",
  productCount,
  lineSheetPages: 10,
  factoryVideo: {
    durationSeconds: 180,
    narrationLanguages: ["en"],
    captionLanguages: ["en", "zh"],
    stillCount: 9,
  },
  publicOrigin: "https://www.beiqiang.online",
} as const;
