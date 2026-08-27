const CODE_PATTERN = /^BQ\d{3}$/;

export function parseComparisonCodes(value: string, allowedCodes: string[]) {
  const allowed = new Set(allowedCodes.map((code) => code.toUpperCase()));
  const result: string[] = [];
  for (const raw of value.split(",")) {
    const code = raw.trim().toUpperCase();
    if (!CODE_PATTERN.test(code) || !allowed.has(code) || result.includes(code)) continue;
    result.push(code);
    if (result.length === 4) break;
  }
  return result;
}

export function buildComparisonUrl(codes: string[], locale: "en" | "zh" = "en") {
  const safe = [...new Set(codes.map((code) => code.trim().toUpperCase()).filter((code) => CODE_PATTERN.test(code)))].slice(0, 4);
  const url = new URL(locale === "zh" ? "/zh/products/" : "/products/", "https://www.beiqiang.online");
  if (safe.length) url.searchParams.set("compare", safe.join(","));
  return url.toString();
}
