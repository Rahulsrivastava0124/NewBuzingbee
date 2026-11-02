const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    // Which website the post belongs to; keeps each site's blog separate
    site: {
      type: String,
      enum: ["buzingbee", "hustlershive"],
      default: "buzingbee",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      trim: true,
      default: "",
    },
    excerpt: {
      type: String,
      trim: true,
      default: "",
    },
    author: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "General",
    },
    tags: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      default: "",
    },
    seo: {
      title: {
        type: String,
        trim: true,
        default: "",
      },
      description: {
        type: String,
        trim: true,
        default: "",
      },
      keywords: {
        type: [String],
        default: [],
      },
      canonicalUrl: {
        type: String,
        trim: true,
        default: "",
      },
      ogImage: {
        type: String,
        trim: true,
        default: "",
      },
    },
    status: {
      type: String,
      enum: ["draft", "published", "review", "scheduled"],
      default: "draft",
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Blog", blogSchema);
