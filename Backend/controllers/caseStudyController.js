const { errorDetail } = require("../utils/errors");
const CaseStudy = require("../models/CaseStudy");
const { uploadBlogImageAndGetUrl } = require("../services/storageService");
const { sanitizeRichText } = require("../utils/sanitize");
const { escapeRegex } = require("../utils/validate");

const normalizeTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags))
    return tags.map((t) => String(t).trim()).filter(Boolean);
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
};

const parseMetrics = (metrics) => {
  if (!metrics) return [];
  if (Array.isArray(metrics)) return metrics;
  try {
    return JSON.parse(metrics);
  } catch {
    return [];
  }
};

const buildImageUrlFromFile = async (req) => {
  if (!req.file) return "";
  return uploadBlogImageAndGetUrl(req, req.file);
};

// CREATE
const addCaseStudy = async (req, res) => {
  try {
    const {
      title,
      slug,
      client,
      industry,
      summary,
      challenge,
      solution,
      results,
      metrics,
      tags,
      image,
      category,
      status,
      seoTitle,
      seoDescription,
      seoKeywords,
      canonicalUrl,
      ogImage,
    } = req.body;

    if (!title) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    }

    const uploadedImageUrl = await buildImageUrlFromFile(req);

    const newCaseStudy = new CaseStudy({
      title,
      slug: slug || "",
      client: client || "",
      industry: industry || "",
      summary: summary || "",
      challenge: sanitizeRichText(challenge || ""),
      solution: sanitizeRichText(solution || ""),
      results: sanitizeRichText(results || ""),
      metrics: parseMetrics(metrics),
      tags: normalizeTags(tags),
      image: uploadedImageUrl || image || "",
      category: category || "General",
      status: status || "draft",
      publishedAt: status === "published" ? new Date() : null,
      createdBy: req.admin?.id,
      seo: {
        title: seoTitle || "",
        description: seoDescription || "",
        keywords: normalizeTags(seoKeywords),
        canonicalUrl: canonicalUrl || "",
        ogImage: ogImage || uploadedImageUrl || image || "",
      },
    });

    const saved = await newCaseStudy.save();

    return res
      .status(201)
      .json({ success: true, message: "Case study created", caseStudy: saved });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to create case study",
        error: errorDetail(error),
      });
  }
};

// READ ALL
const getAllCaseStudies = async (req, res) => {
  try {
    const { status, search, category } = req.query;
    const query = {};
    const text = (v) => (typeof v === "string" ? v : "");

    // Only a signed-in admin may see drafts
    if (!req.admin) query.status = "published";
    else if (text(status)) query.status = text(status);

    if (text(category)) query.category = text(category);
    if (text(search)) {
      const rx = escapeRegex(text(search).slice(0, 100));
      query.$or = [
        { title: { $regex: rx, $options: "i" } },
        { client: { $regex: rx, $options: "i" } },
        { industry: { $regex: rx, $options: "i" } },
        { summary: { $regex: rx, $options: "i" } },
      ];
    }

    const caseStudies = await CaseStudy.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: caseStudies.length,
      caseStudies,
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch case studies",
        error: errorDetail(error),
      });
  }
};

// READ ONE BY ID
const getCaseStudyById = async (req, res) => {
  try {
    const { id } = req.params;
    const shouldTrackView =
      String(req.query.trackView || "false").toLowerCase() === "true";

    if (!req.admin) {
      const visible = await CaseStudy.exists({ _id: id, status: "published" });
      if (!visible) {
        return res
          .status(404)
          .json({ success: false, message: "Case study not found" });
      }
    }

    if (shouldTrackView) {
      await CaseStudy.updateOne({ _id: id }, { $inc: { views: 1 } });
    }

    const caseStudy = await CaseStudy.findById(id);
    if (!caseStudy) {
      return res
        .status(404)
        .json({ success: false, message: "Case study not found" });
    }

    return res.status(200).json({ success: true, caseStudy });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch case study",
        error: errorDetail(error),
      });
  }
};

