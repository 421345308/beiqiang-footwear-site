import assert from "node:assert/strict";
import test from "node:test";
import { buildFactoryReviewPackText } from "../app/lib/factory-review-pack.ts";

test("builds an English supplier-review brief without unsupported commercial confirmation", () => {
  const text = buildFactoryReviewPackText(56, "en");
  assert.match(text, /Quanzhou Beiqiang Footwear & Apparel Co\., Ltd\./);
  assert.match(text, /56 organized product pages; not the factory's full product range/);
  assert.match(text, /Alibaba Trade Assurance or a signed bilateral contract/);
  assert.match(text, /not a third-party factory audit, certificate, capacity proof, quotation/i);
  assert.doesNotMatch(text, /pairs per month|ISO certified|BSCI certified/i);
});

test("builds a Chinese supplier-review brief with the same evidence boundary", () => {
  const text = buildFactoryReviewPackText(56, "zh");
  assert.match(text, /泉州贝强鞋业服饰有限公司/);
  assert.match(text, /56款已整理产品页；不等于工厂全部产品范围/);
  assert.match(text, /不是第三方审厂报告、认证、产能证明、报价/);
});

test("normalizes an invalid product count instead of printing a false catalogue number", () => {
  assert.match(buildFactoryReviewPackText(Number.NaN, "en"), /0 organized product pages/);
});
