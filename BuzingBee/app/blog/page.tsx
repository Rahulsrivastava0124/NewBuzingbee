import type { Metadata } from "next";
import BlogCard from "@/components/BlogCard";
import { fetchBlogCards } from "@/lib/blog";
import { SITE_CONFIG } from "@/lib/constants";

export const dynamic = "force-dynamic";

type BlogListItem = {
  id: string | number;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  image: string;
  slug: string;
};

export const metadata: Metadata = {
  title: "Blog — Digital Marketing & AI Insights",
  description:
    "Read the latest insights, tips, and strategies on digital marketing, web development, AI, and business growth from the BuzingBee team.",
  keywords: [
    "digital marketing blog",
    "AI insights blog",
    "web development articles",
    "BuzingBee blog",
    "business growth tips",
  ],
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blog — Digital Marketing & AI Insights",
    description:
      "Read BuzingBee blog articles on digital marketing, AI, web development, and practical growth strategies.",
    url: "/blog",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — Digital Marketing & AI Insights",
    description:
      "Read BuzingBee blog articles on digital marketing, AI, web development, and practical growth strategies.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function BlogPage() {
  let posts: BlogListItem[] = [];

  try {
    posts = await fetchBlogCards();
  } catch (err) {
    console.error("[BlogPage] Failed to fetch API posts:", err);
    posts = [];
  }

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "BuzingBee Blog",
    description:
      "Insights on digital marketing, AI, web development, and business growth.",
    url: `${SITE_CONFIG.url}/blog`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_CONFIG.url}/blog/${post.slug}`,
        name: post.title,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-accent/10 rounded-full blur-[120px]" />
        <div className="container-max relative z-10">
          <span className="inline-block bg-accent/10 text-accent text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-accent/20">
            Insights & Articles
          </span>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-textHeading font-heading">
            Our <span className="text-accent">Blog</span>
          </h1>
          <p className="mt-4 text-textBody max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Stay ahead of the curve with expert insights on digital marketing,
            AI, technology, and business growth.
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="section-padding pt-4">
        {posts.length > 0 ? (
          <div className="container-max grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {posts.map((post, i) => (
              <BlogCard
                key={post.id}
                title={post.title}
                excerpt={post.excerpt}
                category={post.category}
                date={post.date}
                image={post.image}
                slug={post.slug}
                index={i}
              />
            ))}
          </div>
        ) : (
          <div className="container-max text-center text-textMuted">
            No blog posts available right now.
          </div>
        )}
      </section>
    </>
  );
}
