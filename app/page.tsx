import type { Metadata } from "next";
import BuyerHome from "./components/BuyerHome";
import { pageAlternates } from "./lib/public-locales";
export const metadata: Metadata = {title:"Casual & Walking Shoe Manufacturing | Beiqiang Footwear", description:"Quanzhou Beiqiang supplies casual and walking shoes for brands, importers and wholesalers. Explore our factory, product collection and OEM/ODM services.", alternates:pageAlternates("/")};
export default function Home() {return <BuyerHome />;}
