import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const privateRoutes = ["/api/", "/admin/", "/buyer-workspace/", "/inquiry-status/", "/zh/buyer-workspace/", "/zh/inquiry-status/"];
  return {
    rules: [
      { userAgent: ["Googlebot", "OAI-SearchBot", "ChatGPT-User"], allow: "/", disallow: privateRoutes },
      { userAgent: "*", allow: "/", disallow: privateRoutes },
    ],
    sitemap: "https://www.beiqiang.online/sitemap.xml",
    host: "https://www.beiqiang.online",
  };
}
