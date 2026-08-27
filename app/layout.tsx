import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import ConsentBanner from "./components/ConsentBanner";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3001";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    verification: { google: "XgyFSK5TBQEyEvk9oQYhXO35Wl_W7hznbBXK9J6g_GM" },
    title: "Beiqiang Footwear | Walking & Casual Shoe Factory Supply",
    description: "Quanzhou footwear factory supply for verified walking shoes, wide-toe styles, lightweight slip-ons and casual textile footwear. Samples and OEM/ODM requirements can be discussed before bulk orders.",
    alternates: { canonical: "https://www.beiqiang.online/", languages: { en: "https://www.beiqiang.online/", "zh-CN": "https://www.beiqiang.online/zh/", "x-default": "https://www.beiqiang.online/" } },
    openGraph: {
      title: "Beiqiang Footwear | Walking & Casual Shoe Factory Supply",
      description: "Factory-direct B2B supply of verified walking and casual footwear for importers, wholesalers, online sellers and brand buyers.",
      type: "website",
      images: [{ url: new URL("/og.jpg", origin).toString(), width: 1536, height: 1024, alt: "Beiqiang Footwear factory supply" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Beiqiang Footwear | B2B Walking Shoe Supply",
      description: "Request a sample and discuss specifications before bulk orders.",
      images: [new URL("/og.jpg", origin).toString()],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Quanzhou Beiqiang Footwear & Apparel Co., Ltd.",
    url: "https://www.beiqiang.online/",
    email: "421345308@qq.com",
    telephone: "+86 189 5980 5256",
    address: { "@type": "PostalAddress", addressLocality: "Quanzhou", addressRegion: "Fujian", addressCountry: "CN" },
    sameAs: ["https://cn1576227362luzl.m.en.alibaba.com/"],
  };

  return <html lang="en"><body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }} />{children}<ConsentBanner /></body></html>;
}
