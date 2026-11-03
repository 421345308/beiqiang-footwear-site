/** Convert internal catalogue placeholders into optional customer-facing facts. */
export function publicProductFact(value: string): string {
  const fact = value.trim();
  if (/^(?:other|(?:upper )?material to be confirmed|to be confirmed|cushion-profile sole; material confirmed before quotation)$/i.test(fact)) return "";
  return fact.replace(/;\s*composition to be confirmed$/i, "");
}
