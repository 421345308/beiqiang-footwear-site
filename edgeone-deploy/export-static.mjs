import { cp, rm, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const deployDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceDirectory = path.resolve(deployDirectory, "..", "edgeone-export-v1");
const outputDirectory = path.join(deployDirectory, "dist");

await rm(outputDirectory, { recursive: true, force: true });
await cp(sourceDirectory, outputDirectory, { recursive: true });

// Validate the actual deployment directory, not just the application build.
const release = JSON.parse(await readFile(path.join(outputDirectory, "release.json"), "utf8"));
for (const locale of release.publicLanguages) {
  const prefix = locale === "en" ? "" : `${locale}/`;
  const language = locale === "zh" ? "zh-CN" : locale;
  for (const page of ["", "products/", "products/bq018/", "request-quote/"]) {
    const html = await readFile(path.join(outputDirectory, prefix, page, "index.html"), "utf8");
    if (!html.includes(`<html lang="${language}">`)) throw new Error(`Deployment language mismatch: ${prefix}${page}`);
    for (const asset of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)[^" ]*"/g)) {
      if (!(await stat(path.join(outputDirectory, asset[1]))).isFile()) throw new Error(`Missing deployment asset: ${asset[1]}`);
    }
  }
}
console.log(`Verified deployment output for ${release.publicLanguages.join(", ")} (${release.releaseId})`);

console.log(outputDirectory);
