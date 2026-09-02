import { pathToFileURL } from "node:url";

export const DEFAULT_ORIGIN = "https://www.beiqiang.online";

const ROUTES = [
  {
    path: "/",
    label: "English home",
    required: [/Quanzhou Beiqiang Footwear/i, /\/request-quote\//i, /421345308@qq\.com/i],
  },
  {
    path: "/products/",
    label: "English catalogue",
    required: [/56\s*product pages/i, /BQ061/i, /START BY SOURCING DIRECTION/i],
    forbidden: [/SKU evidence/i],
  },
  {
    path: "/zh/products/",
    label: "Chinese catalogue",
    required: [/56/, /BQ061/, /采购方向/],
    forbidden: [/SKU evidence/i],
  },
  {
    path: "/products/bq061/",
    label: "Latest English product page",
    required: [/BQ061/i, /AA811/i, /Knitted textile upper/i, /\/request-quote\//i],
  },
  {
    path: "/robots.txt",
    label: "Crawler policy",
    required: [
      /User-agent:\s*Googlebot/i,
      /User-agent:\s*OAI-SearchBot/i,
      /User-agent:\s*ChatGPT-User/i,
      /Disallow:\s*\/admin\//i,
      /Disallow:\s*\/buyer-workspace\//i,
      /Disallow:\s*\/inquiry-status\//i,
      /Sitemap:\s*https:\/\/www\.beiqiang\.online\/sitemap\.xml/i,
    ],
  },
  {
    path: "/sitemap.xml",
    label: "Search sitemap",
    required: [
      /https:\/\/www\.beiqiang\.online\/products\/bq061\//i,
      /hreflang="zh-CN"/i,
      /<image:loc>/i,
      /<video:content_loc>/i,
    ],
    forbidden: [/\/admin\//i, /\/buyer-workspace\//i, /\/inquiry-status\//i, /\/api\//i],
  },
  {
    path: "/llms.txt",
    label: "AI-readable business summary",
    required: [
      /56 organized product pages/i,
      /BQ061 \/ AA811/i,
      /Alibaba Trade Assurance or a signed bilateral contract/i,
      /421345308@qq\.com/i,
    ],
  },
];

export function normalizeOrigin(value = DEFAULT_ORIGIN) {
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Base URL must use http or https.");
  return url.origin;
}

export function inspectText(text, required = [], forbidden = []) {
  const searchableText = text.replace(/<!--[\s\S]*?-->/g, "");
  return {
    missing: required.filter((pattern) => !pattern.test(searchableText)).map(String),
    forbidden: forbidden.filter((pattern) => pattern.test(searchableText)).map(String),
  };
}

export async function verifyPublicSite(origin, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const timeoutMs = options.timeoutMs || 20_000;
  const base = normalizeOrigin(origin);
  const results = await Promise.all(ROUTES.map(async (route) => {
    const url = `${base}${route.path}`;
    const startedAt = Date.now();
    try {
      const response = await fetchImpl(url, {
        redirect: "follow",
        headers: { "user-agent": "Beiqiang-Public-Site-Verifier/1.0" },
        signal: AbortSignal.timeout(timeoutMs),
      });
      const text = await response.text();
      const inspection = inspectText(text, route.required, route.forbidden);
      const ok = response.ok && inspection.missing.length === 0 && inspection.forbidden.length === 0;
      return {
        label: route.label,
        path: route.path,
        url,
        status: response.status,
        ok,
        elapsedMs: Date.now() - startedAt,
        ...inspection,
      };
    } catch (error) {
      return {
        label: route.label,
        path: route.path,
        url,
        status: null,
        ok: false,
        elapsedMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }));

  return {
    origin: base,
    checkedAt: new Date().toISOString(),
    ok: results.every((item) => item.ok),
    passed: results.filter((item) => item.ok).length,
    total: results.length,
    results,
  };
}

export function formatReport(report) {
  const lines = [
    `Public site verification: ${report.origin}`,
    `Result: ${report.ok ? "PASS" : "FAIL"} (${report.passed}/${report.total})`,
  ];
  for (const item of report.results) {
    const detail = item.error
      ? `error=${item.error}`
      : `status=${item.status}${item.missing?.length ? ` missing=${item.missing.join(",")}` : ""}${item.forbidden?.length ? ` forbidden=${item.forbidden.join(",")}` : ""}`;
    lines.push(`${item.ok ? "PASS" : "FAIL"} ${item.path} ${detail} ${item.elapsedMs}ms`);
  }
  return lines.join("\n");
}

async function main() {
  const origin = process.argv[2] || DEFAULT_ORIGIN;
  const report = await verifyPublicSite(origin);
  console.log(formatReport(report));
  if (process.argv.includes("--json")) console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
