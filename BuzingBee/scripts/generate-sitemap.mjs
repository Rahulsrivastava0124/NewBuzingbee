import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const SITE_URL = (process.env.SITE_URL || "https://buzingbee.com").replace(
  /\/$/,
  "",
);
const FALLBACK_BLOG_API_URL = "https://api.buzingbee.com/api/blog";

const resolvedBlogApiUrl = () => {
  const raw =
    process.env.BLOG_API_URL ||
    process.env.NEXT_PUBLIC_BLOG_API_URL ||
    FALLBACK_BLOG_API_URL;

  if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
    console.warn(
      `Invalid BLOG_API_URL value "${raw}". Using fallback ${FALLBACK_BLOG_API_URL}.`,
    );
    return FALLBACK_BLOG_API_URL;
  }

  return raw.replace(/\?+$/, "");
};

const STATIC_ROUTES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/services", changefreq: "monthly", priority: "0.9" },
  { path: "/pricing", changefreq: "monthly", priority: "0.8" },
  { path: "/startup", changefreq: "monthly", priority: "0.8" },
  { path: "/portfolio", changefreq: "monthly", priority: "0.8" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/contact", changefreq: "monthly", priority: "0.7" },
];

const normalizeBlogPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.blogs)) return payload.blogs;
  return [];
};

const escapeXml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");

const today = () => new Date().toISOString().split("T")[0];

const fetchBlogRoutes = async () => {
  const blogApiUrl = resolvedBlogApiUrl();

  try {
    const response = await fetch(blogApiUrl);
    if (!response.ok) return [];

    const payload = await response.json();
    const blogs = normalizeBlogPayload(payload);

    const slugs = blogs
      .filter((blog) => blog?.status === "published" && blog?.slug)
      .map((blog) => String(blog.slug).trim())
      .filter(Boolean);

    return [...new Set(slugs)].map((slug) => ({
      path: `/blog/${encodeURIComponent(slug)}`,
      changefreq: "weekly",
      priority: "0.7",
      lastmod: blogLastmodFallback(blogs, slug),
    }));
  } catch {
    return [];
  }
};

const blogLastmodFallback = (blogs, slug) => {
  const match = blogs.find((blog) => String(blog?.slug).trim() === slug);
  const source =
    match?.updatedAt ||
    match?.updated_at ||
    match?.publishedAt ||
    match?.createdAt;

  if (!source) return today();

  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) return today();

  return parsed.toISOString().split("T")[0];
};

const makeUrlTag = ({ path, changefreq, priority, lastmod }) => {
  const loc = `${SITE_URL}${path}`;
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <lastmod>${lastmod || today()}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
};

const run = async () => {
  const blogRoutes = await fetchBlogRoutes();

  const allRoutes = [
    ...STATIC_ROUTES.map((route) => ({ ...route, lastmod: today() })),
    ...blogRoutes,
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...allRoutes.map(makeUrlTag),
    "</urlset>",
    "",
  ].join("\n");

  const outputPath = resolve(process.cwd(), "public", "sitemap.xml");
  await writeFile(outputPath, xml, "utf8");

  console.log(
    `Generated sitemap with ${allRoutes.length} URLs at public/sitemap.xml`,
  );
};

run();
