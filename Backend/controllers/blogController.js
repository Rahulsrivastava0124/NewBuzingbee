const { errorDetail } = require("../utils/errors");
const mongoose = require("mongoose");
const Blog = require("../models/Blog");
const { uploadBlogImageAndGetUrl } = require("../services/storageService");
const { sanitizeRichText } = require("../utils/sanitize");
const { escapeRegex } = require("../utils/validate");
const BlogViewDay = require("../models/BlogViewDay");
const { DEFAULT_SITE, resolveSite, siteFilter, slugify } = require("../utils/site");

// Clean slug that is unique within one website's blog (-2, -3 ... on clashes).
// BuzingBee keeps its blank slugs; other sites always get one from the title.
const buildSlug = async (site, requested, title, excludeId) => {
  const base = slugify(requested) || (site === DEFAULT_SITE ? "" : slugify(title));
  if (!base) return "";
  let slug = base;
  for (let n = 2; ; n += 1) {
    const clash = await Blog.exists({
      ...siteFilter(site),
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });
    if (!clash) return slug;
    slug = `${base.slice(0, 95)}-${n}`;
  }
};

const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);

// Count today's view for a post. Fire-and-forget: a failure here must never
// break serving the post.
const recordDailyView = (blogId) =>
  BlogViewDay.updateOne(
    { blog: blogId, day: dayKey() },
    { $inc: { views: 1 }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  ).catch((error) => console.error("[blog] Could not record daily view:", error.message));

// GET /blog/views/daily?days=14 — per-post daily views for the admin graphs
const getBlogViewsDaily = async (req, res) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 14, 1), 90);
    const keys = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      keys.push(dayKey(d));
    }
    const siteBlogIds = await Blog.find(siteFilter(req.query.site), "_id").lean();
    const rows = await BlogViewDay.find(
      { day: { $gte: keys[0] }, blog: { $in: siteBlogIds.map((b) => b._id) } },
      "blog day views",
    ).lean();
    const index = new Map(keys.map((k, i) => [k, i]));
    const series = {};
    const totals = keys.map(() => 0);
    rows.forEach((r) => {
      const i = index.get(r.day);
      if (i === undefined) return;
      const id = String(r.blog);
      if (!series[id]) series[id] = keys.map(() => 0);
      series[id][i] += r.views;
      totals[i] += r.views;
    });
    return res.json({ success: true, days: keys, totals, series });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch blog views" });
  }
};

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

const buildImageUrlFromFile = async (req) => {
  if (!req.file) return "";
  return uploadBlogImageAndGetUrl(req, req.file);
};

const parseScheduledAt = (value) => {
  if (!value || value === "") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const validateScheduledTime = (scheduledDate) => {
  if (!scheduledDate) return false;
  const now = new Date();
  return scheduledDate > now;
};

const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    "unknown"
  );
};

const traceBlogApiCall = (req, payload = {}) => {
  // Opt-in in production; on by default while developing.
  const traceDefault = process.env.NODE_ENV === "production" ? "false" : "true";
  const traceEnabled =
    String(process.env.BLOG_TRACE_ENABLED || traceDefault).toLowerCase() ===
    "true";

  if (!traceEnabled) return;

  const ip = getClientIP(req);
  const userAgent = req.headers["user-agent"] || "unknown";
  const referrer = req.headers.referer || req.headers.referrer || "direct";

  console.log("[BLOG_API_TRACE]", {
    time: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    blogId: req.params?.id || "",
    ip,
    referrer,
    userAgent,
    ...payload,
  });
};

const addBlog = async (req, res) => {
  try {
    const {
      title,
      content,
      author,
      category,
      tags,
      image,
      status,
      excerpt,
      slug,
      seoTitle,
      seoDescription,
      seoKeywords,
      canonicalUrl,
      ogImage,
      scheduledAt,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    const uploadedImageUrl = await buildImageUrlFromFile(req);

    const scheduledDate = parseScheduledAt(scheduledAt);
    const resolvedStatus = status || "draft";

    if (resolvedStatus === "scheduled" && !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: "Valid scheduled time is required for scheduled blogs",
      });
    }

    if (
      resolvedStatus === "scheduled" &&
      scheduledDate &&
      !validateScheduledTime(scheduledDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Scheduled time must be in the future",
      });
    }

    const site = resolveSite(req.body.site);
    const newBlog = new Blog({
      site,
      title,
      content: sanitizeRichText(content),
      author: author || req.admin?.username || "Admin",
      category: category || "General",
      tags: normalizeTags(tags),
      image: uploadedImageUrl || image || req.body.featuredImage || "",
      status: resolvedStatus,
      scheduledAt: resolvedStatus === "scheduled" ? scheduledDate : null,
      publishedAt: resolvedStatus === "published" ? new Date() : null,
      views: 0,
      createdBy: req.admin?.id,
      excerpt: excerpt || "",
      slug: await buildSlug(site, slug, title),
      seo: {
        title: seoTitle || "",
        description: seoDescription || "",
        keywords: normalizeTags(seoKeywords),
        canonicalUrl: canonicalUrl || "",
        ogImage:
          ogImage || uploadedImageUrl || image || req.body.featuredImage || "",
      },
    });

    const savedBlog = await newBlog.save();

    return res.status(201).json({
      success: true,
      message: "Blog added successfully",
      blog: savedBlog,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add blog",
      error: errorDetail(error),
    });
  }
};

