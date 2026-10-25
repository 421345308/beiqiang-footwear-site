import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { products } from "../app/data/products.ts";
import { europeLocales, copy, t } from "../app/data/europe-copy.ts";
import {
  names,
  facts,
  productTitle,
  productFact,
  productColour,
} from "../app/data/europe-products.ts";
import {
  pageAlternates,
  europePages,
  localizedPath,
  supportsLocalePath,
} from "../app/lib/public-locales.ts";
import {
  filterCatalog,
  defaultSelection,
} from "../app/lib/catalog-selection.ts";
import {
  localizedInquiryPayload,
  inquiryProblem,
} from "../app/lib/europe-inquiry.ts";
import {
  EMPTY_QUOTE_REQUEST_DRAFT,
  normalizeQuoteRequestDraft,
} from "../app/lib/quote-request-draft.ts";
import {
  validateInquiry,
  createInquiryHandler,
} from "../edgeone-deploy/cloud-functions/api/inquiries.js";
const root = new URL("../edgeone-export-v1/", import.meta.url);
test("all UI keys and published product names have three nonempty translations", () => {
  for (const [key, values] of Object.entries(copy)) {
    assert.equal(values.length, 3, key);
    assert.ok(
      values.every((v) => typeof v === "string" && v.trim().length > 0),
      key,
    );
  }
  for (const p of products) {
    assert.ok(names[p.name], p.name);
    for (const l of europeLocales) {
      assert.notEqual(productTitle(p, l), p.name);
      assert.notEqual(productTitle(p, l), p.code);
      assert.notEqual(productFact(p.closure, l), p.closure);
      assert.ok(productColour(p.colors[0], l));
    }
  }
});
test("translations preserve unknown material and unconverted supplier size boundaries", () => {
  for (const locale of europeLocales) {
    assert.equal(
      productFact("Material to be confirmed", locale),
      t(locale, "confirm"),
    );
    assert.equal(
      productFact(
        "Cushion-profile sole; material confirmed before quotation",
        locale,
      ),
      t(locale, "confirm"),
    );
    assert.equal(
      productFact("35–36 / 37–38 / 39–40", locale),
      "35–36 / 37–38 / 39–40",
    );
    assert.equal(productFact("EVA", locale), "EVA");
  }
  const allowedUnknown = new Set([
    "Material to be confirmed",
    "other",
    "Cushion-profile sole; material confirmed before quotation",
  ]);
  for (const p of products)
    for (const field of ["upper", "sole"])
      assert.ok(
        facts[p[field]] ||
          /^(EVA|PVC)$/.test(p[field]) ||
          allowedUnknown.has(p[field]),
        `${p.code}: ${p[field]}`,
      );
});
test("local-language search combines with real photo colour and documented EU range", () => {
  for (const locale of europeLocales) {
    const search = (p) =>
      [
        productTitle(p, locale),
        ...p.colors.map((c) => productColour(c, locale)),
      ].join(" ");
    const result = filterCatalog(
      products,
      {
        ...defaultSelection,
        closure: "Zip-Up",
        colour: "black",
        size: "40",
        q: productColour("Black", locale),
      },
      search,
    );
    assert.deepEqual(
      result.map((p) => p.code),
      ["BQ1041", "BQ1059"],
    );
  }
});
test("each published localized page exports real content with correct lang, canonical and reciprocal alternates", async () => {
  for (const locale of europeLocales)
    for (const path of [
      ...europePages,
      ...products.map((p) => `/products/${p.slug}/`),
    ]) {
      const route = localizedPath(path, locale);
      const html = await readFile(
        new URL(`${route.slice(1)}index.html`, root),
        "utf8",
      );
      assert.ok(html.includes(`<html lang="${locale}">`), route);
      assert.ok(
        html.includes(`href="https://www.beiqiang.online${route}"`),
        route,
      );
      assert.ok(html.includes("<h1"), route);
      for (const l of ["en", "zh-CN", "de", "fr", "es", "x-default"])
        assert.ok(html.includes(`hrefLang="${l}"`), `${route} ${l}`);
      assert.doesNotMatch(html, /<main[^>]*lang="en"/, route);
      assert.doesNotMatch(html, />undefined</, route);
    }
});
test("unsupported secondary translations are excluded from alternate declarations", () => {
  assert.equal(supportsLocalePath("/resources/shoe-moq-guide/", "fr"), false);
  assert.equal(supportsLocalePath("/products/bq018/", "fr"), true);
  assert.equal(
    pageAlternates("/resources/shoe-moq-guide/").languages.fr,
    undefined,
  );
});
test("localized quote preserves draft fields, canonical colors and reply language through backend validation", () => {
  const draft = {
    ...EMPTY_QUOTE_REQUEST_DRAFT,
    name: "Local QA",
    company: "Test Company",
    market: "France",
    bulkQuantity: "300",
    email: "qa@example.com",
    requirements: "Original buyer text",
  };
  const item = {
    code: "BQ018",
    sourceModel: "BQ018",
    name: "Knit Textile Lace-Up Walking Shoes",
    quantity: "300",
    colors: "Lavender",
    sizes: "EU 40",
    notes: "Keep this note",
  };
  for (const locale of europeLocales) {
    const payload = localizedInquiryPayload(
      normalizeQuoteRequestDraft(draft),
      [item],
      locale,
    );
    const result = validateInquiry({
      ...payload,
      consent: true,
      formStartedAt: Date.now() - 5000,
    });
    assert.equal(result.error, undefined);
    assert.equal(result.inquiry.preferredResponseLanguage, locale);
    assert.equal(result.inquiry.items[0].colors, "Lavender");
    assert.equal(result.inquiry.items[0].notes, "Keep this note");
    assert.equal(result.inquiry.requirements, draft.requirements);
    assert.equal(inquiryProblem(draft, true, locale), "");
    assert.equal(inquiryProblem(draft, false, locale), t(locale, "required"));
    assert.equal(
      inquiryProblem({ ...draft, email: "", whatsapp: "" }, true, locale),
      t(locale, "contactHint"),
    );
  }
});
test("actual inquiry handler saves localized payload and reports persistence failure without sending mail", async () => {
  const draft = {
    ...EMPTY_QUOTE_REQUEST_DRAFT,
    name: "Local QA",
    company: "Test Company",
    market: "Germany",
    bulkQuantity: "100",
    email: "qa@example.com",
  };
  let saved;
  const handler = createInquiryHandler({
    getStoreImpl: () => ({
      setJSON: async (key, value) => {
        saved = { key, value };
      },
    }),
    createTransportImpl: () => {
      throw new Error("Mail must not be used in local tests");
    },
  });
  const payload = {
    ...localizedInquiryPayload(draft, [], "de"),
    consent: true,
    formStartedAt: Date.now() - 5000,
  };
  const context = {
    request: new Request("http://localhost/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    env: {},
  };
  const response = await handler(context);
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.ok(body.reference && body.accessCode);
  assert.equal(saved.value.preferredResponseLanguage, "de");
  assert.equal(saved.value.buyerConfirmationSent, false);
  const fail = createInquiryHandler({
    getStoreImpl: () => ({
      setJSON: async () => {
        throw new Error("intentional test failure");
      },
    }),
  });
  assert.equal(
    (
      await fail({
        ...context,
        request: new Request("http://localhost/api/inquiries", {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      })
    ).status,
    503,
  );
});
test("sitemap contains every new page with reciprocal alternates", async () => {
  const xml = await readFile(new URL("sitemap.xml", root), "utf8");
  for (const l of europeLocales)
    for (const path of [
      ...europePages,
      ...products.map((p) => `/products/${p.slug}/`),
    ])
      assert.ok(
        xml.includes(
          `<loc>https://www.beiqiang.online${localizedPath(path, l)}</loc>`,
        ),
      );
  assert.ok(xml.includes('hreflang="fr"'));
  assert.ok(xml.includes('hreflang="de"'));
  assert.ok(xml.includes('hreflang="es"'));
});
