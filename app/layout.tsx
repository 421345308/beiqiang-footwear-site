import type { Metadata } from "next";
import "./globals.css";
import ConsentBanner from "./components/ConsentBanner";
import ContextContactDock from "./components/ContextContactDock";

export function generateMetadata(): Metadata {
  const origin = "https://www.beiqiang.online";
  return {
    metadataBase: new URL(`${origin}/`),
    verification: { google: "XgyFSK5TBQEyEvk9oQYhXO35Wl_W7hznbBXK9J6g_GM" },
    title: "Walking Shoes Manufacturer & Wholesale Supplier | Beiqiang Footwear",
    description: "Wholesale walking shoes, knit slip-ons and private-label footwear from Beiqiang, a footwear factory in Quanzhou, China. Explore styles, discuss custom requirements and request a sample quotation.",
    alternates: { canonical: "https://www.beiqiang.online/", languages: { en: "https://www.beiqiang.online/", "zh-CN": "https://www.beiqiang.online/zh/", "x-default": "https://www.beiqiang.online/" } },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      title: "Walking Shoes Manufacturer & Wholesale Supplier | Beiqiang Footwear",
      description: "Walking and casual shoes for wholesalers and brands. Explore existing styles, private-label options and the sample-to-order process.",
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
    legalName: "Quanzhou Beiqiang Footwear & Apparel Co., Ltd.",
    alternateName: ["Beiqiang Footwear", "泉州贝强鞋业服饰有限公司"],
    url: "https://www.beiqiang.online/",
    logo: { "@type": "ImageObject", url: "https://www.beiqiang.online/brand/logo-512.png", contentUrl: "https://www.beiqiang.online/brand/logo-512.png", width: 512, height: 512, caption: "Beiqiang Footwear" },
    image: "https://www.beiqiang.online/brand/logo-512.png",
    email: "shepeiqiang@gmail.com",
    telephone: "+86 189 5980 5256",
    address: { "@type": "PostalAddress", streetAddress: "No. 26, Xitou, Pengshu Village, Majia Town, Luojiang District", addressLocality: "Quanzhou", addressRegion: "Fujian", postalCode: "362014", addressCountry: "CN" },
    contactPoint: [{ "@type": "ContactPoint", contactType: "sales", email: "shepeiqiang@gmail.com", telephone: "+86 189 5980 5256", availableLanguage: ["en", "zh-CN"] }],
    // Layer-1 brand profiles. Append each URL here as the profile goes live so the
    // entity graph stays truthful - never list a profile that does not exist yet.
    sameAs: ["https://cn1576227362luzl.m.en.alibaba.com/"],
  };

  return <html lang="en"><body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }} />{children}<ContextContactDock /><ConsentBanner /></body></html>;
}