const getAllBlogs = async (req, res) => {
  try {
    const { status, search, category } = req.query;
    const text = (v) => (typeof v === "string" ? v : "");
    const query = { $and: [siteFilter(req.query.site)] };

    // Only a signed-in admin may see drafts, reviews or scheduled posts
    if (!req.admin) query.status = "published";
    else if (text(status)) query.status = text(status);

    if (text(category)) query.category = text(category);
    if (text(search)) {
      const rx = escapeRegex(text(search).slice(0, 100));
      query.$or = [
        { title: { $regex: rx, $options: "i" } },
        { content: { $regex: rx, $options: "i" } },
        { author: { $regex: rx, $options: "i" } },
      ];
    }

    const blogs = await Blog.find(query).sort({ createdAt: -1 });
    const normalizedBlogs = blogs.map((blog) => ({
      ...blog.toObject(),
      views: Number.isFinite(Number(blog.views)) ? Number(blog.views) : 0,
    }));

    return res.status(200).json({
      success: true,
      count: normalizedBlogs.length,
      blogs: normalizedBlogs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
      error: errorDetail(error),
    });
  }
};

const getBlogById = async (req, res) => {
  const startedAt = Date.now();
  try {
    if (!req.admin) {
      // Unpublished content is not public: answer exactly like "not found"
      const visible = await Blog.exists({
        _id: req.params.id,
        status: "published",
      });
      if (!visible) {
        return res
          .status(404)
          .json({ success: false, message: "Blog not found" });
      }
    }

    const shouldTrackView =
      String(req.query.trackView || "false").toLowerCase() === "true";

    if (shouldTrackView) {
      await Blog.updateOne(
        {
          _id: req.params.id,
          $or: [{ views: { $exists: false } }, { views: null }],
        },
        { $set: { views: 0 } },
      );
    }

    const blog = shouldTrackView
      ? await Blog.findByIdAndUpdate(
          req.params.id,
          { $inc: { views: 1 } },
          { new: true },
        )
      : await Blog.findById(req.params.id);

    if (blog && shouldTrackView) recordDailyView(blog._id);

    if (!blog) {
      traceBlogApiCall(req, {
        route: "getBlogById",
        statusCode: 404,
        found: false,
        durationMs: Date.now() - startedAt,
      });

      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    traceBlogApiCall(req, {
      route: "getBlogById",
      statusCode: 200,
      found: true,
      trackView: shouldTrackView,
      views: blog.views || 0,
      durationMs: Date.now() - startedAt,
    });

    return res.status(200).json({
      success: true,
      blog,
    });
  } catch (error) {
    traceBlogApiCall(req, {
      route: "getBlogById",
      statusCode: 500,
      error: errorDetail(error),
      durationMs: Date.now() - startedAt,
    });

    return res.status(500).json({
      success: false,
      message: "Failed to fetch blog",
      error: errorDetail(error),
    });
  }
};

const getBlogBySlug = async (req, res) => {
  const startedAt = Date.now();
  try {
    const slug = String(req.params.slug || "").trim();
    const shouldTrackView =
      String(req.query.trackView || "false").toLowerCase() === "true";

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Blog slug is required",
      });
    }

    const query = {
      slug: {
        $regex: `^${escapeRegex(slug)}$`,
        $options: "i",
      },
      // Unpublished content is not public
      ...(req.admin ? {} : { status: "published" }),
      $and: [siteFilter(req.query.site)],
    };

    if (shouldTrackView) {
      await Blog.updateOne(
        {
          ...query,
          $or: [{ views: { $exists: false } }, { views: null }],
        },
        { $set: { views: 0 } },
      );
    }

    const blog = shouldTrackView
      ? await Blog.findOneAndUpdate(
          query,
          { $inc: { views: 1 } },
          { new: true },
        )
      : await Blog.findOne(query);

    if (blog && shouldTrackView) recordDailyView(blog._id);

    if (!blog) {
      traceBlogApiCall(req, {
        route: "getBlogBySlug",
        statusCode: 404,
        found: false,
        slug,
        durationMs: Date.now() - startedAt,
      });

      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    traceBlogApiCall(req, {
      route: "getBlogBySlug",
      statusCode: 200,
      found: true,
      slug,
      trackView: shouldTrackView,
      views: blog.views || 0,
      durationMs: Date.now() - startedAt,
    });

    return res.status(200).json({
      success: true,
      blog,
    });
  } catch (error) {
    traceBlogApiCall(req, {
      route: "getBlogBySlug",
      statusCode: 500,
      slug: req.params?.slug || "",
      error: errorDetail(error),
      durationMs: Date.now() - startedAt,
    });

    return res.status(500).json({
      success: false,
      message: "Failed to fetch blog",
      error: errorDetail(error),
    });
  }
};

