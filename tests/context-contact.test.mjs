import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContextContactLinks,
  cleanPublicPath,
  describeContactPage,
  shouldShowContextContact,
} from "../app/lib/context-contact.ts";

test("keeps the contextual contact dock off private and duplicate commercial routes", () => {
  for (const path of ["/admin/inquiries", "/buyer-workspace/", "/inquiry-status/?reference=secret", "/zh/buyer-workspace/", "/zh/inquiry-status/ABC", "/request-quote/", "/zh/request-quote/"]) {
    assert.equal(shouldShowContextContact(path), false, path);
  }
  assert.equal(shouldShowContextContact("/factory/"), true);
  assert.equal(shouldShowContextContact("/products/bq031/"), true);
});

test("builds bilingual contact links with a bounded public pathname and no private query", () => {
  const english = buildContextContactLinks("/products/bq031/?accessCode=SECRET#quote");
  assert.equal(english.zh, false);
  assert.equal(english.context, "product BQ031 page");
  assert.match(decodeURIComponent(english.whatsappHref), /product BQ031 page/);
  assert.doesNotMatch(decodeURIComponent(english.whatsappHref), /SECRET|accessCode/);
  assert.match(decodeURIComponent(english.emailHref), /target market \/ sales channel/);

  const chinese = buildContextContactLinks("/zh/collections/fleece-lined-shoes/?token=PRIVATE");
  assert.equal(chinese.zh, true);
  assert.equal(chinese.context, "加绒产品方向");
  assert.match(decodeURIComponent(chinese.whatsappHref), /目标市场／销售渠道/);
  assert.doesNotMatch(decodeURIComponent(chinese.whatsappHref), /PRIVATE|token/);
  assert.equal(chinese.quoteHref, "/zh/request-quote/");
});

test("rejects traversal-like paths and labels public sourcing contexts conservatively", () => {
  assert.equal(cleanPublicPath("products/../secret?x=1"), "/");
  assert.equal(describeContactPage("/factory/", false), "factory and supplier information");
  assert.equal(describeContactPage("/zh/solutions/oem-knit-shoes/", true), "OEM／ODM采购方案");
});
