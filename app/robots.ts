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
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
