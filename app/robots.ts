import { MetadataRoute } from "next";
import { getSiteUrl } from "@/server/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/quiz-tools/"],
      },
      {
        userAgent: ["Mediapartners-Google", "AdsBot-Google"],
        allow: "/",
        disallow: ["/admin/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
