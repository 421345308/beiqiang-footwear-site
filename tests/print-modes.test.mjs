import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { printWithBodyClass } from "../app/lib/print-mode.ts";

function installPrintEnvironment(printImpl) {
  const classes = new Set(); let afterPrint;
  globalThis.document = { body: { classList: { add: (value) => classes.add(value), remove: (value) => classes.delete(value) } } };
  globalThis.window = { addEventListener: (_name, callback) => { afterPrint = callback; }, print: printImpl };
  return { classes, afterPrint: () => afterPrint?.() };
}

test("keeps the selected print mode active until the browser finishes printing", () => {
  let printed = 0; const environment = installPrintEnvironment(() => { printed += 1; });
  printWithBodyClass("buyer-quotation-printing");
  assert.equal(printed, 1); assert.equal(environment.classes.has("buyer-quotation-printing"), true);
  environment.afterPrint(); assert.equal(environment.classes.has("buyer-quotation-printing"), false);
  delete globalThis.window; delete globalThis.document;
});

test("supports a separate buyer project snapshot print mode", () => {
  let printed = 0; const environment = installPrintEnvironment(() => { printed += 1; });
  printWithBodyClass("buyer-project-printing");
  assert.equal(printed, 1); assert.equal(environment.classes.has("buyer-project-printing"), true);
  environment.afterPrint(); assert.equal(environment.classes.has("buyer-project-printing"), false);
  delete globalThis.window; delete globalThis.document;
});

test("supports a separate product comparison sourcing-review print mode", () => {
  let printed = 0; const environment = installPrintEnvironment(() => { printed += 1; });
  printWithBodyClass("comparison-printing");
  assert.equal(printed, 1); assert.equal(environment.classes.has("comparison-printing"), true);
  environment.afterPrint(); assert.equal(environment.classes.has("comparison-printing"), false);
  delete globalThis.window; delete globalThis.document;
});

test("removes the print mode if the browser print call fails", () => {
  const environment = installPrintEnvironment(() => { throw new Error("print unavailable"); });
  assert.throws(() => printWithBodyClass("product-sheet-printing"), /print unavailable/); assert.equal(environment.classes.size, 0);
  delete globalThis.window; delete globalThis.document;
});

test("scopes product, comparison, quotation and project print CSS so ordinary page printing is not blank", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /body\.product-sheet-printing[^\n]+product-print-sheet/); assert.match(css, /body\.comparison-printing[^\n]+catalog-section/); assert.match(css, /body\.buyer-quotation-printing[^\n]+buyer-status-result/); assert.match(css, /body\.buyer-project-printing[^\n]+buyer-status-result/); assert.match(css, /BUYER SOURCING PROJECT SNAPSHOT/); assert.doesNotMatch(css, /\n\s*body\s*>\s*\*:not\(main\)/);
});
