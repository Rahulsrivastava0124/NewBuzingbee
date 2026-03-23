export interface CaseStudyApiItem {
  _id?: string;
  id?: string | number;
  title?: string;
  slug?: string;
  client?: string;
  industry?: string;
  summary?: string;
  challenge?: string;
  solution?: string;
  results?: string;
  metrics?: Array<{ label: string; value: string }>;
  tags?: string[];
  image?: string;
  category?: string;
  status?: string;
  publishedAt?: string;
  createdAt?: string;
  views?: number;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[] | string;
    canonicalUrl?: string;
    ogImage?: string;
  };
}

export interface CaseStudyCardItem {
  id: string;
  title: string;
  slug: string;
  client: string;
  industry: string;
  summary: string;
  image: string;
  category: string;
  date: string;
  views: number;
  metrics: Array<{ label: string; value: string }>;
}

export interface CaseStudyDetail extends CaseStudyCardItem {
  challenge: string;
  solution: string;
  results: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  canonicalUrl: string;
}

const FALLBACK_CS_API_URL = "https://api.buzingbee.com/api/case-studies";

const readCsApiUrl = (): string => {
  const value =
    process.env.CASE_STUDY_API_URL ||
    process.env.NEXT_PUBLIC_CASE_STUDY_API_URL ||
    process.env.BLOG_API_URL?.replace("/blog", "/case-studies") ||
    process.env.NEXT_PUBLIC_BLOG_API_URL?.replace("/blog", "/case-studies") ||
    "";
  return typeof value === "string" ? value.trim() : "";
};

const resolvedCsApiUrl = (): string => {
  const raw = readCsApiUrl() || FALLBACK_CS_API_URL;
  if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
    return FALLBACK_CS_API_URL;
  }
  return raw.replace(/\?+$/, "");
};

const readApiOrigin = (url: string) => {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
};

const normalizeImageUrl = (value?: string, apiOrigin?: string) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("http://"))
    return trimmed.replace(/^http:\/\//, "https://");
  if (trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/"))
    return apiOrigin ? `${apiOrigin}${trimmed}` : trimmed;
  return apiOrigin ? `${apiOrigin}/${trimmed.replace(/^\/+/, "")}` : trimmed;
};

const toReadableDate = (value?: string) => {
  if (!value) return "Recent";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Recent";
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const toSlug = (title = "") =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const normalizeKeywords = (value?: string[] | string): string[] => {
  if (Array.isArray(value))
    return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === "string")
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  return [];
};

const normalizePayload = (payload: unknown): CaseStudyApiItem[] => {
  if (Array.isArray(payload)) return payload as CaseStudyApiItem[];
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    if (Array.isArray(p.caseStudies))
      return p.caseStudies as CaseStudyApiItem[];
    if (Array.isArray(p.data)) return p.data as CaseStudyApiItem[];
  }
  return [];
};

const mapToDetail = (
  raw: CaseStudyApiItem,
  index: number,
  apiOrigin: string,
): CaseStudyDetail => ({
  id: String(raw._id || raw.id || index),
  title: raw.title || "Untitled Case Study",
  slug: raw.slug || toSlug(raw.title || `case-study-${index + 1}`),
  client: raw.client || "",
  industry: raw.industry || "",
  summary: raw.summary || raw.seo?.description || "",
  image: normalizeImageUrl(raw.image || raw.seo?.ogImage, apiOrigin),
  category: raw.category || "Case Study",
  date: toReadableDate(raw.publishedAt || raw.createdAt),
  views: Number.isFinite(Number(raw.views)) ? Number(raw.views) : 0,
  metrics: Array.isArray(raw.metrics) ? raw.metrics : [],
  challenge: raw.challenge || "",
  solution: raw.solution || "",
  results: raw.results || "",
  tags: Array.isArray(raw.tags) ? raw.tags : [],
  seoTitle: raw.seo?.title || raw.title || "BuzingBee Case Study",
  seoDescription: raw.seo?.description || raw.summary || "",
  seoKeywords: normalizeKeywords(raw.seo?.keywords),
  canonicalUrl: raw.seo?.canonicalUrl || "",
});

export const fetchCaseStudies = async (): Promise<CaseStudyDetail[]> => {
  const apiUrl = resolvedCsApiUrl();
  const apiOrigin = readApiOrigin(apiUrl);

  const response = await fetch(apiUrl, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(
      `Unable to fetch case studies from ${apiUrl} (${response.status})`,
    );
  }

  const payload = await response.json();
  const items = normalizePayload(payload)
    .filter(
      (cs) => !cs?.status || cs.status.trim().toLowerCase() === "published",
    )
    .filter((cs) => cs?.title);

  return items.map((cs, i) => mapToDetail(cs, i, apiOrigin));
};

export const fetchCaseStudyCards = async (): Promise<CaseStudyCardItem[]> => {
  const posts = await fetchCaseStudies();
  return posts.map(
    ({
      id,
      title,
      slug,
      client,
      industry,
      summary,
      image,
      category,
      date,
      views,
      metrics,
    }) => ({
      id,
      title,
      slug,
      client,
      industry,
      summary,
      image,
      category,
      date,
      views,
      metrics,
    }),
  );
};

export const fetchCaseStudyBySlug = async (
  slug: string,
): Promise<CaseStudyDetail | null> => {
  try {
    const apiUrl = resolvedCsApiUrl();
    const apiOrigin = readApiOrigin(apiUrl);
    const encodedSlug = encodeURIComponent(String(slug || "").trim());

    const response = await fetch(
      `${apiUrl}/slug/${encodedSlug}?trackView=true`,
      {
        cache: "no-store",
      },
    );

    if (response.ok) {
      const payload = await response.json();
      const raw = payload?.caseStudy;
      if (raw && typeof raw === "object") {
        return mapToDetail(raw as CaseStudyApiItem, 0, apiOrigin);
      }
    }

    // Fallback: find in full list
    const all = await fetchCaseStudies();
    const requested = String(slug || "")
      .trim()
      .toLowerCase();
    return (
      all.find((cs) => cs.slug.toLowerCase() === requested) ||
      all.find((cs) => toSlug(cs.title).toLowerCase() === requested) ||
      null
    );
  } catch {
    return null;
  }
};
