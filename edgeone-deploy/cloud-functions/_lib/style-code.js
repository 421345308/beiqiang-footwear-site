// A bounded identity format for current and historical buyer records. Public
// selection still checks the current catalogue where a catalogue is available.
const STYLE_CODE = /^BQ(?:\d{3,4}|-\d{4}|-[A-Z][A-Z0-9]{1,11}(?:-[A-Z0-9]{1,4})?)$/;
const STYLE_CODES_IN_TEXT = /(?<![A-Z0-9-])BQ(?:\d{3,4}|-\d{4}|-[A-Z][A-Z0-9]{1,11}(?:-[A-Z0-9]{1,4})?)(?![A-Z0-9-])/gi;

/** @param {unknown} value */
export function isStyleCode(value) {
  return typeof value === "string" && value.length <= 20 && STYLE_CODE.test(value);
}

/** @param {unknown} value */
export function extractStyleCodes(value) {
  return (String(value || "").match(STYLE_CODES_IN_TEXT) || []).map((code) => code.toUpperCase());
}