const updateBlog = async (req, res) => {
  try {
    const {
      title,
      content,
      author,
      category,
      tags,
      image,
      status,
      excerpt,
      slug,
      featuredImage,
      seoTitle,
      seoDescription,
      seoKeywords,
      canonicalUrl,
      ogImage,
      scheduledAt,
    } = req.body;

    const uploadedImageUrl = await buildImageUrlFromFile(req);

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const nextStatus = status ?? blog.status;
    const parsedScheduledAt = parseScheduledAt(scheduledAt);

    // When changing to scheduled status, need to provide a future scheduledAt
    if (nextStatus === "scheduled") {
      if (!parsedScheduledAt && !blog.scheduledAt) {
        return res.status(400).json({
          success: false,
          message: "Valid scheduled time is required for scheduled blogs",
        });
      }

      // If new scheduledAt is provided, validate it's in the future
      if (parsedScheduledAt && !validateScheduledTime(parsedScheduledAt)) {
        return res.status(400).json({
          success: false,
          message: "Scheduled time must be in the future",
        });
      }

      // If using existing scheduledAt, validate it's still in the future
      const existingScheduledAt = blog.scheduledAt;
      if (
        !parsedScheduledAt &&
        existingScheduledAt &&
        !validateScheduledTime(existingScheduledAt)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Existing scheduled time has passed. Please provide a new future time",
        });
      }
    }

    blog.title = title ?? blog.title;
    blog.content =
      content !== undefined ? sanitizeRichText(content) : blog.content;
    blog.author = author ?? blog.author;
    blog.category = category ?? blog.category;
    blog.tags = tags !== undefined ? normalizeTags(tags) : blog.tags;
    blog.image = uploadedImageUrl || image || featuredImage || blog.image;
    blog.status = nextStatus;
    if (nextStatus === "scheduled") {
      // Use new scheduledAt if provided, otherwise keep existing
      if (parsedScheduledAt) {
        blog.scheduledAt = parsedScheduledAt;
      }
      // Always clear publishedAt when scheduling
      blog.publishedAt = null;
    } else if (nextStatus === "published") {
      blog.scheduledAt = null;
      blog.publishedAt = blog.publishedAt || new Date();
    } else if (nextStatus === "draft" || nextStatus === "review") {
      blog.scheduledAt = null;
      blog.publishedAt = null;
    }
    blog.excerpt = excerpt ?? blog.excerpt;
    if (slug !== undefined) {
      blog.slug = await buildSlug(resolveSite(blog.site), slug, blog.title, blog._id);
    } else if (!blog.slug && resolveSite(blog.site) !== DEFAULT_SITE) {
      blog.slug = await buildSlug(resolveSite(blog.site), "", blog.title, blog._id);
    }
    blog.seo = {
      title: seoTitle ?? blog.seo?.title ?? "",
      description: seoDescription ?? blog.seo?.description ?? "",
      keywords:
        seoKeywords !== undefined
          ? normalizeTags(seoKeywords)
          : blog.seo?.keywords || [],
      canonicalUrl: canonicalUrl ?? blog.seo?.canonicalUrl ?? "",
      ogImage:
        ogImage ||
        uploadedImageUrl ||
        image ||
        featuredImage ||
        blog.seo?.ogImage ||
        blog.image ||
        "",
    };

    const savedBlog = await blog.save();

    return res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      blog: savedBlog,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update blog",
      error: errorDetail(error),
    });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    await Blog.deleteOne({ _id: blog._id });

    return res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete blog",
      error: errorDetail(error),
    });
  }
};

const getBlogStats = async (req, res) => {
  try {
    const scope = siteFilter(req.query.site);
    const [total, drafts, published, review, scheduled] = await Promise.all([
      Blog.countDocuments(scope),
      Blog.countDocuments({ ...scope, status: "draft" }),
      Blog.countDocuments({ ...scope, status: "published" }),
      Blog.countDocuments({ ...scope, status: "review" }),
      Blog.countDocuments({ ...scope, status: "scheduled" }),
    ]);

    return res.status(200).json({
      success: true,
      total,
      drafts,
      published,
      review,
      scheduled,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
      error: errorDetail(error),
    });
  }
};

const autoPublishScheduledBlogs = async () => {
  // Skip if MongoDB is not yet connected (readyState 1 = connected)
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  const now = new Date();
  const result = await Blog.updateMany(
    {
      status: "scheduled",
      scheduledAt: { $lte: now },
    },
    {
      $set: {
        status: "published",
        publishedAt: now,
      },
      $unset: {
        scheduledAt: "",
      },
    },
  );

  if (result.modifiedCount > 0) {
    console.log(`Auto-published ${result.modifiedCount} scheduled blog(s)`);
  }
};

module.exports = {
  addBlog,
  getAllBlogs,
  getBlogById,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  getBlogStats,
  getBlogViewsDaily,
  autoPublishScheduledBlogs,
};
