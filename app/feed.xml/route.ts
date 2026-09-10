import { NextResponse } from "next/server";
import { BlogService } from "@/server/services/blog-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rajasthanexamtwister.in";

  let blogs: any[] = [];
  try {
    const result = await BlogService.listBlogs({ pageSize: 50 }, false);
    blogs = result.blogs || [];
  } catch (err) {
    console.error("RSS Feed blog fetch error:", err);
  }

  const itemsXml = blogs
    .map((blog) => {
      const pubDate = blog.publishedAt
        ? new Date(blog.publishedAt).toUTCString()
        : new Date(blog.createdAt).toUTCString();
      const blogUrl = `${baseUrl}/blogs/${blog.slug}`;
      const description = blog.excerpt || blog.metaDescription || blog.title;

      return `    <item>
      <title><![CDATA[${blog.title}]]></title>
      <link>${blogUrl}</link>
      <guid isPermaLink="true">${blogUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
      ${blog.author ? `<author><![CDATA[${blog.author}]]></author>` : ""}
      ${blog.categoryId?.name ? `<category><![CDATA[${blog.categoryId.name}]]></category>` : ""}
    </item>`;
    })
    .join("\n");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Rajasthan Exam Twister — RSS Feed</title>
    <link>${baseUrl}</link>
    <description>Latest exam prep blogs, Rajasthan GK revision notes, and current affairs for REET, RPSC, CET, and state exams.</description>
    <language>hi-IN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
