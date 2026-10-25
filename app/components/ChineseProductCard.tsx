import StudioProductCard from "./StudioProductCard";
import type { Product } from "../data/products";
export default function ChineseProductCard(props: {product: Product; collectionSlug?: string; preferredColour?: string}) {return <StudioProductCard {...props} locale="zh" />;}
