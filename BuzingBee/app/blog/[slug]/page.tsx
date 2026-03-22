import type { Metadata } from "next";
import { ArrowLeft, MessageCircle } from "lucide-react";
import Link from "next/link";
import BlogCard from "@/components/BlogCard";
import { fetchBlogBySlug } from "@/lib/blog";
import { fetchBlogCards } from "@/lib/blog";
import { SITE_CONFIG } from "@/lib/constants";

const toTitleFromSlug = (slug = "") =>
  slug
    .split("-")
    .filter(Boolean)
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const sanitizeBlogHtml = (html = "") =>
  html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+=("[^"]*"|'[^']*')/gi, "")
    .replace(/javascript:/gi, "");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchBlogBySlug(slug);

  const title = post?.seoTitle || post?.title || toTitleFromSlug(slug);
  const description =
    post?.seoDescription || post?.excerpt || "Read this blog article.";
  const image = post?.image || "/og-image.png";
  const canonicalPath = `/blog/${slug}`;

  return {
    title,
    description,
    keywords: post?.seoKeywords,
    alternates: {
      canonical: post?.canonicalUrl || canonicalPath,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonicalPath,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, blogCards] = await Promise.all([
    fetchBlogBySlug(slug),
    fetchBlogCards().catch(() => []),
  ]);
  const title = post?.title || (slug ? toTitleFromSlug(slug) : "Blog Detail");
  const image = post?.image || "";
  const category = post?.category || "Blog";
  const date = post?.date || "";
  const contentHtml = sanitizeBlogHtml(post?.content || "");
  const articleUrl = `${SITE_CONFIG.url}/blog/${slug}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${articleUrl}`)}`;
  const recommendedBlogs = blogCards
    .filter((blog) => blog.slug !== slug)
    .slice(0, 3);

  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="container-max">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-bgSection px-4 py-2 text-sm font-medium text-textBody transition-all duration-300 hover:border-accent/40 hover:text-accent"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Link>

              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400 transition-all duration-300 hover:bg-green-500 hover:text-white"
              >
                <MessageCircle className="h-4 w-4" />
                Share on WhatsApp
              </a>
            </div>

            <span className="inline-block bg-accent/10 text-accent text-xs font-bold px-3 py-1 rounded-full mb-4 border border-accent/20">
              {category}
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-textHeading font-heading leading-tight">
              {title}
            </h1>
            <div className="mt-4 flex items-center gap-4 text-textMuted text-sm">
              <span>BuzingBee Team</span>
              {date && (
                <>
                  <span>•</span>
                  <span>{date}</span>
                </>
              )}
              <span>•</span>
              <span>5 min read</span>
            </div>
          </div>

          <div className="w-full aspect-video bg-bgSection rounded-[14px] mb-10 relative overflow-hidden">
            {image ? (
              <img
                src={image}
                alt={title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent" />
            {!image && (
              <div className="absolute inset-0 flex items-center justify-center text-accent/50">
                <span className="text-sm font-semibold">BuzingBee Blog</span>
              </div>
            )}
          </div>

          <article className="blog-content max-w-none">
            {contentHtml ? (
              <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
            ) : (
              <p className="text-textBody leading-relaxed">
                {post?.excerpt || "Content is not available for this blog yet."}
              </p>
            )}
          </article>

          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                headline: post?.seoTitle || title,
                description: post?.seoDescription || post?.excerpt || "",
                image: image ? [image] : undefined,
                datePublished: date || undefined,
                author: {
                  "@type": "Organization",
                  name: "BuzingBee",
                },
                publisher: {
                  "@type": "Organization",
                  name: "BuzingBee",
                  logo: {
                    "@type": "ImageObject",
                    url: `${SITE_CONFIG.url}/bee1-removebg-preview.png`,
                  },
                },
                mainEntityOfPage: {
                  "@type": "WebPage",
                  "@id": articleUrl,
                },
              }),
            }}
          />
        </div>

        {recommendedBlogs.length ? (
          <div className="mt-16 border-t border-border pt-10">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                  Recommended Blogs
                </p>
                <h2 className="mt-2 text-2xl font-bold text-textHeading font-heading">
                  More articles you may like
                </h2>
              </div>

              <Link
                href="/blog"
                className="text-sm font-semibold text-accent transition hover:text-accent/80"
              >
                View all blogs
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {recommendedBlogs.map((blog, index) => (
                <BlogCard
                  key={blog.id}
                  title={blog.title}
                  excerpt={blog.excerpt}
                  category={blog.category}
                  date={blog.date}
                  image={blog.image}
                  slug={blog.slug}
                  views={blog.views}
                  index={index}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
