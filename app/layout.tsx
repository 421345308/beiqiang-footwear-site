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
    url: "https://www.beiqiang.online/",
    email: "shepeiqiang@gmail.com",
    telephone: "+86 189 5980 5256",
    address: { "@type": "PostalAddress", streetAddress: "No. 26, Xitou, Pengshu Village, Majia Town, Luojiang District", addressLocality: "Quanzhou", addressRegion: "Fujian", postalCode: "362014", addressCountry: "CN" },
    contactPoint: [{ "@type": "ContactPoint", contactType: "sales", email: "shepeiqiang@gmail.com", telephone: "+86 189 5980 5256", availableLanguage: ["en", "zh-CN"] }],
    sameAs: ["https://cn1576227362luzl.m.en.alibaba.com/"],
  };

  return <html lang="en"><body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }} />{children}<ContextContactDock /><ConsentBanner /></body></html>;
}
