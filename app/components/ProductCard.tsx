import StudioProductCard from "./StudioProductCard";
import type { Product } from "../data/products";
export default function ProductCard(props: {product: Product; collectionSlug?: string}) {return <StudioProductCard {...props} />;}
