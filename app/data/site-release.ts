import { productCount } from "./catalog-meta.ts";
import { lineSheetProductCount } from "./line-sheet-selection.ts";
import lineSheetManifest from "./line-sheet-manifest.json" with { type: "json" };

export const SITE_RELEASE = {
  releaseId: "2026-11-11.5",
  releasedAt: "2026-11-11T07:53:43+00:00",
  productCount,
  publicLanguages: ["en", "zh", "de", "fr", "es"],
  lineSheetProductCount,
  lineSheetPages: lineSheetManifest.pageCount,
  factoryVideo: {
    durationSeconds: 180,
    narrationLanguages: ["en"],
    captionLanguages: ["en", "zh"],
    stillCount: 9,
  },
  publicOrigin: "https://www.beiqiang.online",
} as const;
