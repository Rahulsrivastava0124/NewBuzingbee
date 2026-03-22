import type { Metadata } from "next";
import Link from "next/link";
import { fetchBlogBySlug } from "@/lib/blog";
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
  const post = await fetchBlogBySlug(slug);
  const title = post?.title || (slug ? toTitleFromSlug(slug) : "Blog Detail");
  const image = post?.image || "";
  const category = post?.category || "Blog";
  const date = post?.date || "";
  const contentHtml = sanitizeBlogHtml(post?.content || "");
  const articleUrl = `${SITE_CONFIG.url}/blog/${slug}`;

  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="container-max max-w-3xl">
        <div className="mb-8">
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

        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/blog" className="btn-outline text-sm">
            ← Back to Blog
          </Link>
        </div>
      </div>
    </section>
  );
}
