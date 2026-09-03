import { pathToFileURL } from "node:url";
import { SITE_RELEASE } from "../app/data/site-release.ts";

export const DEFAULT_ORIGINS = [
  "https://www.beiqiang.online",
  "https://beiqiang-footwear.cz8mynhrt7.chatgpt.site",
];

const REQUIRED_MEDIA = [
  ["/videos/beiqiang-factory-tour.mp4", "video/mp4"],
  ["/videos/beiqiang-factory-tour.en.vtt", "text/vtt"],
  ["/videos/beiqiang-factory-tour.zh.vtt", "text/vtt"],
];

export function normalizeOrigin(value) {
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Deployment origin must use http or https.");
  return url.origin;
}

export function inspectRelease(value) {
  return {
    releaseId: value?.releaseId || null,
    releaseMatches: value?.releaseId === SITE_RELEASE.releaseId,
    productCountMatches: value?.productCount === SITE_RELEASE.productCount,
    factoryVideoMatches:
      value?.factoryVideo?.durationSeconds === SITE_RELEASE.factoryVideo.durationSeconds &&
      JSON.stringify(value?.factoryVideo?.narrationLanguages) === JSON.stringify(SITE_RELEASE.factoryVideo.narrationLanguages) &&
      JSON.stringify(value?.factoryVideo?.captionLanguages) === JSON.stringify(SITE_RELEASE.factoryVideo.captionLanguages),
  };
}

export async function verifyDeployment(origin, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const timeoutMs = options.timeoutMs || 20_000;
  const base = normalizeOrigin(origin);
  const headers = {
    "cache-control": "no-cache",
    pragma: "no-cache",
    "user-agent": "Beiqiang-Deployment-Parity/1.0",
  };
  const releaseUrl = `${base}/release.json?deployment-check=${Date.now()}`;
  let release = null;
  let releaseStatus = null;
  let releaseError = null;
  try {
    const response = await fetchImpl(releaseUrl, {
      redirect: "follow",
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });
    releaseStatus = response.status;
    if (response.ok) release = await response.json();
    else releaseError = `HTTP ${response.status}`;
  } catch (error) {
    releaseError = error instanceof Error ? error.message : String(error);
  }

  const releaseInspection = inspectRelease(release);
  const media = await Promise.all(REQUIRED_MEDIA.map(async ([path, expectedType]) => {
    try {
      const response = await fetchImpl(`${base}${path}`, {
        redirect: "follow",
        headers: { ...headers, range: "bytes=0-0" },
        signal: AbortSignal.timeout(timeoutMs),
      });
      const contentType = response.headers.get("content-type") || "";
      return {
        path,
        status: response.status,
        contentType,
        ok: response.ok && contentType.toLowerCase().includes(expectedType),
      };
    } catch (error) {
      return { path, status: null, contentType: "", ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }));

  const ok = releaseStatus === 200 && !releaseError && Object.values(releaseInspection).slice(1).every(Boolean) && media.every((item) => item.ok);
  return { origin: base, ok, expectedReleaseId: SITE_RELEASE.releaseId, releaseStatus, releaseError, ...releaseInspection, media };
}

export function formatDeploymentReport(results) {
  const lines = [`Expected release: ${SITE_RELEASE.releaseId}`];
  for (const result of results) {
    lines.push(`${result.ok ? "PASS" : "FAIL"} ${result.origin} release=${result.releaseId || "missing"} status=${result.releaseStatus ?? "error"}`);
    for (const item of result.media) lines.push(`  ${item.ok ? "PASS" : "FAIL"} ${item.path} status=${item.status ?? "error"} type=${item.contentType || "missing"}`);
    if (result.releaseError) lines.push(`  release error: ${result.releaseError}`);
  }
  return lines.join("\n");
}

async function main() {
  const origins = process.argv.slice(2).filter((argument) => !argument.startsWith("--"));
  const targets = origins.length ? origins : DEFAULT_ORIGINS;
  const results = await Promise.all(targets.map((origin) => verifyDeployment(origin)));
  console.log(formatDeploymentReport(results));
  if (process.argv.includes("--json")) console.log(JSON.stringify({ expected: SITE_RELEASE, results }, null, 2));
  process.exitCode = results.every((result) => result.ok) ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
