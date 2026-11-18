import type { Metadata } from "next";
import { ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleSidebar, { type ArticleHeading } from "@/components/ArticleSidebar";
import BlogCard from "@/components/BlogCard";
import BlogShareButtons from "@/components/BlogShareButtons";
import { fetchBlogBySlug } from "@/lib/blog";
import { fetchBlogCards, type BlogCardItem } from "@/lib/blog";
import { SITE_CONFIG } from "@/lib/constants";
import { canonicalForPath, resolveCmsCanonical } from "@/lib/seo";

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
    .replace(/javascript:/gi, "")
    // the page template already renders the article title as the only <h1>
    .replace(/<h1(\s[^>]*)?>/gi, "<h2$1>")
    .replace(/<\/h1>/gi, "</h2>");

const stripTags = (html = "") =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

// Gives every h2/h3 an id (keeping one the editor set) and lists them for the sidebar
const withHeadingIds = (html: string) => {
  const headings: ArticleHeading[] = [];
  const used = new Set<string>();
  const out = html.replace(/<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi, (match, lvl, attrs = "", inner) => {
    const text = stripTags(inner);
    if (!text) return match;
    const existing = /\sid=["']([^"']+)["']/i.exec(attrs)?.[1];
    let id = existing || text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
    if (!existing) {
      const base = id;
      for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    }
    used.add(id);
    headings.push({ id, text, level: Number(lvl) as 2 | 3 });
    return existing ? match : `<h${lvl} id="${id}"${attrs}>${inner}</h${lvl}>`;
  });
  return { html: out, headings };
};

// ~200 words a minute, at least 1
const readingMinutes = (html: string) =>
  Math.max(1, Math.round(stripTags(html).split(" ").filter(Boolean).length / 200));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchBlogBySlug(slug);
  if (!post) notFound();

  const title = post?.seoTitle || post?.title || toTitleFromSlug(slug);
  const description =
    post?.seoDescription || post?.excerpt || "Read this blog article.";
  const image = post?.image || "/og-image.png";
  const canonicalPath = `/blog/${slug}`;
  const canonicalUrl = resolveCmsCanonical(post?.canonicalUrl, canonicalPath);

  return {
    title,
    description,
    keywords: post?.seoKeywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonicalUrl,
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
    fetchBlogCards().catch((): BlogCardItem[] => []),
  ]);
  if (!post) notFound();
  const title = post?.title || (slug ? toTitleFromSlug(slug) : "Blog Detail");
  const image = post?.image || "";
  const category = post?.category || "Blog";
  const date = post?.date || "";
  const { html: contentHtml, headings: allHeadings } = withHeadingIds(sanitizeBlogHtml(post?.content || ""));
  // posts often repeat their title as the first heading; the sidebar lists only the points
  const sameText = (a: string) => a.trim().toLowerCase() === title.trim().toLowerCase();
  const headings = allHeadings.filter((h) => !sameText(h.text));
  const minutes = readingMinutes(contentHtml || post?.excerpt || "");
  const reads = post?.views ?? 0;
  const articleUrl = canonicalForPath(`/blog/${slug}`);
  const recommendedBlogs = blogCards
    .filter((blog) => blog.slug !== slug)
    .slice(0, 3);

  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="container-max">
        {/* article + sticky reading sidebar (sidebar only from lg up) */}
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 max-w-3xl">
          <div className="mb-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-bgSection px-4 py-2 text-sm font-medium text-textBody transition-all duration-300 hover:border-accent/40 hover:text-accent"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Link>

              <BlogShareButtons title={title} url={articleUrl} />
            </div>

            <span className="inline-block bg-accent/10 text-accent text-xs font-bold px-3 py-1 rounded-full mb-4 border border-accent/20">
              {category}
            </span>
            <h1 className="heading-page">
              {title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-textMuted text-sm">
              <span>BuzingBee Team</span>
              {date && (
                <>
                  <span aria-hidden="true">•</span>
                  <span>{date}</span>
                </>
              )}
              <span aria-hidden="true">•</span>
              <span>{minutes} min read</span>
              <span aria-hidden="true">•</span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                {reads.toLocaleString("en-IN")} {reads === 1 ? "read" : "reads"}
              </span>
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

          <article id="article-body" className="blog-content max-w-none">
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
                    url: `${SITE_CONFIG.url}/android-chrome-512x512.png`,
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

        <ArticleSidebar headings={headings} minutes={minutes} articleId="article-body" />
        </div>

        {recommendedBlogs.length ? (
          <div className="mt-16 border-t border-border pt-10">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                  Recommended Blogs
                </p>
                <h2 className="heading-sub mt-2">
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
