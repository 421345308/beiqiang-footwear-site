// Keep probable internal fixtures out of operating totals without interpreting
// ordinary buyer requirements (e.g. "internal comfort") as a test submission.
export function isInternalTest(record) {
  if (record?.internalTest === true) return true;
  const identity = `${record?.name || ""} ${record?.company || ""}`;
  const text = `${identity} ${record?.requirements || ""} ${record?.quantity || ""}`;
  return /\b(?:deployment|smtp|internal)\s+test\b/i.test(identity) ||
    (/\binternal\b/i.test(identity) && /\b(?:test\s+only|deployment\s+test|smtp\s+test)\b/i.test(text));
}
