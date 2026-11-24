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

const toDay = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().split("T")[0];
};

// last real change of a CMS item; empty means "omit <lastmod>" (it's optional, and a fake "today" teaches crawlers to ignore it)
const lastmodOf = (item) =>
  toDay(item?.updatedAt || item?.updated_at || item?.publishedAt || item?.createdAt);

const newest = (routes) => routes.map((r) => r.lastmod).filter(Boolean).sort().pop() || "";

const fetchCaseStudyRoutes = async () => {
  const url = blogApiUrlToCaseStudies(resolvedBlogApiUrl());
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const payload = await response.json();
    const items = Array.isArray(payload) ? payload : payload?.caseStudies || payload?.data || [];
    return items
      .filter((cs) => cs?.slug && (!cs.status || cs.status === "published"))
      .map((cs) => ({
        path: `/case-studies/${encodeURIComponent(String(cs.slug).trim())}`,
        changefreq: "monthly",
        priority: "0.7",
        lastmod: lastmodOf(cs),
      }));
  } catch {
    return [];
  }
};

const blogApiUrlToCaseStudies = (blogUrl) =>
  process.env.CASE_STUDY_API_URL || blogUrl.replace("/blog", "/case-studies");

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
      lastmod: lastmodOf(blogs.find((blog) => String(blog?.slug).trim() === slug)),
    }));
  } catch {
    return [];
  }
};

const makeUrlTag = ({ path, changefreq, priority, lastmod }) => {
  const loc = `${SITE_URL}${path}`;
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
};

const run = async () => {
  const [blogRoutes, caseStudyRoutes] = await Promise.all([
    fetchBlogRoutes(),
    fetchCaseStudyRoutes(),
  ]);

  // listing pages change when their newest item does; /case-studies is left out while it's empty (noindex)
  const allRoutes = [
    ...STATIC_ROUTES.map((route) =>
      route.path === "/blog" ? { ...route, lastmod: newest(blogRoutes) } : route,
    ),
    ...(caseStudyRoutes.length
      ? [{ path: "/case-studies", changefreq: "weekly", priority: "0.8", lastmod: newest(caseStudyRoutes) }]
      : []),
    ...blogRoutes,
    ...caseStudyRoutes,
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
