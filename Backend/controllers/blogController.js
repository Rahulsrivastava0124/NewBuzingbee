const Blog = require("../models/Blog");

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

const buildImageUrlFromFile = (req) => {
  if (!req.file) return "";
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/uploads/${req.file.filename}`;
};

const parseScheduledAt = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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

    const uploadedImageUrl = buildImageUrlFromFile(req);

    const scheduledDate = parseScheduledAt(scheduledAt);
    const resolvedStatus = status || "draft";

    if (resolvedStatus === "scheduled" && !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: "Valid scheduled time is required for scheduled blogs",
      });
    }

    const newBlog = new Blog({
      title,
      content,
      author: author || req.admin?.username || "Admin",
      category: category || "General",
      tags: normalizeTags(tags),
      image: uploadedImageUrl || image || req.body.featuredImage || "",
      status: resolvedStatus,
      scheduledAt: resolvedStatus === "scheduled" ? scheduledDate : null,
      publishedAt: resolvedStatus === "published" ? new Date() : null,
      createdBy: req.admin?.id,
      excerpt: excerpt || "",
      slug: slug || "",
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
      error: error.message,
    });
  }
};

const getAllBlogs = async (req, res) => {
  try {
    const { status, search, category } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }

    const blogs = await Blog.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: blogs.length,
      blogs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
      error: error.message,
    });
  }
};

const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    return res.status(200).json({
      success: true,
      blog,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blog",
      error: error.message,
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

    const uploadedImageUrl = buildImageUrlFromFile(req);

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const nextStatus = status ?? blog.status;
    const parsedScheduledAt = parseScheduledAt(scheduledAt);

    if (nextStatus === "scheduled" && !parsedScheduledAt && !blog.scheduledAt) {
      return res.status(400).json({
        success: false,
        message: "Valid scheduled time is required for scheduled blogs",
      });
    }

    blog.title = title ?? blog.title;
    blog.content = content ?? blog.content;
    blog.author = author ?? blog.author;
    blog.category = category ?? blog.category;
    blog.tags = tags !== undefined ? normalizeTags(tags) : blog.tags;
    blog.image = uploadedImageUrl || image || featuredImage || blog.image;
    blog.status = nextStatus;
    if (nextStatus === "scheduled") {
      blog.scheduledAt = parsedScheduledAt || blog.scheduledAt;
      blog.publishedAt = null;
    } else if (nextStatus === "published") {
      blog.scheduledAt = null;
      blog.publishedAt = blog.publishedAt || new Date();
    } else {
      blog.scheduledAt = null;
    }
    blog.excerpt = excerpt ?? blog.excerpt;
    blog.slug = slug ?? blog.slug;
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
      error: error.message,
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
      error: error.message,
    });
  }
};

const getBlogStats = async (_req, res) => {
  try {
    const [total, drafts, published, review, scheduled] = await Promise.all([
      Blog.countDocuments(),
      Blog.countDocuments({ status: "draft" }),
      Blog.countDocuments({ status: "published" }),
      Blog.countDocuments({ status: "review" }),
      Blog.countDocuments({ status: "scheduled" }),
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
      error: error.message,
    });
  }
};

const autoPublishScheduledBlogs = async () => {
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
  updateBlog,
  deleteBlog,
  getBlogStats,
  autoPublishScheduledBlogs,
};
