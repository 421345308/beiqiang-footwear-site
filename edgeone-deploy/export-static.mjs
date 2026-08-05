import { cp, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const deployDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceDirectory = path.resolve(deployDirectory, "..", "edgeone-export-v1");
const outputDirectory = path.join(deployDirectory, "dist");

await rm(outputDirectory, { recursive: true, force: true });
await cp(sourceDirectory, outputDirectory, { recursive: true });

console.log(outputDirectory);
