import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3001";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: "Beiqiang Footwear | Wide Toe Box Walking Shoe Factory Supply",
    description: "Quanzhou footwear factory supply for wide toe box comfort walking shoes, lightweight slip-ons and casual textile footwear. Samples and OEM/ODM requirements can be discussed before bulk orders.",
    openGraph: {
      title: "Beiqiang Footwear | Wide Toe Box Walking Shoe Factory Supply",
      description: "Factory-direct B2B supply of comfort walking shoes for importers, wholesalers, online sellers and brand buyers.",
      type: "website",
      images: [{ url: new URL("/og.png", origin).toString(), width: 1536, height: 1024, alt: "Beiqiang Footwear factory supply" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Beiqiang Footwear | B2B Walking Shoe Supply",
      description: "Request a sample and discuss specifications before bulk orders.",
      images: [new URL("/og.png", origin).toString()],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
