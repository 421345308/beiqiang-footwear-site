import labels from "../data/product-photo-labels.json" with { type: "json" };
import { colorZh } from "../data/products-zh";

type PhotoLabel = { role: string; colour?: string; sourceCrop?: boolean };
const roles: Record<string, [string, string]> = {
  outsole: ["鞋底纹路", "Outsole view"],
  top: ["俯视细节", "Top view"],
  heel: ["后跟细节", "Heel view"],
  collar: ["鞋口细节", "Collar detail"],
  upper: ["鞋面近景", "Upper detail"],
  side: ["侧面轮廓", "Side profile"],
  pair: ["整鞋展示", "Pair view"],
  overview: ["配色合照", "Colour overview"],
  "on-foot": ["上脚展示", "On-foot view"],
};
export function productPhotoLabel(code: string, index: number, locale: string): string | null {
  const photo = (labels as Record<string, PhotoLabel[]>)[code]?.[index];
  if (!photo) return null;
  if (photo.colour) {
    const colour = locale === "zh" ? colorZh(photo.colour) : photo.colour;
    const role = roles[photo.role]?.[locale === "zh" ? 0 : 1];
    return photo.sourceCrop ? `${colour} · ${locale === "zh" ? "来源配色合照局部" : "Detail from supplier colour sheet"}` : `${colour}${role ? ` · ${role}` : ""}`;
  }
  return roles[photo.role]?.[locale === "zh" ? 0 : 1] ?? null;
}
