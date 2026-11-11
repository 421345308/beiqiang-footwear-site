import { execFileSync } from "node:child_process";
import { PUBLISHED_PRODUCT_CODES } from "../app/data/published-product-codes.ts";

// Read public catalogue metadata over the existing SSH channel. No API/DB secrets,
// writes, service changes, or public diagnostic endpoint are needed.
const REMOTE_READ = `/opt/beiqiang/runtime/node/bin/node --input-type=module -e 'import fs from "node:fs"; const root=fs.realpathSync("/opt/beiqiang/current"); const {FINDER_STYLE_CODES}=await import(root+"/edgeone-deploy/cloud-functions/api/catalog-style-codes.js"); console.log(JSON.stringify({release:root.split("/").pop(),codes:[...FINDER_STYLE_CODES]}));'`;

export function compareCodes(expected, actual) {
  const valid = Array.isArray(actual) && actual.length > 0 && actual.every(code => typeof code === "string" && /^BQ(?:\d{3,4}|-[A-Z0-9-]+)$/.test(code));
  if (!valid) throw new Error("Missing or invalid catalogue codes");
  const wanted = new Set(expected), found = new Set(actual);
  const missing = [...wanted].filter(code => !found.has(code)).sort();
  const unexpected = [...found].filter(code => !wanted.has(code)).sort();
  return { ok: !missing.length && !unexpected.length && found.size === actual.length, count: found.size, missing, unexpected, duplicates: actual.length - found.size };
}

export function sitemapCodes(xml) {
  if (!/<urlset\b/.test(xml) || !/<\/urlset>/.test(xml)) throw new Error("Invalid or unsupported sitemap (expected urlset)");
  const codes = [];
  for (const match of xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)) {
    const path = new URL(match[1].trim()).pathname;
    const product = path.match(/^\/products\/(bq(?:\d{3,4}|-[a-z0-9-]+))\/$/);
    if (product) codes.push(product[1].toUpperCase());
  }
  return codes;
}

export function readVpsCatalogue(execImpl = execFileSync) {
  try {
    const output = execImpl("ssh", ["-o", "BatchMode=yes", "-o", "ConnectTimeout=10", "beiqiang-vps", REMOTE_READ], { encoding: "utf8", timeout: 20000, maxBuffer: 262144, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    const value = JSON.parse(output);
    if (!/^\d{8}T\d{6}Z$/.test(value.release)) throw new Error("Invalid release");
    return value;
  } catch {
    // Do not echo SSH stderr, host details, or credential diagnostics into reports.
    throw new Error("VPS catalogue unavailable; check existing SSH access and retry this read-only check");
  }
}

export async function verifyCatalogParity(origins, options = {}) {
  const expected = options.expected || PUBLISHED_PRODUCT_CODES;
  const results = [];
  try {
    const vps = await (options.readVps || readVpsCatalogue)();
    results.push({ target: "VPS inquiry whitelist", release: vps.release, ...compareCodes(expected, vps.codes) });
  } catch (error) { results.push({ target: "VPS inquiry whitelist", ok: false, error: error.message }); }
  for (const origin of origins) {
    try {
      const base = new URL(origin);
      if (!/^https?:$/.test(base.protocol)) throw new Error("Invalid origin");
      const response = await (options.fetchImpl || fetch)(`${base.origin}/sitemap.xml?catalog-check=${Date.now()}`, { headers: { "cache-control": "no-cache" }, signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`Sitemap HTTP ${response.status}`);
      results.push({ target: base.origin, ...compareCodes(expected, sitemapCodes(await response.text())) });
    } catch (error) { results.push({ target: origin, ok: false, error: error.message }); }
  }
  return results;
}

export function formatCatalogReport(results) {
  return results.map(result => `${result.ok ? "PASS" : "ALERT CATALOG_PARITY"} ${result.target} ${JSON.stringify(result)}`).join("\n");
}
