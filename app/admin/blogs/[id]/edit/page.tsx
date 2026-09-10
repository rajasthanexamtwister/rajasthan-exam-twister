import { notFound } from "next/navigation";
import { BlogService } from "@/server/services/blog-service";
import { BlogForm } from "@/components/admin/blog-form";

interface EditBlogPageProps {
  params: {
    id: string;
  };
}

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const blog = await BlogService.getBlogById(params.id);

  if (!blog) {
    notFound();
  }

  const initialData = {
    _id: blog._id.toString(),
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    content: blog.content,
    author: blog.author,
    metaTitle: blog.metaTitle,
    metaDescription: blog.metaDescription,
    canonicalUrl: blog.canonicalUrl,
    status: blog.status,
    readingTime: blog.readingTime,
    publishedAt: blog.publishedAt?.toISOString(),
  };

  return <BlogForm initialData={initialData} isEdit={true} />;
}
