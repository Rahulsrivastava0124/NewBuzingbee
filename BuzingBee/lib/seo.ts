import { SITE_CONFIG } from "@/lib/constants";

const BASE_URL = SITE_CONFIG.url.replace(/\/$/, "");

export const canonicalForPath = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${normalizedPath}`;
};

export const resolveCmsCanonical = (
  candidate: string | undefined,
  fallbackPath: string,
) => {
  const fallback = canonicalForPath(fallbackPath);

  if (!candidate || !candidate.trim()) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, BASE_URL);
    const hostMatches = parsed.hostname === new URL(BASE_URL).hostname;

    if (!hostMatches) {
      return fallback;
    }

    parsed.protocol = "https:";
    parsed.hash = "";
    parsed.search = "";

    if (parsed.pathname !== "/") {
      parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    }

    return parsed.toString();
  } catch {
    return fallback;
  }
};
