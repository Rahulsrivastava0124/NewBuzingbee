import Head from "next/head";
import { useRouter } from "next/router";

const SITE_NAME = "BuzingBee";
const SITE_URL = "https://buzingbee.com";
const DEFAULT_IMAGE = "/og-image.png";
const DEFAULT_DESCRIPTION =
  "BuzingBee delivers digital marketing services and AI services to help businesses grow faster with intelligent automation, paid ads, SEO, and AI agents.";
const DEFAULT_KEYWORDS =
  "digital marketing services, AI services, business growth, AI marketing automation, AI agents, SEO services, lead generation, campaign optimization";

const normalizePath = (path) => {
  if (!path || path === "/") return "/";
  return path.startsWith("/") ? path : `/${path}`;
};

const buildPageSchema = (canonicalUrl, fullTitle, finalDescription, finalPath, title) => {
  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
  ];
  if (finalPath !== "/") {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: title || SITE_NAME,
      item: canonicalUrl,
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: fullTitle,
    description: finalDescription,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems,
    },
  };
};

export default function Seo({
  title,
  description,
  keywords,
  canonicalPath,
  image = DEFAULT_IMAGE,
  type = "website",
  noindex = false,
}) {
  const router = useRouter();
  const fallbackPath = router.asPath?.split("?")?.[0] || "/";
  const finalPath = normalizePath(canonicalPath || fallbackPath);
  const canonicalUrl = `${SITE_URL}${finalPath}`;
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const finalDescription = description || DEFAULT_DESCRIPTION;
  const finalKeywords = keywords || DEFAULT_KEYWORDS;
  const robots = noindex
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  const pageSchema = buildPageSchema(
    canonicalUrl,
    fullTitle,
    finalDescription,
    finalPath,
    title
  );

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="robots" content={robots} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta
        property="og:image:alt"
        content="BuzingBee digital marketing and AI services"
      />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={image} />

      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en-US" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
    </Head>
  );
}