// READ ONE BY SLUG
const getCaseStudyBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const shouldTrackView =
      String(req.query.trackView || "false").toLowerCase() === "true";

    const caseStudy = await CaseStudy.findOne({
      slug,
      ...(req.admin ? {} : { status: "published" }),
    });

    if (!caseStudy) {
      return res
        .status(404)
        .json({ success: false, message: "Case study not found" });
    }

    if (shouldTrackView) {
      await CaseStudy.updateOne({ _id: caseStudy._id }, { $inc: { views: 1 } });
      caseStudy.views = (caseStudy.views || 0) + 1;
    }

    return res.status(200).json({ success: true, caseStudy });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch case study",
        error: errorDetail(error),
      });
  }
};

// UPDATE
const updateCaseStudy = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await CaseStudy.findById(id);

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Case study not found" });
    }

    const {
      title,
      slug,
      client,
      industry,
      summary,
      challenge,
      solution,
      results,
      metrics,
      tags,
      image,
      category,
      status,
      seoTitle,
      seoDescription,
      seoKeywords,
      canonicalUrl,
      ogImage,
    } = req.body;

    const uploadedImageUrl = await buildImageUrlFromFile(req);

    const wasPublished = existing.status === "published";
    const becomesPublished = (status || existing.status) === "published";

    const updated = await CaseStudy.findByIdAndUpdate(
      id,
      {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(client !== undefined && { client }),
        ...(industry !== undefined && { industry }),
        ...(summary !== undefined && { summary }),
        ...(challenge !== undefined && { challenge: sanitizeRichText(challenge) }),
        ...(solution !== undefined && { solution: sanitizeRichText(solution) }),
        ...(results !== undefined && { results: sanitizeRichText(results) }),
        ...(metrics !== undefined && { metrics: parseMetrics(metrics) }),
        ...(tags !== undefined && { tags: normalizeTags(tags) }),
        ...(category !== undefined && { category }),
        ...(status !== undefined && { status }),
        image: uploadedImageUrl || image || existing.image,
        publishedAt:
          becomesPublished && !wasPublished ? new Date() : existing.publishedAt,
        seo: {
          title: seoTitle !== undefined ? seoTitle : existing.seo?.title || "",
          description:
            seoDescription !== undefined
              ? seoDescription
              : existing.seo?.description || "",
          keywords:
            seoKeywords !== undefined
              ? normalizeTags(seoKeywords)
              : existing.seo?.keywords || [],
          canonicalUrl:
            canonicalUrl !== undefined
              ? canonicalUrl
              : existing.seo?.canonicalUrl || "",
          ogImage:
            ogImage !== undefined ? ogImage : existing.seo?.ogImage || "",
        },
      },
      { new: true },
    );

    return res
      .status(200)
      .json({
        success: true,
        message: "Case study updated",
        caseStudy: updated,
      });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to update case study",
        error: errorDetail(error),
      });
  }
};

// DELETE
const deleteCaseStudy = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await CaseStudy.findByIdAndDelete(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Case study not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Case study deleted" });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to delete case study",
        error: errorDetail(error),
      });
  }
};

// STATS
const getCaseStudyStats = async (req, res) => {
  try {
    const [total, published, drafts] = await Promise.all([
      CaseStudy.countDocuments(),
      CaseStudy.countDocuments({ status: "published" }),
      CaseStudy.countDocuments({ status: "draft" }),
    ]);

    return res.status(200).json({ success: true, total, published, drafts });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch stats",
        error: errorDetail(error),
      });
  }
};

module.exports = {
  addCaseStudy,
  getAllCaseStudies,
  getCaseStudyById,
  getCaseStudyBySlug,
  updateCaseStudy,
  deleteCaseStudy,
  getCaseStudyStats,
};
