// Each website served by this backend keeps its own blog and enquiries.
const SITES = ["buzingbee", "hustlershive"];
const DEFAULT_SITE = "buzingbee";

// Unknown or missing values fall back to the original BuzingBee site
const resolveSite = (value) => {
  const site = String(value || "").trim().toLowerCase();
  return SITES.includes(site) ? site : DEFAULT_SITE;
};

// Records saved before the `site` field existed belong to BuzingBee
const siteFilter = (value) => {
  const site = resolveSite(value);
  return site === DEFAULT_SITE
    ? { $or: [{ site: DEFAULT_SITE }, { site: { $exists: false } }] }
    : { site };
};

module.exports = { SITES, DEFAULT_SITE, resolveSite, siteFilter };
