import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { products } from "../app/data/products.ts";
import { buyerFitZh, closureZh, colorZh, factZh, productNameZh, productSummaryZh } from "../app/data/products-zh.ts";

const projectRoot = resolve(import.meta.dirname, "..");
const dataFile = resolve(projectRoot, "tmp", "pdfs", "line-sheet-products.json");
const chineseDataFile = resolve(projectRoot, "tmp", "pdfs", "line-sheet-products-zh.json");
await mkdir(resolve(projectRoot, "tmp", "pdfs"), { recursive: true });
await writeFile(dataFile, `${JSON.stringify(products, null, 2)}\n`, "utf8");
await writeFile(chineseDataFile, `${JSON.stringify(products.map((product) => ({
  ...product,
  nameZh: productNameZh(product),
  summaryZh: productSummaryZh(product),
  buyerFitZh: buyerFitZh(product),
  closureZh: closureZh(product.closure),
  upperZh: factZh(product.upper),
  soleZh: factZh(product.sole),
  sizeZh: factZh(product.size),
  colorsZh: product.colors.map(colorZh),
  highlightsZh: product.highlights.map(factZh),
  evidenceHighlightsZh: product.highlights
    .map((highlight) => ({ source: highlight, translated: factZh(highlight) }))
    .filter(({ source, translated }) => translated !== source)
    .map(({ translated }) => translated),
  confirmBeforeQuoteZh: product.confirmBeforeQuote.map(factZh),
})), null, 2)}\n`, "utf8");

const home = process.env.USERPROFILE || process.env.HOME || "";
const bundled = home ? join(home, ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "python", process.platform === "win32" ? "python.exe" : "bin/python") : "";
const candidates = [process.env.BEIQIANG_PYTHON, bundled, "python3", "python"].filter(Boolean);
let python = "";
for (const candidate of candidates) {
  if ((candidate.includes("/") || candidate.includes("\\")) && !existsSync(candidate)) continue;
  const check = spawnSync(candidate, ["-c", "import reportlab"], { stdio: "ignore" });
  if (check.status === 0) { python = candidate; break; }
}
if (!python) throw new Error("A Python runtime with reportlab is required. Set BEIQIANG_PYTHON to the correct executable.");

const result = spawnSync(python, [resolve(projectRoot, "scripts", "generate-line-sheet.py")], { cwd: projectRoot, stdio: "inherit" });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
const chineseResult = spawnSync(python, [resolve(projectRoot, "scripts", "generate-line-sheet-zh.py")], { cwd: projectRoot, stdio: "inherit" });
if (chineseResult.error) throw chineseResult.error;
if (chineseResult.status !== 0) process.exit(chineseResult.status || 1);

const pdfFiles = [
  "beiqiang-footwear-line-sheet-2026.pdf",
  "beiqiang-footwear-line-sheet-zh-2026.pdf",
];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const files = {};
for (const name of pdfFiles) {
  const outputBytes = await readFile(resolve(projectRoot, "output", "pdf", name));
  const publicBytes = await readFile(resolve(projectRoot, "public", "downloads", name));
  if (!outputBytes.equals(publicBytes)) throw new Error(`${name} public and operating copies differ`);
  files[name] = { sha256: sha256(outputBytes), bytes: outputBytes.length };
}
const manifest = {
  productCount: products.length,
  pageCount: Math.ceil(products.length / 5) + 2,
  productDataSha256: sha256(JSON.stringify(products)),
  files,
};
await writeFile(resolve(projectRoot, "app", "data", "line-sheet-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
