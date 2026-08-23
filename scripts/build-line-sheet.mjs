import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { products } from "../app/data/products.ts";

const projectRoot = resolve(import.meta.dirname, "..");
const dataFile = resolve(projectRoot, "tmp", "pdfs", "line-sheet-products.json");
await mkdir(resolve(projectRoot, "tmp", "pdfs"), { recursive: true });
await writeFile(dataFile, `${JSON.stringify(products, null, 2)}\n`, "utf8");

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
