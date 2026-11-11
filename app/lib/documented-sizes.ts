// EU labels express documented options, not real-time stock or per-colour availability.
export function documentedSizes(product: { size: string }): number[] {
  const paired = product.size.match(/^EU\s+(\d{2})\s*-\s*(\d{2})\s*–\s*(\d{2})\s*-\s*(\d{2})$/i);
  const single = product.size.match(/^EU\s+(\d{2})\s*[-–]\s*(\d{2})$/i);
  const listed = product.size.match(/^EU\s+(\d{2}(?:\s*[-–]\s*\d{2})?(?:\s*,\s*\d{2}(?:\s*[-–]\s*\d{2})?)+)$/i);
  if (listed) {
    const sizes = new Set<number>();
    for (const part of listed[1].split(",")) {
      const match = part.trim().match(/^(\d{2})(?:\s*[-–]\s*(\d{2}))?$/);
      if (!match) return [];
      const first = +match[1], last = match[2] ? +match[2] : first;
      if (first < 20 || last > 55 || last < first) return [];
      for (let size = first; size <= last; size++) sizes.add(size);
    }
    return [...sizes].sort((a, b) => a - b);
  }
  if (paired && (+paired[2] !== +paired[1] + 1 || +paired[4] !== +paired[3] + 1 || (+paired[3] - +paired[1]) % 2 !== 0)) return [];
  const first = paired ? +paired[1] : single ? +single[1] : 0;
  const last = paired ? +paired[4] : single ? +single[2] : 0;
  if (first < 20 || last > 55 || last < first) return [];
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
}
