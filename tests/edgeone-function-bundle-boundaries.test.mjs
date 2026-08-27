import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const analyticsPath = new URL("../edgeone-deploy/cloud-functions/api/admin/analytics.js", import.meta.url);
const weeklyReviewPath = new URL("../edgeone-deploy/cloud-functions/api/admin/weekly-review.js", import.meta.url);

test("an imported route module does not declare the weekly-review handler binding", async () => {
  const [analytics, weeklyReview] = await Promise.all([
    readFile(analyticsPath, "utf8"),
    readFile(weeklyReviewPath, "utf8"),
  ]);

  assert.match(weeklyReview, /from\s+["']\.\/analytics\.js["']/);
  assert.match(weeklyReview, /export\s+const\s+onRequestGet\b/);
  assert.doesNotMatch(analytics, /export\s+const\s+onRequestGet\b/);
  assert.doesNotMatch(analytics, /export\s+(?:async\s+)?function\s+onRequestGet\b/);
  assert.match(analytics, /export\s*\{\s*adminAnalyticsRouteHandler\s+as\s+onRequestGet\s*\}/);
});
