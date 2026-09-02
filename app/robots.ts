import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: ["Googlebot", "OAI-SearchBot", "ChatGPT-User"], allow: "/", disallow: ["/api/"] },
      { userAgent: "*", allow: "/", disallow: ["/api/"] },
    ],
    sitemap: "https://www.beiqiang.online/sitemap.xml",
    host: "https://www.beiqiang.online",
  };
}
